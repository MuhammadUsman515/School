"""AI quiz and lesson plan generation endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from services.llm import get_llm_client
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class GenerateQuizRequest(BaseModel):
    topic: str
    subject: str
    grade: str
    count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "MEDIUM"
    question_types: list[str] = ["MCQ"]
    tenant_id: str
    subject_id: Optional[str] = None


class GenerateLessonPlanRequest(BaseModel):
    topic: str
    subject: str
    grade: str
    duration_minutes: int = 45
    objectives: list[str]


@router.post("/generate")
async def generate_quiz(req: GenerateQuizRequest):
    """
    Generate quiz questions using Azure OpenAI GPT-4o.
    Returns structured questions with answers and explanations.
    """
    client = get_llm_client()

    prompt = f"""Generate exactly {req.count} quiz questions for:
- Subject: {req.subject}
- Grade: {req.grade}
- Topic: {req.topic}
- Difficulty: {req.difficulty}
- Question types: {', '.join(req.question_types)}

Return a JSON object with a "questions" array. Each question must have:
{{
  "question": "string",
  "question_type": "MCQ|TRUE_FALSE|SHORT_ANSWER|FILL_IN_BLANK",
  "options": ["A", "B", "C", "D"] (only for MCQ — omit otherwise),
  "correct_answer": "string",
  "explanation": "string",
  "difficulty": "{req.difficulty}"
}}"""

    try:
        import os
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2500,
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        questions = parsed.get("questions", parsed if isinstance(parsed, list) else [])
        return {"questions": questions, "count": len(questions), "topic": req.topic}
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        return {"questions": [], "count": 0, "error": str(e)}


@router.post("/lesson-plan")
async def generate_lesson_plan(req: GenerateLessonPlanRequest):
    """
    Generate a structured lesson plan using Azure OpenAI.
    """
    client = get_llm_client()

    prompt = f"""Create a comprehensive lesson plan as JSON:
Subject: {req.subject}
Grade: {req.grade}
Topic: {req.topic}
Duration: {req.duration_minutes} minutes
Learning objectives: {'; '.join(req.objectives)}

Return JSON with these fields:
{{
  "title": "string",
  "subject": "string",
  "grade": "string",
  "duration_minutes": number,
  "objectives": ["string"],
  "introduction": "string (5-7 min activity)",
  "main_activity": "string (main teaching segment)",
  "guided_practice": "string",
  "independent_practice": "string",
  "assessment": "string",
  "differentiation": {{"advanced": "string", "struggling": "string"}},
  "resources": ["string"],
  "homework": "string"
}}"""

    try:
        import os
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception as e:
        logger.error(f"Lesson plan generation failed: {e}")
        return {"error": str(e)}
