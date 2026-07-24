"""
mock_inference.py
-----------------
Rule-based inference engine used as a stand-in while the real DistilBERT model
is being trained. Provides realistic-looking output so the frontend is fully
functional from day one.

Replace `analyze_transcript()` calls with inference.py once the model is ready.
"""

import re
from typing import List
from app.models import TurnInput, TurnResult, HighlightedToken

# ─── Tactic Keyword Patterns ─────────────────────────────────────────────────

TACTIC_PATTERNS: dict[str, List[str]] = {
    "urgency": [
        r"\bact now\b", r"\blimited time\b", r"\bexpires?\b", r"\bimmediately\b",
        r"\bwithin \d+ hours?\b", r"\btoday only\b", r"\bdon't (wait|delay)\b",
        r"\blast chance\b", r"\burgent\b", r"\basap\b", r"\bright away\b",
        r"\bdeadline\b", r"\bsuspend(ed)?\b", r"\bblock(ed)?\b",
    ],
    "authority": [
        r"\bbank\b", r"\bpolice\b", r"\bifrs\b", r"\bits?\b", r"\bgovernment\b",
        r"\bofficial\b", r"\bauthority\b", r"\blegal\b", r"\bwarrant\b",
        r"\byour account\b", r"\bverif(y|ication)\b", r"\bfederal\b",
        r"\binternal revenue\b", r"\bmanager\b", r"\bsupervis\b",
    ],
    "isolation": [
        r"\bdon't tell\b", r"\bkeep (this|it) (between|secret)\b",
        r"\bjust between us\b", r"\bdon't (mention|share|discuss)\b",
        r"\bno one else\b", r"\byour (family|friends) (won't|don't)\b",
        r"\bprivate\b.*\bconversation\b", r"\bconfidential\b",
    ],
    "reciprocity": [
        r"\bi('ve)? helped? you\b", r"\bafter everything\b",
        r"\byou owe\b", r"\bin return\b", r"\bfavor\b", r"\bdo this for me\b",
        r"\bI did .{1,30} for you\b", r"\bwe('ve)? been .{1,30} friends\b",
        r"\btrust me\b",
    ],
    "emotional": [
        r"\bscared?\b", r"\bafraid\b", r"\bworried\b", r"\bdesperate\b",
        r"\bpanic\b", r"\bguilty?\b", r"\bsham(e|eful)\b", r"\blove\b",
        r"\bmiss you\b", r"\bbroken\b", r"\bcrying\b", r"\bsuffering\b",
        r"\balone\b", r"\bno one cares\b", r"\bonly you\b",
    ],
}

# ─── Tactic Display Metadata ──────────────────────────────────────────────────

TACTIC_COLORS = {
    "urgency":      "#f59e0b",  # amber
    "authority":    "#3b82f6",  # blue
    "isolation":    "#8b5cf6",  # purple
    "reciprocity":  "#10b981",  # emerald
    "emotional":    "#ef4444",  # red
    "benign":       "#6b7280",  # gray
}

# ─── Core Analysis Logic ──────────────────────────────────────────────────────

def _score_turn(text: str) -> dict[str, float]:
    """Return per-tactic confidence scores for a single turn."""
    text_lower = text.lower()
    scores: dict[str, float] = {}
    for tactic, patterns in TACTIC_PATTERNS.items():
        matches = sum(1 for p in patterns if re.search(p, text_lower))
        if matches > 0:
            # Sigmoid-like scaling: more matches → higher score, max ~0.97
            raw = min(matches / max(len(patterns) * 0.3, 1), 1.0)
            scores[tactic] = round(0.55 + raw * 0.42, 3)
    return scores if scores else {"benign": 0.92}


def _highlight_tokens(text: str, tactics: List[str]) -> List[HighlightedToken]:
    """Return token-level attribution scores (mock SHAP via regex matching)."""
    words = text.split()
    highlights: List[HighlightedToken] = []
    text_lower = text.lower()

    for word in words:
        score = 0.0
        word_clean = re.sub(r"[^\w]", "", word.lower())
        for tactic in tactics:
            if tactic == "benign":
                continue
            for pattern in TACTIC_PATTERNS.get(tactic, []):
                # Check if this word is part of any matching phrase
                match = re.search(pattern, text_lower)
                if match and word_clean in match.group(0).replace(" ", "_").split("_"):
                    score = max(score, 0.65 + len(word_clean) * 0.01)
        highlights.append(HighlightedToken(token=word, score=round(min(score, 0.99), 3)))

    return highlights


def analyze_transcript(turns: List[TurnInput]) -> List[TurnResult]:
    """
    Analyze a full conversation transcript and return per-turn results.
    Uses sliding window of 2 prior turns for context (mirrors the real model).
    """
    results: List[TurnResult] = []

    for i, turn in enumerate(turns):
        # Sliding window context: concatenate with up to 2 prior turns
        context_window = turns[max(0, i - 2): i + 1]
        combined_text = " ".join(t.text for t in context_window)

        scores = _score_turn(combined_text)
        tactics_detected = [t for t, s in scores.items() if s >= 0.6]
        if not tactics_detected:
            tactics_detected = ["benign"]

        max_confidence = max(scores.values())
        highlights = _highlight_tokens(turn.text, tactics_detected)

        results.append(TurnResult(
            turn_id=i,
            speaker=turn.speaker,
            text=turn.text,
            tactics=tactics_detected,
            confidence=round(max_confidence, 3),
            tactic_scores=scores,
            highlighted_tokens=highlights,
        ))

    return results


def compute_risk_score(results: List[TurnResult]) -> float:
    """Aggregate risk score for the whole conversation (0-1)."""
    if not results:
        return 0.0
    high_risk_turns = [r for r in results if "benign" not in r.tactics]
    if not high_risk_turns:
        return 0.0
    avg_conf = sum(r.confidence for r in high_risk_turns) / len(results)
    density = len(high_risk_turns) / len(results)
    return round(min(avg_conf * 0.6 + density * 0.4, 1.0), 3)


def get_dominant_tactic(results: List[TurnResult]) -> str | None:
    """Return the most frequently detected non-benign tactic."""
    counts: dict[str, int] = {}
    for r in results:
        for t in r.tactics:
            if t != "benign":
                counts[t] = counts.get(t, 0) + 1
    return max(counts, key=counts.get) if counts else None
