from pydantic import BaseModel, Field
from typing import List, Optional


# ─── Request Schemas ──────────────────────────────────────────────────────────

class TurnInput(BaseModel):
    speaker: str = Field(..., example="Scammer")
    text: str = Field(..., example="This is urgent — your account will be suspended in 24 hours.")


class AnalyzeRequest(BaseModel):
    transcript: List[TurnInput] = Field(
        ...,
        min_length=1,
        description="Ordered list of conversation turns.",
    )


# ─── Response Schemas ─────────────────────────────────────────────────────────

class HighlightedToken(BaseModel):
    token: str
    score: float  # SHAP attribution score (0-1)


class TurnResult(BaseModel):
    turn_id: int
    speaker: str
    text: str
    tactics: List[str]                          # e.g. ["urgency", "authority"]
    confidence: float                            # max confidence across detected tactics
    tactic_scores: dict[str, float]             # per-tactic confidence scores
    highlighted_tokens: List[HighlightedToken]  # token-level SHAP highlights


class AnalyzeResponse(BaseModel):
    turns: List[TurnResult]
    overall_risk_score: float   # 0-1 aggregate risk
    dominant_tactic: Optional[str]  # most prominent tactic in the conversation
    flagged_turn_ids: List[int]     # turns with risk above threshold


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"
