"""PlainMD -- Backend Server.

FastAPI application providing:
- Email/password & Google OAuth authentication
- Guest mode with limited access
- Medical document upload & AI processing
- AI-powered medical record understanding chat
- Conversation history with document context
- Document management & categorization
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlencode

import bcrypt
import httpx
import jwt
from dotenv import load_dotenv
from groq import AsyncGroq, RateLimitError
from fastapi import (
    APIRouter, Cookie, Depends, FastAPI, File, Form,
    Header, HTTPException, Request, Response, UploadFile,
)
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# --------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------- #
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]
GROQ_API_KEY = os.environ["GROQ_API_KEY"]
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
SAMBANOVA_API_KEY = os.environ.get("SAMBANOVA_API_KEY", "")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

JWT_ALG = "HS256"
JWT_EXP_DAYS = 7

GUEST_UPLOAD_LIMIT = 1
GUEST_QUESTION_LIMIT = 3

app = FastAPI(title="PlainMD")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("plainmd")

_USER_COLS = (
    "user_id,email,name,picture,auth_provider,onboarded,"
    "is_guest,guest_uploads_count,guest_questions_count,profile,created_at"
)


# --------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------- #
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    onboarded: bool = False
    is_guest: bool = False
    guest_uploads_count: int = 0
    guest_questions_count: int = 0


class ChatIn(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None


# --------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------- #
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _make_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(_now().timestamp()),
        "exp": int((_now() + timedelta(days=JWT_EXP_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _maybe_data(result) -> Optional[dict]:
    if result is None:
        return None
    return result.data


def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))


async def _user_from_jwt(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload.get("sub")
        if not user_id:
            return None
        result = (
            sb.table("users")
            .select(_USER_COLS)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return _maybe_data(result)
    except jwt.PyJWTError:
        return None


async def _user_from_session(token: str) -> Optional[dict]:
    result = (
        sb.table("user_sessions")
        .select("*")
        .eq("session_token", token)
        .maybe_single()
        .execute()
    )
    sess = _maybe_data(result)
    if not sess:
        return None
    expires = sess.get("expires_at")
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires and expires < _now():
        return None
    user_result = (
        sb.table("users")
        .select(_USER_COLS)
        .eq("user_id", sess["user_id"])
        .maybe_single()
        .execute()
    )
    return _maybe_data(user_result)


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    session_token: Optional[str] = Cookie(None),
) -> dict:
    if session_token:
        user = await _user_from_session(session_token)
        if user:
            return user
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        user = await _user_from_jwt(token)
        if user:
            return user
        user = await _user_from_session(token)
        if user:
            return user
    raise HTTPException(status_code=401, detail="Not authenticated")


def _public_user(user: dict) -> UserOut:
    return UserOut(
        user_id=user["user_id"],
        email=user.get("email", ""),
        name=user.get("name", ""),
        picture=user.get("picture"),
        onboarded=bool(user.get("onboarded", False)),
        is_guest=bool(user.get("is_guest", False)),
        guest_uploads_count=user.get("guest_uploads_count", 0) or 0,
        guest_questions_count=user.get("guest_questions_count", 0) or 0,
    )


# --------------------------------------------------------------------- #
# Auth endpoints
# --------------------------------------------------------------------- #
@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    existing = (
        sb.table("users")
        .select("user_id")
        .eq("email", payload.email.lower())
        .maybe_single()
        .execute()
    )
    if _maybe_data(existing):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "picture": None,
        "password_hash": _hash_pw(payload.password),
        "auth_provider": "email",
        "onboarded": True,
        "is_guest": False,
        "guest_uploads_count": 0,
        "guest_questions_count": 0,
        "profile": {},
        "created_at": _now().isoformat(),
    }
    sb.table("users").insert(doc).execute()
    token = _make_jwt(user_id)
    return {"token": token, "user": _public_user(doc).model_dump()}


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    result = (
        sb.table("users")
        .select("*")
        .eq("email", payload.email.lower())
        .maybe_single()
        .execute()
    )
    user = _maybe_data(result)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not _verify_pw(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _make_jwt(user["user_id"])
    return {"token": token, "user": _public_user(user).model_dump()}


@api_router.post("/auth/guest")
async def create_guest():
    user_id = f"guest_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": f"{user_id}@guest.plainmd.local",
        "name": "Guest",
        "picture": None,
        "auth_provider": "guest",
        "onboarded": True,
        "is_guest": True,
        "guest_uploads_count": 0,
        "guest_questions_count": 0,
        "profile": {},
        "created_at": _now().isoformat(),
    }
    sb.table("users").insert(doc).execute()
    token = _make_jwt(user_id)
    return {"token": token, "user": _public_user(doc).model_dump()}


def _get_origin(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or request.url.netloc
    )
    return f"{proto}://{host}"


@api_router.get("/auth/google/url")
async def google_auth_url(request: Request):
    redirect_uri = _get_origin(request) + "/auth/callback"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return {
        "url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    }


@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    body = await request.json()
    code = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="code is required")

    redirect_uri = body.get(
        "redirect_uri", _get_origin(request) + "/auth/callback"
    )

    async with httpx.AsyncClient(timeout=15.0) as hc:
        r = await hc.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if r.status_code != 200:
        raise HTTPException(
            status_code=401, detail="Failed to exchange authorization code"
        )
    tokens = r.json()

    async with httpx.AsyncClient(timeout=15.0) as hc:
        r = await hc.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
    if r.status_code != 200:
        raise HTTPException(
            status_code=401, detail="Failed to fetch user info from Google"
        )
    data = r.json()
    email = (data.get("email") or "").lower()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")
    session_token_val = f"gs_{uuid.uuid4().hex}"

    existing = (
        sb.table("users")
        .select(_USER_COLS)
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    user = _maybe_data(existing)
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "auth_provider": "google",
            "onboarded": True,
            "is_guest": False,
            "guest_uploads_count": 0,
            "guest_questions_count": 0,
            "profile": {},
            "created_at": _now().isoformat(),
        }
        sb.table("users").insert(user_doc).execute()
        user = user_doc
    else:
        sb.table("users").update(
            {"name": name, "picture": picture}
        ).eq("user_id", user["user_id"]).execute()
        user["name"] = name
        user["picture"] = picture

    expires_at = _now() + timedelta(days=7)
    sb.table("user_sessions").upsert({
        "session_token": session_token_val,
        "user_id": user["user_id"],
        "expires_at": expires_at.isoformat(),
        "created_at": _now().isoformat(),
    }).execute()

    response.set_cookie(
        key="session_token",
        value=session_token_val,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60,
    )
    return {
        "user": _public_user(user).model_dump(),
        "session_token": session_token_val,
    }


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    result = (
        sb.table("users")
        .select(_USER_COLS)
        .eq("user_id", user["user_id"])
        .maybe_single()
        .execute()
    )
    full = _maybe_data(result)
    return {"user": _public_user(full).model_dump(), "profile": full.get("profile", {})}


@api_router.post("/auth/logout")
async def logout(
    response: Response, session_token: Optional[str] = Cookie(None)
):
    if session_token:
        sb.table("user_sessions").delete().eq(
            "session_token", session_token
        ).execute()
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# --------------------------------------------------------------------- #
# Profile
# --------------------------------------------------------------------- #
@api_router.put("/profile")
async def update_profile(
    payload: ProfileUpdateIn, user: dict = Depends(get_current_user)
):
    update_data = {}
    if payload.name:
        update_data["name"] = payload.name
    if update_data:
        sb.table("users").update(update_data).eq(
            "user_id", user["user_id"]
        ).execute()
    result = (
        sb.table("users")
        .select(_USER_COLS)
        .eq("user_id", user["user_id"])
        .maybe_single()
        .execute()
    )
    full = _maybe_data(result)
    return {"user": _public_user(full).model_dump()}


# --------------------------------------------------------------------- #
# Document Upload & Processing
# --------------------------------------------------------------------- #
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if user.get("is_guest") and (
        user.get("guest_uploads_count", 0) or 0
    ) >= GUEST_UPLOAD_LIMIT:
        raise HTTPException(
            status_code=403,
            detail="Guest users can upload one document. Create an account to upload more.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 20MB.")

    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    filename = file.filename or "unnamed_document"
    content_type = file.content_type or "application/octet-stream"
    file_type = (
        "pdf" if "pdf" in content_type
        else ("image" if "image" in content_type else "text")
    )

    extracted_text = ""
    if file_type == "text":
        try:
            extracted_text = content.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = content.decode("latin-1", errors="replace")

    ai_result = await _process_document_with_ai(
        extracted_text, content, file_type, filename
    )

    doc_record = {
        "document_id": document_id,
        "user_id": user["user_id"],
        "filename": filename,
        "file_type": file_type,
        "file_size": len(content),
        "category": ai_result.get("category", "uncategorized"),
        "record_type": ai_result.get("record_type", ""),
        "extracted_text": extracted_text or ai_result.get("extracted_text", ""),
        "structured_data": ai_result.get("structured_data", {}),
        "summary": ai_result.get("summary", ""),
        "record_date": ai_result.get("record_date"),
        "uploaded_at": _now().isoformat(),
        "updated_at": _now().isoformat(),
    }
    sb.table("documents").insert(doc_record).execute()

    if user.get("is_guest"):
        sb.table("users").update({
            "guest_uploads_count": (
                user.get("guest_uploads_count", 0) or 0
            ) + 1,
        }).eq("user_id", user["user_id"]).execute()

    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
    conv_title = filename if len(filename) <= 60 else filename[:57] + "..."
    sb.table("conversations").insert({
        "conversation_id": conversation_id,
        "user_id": user["user_id"],
        "document_id": document_id,
        "title": conv_title,
        "created_at": _now().isoformat(),
        "updated_at": _now().isoformat(),
    }).execute()

    ai_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    sb.table("messages").insert({
        "message_id": ai_msg_id,
        "conversation_id": conversation_id,
        "user_id": user["user_id"],
        "role": "assistant",
        "content": json.dumps({
            "type": "document_summary",
            "summary": ai_result.get("summary", ""),
            "category": ai_result.get("category", "uncategorized"),
            "record_type": ai_result.get("record_type", ""),
            "key_findings": ai_result.get("key_findings", []),
        }),
        "citations": json.dumps([
            {"document_id": document_id, "filename": filename}
        ]),
        "created_at": _now().isoformat(),
    }).execute()

    return {
        "document": doc_record,
        "conversation_id": conversation_id,
        "summary": ai_result.get("summary", ""),
    }


async def _process_document_with_ai(
    text: str, content: bytes, file_type: str, filename: str,
) -> dict:
    prompt = f"""You are a medical document analyzer for PlainMD. Analyze this medical document and provide:

1. A simplified summary explaining the results as if talking to a 15-year-old. Use conversational, calming, non-clinical language.
2. The category (one of: labs, imaging, medications, diagnoses, visits, procedures, allergies, prescriptions)
3. The record type (one of: lab_report, blood_test, imaging, mri, ct_scan, prescription, doctor_notes, discharge_summary, medication_list, surgery_record, insurance, vaccination)
4. Key findings as a list
5. Any extracted text if the document is an image
6. The approximate date of the record if visible

Respond with STRICT JSON only:
{{
  "summary": "A clear, friendly 3-5 sentence summary in plain language",
  "category": "labs",
  "record_type": "lab_report",
  "key_findings": ["finding 1", "finding 2"],
  "extracted_text": "text extracted from document",
  "record_date": "2024-03-12T00:00:00Z or null",
  "structured_data": {{}}
}}

RULES:
- Do NOT diagnose or recommend treatment
- Use calming, friendly language
- Explain medical terms simply
- If unsure about something, say so clearly

Document filename: {filename}
Document type: {file_type}
"""
    if text:
        prompt += f"\nDocument content:\n{text[:8000]}"

    messages = [{"role": "user", "content": prompt}]
    response_text = await _call_llm(messages, max_tokens=2048)

    if response_text is None:
        return {
            "summary": (
                "We received your document but couldn't analyze it right now. "
                "Please try again in a moment."
            ),
            "category": "uncategorized",
            "record_type": "",
            "key_findings": [],
            "extracted_text": text or "",
            "structured_data": {},
        }
    return _parse_ai_json(response_text)


async def _call_llm(
    messages: list, max_tokens: int = 4096
) -> Optional[str]:
    models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    response_text = None
    last_err = None

    for model in models:
        try:
            resp = await groq_client.chat.completions.create(
                model=model, max_tokens=max_tokens, messages=messages,
            )
            response_text = resp.choices[0].message.content
            break
        except RateLimitError as e:
            logger.warning("Rate limited on %s, trying fallback", model)
            last_err = e
            continue
        except Exception as e:
            logger.exception("LLM call failed on %s", model)
            last_err = e
            break

    if response_text is None and isinstance(last_err, RateLimitError) and SAMBANOVA_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                sn_resp = await client.post(
                    "https://api.sambanova.ai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {SAMBANOVA_API_KEY}"},
                    json={
                        "model": "Meta-Llama-3.3-70B-Instruct",
                        "max_tokens": max_tokens,
                        "messages": messages,
                    },
                )
                sn_resp.raise_for_status()
                response_text = sn_resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.exception("SambaNova fallback failed")
            last_err = e

    return response_text


def _parse_ai_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    return {
        "summary": raw[:500] if raw else "Document uploaded successfully.",
        "category": "uncategorized",
        "record_type": "",
        "key_findings": [],
        "extracted_text": "",
        "structured_data": {},
    }


# --------------------------------------------------------------------- #
# Document Management
# --------------------------------------------------------------------- #
@api_router.get("/documents")
async def list_documents(
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    query = sb.table("documents").select("*").eq("user_id", user["user_id"])
    if category:
        query = query.eq("category", category)
    result = query.order("uploaded_at", desc=True).limit(200).execute()
    return {"documents": result.data or []}


@api_router.get("/documents/categories/summary")
async def document_categories_summary(user: dict = Depends(get_current_user)):
    result = (
        sb.table("documents")
        .select("category")
        .eq("user_id", user["user_id"])
        .execute()
    )
    docs = result.data or []
    counts = {}
    for d in docs:
        cat = d.get("category", "uncategorized")
        counts[cat] = counts.get(cat, 0) + 1
    return {"categories": counts}


@api_router.get("/documents/{document_id}")
async def get_document(
    document_id: str, user: dict = Depends(get_current_user)
):
    result = (
        sb.table("documents")
        .select("*")
        .eq("document_id", document_id)
        .eq("user_id", user["user_id"])
        .maybe_single()
        .execute()
    )
    doc = _maybe_data(result)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"document": doc}


@api_router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str, user: dict = Depends(get_current_user)
):
    sb.table("documents").delete().eq(
        "document_id", document_id
    ).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


# --------------------------------------------------------------------- #
# AI Medical Chat
# --------------------------------------------------------------------- #
MEDICAL_SYSTEM_PROMPT = """You are PlainMD -- a calm, intelligent, emotionally reassuring medical record companion. You help users understand their medical documents in plain language.

Your personality:
- Warm, conversational, and calming -- like a smart best friend explaining health records
- NOT robotic, clinical, or emotionally cold
- Use simple language, avoid medical jargon unless explaining it
- Always cite which document you're referencing when possible

SAFETY RULES (NEVER VIOLATE):
- NEVER diagnose diseases
- NEVER recommend medications or treatments
- NEVER predict health outcomes
- NEVER replace doctors or medical professionals
- NEVER give emergency medical advice
- NEVER provide mental health crisis counseling
- NEVER advise users to ignore their physicians
- For concerning findings, say: "Please discuss this with your doctor."
- For potentially critical findings, say: "This may require immediate medical attention. Please contact a healthcare professional or emergency services immediately."

When uncertain:
1. Ask clarifying questions
2. Recommend re-uploading clearer files
3. Clearly state uncertainty and recommend consulting a medical professional

Always cite sources from uploaded records (document name, upload date, report type).

{context}
"""


@api_router.post("/chat")
async def chat_endpoint(
    payload: ChatIn, user: dict = Depends(get_current_user)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if user.get("is_guest") and (
        user.get("guest_questions_count", 0) or 0
    ) >= GUEST_QUESTION_LIMIT:
        raise HTTPException(
            status_code=403,
            detail=(
                "Guest users can ask up to 3 questions. "
                "Create an account to continue chatting with your medical history."
            ),
        )

    conversation_id = payload.conversation_id

    if not conversation_id:
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        title = payload.message[:60].strip() or "New conversation"
        sb.table("conversations").insert({
            "conversation_id": conversation_id,
            "user_id": user["user_id"],
            "document_id": payload.document_id,
            "title": title,
            "created_at": _now().isoformat(),
            "updated_at": _now().isoformat(),
        }).execute()

    prior_result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .limit(50)
        .execute()
    )
    prior = prior_result.data or []

    doc_context = await _build_document_context(
        user["user_id"], payload.document_id, payload.message
    )

    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    sb.table("messages").insert({
        "message_id": user_msg_id,
        "conversation_id": conversation_id,
        "user_id": user["user_id"],
        "role": "user",
        "content": payload.message,
        "created_at": _now().isoformat(),
    }).execute()

    system_prompt = MEDICAL_SYSTEM_PROMPT.format(context=doc_context)
    messages = [{"role": "system", "content": system_prompt}]
    for m in prior:
        content = m["content"]
        if not isinstance(content, str):
            content = (
                json.dumps(content)
                if isinstance(content, dict)
                else str(content)
            )
        messages.append({"role": m["role"], "content": content})
    messages.append({"role": "user", "content": payload.message})

    response_text = await _call_llm(messages)

    if response_text is None:
        raise HTTPException(
            status_code=429,
            detail=(
                "We're experiencing high demand right now. "
                "Please try again in a few minutes."
            ),
        )

    ai_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    sb.table("messages").insert({
        "message_id": ai_msg_id,
        "conversation_id": conversation_id,
        "user_id": user["user_id"],
        "role": "assistant",
        "content": response_text,
        "created_at": _now().isoformat(),
    }).execute()

    sb.table("conversations").update(
        {"updated_at": _now().isoformat()}
    ).eq("conversation_id", conversation_id).execute()

    if user.get("is_guest"):
        sb.table("users").update({
            "guest_questions_count": (
                user.get("guest_questions_count", 0) or 0
            ) + 1,
        }).eq("user_id", user["user_id"]).execute()

    return {
        "conversation_id": conversation_id,
        "message_id": ai_msg_id,
        "response": response_text,
    }


async def _build_document_context(
    user_id: str, document_id: Optional[str], query: str,
) -> str:
    parts = []

    if document_id:
        result = (
            sb.table("documents")
            .select("*")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        doc = _maybe_data(result)
        if doc:
            parts.append(
                f"Current document: {doc['filename']} "
                f"(Category: {doc.get('category', 'N/A')}, "
                f"Uploaded: {doc.get('uploaded_at', 'N/A')})"
            )
            if doc.get("summary"):
                parts.append(f"Summary: {doc['summary']}")
            if doc.get("extracted_text"):
                parts.append(f"Content: {doc['extracted_text'][:4000]}")

    all_docs_result = (
        sb.table("documents")
        .select("document_id,filename,category,record_type,summary,uploaded_at")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .limit(20)
        .execute()
    )
    all_docs = all_docs_result.data or []

    if all_docs:
        parts.append("\nUser's medical document history:")
        for d in all_docs:
            parts.append(
                f"- {d['filename']} ({d.get('category', 'N/A')}, "
                f"{d.get('uploaded_at', 'N/A')}): "
                f"{(d.get('summary') or '')[:200]}"
            )

    return "\n".join(parts) if parts else "No documents uploaded yet."


# --------------------------------------------------------------------- #
# Conversations
# --------------------------------------------------------------------- #
@api_router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    result = (
        sb.table("conversations")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )
    return {"conversations": result.data or []}


@api_router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
    conv_result = (
        sb.table("conversations")
        .select("*")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user["user_id"])
        .maybe_single()
        .execute()
    )
    if not _maybe_data(conv_result):
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs_result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .limit(500)
        .execute()
    )
    return {
        "conversation": _maybe_data(conv_result),
        "messages": msgs_result.data or [],
    }


@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str, user: dict = Depends(get_current_user)
):
    sb.table("conversations").delete().eq(
        "conversation_id", conversation_id
    ).eq("user_id", user["user_id"]).execute()
    return {"ok": True}


# --------------------------------------------------------------------- #
# Search
# --------------------------------------------------------------------- #
@api_router.get("/search")
async def search(q: str, user: dict = Depends(get_current_user)):
    if not q.strip():
        return {"documents": [], "conversations": []}

    docs_result = (
        sb.table("documents")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("uploaded_at", desc=True)
        .limit(200)
        .execute()
    )
    docs = docs_result.data or []
    q_lower = q.lower()
    matched_docs = [
        d for d in docs
        if q_lower in (d.get("filename", "") or "").lower()
        or q_lower in (d.get("summary", "") or "").lower()
        or q_lower in (d.get("category", "") or "").lower()
        or q_lower in (d.get("extracted_text", "") or "").lower()
    ]

    convs_result = (
        sb.table("conversations")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )
    convs = convs_result.data or []
    matched_convs = [
        c for c in convs if q_lower in (c.get("title", "") or "").lower()
    ]

    return {
        "documents": matched_docs[:20],
        "conversations": matched_convs[:20],
    }


# --------------------------------------------------------------------- #
# Suggestions
# --------------------------------------------------------------------- #
@api_router.get("/suggestions")
async def get_suggestions():
    return {
        "suggestions": [
            {"key": "explain", "label": "Explain this", "prompt": "Can you explain this document in simpler terms?"},
            {"key": "compare", "label": "Compare labs", "prompt": "Compare this to my previous lab results"},
            {"key": "trends", "label": "Show trends", "prompt": "Show me trends in my health records over time"},
            {"key": "normal", "label": "What's normal?", "prompt": "Are these results within normal range?"},
            {"key": "concerns", "label": "Key concerns", "prompt": "What should I be concerned about in this report?"},
            {"key": "doctor", "label": "Questions for doctor", "prompt": "What questions should I ask my doctor about these results?"},
        ]
    }


# --------------------------------------------------------------------- #
# User data management
# --------------------------------------------------------------------- #
@api_router.delete("/account")
async def delete_account(user: dict = Depends(get_current_user)):
    sb.table("messages").delete().eq("user_id", user["user_id"]).execute()
    sb.table("conversations").delete().eq("user_id", user["user_id"]).execute()
    sb.table("documents").delete().eq("user_id", user["user_id"]).execute()
    sb.table("user_sessions").delete().eq("user_id", user["user_id"]).execute()
    sb.table("users").delete().eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@api_router.delete("/data/documents")
async def delete_all_documents(user: dict = Depends(get_current_user)):
    sb.table("documents").delete().eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@api_router.delete("/data/conversations")
async def delete_all_conversations(user: dict = Depends(get_current_user)):
    sb.table("messages").delete().eq("user_id", user["user_id"]).execute()
    sb.table("conversations").delete().eq("user_id", user["user_id"]).execute()
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "PlainMD API", "status": "ok"}


# --------------------------------------------------------------------- #
# App wiring
# --------------------------------------------------------------------- #
cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
