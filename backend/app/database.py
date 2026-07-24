"""
database.py
-----------
SQLite-backed logging of anonymized analysis requests.
Usage data (tactic distribution, risk scores) feeds the paper's
real-world validation section without storing raw PII.
"""

from __future__ import annotations
import json
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, String, Text, DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = "sqlite:///./tactic_detector.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    num_turns = Column(Integer)
    overall_risk_score = Column(Float)
    dominant_tactic = Column(String(50), nullable=True)
    tactic_distribution = Column(Text)   # JSON: {"urgency": 3, "authority": 1, ...}
    flagged_turns_count = Column(Integer)
    model_version = Column(String(20), default="mock-v1")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def log_analysis(
    db: Session,
    num_turns: int,
    overall_risk_score: float,
    dominant_tactic: str | None,
    tactic_counts: dict[str, int],
    flagged_turns_count: int,
    model_version: str = "mock-v1",
) -> None:
    """Insert an anonymized log entry (no raw text stored)."""
    entry = AnalysisLog(
        num_turns=num_turns,
        overall_risk_score=overall_risk_score,
        dominant_tactic=dominant_tactic,
        tactic_distribution=json.dumps(tactic_counts),
        flagged_turns_count=flagged_turns_count,
        model_version=model_version,
    )
    db.add(entry)
    db.commit()
