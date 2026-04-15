"""RAG-based school assistant chatbot endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.database import get_db, set_tenant_context
from services.llm import get_llm_client
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    tenant_id: str
    user_id: str


@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-based chatbot: retrieves relevant school knowledge base articles
    then uses GPT-4o to generate a grounded, contextual response.
    """
    set_tenant_context(db, req.tenant_id)

    # Get school name
    tenant = db.execute(
        text("SELECT name FROM tenants WHERE id = :id"),
        {"id": req.tenant_id},
    ).fetchone()
    school_name = tenant.name if tenant else "our school"

    # Keyword search in knowledge base (pgvector cosine search would go here in Phase 2)
    keywords = req.message[:50].replace("'", "''")
    kb_rows = db.execute(
        text("""
            SELECT title, content FROM ai_knowledge_base
            WHERE tenant_id = :tenant_id
              AND (title ILIKE '%' || :kw || '%' OR content ILIKE '%' || :kw || '%')
            LIMIT 5
        """),
        {"tenant_id": req.tenant_id, "kw": keywords[:20]},
    ).fetchall()

    context = "\n\n".join(f"[{row.title}]: {row.content}" for row in kb_rows) if kb_rows else \
        "No specific policy document found. Refer the user to the school office."

    system_prompt = f"""You are a helpful school assistant for {school_name}.
Answer parent and student questions based ONLY on the provided context below.
Be concise, friendly, and accurate.
If the answer is not in the context, say: "Please contact the school office for this information."
Never make up information.

Context:
{context}"""

    try:
        client = get_llm_client()
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message},
            ],
            max_tokens=500,
            temperature=0.3,
        )
        reply = response.choices[0].message.content or "I could not process your request."
    except Exception as e:
        logger.error(f"Chatbot LLM error: {e}")
        reply = "I'm currently unavailable. Please contact the school office directly."

    return {"reply": reply, "context_used": len(kb_rows)}
