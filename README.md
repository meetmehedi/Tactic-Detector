# 🛡️ Social Engineering Tactic Detector

> An AI-powered pipeline that analyzes conversation transcripts, classifies social engineering tactics turn-by-turn, and explains *why* using token-level highlights — built as a portfolio + research project.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  React Frontend  │────▶│  FastAPI Backend  │────▶│  Model Inference   │
│  (paste/upload   │◀────│  (REST API)       │◀────│  (DistilBERT +     │
│   transcript)    │     │                   │     │   SHAP explainer)  │
└─────────────────┘     └──────────────────┘     └───────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  SQLite           │
                          │  (usage logging)  │
                          └──────────────────┘
```

## Tactic Taxonomy (Cialdini-based)

| Tactic | Description | Icon |
|--------|-------------|------|
| **Urgency** | Artificial time pressure ("act now", "24 hours") | ⏰ |
| **Authority** | Impersonating banks, police, government | 🎖️ |
| **Isolation** | Discouraging the victim from consulting others | 🔒 |
| **Reciprocity** | Leveraging past favors to extract compliance | 🤝 |
| **Emotional** | Exploiting fear, guilt, loneliness, or romance | 💔 |
| **Benign** | Normal, non-manipulative conversation | ✅ |

---

## Quick Start

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend (React + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## API Reference

### `POST /analyze`
Analyze a conversation transcript.

**Request:**
```json
{
  "transcript": [
    {"speaker": "Scammer", "text": "This is urgent — act now or lose everything."},
    {"speaker": "Victim", "text": "What do I need to do?"}
  ]
}
```

**Response:**
```json
{
  "turns": [
    {
      "turn_id": 0,
      "speaker": "Scammer",
      "text": "This is urgent — act now or lose everything.",
      "tactics": ["urgency"],
      "confidence": 0.87,
      "tactic_scores": {"urgency": 0.87, "benign": 0.05},
      "highlighted_tokens": [
        {"token": "urgent", "score": 0.92},
        {"token": "act", "score": 0.71}
      ]
    }
  ],
  "overall_risk_score": 0.72,
  "dominant_tactic": "urgency",
  "flagged_turn_ids": [0]
}
```

### `POST /analyze/demo`
Run analysis on a built-in romance scam demo transcript. No input required.

### `GET /health`
System health check.

---

## Model Training (Phase 2)

### 1. Generate Dataset
```bash
cd backend
export OPENAI_API_KEY=sk-...
python training/generate_dataset.py --output data/dataset.jsonl --per-tactic 150
```

### 2. Train DistilBERT
```bash
python training/train.py \
  --data data/dataset.jsonl \
  --output training/checkpoints/best_model \
  --epochs 5 \
  --batch-size 16
```

The trained model is saved to `training/checkpoints/best_model/`. Set `MODEL_PATH` env var and switch `main.py` imports from `mock_inference` to `inference` to use it.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Model | DistilBERT/RoBERTa + SHAP |
| Backend | FastAPI + Python 3.11 |
| Frontend | React 18 + Tailwind CSS v4 |
| Database | SQLite (SQLAlchemy) |
| Hosting | Vercel (frontend) + Render (backend) |
| Dataset | LLM-generated + DailyDialog negatives |

---

## Project Structure

```
Tactic Detector/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes
│   │   ├── models.py         # Pydantic schemas
│   │   ├── mock_inference.py # Rule-based demo engine
│   │   ├── inference.py      # Real DistilBERT + SHAP
│   │   └── database.py       # SQLite logging
│   └── training/
│       ├── generate_dataset.py
│       └── train.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── TranscriptInput.jsx
│           ├── TurnAnalysis.jsx
│           ├── TacticTimeline.jsx
│           └── RiskBadge.jsx
└── data/
    └── sample_transcripts/
```

---

## Roadmap

- [x] FastAPI backend with mock inference
- [x] React frontend with heatmap visualization
- [x] SHAP token-level attribution
- [x] SQLite usage logging
- [ ] Synthetic dataset generation (Phase 1)
- [ ] DistilBERT fine-tuning (Phase 2)
- [ ] Real model inference swap-in
- [ ] HuggingFace model card + dataset release
- [ ] Demo video for portfolio

---

## License

MIT © 2024 — Built for NLP safety research and portfolio demonstration.
