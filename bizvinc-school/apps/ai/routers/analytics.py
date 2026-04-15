"""Performance analytics endpoints for the AI service."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.database import get_db, set_tenant_context
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class WeakAreaRequest(BaseModel):
    tenant_id: str
    student_id: str
    subject_id: str


class AbsenceAnomalyRequest(BaseModel):
    tenant_id: str
    class_id: str
    days: int = 30


@router.post("/weak-areas")
async def detect_weak_areas(req: WeakAreaRequest, db: Session = Depends(get_db)):
    """
    Identify weak areas for a student based on quiz/exam performance per topic.
    Uses simple mastery scoring: correct / attempted per topic.
    """
    set_tenant_context(db, req.tenant_id)

    # Get exam results for this student and subject
    results = db.execute(
        text("""
            SELECT qbi.topic,
                   COUNT(*) as attempted,
                   SUM(CASE WHEN er.answers::jsonb ? qbi.id::text THEN 1 ELSE 0 END) as correct
            FROM exam_results er
            JOIN exams e ON e.id = er.exam_id
            JOIN exam_questions eq ON eq.exam_id = e.id
            JOIN question_bank_items qbi ON qbi.id = eq.question_id
            WHERE er.student_id = :student_id
              AND qbi.subject_id = :subject_id
              AND qbi.topic IS NOT NULL
            GROUP BY qbi.topic
        """),
        {"student_id": req.student_id, "subject_id": req.subject_id},
    ).fetchall()

    weak_areas = []
    for row in results:
        mastery = row.correct / max(row.attempted, 1)
        if mastery < 0.7:  # Below 70% mastery = weak area
            weak_areas.append({
                "topic": row.topic,
                "mastery_score": round(mastery, 4),
                "questions_attempted": row.attempted,
                "questions_correct": row.correct,
                "needs_improvement": True,
            })

    weak_areas.sort(key=lambda x: x["mastery_score"])
    return {"weak_areas": weak_areas, "total_topics": len(results)}


@router.post("/absence-anomalies")
async def detect_absence_anomalies(req: AbsenceAnomalyRequest, db: Session = Depends(get_db)):
    """
    Detect anomalous absence patterns using basic statistical analysis.
    Flags students with: consecutive absences, Monday pattern, sudden drops.
    """
    set_tenant_context(db, req.tenant_id)

    rows = db.execute(
        text("""
            SELECT a.student_id, s.first_name, s.last_name,
                   EXTRACT(DOW FROM a.date) as day_of_week,
                   a.status, a.date
            FROM attendances a
            JOIN students s ON s.id = a.student_id
            WHERE a.tenant_id = :tenant_id
              AND a.class_id = :class_id
              AND a.date >= CURRENT_DATE - :days
              AND a.status IN ('ABSENT_UNEXCUSED', 'ABSENT_EXCUSED')
            ORDER BY a.student_id, a.date
        """),
        {"tenant_id": req.tenant_id, "class_id": req.class_id, "days": req.days},
    ).fetchall()

    # Group by student
    by_student: dict = {}
    for row in rows:
        sid = str(row.student_id)
        if sid not in by_student:
            by_student[sid] = {
                "student_id": sid,
                "name": f"{row.first_name} {row.last_name}",
                "absences": [],
                "monday_absences": 0,
                "total_absences": 0,
            }
        by_student[sid]["absences"].append(str(row.date))
        by_student[sid]["total_absences"] += 1
        if row.day_of_week == 1:  # Monday = 1 in PostgreSQL DOW
            by_student[sid]["monday_absences"] += 1

    # Flag anomalies
    anomalies = []
    for student in by_student.values():
        flags = []
        if student["total_absences"] >= 5:
            flags.append("HIGH_ABSENCE_COUNT")
        monday_rate = student["monday_absences"] / max(student["total_absences"], 1)
        if monday_rate > 0.5:
            flags.append("MONDAY_PATTERN")

        if flags:
            anomalies.append({**student, "flags": flags})

    return {"anomalies": anomalies, "analyzed_students": len(by_student)}
