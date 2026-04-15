"""
Bizvinc School — Python FastAPI AI/ML Service
Handles: fee defaulter prediction, quiz generation, chatbot, analytics
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

load_dotenv()

from routers import predictions, quiz, chatbot, analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Bizvinc School AI Service starting...")
    yield
    logger.info("AI Service shutting down.")


app = FastAPI(
    title="Bizvinc School AI Service",
    description="ML predictions, quiz generation, RAG chatbot for Bizvinc School",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
                   os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3001")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bizvinc-ai"}
