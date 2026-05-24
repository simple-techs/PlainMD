"""Vercel serverless entry point — re-exports the FastAPI app from backend/server.py."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from server import app  # noqa: E402, F401
