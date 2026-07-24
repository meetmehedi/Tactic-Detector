"""
main.py — FastAPI entry point for Tactic Detector backend
"""

from __future__ import annotations
from collections import Counter

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from app.models import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.mock_inference import (
    analyze_transcript,
    compute_risk_score,
    get_dominant_tactic,
)
from app.database import init_db, get_db, log_analysis

# ─── App Setup ────────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Tactic Detector API",
    description="Detects social engineering tactics in conversation transcripts using NLP.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    return HealthResponse(status="ok", model_loaded=True)


@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
@limiter.limit("30/minute")
async def analyze(
    request: Request,
    body: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze a conversation transcript for social engineering tactics.

    Each turn is classified with one or more tactic labels, confidence scores,
    and token-level highlights showing *why* the model flagged it.
    """
    if len(body.transcript) > 200:
        raise HTTPException(status_code=400, detail="Transcript exceeds 200 turns.")

    results = analyze_transcript(body.transcript)
    risk_score = compute_risk_score(results)
    dominant = get_dominant_tactic(results)
    flagged = [r.turn_id for r in results if "benign" not in r.tactics]

    # Tactic distribution for logging (anonymized)
    all_tactics = [t for r in results for t in r.tactics if t != "benign"]
    tactic_counts = dict(Counter(all_tactics))

    log_analysis(
        db=db,
        num_turns=len(results),
        overall_risk_score=risk_score,
        dominant_tactic=dominant,
        tactic_counts=tactic_counts,
        flagged_turns_count=len(flagged),
    )

    return AnalyzeResponse(
        turns=results,
        overall_risk_score=risk_score,
        dominant_tactic=dominant,
        flagged_turn_ids=flagged,
    )


@app.post("/analyze/demo", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_demo():
    """
    Run analysis on a built-in demo transcript (romance scam scenario).
    No authentication required — useful for portfolio links.
    """
    import json, pathlib

    demo_file = pathlib.Path(__file__).parent.parent.parent / "data" / "sample_transcripts" / "romance_scam.json"
    if not demo_file.exists():
        raise HTTPException(status_code=404, detail="Demo data not found.")

    with open(demo_file) as f:
        raw = json.load(f)

    from app.models import TurnInput
    turns = [TurnInput(**t) for t in raw["transcript"]]
    results = analyze_transcript(turns)
    risk_score = compute_risk_score(results)
    dominant = get_dominant_tactic(results)
    flagged = [r.turn_id for r in results if "benign" not in r.tactics]

    return AnalyzeResponse(
        turns=results,
        overall_risk_score=risk_score,
        dominant_tactic=dominant,
        flagged_turn_ids=flagged,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
