"""
train.py
--------
Fine-tune DistilBERT for multi-label social engineering tactic classification.

Supports:
  - Real data (from fetch_real_data.py) + optional synthetic data combined
  - Weighted sampling for class imbalance
  - Sliding-window conversational context
  - Per-class F1 reporting

Usage:
  # With real data only:
  python training/train.py --data data/real_data.jsonl

  # Merge real + synthetic:
  python training/train.py --data data/real_data.jsonl --extra data/dataset.jsonl

  # Full options:
  python training/train.py \
      --data data/real_data.jsonl \
      --extra data/dataset.jsonl \
      --output training/checkpoints/best_model \
      --epochs 5 --batch-size 16 --lr 2e-5
"""

from __future__ import annotations
import argparse
import json
import pathlib
import random
from collections import Counter

import numpy as np
import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from sklearn.metrics import f1_score, classification_report
from sklearn.model_selection import train_test_split

# ─── Config ───────────────────────────────────────────────────────────────────

TACTIC_LABELS = ["urgency", "authority", "isolation", "reciprocity", "emotional", "benign"]
NUM_LABELS = len(TACTIC_LABELS)
LABEL2ID = {l: i for i, l in enumerate(TACTIC_LABELS)}
MAX_LEN = 256
SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_jsonl(path: str) -> list[dict]:
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def merge_and_deduplicate(primary: list[dict], extra: list[dict]) -> list[dict]:
    """Merge two record lists; deduplicate on exact text match."""
    seen = set()
    merged = []
    for r in primary + extra:
        key = r["text"].strip().lower()[:120]
        if key not in seen:
            seen.add(key)
            merged.append(r)
    random.shuffle(merged)
    print(f"  Merged: {len(primary)} primary + {len(extra)} extra → {len(merged)} after dedup")
    return merged


def build_context_map(records: list[dict]) -> dict[str, list[str]]:
    """Map conversation_id → ordered list of turn texts (for sliding window)."""
    ctx: dict[str, list[str]] = {}
    # Sort by turn_id within each conversation
    from itertools import groupby
    by_conv = {}
    for r in records:
        cid = r["conversation_id"]
        by_conv.setdefault(cid, []).append(r)
    for cid, turns in by_conv.items():
        ctx[cid] = [t["text"] for t in sorted(turns, key=lambda x: x.get("turn_id", 0))]
    return ctx


# ─── Dataset ─────────────────────────────────────────────────────────────────

class TacticDataset(Dataset):
    def __init__(self, records: list[dict], tokenizer, context_map: dict[str, list[str]]):
        self.records = records
        self.tokenizer = tokenizer
        self.context_map = context_map

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        rec = self.records[idx]
        conv_id = rec["conversation_id"]
        turn_id = int(rec.get("turn_id", 0))

        # Sliding window context: concatenate up to 2 prior turns
        prior = self.context_map.get(conv_id, [])
        context = prior[max(0, turn_id - 2): turn_id]
        combined = " [SEP] ".join(context + [rec["text"]])

        enc = self.tokenizer(
            combined,
            max_length=MAX_LEN,
            truncation=True,
            padding="max_length",
            return_tensors="pt",
        )

        # Multi-hot label vector
        label_vec = torch.zeros(NUM_LABELS)
        for tactic in rec.get("tactics", ["benign"]):
            if tactic in LABEL2ID:
                label_vec[LABEL2ID[tactic]] = 1.0

        return {
            "input_ids": enc["input_ids"].squeeze(),
            "attention_mask": enc["attention_mask"].squeeze(),
            "labels": label_vec,
        }


# ─── Class Weights & Sampler ──────────────────────────────────────────────────

def compute_pos_weights(records: list[dict]) -> torch.Tensor:
    """BCEWithLogitsLoss pos_weight: (neg_count / pos_count) per class."""
    total = len(records)
    counts = Counter(t for r in records for t in r.get("tactics", ["benign"]) if t in LABEL2ID)
    weights = []
    for label in TACTIC_LABELS:
        pos = counts.get(label, 1)
        neg = total - pos
        weights.append(max(neg / pos, 1.0))
    return torch.tensor(weights, dtype=torch.float)


def make_weighted_sampler(records: list[dict]) -> WeightedRandomSampler:
    """
    Weighted sampler so under-represented tactics are sampled more often.
    Sample weight = 1 / (min tactic frequency) for each record.
    """
    tactic_counts = Counter(t for r in records for t in r.get("tactics", ["benign"]))
    sample_weights = []
    for r in records:
        tactics = r.get("tactics", ["benign"])
        min_count = min(tactic_counts.get(t, 1) for t in tactics)
        sample_weights.append(1.0 / min_count)
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )


# ─── Evaluation ───────────────────────────────────────────────────────────────

def evaluate(model, loader, device, threshold=0.5):
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in loader:
            logits = model(
                batch["input_ids"].to(device),
                batch["attention_mask"].to(device),
            ).logits
            preds = (torch.sigmoid(logits) >= threshold).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(batch["labels"].numpy())
    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    return macro_f1, all_preds, all_labels


# ─── Training ─────────────────────────────────────────────────────────────────

def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[INFO] Device: {device}")
    if device.type == "cpu":
        print("  [WARNING] No GPU found — training will be slow. Use Google Colab for free GPU.")

    # Load data
    print(f"\n[INFO] Loading data from: {args.data}")
    records = load_jsonl(args.data)
    if args.extra:
        print(f"[INFO] Loading extra data from: {args.extra}")
        extra = load_jsonl(args.extra)
        records = merge_and_deduplicate(records, extra)

    print(f"  Total records: {len(records):,}")

    # Label distribution
    tactic_counts = Counter(t for r in records for t in r.get("tactics", ["benign"]))
    print("\n[INFO] Tactic distribution:")
    for t in TACTIC_LABELS:
        bar = "█" * (tactic_counts.get(t, 0) // max(max(tactic_counts.values()) // 30, 1))
        print(f"  {t:<14} {tactic_counts.get(t, 0):>6,}  {bar}")

    # Split 80 / 10 / 10
    train_recs, test_recs = train_test_split(records, test_size=0.2, random_state=SEED)
    val_recs, test_recs = train_test_split(test_recs, test_size=0.5, random_state=SEED)
    print(f"\n[INFO] Train: {len(train_recs):,} | Val: {len(val_recs):,} | Test: {len(test_recs):,}")

    # Build context maps
    ctx_map = build_context_map(records)

    # Tokenizer + Model
    print(f"\n[INFO] Loading base model: {args.base_model}")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        num_labels=NUM_LABELS,
        problem_type="multi_label_classification",
    ).to(device)

    # Datasets
    train_ds = TacticDataset(train_recs, tokenizer, ctx_map)
    val_ds   = TacticDataset(val_recs,   tokenizer, ctx_map)
    test_ds  = TacticDataset(test_recs,  tokenizer, ctx_map)

    sampler = make_weighted_sampler(train_recs)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size)
    test_loader  = DataLoader(test_ds,  batch_size=args.batch_size)

    # Loss: weighted BCE for class imbalance
    pos_weights = compute_pos_weights(train_recs).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weights)

    # Optimizer + scheduler
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,
        num_training_steps=total_steps,
    )

    # Training loop
    output_dir = pathlib.Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    best_val_f1 = 0.0

    print(f"\n[INFO] Training for {args.epochs} epochs…\n")
    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0.0
        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss = criterion(outputs.logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

            if (step + 1) % 50 == 0:
                print(f"  Epoch {epoch} | Step {step+1}/{len(train_loader)} | loss={total_loss/(step+1):.4f}")

        val_f1, _, _ = evaluate(model, val_loader, device)
        avg_loss = total_loss / len(train_loader)
        print(f"\n[EPOCH {epoch}/{args.epochs}] avg_loss={avg_loss:.4f}  val_macro_F1={val_f1:.4f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            print(f"  [SAVED] Saved best model checkpoint (val_F1={val_f1:.4f})\n")

    # Final test evaluation on best checkpoint
    print("\n" + "="*55)
    print("[RESULT] Test Set Evaluation (best checkpoint):")
    print("="*55)
    # Reload best
    from transformers import AutoModelForSequenceClassification as AMC
    best_model = AMC.from_pretrained(output_dir, num_labels=NUM_LABELS).to(device)
    _, preds, labels = evaluate(best_model, test_loader, device)
    print(classification_report(labels, preds, target_names=TACTIC_LABELS, zero_division=0))
    print(f"\n[COMPLETE] Training complete. Best val macro-F1: {best_val_f1:.4f}")
    print(f"   Model saved to: {output_dir}")
    print(f"\nTo use real model in API:")
    print(f"  Set MODEL_PATH={output_dir}")
    print(f"  Change main.py import: from app.inference import ...")


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train DistilBERT tactic classifier on real data.")
    parser.add_argument("--data",       default="data/real_data.jsonl",
                        help="Primary training data JSONL (from fetch_real_data.py)")
    parser.add_argument("--extra",      default=None,
                        help="Optional extra JSONL to merge (e.g. synthetic data)")
    parser.add_argument("--output",     default="training/checkpoints/best_model",
                        help="Output directory for saved model")
    parser.add_argument("--base-model", default="distilbert-base-uncased",
                        help="HuggingFace base model (e.g. roberta-base for better accuracy)")
    parser.add_argument("--epochs",     type=int,   default=5)
    parser.add_argument("--batch-size", type=int,   default=16)
    parser.add_argument("--lr",         type=float, default=2e-5)
    args = parser.parse_args()
    train(args)
