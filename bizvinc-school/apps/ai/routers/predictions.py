"""Fee defaulter prediction endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from services.database import get_db, set_tenant_context
from models.fee_predictor import predictor, PaymentFeatures
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class PredictStudentRequest(BaseModel):
    tenant_id: str
    student_id: str


class RunTenantPredictionsRequest(BaseModel):
    tenant_id: str


@router.post("/student")
async def predict_student_risk(req: PredictStudentRequest, db: Session = Depends(get_db)):
    """
    Calculate fee defaulter risk for a single student based on 12-month payment history.
    """
    set_tenant_context(db, req.tenant_id)

    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    invoices = db.execute(
        text("""
            SELECT i.id, i.total_amount, i.paid_amount, i.status, i.due_date, i.paid_at
            FROM invoices i
            WHERE i.tenant_id = :tenant_id
              AND i.student_id = :student_id
              AND i.issued_at >= :cutoff
            ORDER BY i.due_date ASC
        """),
        {"tenant_id": req.tenant_id, "student_id": req.student_id, "cutoff": twelve_months_ago},
    ).fetchall()

    if not invoices:
        return {"risk_score": 0.0, "risk_category": "LOW", "features": {}, "message": "Insufficient data"}

    now = datetime.utcnow()
    late_count = 0
    partial_count = 0
    total_days_late = 0
    late_paid_count = 0
    consecutive_missed = 0
    max_consecutive = 0
    total_outstanding = 0.0
    last_paid_at = None

    for inv in invoices:
        paid_at = inv.paid_at
        due_date = inv.due_date
        outstanding = float(inv.total_amount) - float(inv.paid_amount)

        if paid_at and paid_at > due_date:
            days_late = (paid_at - due_date).days
            late_count += 1
            total_days_late += days_late
            late_paid_count += 1
            consecutive_missed = 0
            last_paid_at = paid_at
        elif inv.status in ("PENDING", "OVERDUE") and due_date < now:
            consecutive_missed += 1
            max_consecutive = max(max_consecutive, consecutive_missed)
            total_outstanding += outstanding
        elif inv.status == "PARTIAL":
            partial_count += 1
            consecutive_missed = 0
            total_outstanding += outstanding
            if paid_at:
                last_paid_at = max(last_paid_at, paid_at) if last_paid_at else paid_at
        else:
            consecutive_missed = 0
            if paid_at:
                last_paid_at = max(last_paid_at, paid_at) if last_paid_at else paid_at

    months_since_last = 0
    if last_paid_at:
        months_since_last = int((now - last_paid_at).days / 30)
    elif len(invoices) > 0:
        months_since_last = 6

    features = PaymentFeatures(
        late_payment_count=late_count,
        late_payment_rate=late_count / max(len(invoices), 1),
        avg_days_late=total_days_late / max(late_paid_count, 1),
        partial_payment_count=partial_count,
        consecutive_missed=max_consecutive,
        months_since_last_payment=months_since_last,
        total_outstanding=total_outstanding,
    )

    result = predictor.predict_risk_score(features)

    # Persist result to database
    try:
        db.execute(
            text("""
                INSERT INTO fee_defaulter_risks (id, student_id, tenant_id, risk_score, risk_category, features, predicted_at)
                VALUES (uuid_generate_v4(), :student_id, :tenant_id, :risk_score, :risk_category, :features::jsonb, NOW())
                ON CONFLICT (student_id) DO UPDATE SET
                    risk_score = EXCLUDED.risk_score,
                    risk_category = EXCLUDED.risk_category,
                    features = EXCLUDED.features,
                    predicted_at = NOW()
            """),
            {
                "student_id": req.student_id,
                "tenant_id": req.tenant_id,
                "risk_score": result["risk_score"],
                "risk_category": result["risk_category"],
                "features": str(result["features"]).replace("'", '"'),
            },
        )
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist prediction: {e}")
        db.rollback()

    return result


@router.post("/tenant/run")
async def run_tenant_predictions(req: RunTenantPredictionsRequest, db: Session = Depends(get_db)):
    """
    Run fee defaulter predictions for all active students in a tenant.
    Returns a summary of predictions run.
    """
    set_tenant_context(db, req.tenant_id)

    students = db.execute(
        text("SELECT id FROM students WHERE tenant_id = :tenant_id AND status = 'ACTIVE'"),
        {"tenant_id": req.tenant_id},
    ).fetchall()

    results = {"total": len(students), "processed": 0, "errors": 0,
               "high_risk": 0, "critical": 0}

    for student in students:
        try:
            from fastapi.testclient import TestClient
            req_inner = PredictStudentRequest(tenant_id=req.tenant_id, student_id=str(student.id))
            result = await predict_student_risk(req_inner, db)
            results["processed"] += 1
            if result.get("risk_category") == "HIGH":
                results["high_risk"] += 1
            elif result.get("risk_category") == "CRITICAL":
                results["critical"] += 1
        except Exception as e:
            logger.error(f"Error predicting for student {student.id}: {e}")
            results["errors"] += 1

    return results
