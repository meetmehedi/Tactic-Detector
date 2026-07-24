"""
fetch_real_data.py
------------------
Downloads and normalises multiple public real-world datasets into the
unified JSONL format used by train.py:

  {"conversation_id": str, "turn_id": int, "speaker": str,
   "text": str, "tactics": [str], "source": str}

Datasets pulled:
  1. audreyeleven/MentalManip      → emotional, isolation, authority
  2. pauladroghoff/manipulative-language-detection → all tactics
  3. ealvaradob/phishing-dataset   → authority, urgency (email/SMS bodies)
  4. Ngadou/social-engineering-convo → all tactics
  5. sms_spam (UCI via HF)         → urgency, authority
  6. daily_dialog                  → benign class
  7. persuasionforgood (ConvoKit)  → reciprocity, emotional

Usage:
  pip install datasets convokit
  python training/fetch_real_data.py --output data/real_data.jsonl
"""

from __future__ import annotations
import argparse
import json
import pathlib
import re
from typing import Iterator

from datasets import load_dataset

# ─── Tactic label constants ───────────────────────────────────────────────────

TACTICS = ["urgency", "authority", "isolation", "reciprocity", "emotional", "benign"]


def _write(path: pathlib.Path, records: list[dict]) -> None:
    with open(path, "a") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    print(f"  → wrote {len(records)} records to {path}")


# ─── 1. MentalManip ──────────────────────────────────────────────────────────

MENTALMANIP_LABEL_MAP = {
    # manipulation_type → tactic
    "persuasion":     ["emotional"],
    "intimidation":   ["authority", "emotional"],
    "seduction":      ["emotional", "reciprocity"],
    "gaslighting":    ["isolation", "emotional"],
    "bribery":        ["reciprocity"],
    "pretense":       ["authority"],
    "emotional_blackmail": ["emotional", "isolation"],
    "diversion":      ["authority"],
    "shaming":        ["emotional", "isolation"],
}


def fetch_mentalmanip() -> list[dict]:
    print("\n[1/7] MentalManip (mental manipulation conversations)…")
    try:
        ds = load_dataset("audreyeleven/MentalManip", split="train", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ Could not load MentalManip: {e}")
        return []

    records = []
    for i, row in enumerate(ds):
        text = row.get("sentence") or row.get("text") or row.get("utterance") or ""
        if not text.strip():
            continue
        manip_type = str(row.get("manipulation_type") or row.get("label") or "").lower()
        is_manip = row.get("label", 1)
        if is_manip == 0 or manip_type in ("none", "0", ""):
            tactics = ["benign"]
        else:
            tactics = MENTALMANIP_LABEL_MAP.get(manip_type, ["emotional"])
        records.append({
            "conversation_id": f"mm_{i:05d}",
            "turn_id": 0,
            "speaker": "Speaker",
            "text": text.strip(),
            "tactics": tactics,
            "source": "mentalmanip",
        })
    print(f"  ✓ {len(records)} examples")
    return records


# ─── 2. Manipulative Language Detection ───────────────────────────────────────

PAULADRO_LABEL_MAP = {
    "feigning_innocence": ["isolation"],
    "rationalization":    ["authority"],
    "playing_victim":     ["emotional", "reciprocity"],
    "diversion":          ["authority"],
    "coercion":           ["urgency", "emotional"],
    "normal":             ["benign"],
    "non_manipulative":   ["benign"],
    "0":                  ["benign"],
    "1":                  ["emotional"],   # generic manipulative
}


def fetch_manipulative_language() -> list[dict]:
    print("\n[2/7] Manipulative Language Detection…")
    try:
        ds = load_dataset("pauladroghoff/manipulative-language-detection", split="train", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ Could not load: {e}")
        return []

    records = []
    for i, row in enumerate(ds):
        text = row.get("text") or row.get("sentence") or row.get("utterance") or ""
        if not text.strip():
            continue
        raw_label = str(row.get("label") or row.get("manipulation_type") or "").lower().strip()
        tactics = PAULADRO_LABEL_MAP.get(raw_label, ["emotional"] if raw_label not in ("0", "normal") else ["benign"])
        records.append({
            "conversation_id": f"ml_{i:05d}",
            "turn_id": 0,
            "speaker": "Speaker",
            "text": text.strip(),
            "tactics": tactics,
            "source": "manipulative_language",
        })
    print(f"  ✓ {len(records)} examples")
    return records


# ─── 3. Phishing Dataset ──────────────────────────────────────────────────────

URGENCY_PATTERNS = [
    r"act now", r"immediately", r"within \d+ hours?", r"expires?", r"urgent",
    r"last chance", r"limited time", r"asap", r"deadline", r"suspended",
]


def _has_urgency(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in URGENCY_PATTERNS)


def fetch_phishing() -> list[dict]:
    print("\n[3/7] Phishing Dataset (emails + SMS)…")
    try:
        ds = load_dataset("ealvaradob/phishing-dataset", "emails", split="train", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ Could not load phishing/emails: {e}")
        ds = None

    records = []
    if ds:
        for i, row in enumerate(ds):
            text = row.get("text") or row.get("email") or ""
            label = int(row.get("label", 0))
            if not text.strip() or len(text) < 30:
                continue
            if label == 1:  # phishing
                tactics = ["authority"]
                if _has_urgency(text):
                    tactics.append("urgency")
            else:
                tactics = ["benign"]
            # Truncate long emails to first 512 chars (subject + opening)
            records.append({
                "conversation_id": f"ph_{i:05d}",
                "turn_id": 0,
                "speaker": "Sender",
                "text": text.strip()[:600],
                "tactics": tactics,
                "source": "phishing_email",
            })
        print(f"  ✓ {len(records)} phishing email examples")

    # Also load SMS if available
    try:
        ds_sms = load_dataset("ealvaradob/phishing-dataset", "sms", split="train", trust_remote_code=True)
        sms_records = []
        for i, row in enumerate(ds_sms):
            text = row.get("text") or row.get("sms") or ""
            label = int(row.get("label", 0))
            if not text.strip():
                continue
            if label == 1:
                t = ["urgency"] if _has_urgency(text) else ["authority"]
            else:
                t = ["benign"]
            sms_records.append({
                "conversation_id": f"ph_sms_{i:05d}",
                "turn_id": 0,
                "speaker": "Sender",
                "text": text.strip(),
                "tactics": t,
                "source": "phishing_sms",
            })
        records.extend(sms_records)
        print(f"  ✓ {len(sms_records)} phishing SMS examples")
    except Exception as e:
        print(f"  ⚠ Could not load phishing/sms: {e}")

    return records


# ─── 4. Social Engineering Convo ─────────────────────────────────────────────

SE_LABEL_MAP = {
    "scam":           ["urgency", "authority"],
    "likely a scam":  ["urgency"],
    "not a scam":     ["benign"],
    "1":              ["urgency", "authority"],
    "0":              ["benign"],
}


def fetch_social_engineering_convo() -> list[dict]:
    print("\n[4/7] Social Engineering Conversations…")
    try:
        ds = load_dataset("Ngadou/social-engineering-convo", split="train", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ Could not load: {e}")
        return []

    records = []
    for i, row in enumerate(ds):
        text = row.get("text") or row.get("conversation") or row.get("message") or ""
        if not text.strip():
            continue
        raw = str(row.get("label") or row.get("category") or "").lower().strip()
        tactics = SE_LABEL_MAP.get(raw, ["urgency"])
        records.append({
            "conversation_id": f"se_{i:05d}",
            "turn_id": 0,
            "speaker": "Scammer",
            "text": text.strip(),
            "tactics": tactics,
            "source": "social_engineering_convo",
        })
    print(f"  ✓ {len(records)} examples")
    return records


# ─── 5. SMS Spam ─────────────────────────────────────────────────────────────

def fetch_sms_spam() -> list[dict]:
    print("\n[5/7] SMS Spam Collection…")
    try:
        ds = load_dataset("sms_spam", split="train", trust_remote_code=True)
    except Exception:
        try:
            ds = load_dataset("ucirvine/sms_spam", split="train", trust_remote_code=True)
        except Exception as e:
            print(f"  ⚠ Could not load SMS spam: {e}")
            return []

    records = []
    for i, row in enumerate(ds):
        text = row.get("sms") or row.get("text") or row.get("message") or ""
        label = row.get("label", 0)
        if not text.strip():
            continue
        if label == 1:  # spam
            tactics = ["urgency"] if _has_urgency(text) else ["authority"]
            if _has_urgency(text):
                tactics = list(set(tactics + ["urgency"]))
        else:
            tactics = ["benign"]
        records.append({
            "conversation_id": f"sms_{i:05d}",
            "turn_id": 0,
            "speaker": "Sender",
            "text": text.strip(),
            "tactics": tactics,
            "source": "sms_spam",
        })
    print(f"  ✓ {len(records)} examples")
    return records


# ─── 6. DailyDialog (benign class) ───────────────────────────────────────────

def fetch_daily_dialog(max_turns: int = 3000) -> list[dict]:
    print(f"\n[6/7] DailyDialog (benign, up to {max_turns} turns)…")
    try:
        ds = load_dataset("daily_dialog", split="train", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ Could not load DailyDialog: {e}")
        return []

    records = []
    conv_id = 0
    for dialog in ds:
        for turn_id, text in enumerate(dialog.get("dialog", [])):
            if len(records) >= max_turns:
                break
            if not text.strip():
                continue
            records.append({
                "conversation_id": f"dd_{conv_id:05d}",
                "turn_id": turn_id,
                "speaker": "Speaker" if turn_id % 2 == 0 else "Listener",
                "text": text.strip(),
                "tactics": ["benign"],
                "source": "daily_dialog",
            })
        conv_id += 1
        if len(records) >= max_turns:
            break
    print(f"  ✓ {len(records)} benign turns")
    return records


# ─── 7. Persuasion for Good (ConvoKit) ───────────────────────────────────────

P4G_STRATEGY_MAP = {
    # ConvoKit strategy label → our tactic
    "foot-in-the-door":   ["reciprocity"],
    "emotion appeal":     ["emotional"],
    "logical appeal":     ["benign"],      # legitimate persuasion
    "credibility appeal": ["authority"],
    "self-modeling":      ["reciprocity"],
    "personal story":     ["emotional"],
    "evidence":           ["benign"],
    "donation information": ["benign"],
    "ask donation":       ["reciprocity"],
    "acknowledgement":    ["benign"],
    "no strategy":        ["benign"],
    "have you heard":     ["benign"],
    "task related":       ["benign"],
}


def fetch_persuasion_for_good() -> list[dict]:
    print("\n[7/7] Persuasion for Good (ConvoKit)…")
    try:
        from convokit import Corpus, download
        corpus = Corpus(filename=download("persuasionforgood-corpus"))
    except ImportError:
        print("  ⚠ convokit not installed. Run: pip install convokit")
        return []
    except Exception as e:
        print(f"  ⚠ Could not load Persuasion for Good: {e}")
        return []

    records = []
    for conv in corpus.iter_conversations():
        conv_id = conv.id
        for utt in conv.iter_utterances():
            text = utt.text
            if not text or not text.strip():
                continue
            # Strategy labels are in utterance meta
            strategy = (
                utt.meta.get("er_label_1") or
                utt.meta.get("ee_label_1") or
                "no strategy"
            )
            strategy = str(strategy).lower().strip()
            tactics = P4G_STRATEGY_MAP.get(strategy, ["emotional"])
            records.append({
                "conversation_id": f"p4g_{conv_id}",
                "turn_id": int(utt.id.split("_")[-1]) if "_" in utt.id else 0,
                "speaker": utt.speaker.id,
                "text": text.strip(),
                "tactics": tactics,
                "source": "persuasion_for_good",
            })
    print(f"  ✓ {len(records)} turns from {corpus.num_conversations} conversations")
    return records


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="data/real_data.jsonl", help="Output JSONL path")
    parser.add_argument("--no-p4g", action="store_true", help="Skip Persuasion for Good (requires convokit)")
    parser.add_argument("--max-benign", type=int, default=3000, help="Max DailyDialog benign turns")
    args = parser.parse_args()

    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Start fresh
    output.write_text("")

    all_records: list[dict] = []
    all_records.extend(fetch_mentalmanip())
    all_records.extend(fetch_manipulative_language())
    all_records.extend(fetch_phishing())
    all_records.extend(fetch_social_engineering_convo())
    all_records.extend(fetch_sms_spam())
    all_records.extend(fetch_daily_dialog(args.max_benign))
    if not args.no_p4g:
        all_records.extend(fetch_persuasion_for_good())

    # Write
    with open(output, "w") as f:
        for r in all_records:
            f.write(json.dumps(r) + "\n")

    # Summary stats
    from collections import Counter
    tactic_counts = Counter(t for r in all_records for t in r["tactics"])
    source_counts = Counter(r["source"] for r in all_records)

    print(f"\n{'='*50}")
    print(f"✅ Total records: {len(all_records):,}")
    print(f"\nPer tactic:")
    for t, c in sorted(tactic_counts.items(), key=lambda x: -x[1]):
        print(f"  {t:<14} {c:>6,}")
    print(f"\nPer source:")
    for s, c in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"  {s:<35} {c:>6,}")
    print(f"\nSaved to: {output}")


if __name__ == "__main__":
    main()
