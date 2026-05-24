# PlainMD

**Medical language, made plain.**

PlainMD is an AI-powered medical record companion that helps users understand and conversationally interact with their medical documents in plain language.

## Tech Stack

- **Frontend:** React (CRA + Craco), Tailwind CSS, Radix UI, Lucide Icons
- **Backend:** FastAPI (Python), Groq AI (Llama 3.3 70B)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Yarn

### Environment Variables

Create `backend/.env`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
SAMBANOVA_API_KEY=optional
```

### Setup

```bash
# Frontend
cd frontend
yarn install
yarn start

# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Database

Run `backend/schema.sql` in the Supabase SQL Editor to create tables.

## Features

- Upload medical documents (PDF, images, text)
- AI-simplified summaries in plain language
- Conversational chat about health records
- Document categorization (labs, imaging, medications, etc.)
- Long-term health memory across records
- Guest mode with limited access
- Privacy-first architecture
