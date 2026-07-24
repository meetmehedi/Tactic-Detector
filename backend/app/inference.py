"""
inference.py
------------
Real DistilBERT-based inference engine.
Swap this in for mock_inference.py once a fine-tuned checkpoint exists.

Usage:
    from app.inference import analyze_transcript, compute_risk_score, get_dominant_tactic
"""

from __future__ import annotations
import os
import logging
from typing import List

import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from app.models import TurnInput, TurnResult, HighlightedToken

logger = logging.getLogger(__name__)

# ─── Config ───────────────────────────────────────────────────────────────────

MODEL_PATH = os.getenv("MODEL_PATH", "./training/checkpoints/best_model")
BASE_MODEL = "distilbert-base-uncased"
THRESHOLD = 0.5
MAX_LENGTH = 256

TACTIC_LABELS = ["urgency", "authority", "isolation", "reciprocity", "emotional", "benign"]

# ─── Model Loading ────────────────────────────────────────────────────────────

_tokenizer = None
_model = None


def _load_model():
    global _tokenizer, _model
    if _tokenizer is None:
        logger.info("Loading tokenizer from %s", MODEL_PATH)
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    if _model is None:
        logger.info("Loading model from %s", MODEL_PATH)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        _model.eval()
    return _tokenizer, _model


# ─── SHAP Token Attribution ───────────────────────────────────────────────────

def _compute_shap_highlights(text: str, tactics: List[str]) -> List[HighlightedToken]:
    """
    Compute token-level SHAP attribution scores.
    Requires: pip install shap
    """
    try:
        import shap
        tokenizer, model = _load_model()

        def predict(texts):
            enc = tokenizer(texts, return_tensors="pt", truncation=True,
                            max_length=MAX_LENGTH, padding=True)
            with torch.no_grad():
                logits = model(**enc).logits
            return torch.sigmoid(logits).numpy()

        explainer = shap.Explainer(predict, tokenizer)
        shap_values = explainer([text])

        tokens = shap_values.data[0]
        values = np.abs(shap_values.values[0]).max(axis=1)  # max across tactic classes
        max_val = values.max() if values.max() > 0 else 1.0

        highlights = []
        for token, val in zip(tokens, values):
            if token in ("[CLS]", "[SEP]", "[PAD]"):
                continue
            highlights.append(HighlightedToken(
                token=token,
                score=round(float(val / max_val), 3),
            ))
        return highlights
    except Exception as e:
        logger.warning("SHAP failed, returning empty highlights: %s", e)
        return []


# ─── Core Analysis ────────────────────────────────────────────────────────────

def _classify_turn(text: str) -> dict[str, float]:
    tokenizer, model = _load_model()
    enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
    with torch.no_grad():
        logits = model(**enc).logits
    probs = torch.sigmoid(logits).squeeze().tolist()
    if isinstance(probs, float):
        probs = [probs]
    return {label: round(float(p), 3) for label, p in zip(TACTIC_LABELS, probs)}


def analyze_transcript(turns: List[TurnInput]) -> List[TurnResult]:
    results: List[TurnResult] = []
    for i, turn in enumerate(turns):
        context_window = turns[max(0, i - 2): i + 1]
        combined = " [SEP] ".join(t.text for t in context_window)

        scores = _classify_turn(combined)
        tactics = [t for t, s in scores.items() if s >= THRESHOLD] or ["benign"]
        max_conf = max(scores.values())
        highlights = _compute_shap_highlights(turn.text, tactics)

        results.append(TurnResult(
            turn_id=i,
            speaker=turn.speaker,
            text=turn.text,
            tactics=tactics,
            confidence=round(max_conf, 3),
            tactic_scores=scores,
            highlighted_tokens=highlights,
        ))
    return results


def compute_risk_score(results: List[TurnResult]) -> float:
    if not results:
        return 0.0
    high_risk = [r for r in results if "benign" not in r.tactics]
    if not high_risk:
        return 0.0
    avg_conf = sum(r.confidence for r in high_risk) / len(results)
    density = len(high_risk) / len(results)
    return round(min(avg_conf * 0.6 + density * 0.4, 1.0), 3)


def get_dominant_tactic(results: List[TurnResult]) -> str | None:
    counts: dict[str, int] = {}
    for r in results:
        for t in r.tactics:
            if t != "benign":
                counts[t] = counts.get(t, 0) + 1
    return max(counts, key=counts.get) if counts else None
