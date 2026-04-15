"""
Fee defaulter risk prediction model.
Uses a weighted rule-based scorer for the MVP phase.
Once 12+ months of payment data is available, replaces with trained XGBoost.
"""

from dataclasses import dataclass
from enum import Enum
import numpy as np


class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class PaymentFeatures:
    late_payment_count: int
    late_payment_rate: float       # 0.0 – 1.0
    avg_days_late: float
    partial_payment_count: int
    consecutive_missed: int
    months_since_last_payment: int
    total_outstanding: float
    sibling_count: int = 0


class FeeDefaulterPredictor:
    """Rule-based defaulter risk scorer (pre-ML phase)."""

    WEIGHTS = {
        "late_payment_rate": 0.35,
        "consecutive_missed": 0.25,
        "avg_days_late": 0.20,
        "partial_payment_count": 0.12,
        "months_since_last_payment": 0.08,
    }

    def predict_risk_score(self, features: PaymentFeatures) -> dict:
        """
        Returns risk_score (0-1) and risk_category based on weighted feature scoring.
        """
        score = (
            min(features.late_payment_rate, 1.0) * self.WEIGHTS["late_payment_rate"]
            + min(features.consecutive_missed / 3.0, 1.0) * self.WEIGHTS["consecutive_missed"]
            + min(features.avg_days_late / 60.0, 1.0) * self.WEIGHTS["avg_days_late"]
            + min(features.partial_payment_count / 5.0, 1.0) * self.WEIGHTS["partial_payment_count"]
            + min(features.months_since_last_payment / 3.0, 1.0) * self.WEIGHTS["months_since_last_payment"]
        )
        score = round(min(score, 1.0), 4)

        if score >= 0.7:
            category = RiskCategory.CRITICAL
        elif score >= 0.5:
            category = RiskCategory.HIGH
        elif score >= 0.3:
            category = RiskCategory.MEDIUM
        else:
            category = RiskCategory.LOW

        return {
            "risk_score": score,
            "risk_category": category.value,
            "features": {
                "late_payment_count": features.late_payment_count,
                "late_payment_rate": features.late_payment_rate,
                "avg_days_late": features.avg_days_late,
                "partial_payment_count": features.partial_payment_count,
                "consecutive_missed": features.consecutive_missed,
                "months_since_last_payment": features.months_since_last_payment,
                "total_outstanding": features.total_outstanding,
            },
        }

    def train_xgboost(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Train an XGBoost classifier on labeled payment history.
        Call this once 6–12 months of real data is available.
        """
        try:
            import xgboost as xgb
            from sklearn.preprocessing import StandardScaler

            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                use_label_encoder=False,
                eval_metric="logloss",
            )
            self.model.fit(X_scaled, y)
        except ImportError:
            raise RuntimeError("xgboost is required for model training")


# Singleton instance
predictor = FeeDefaulterPredictor()
