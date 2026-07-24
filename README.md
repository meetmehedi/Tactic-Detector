# 🛡️ Social Engineering Tactic Detector

> **AI-Powered Multi-Turn Conversation Analyzer & SHAP Explainability Engine**  
> *Detects psychological manipulation tactics in chat transcripts turn-by-turn with token-level risk heatmaps.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https://meetmehedi.github.io/Tactic-Detector/)
[![Project Documentation](https://img.shields.io/badge/📄_Full_Documentation-PROJECT__DOCUMENTATION.md-009688?style=for-the-badge)](PROJECT_DOCUMENTATION.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Live Web Application

The application is deployed and hosted on **GitHub Pages** with an offline client-side inference fallback:

### 👉 **[https://meetmehedi.github.io/Tactic-Detector/](https://meetmehedi.github.io/Tactic-Detector/)**

*(No installation or server setup required — interactive demo runs directly in any web browser!)*

---

## ✨ Features

- 💬 **Multi-Turn Conversation Parsing**: Analyzes full dialogue transcripts turn-by-turn.
- 🎯 **Tactic Taxonomy Classification**: Identifies 5 core manipulation tactics (**Urgency**, **Authority**, **Isolation**, **Reciprocity**, **Emotional**) + **Benign** control.
- 🔥 **SHAP Token Attribution Heatmaps**: Highlights exact manipulative trigger phrases (High, Medium, Low risk).
- 📊 **Overall Risk Index Gauge**: Calculates holistic transcript threat scores ($0\% \text{ to } 100\%$).
- 🗺️ **Interactive Turn Map**: Quick-jump navigation grid for reviewing flagged scam turns.
- 🎨 **Minimalist Futuristic UI**: Steve Jobs × AI Researcher aesthetic inspired by `mdmehedihasan.us` with Dark/Light theme support.
- 🚀 **Zero-Downtime Deployment**: Hybrid API execution (FastAPI backend + browser client-side fallback).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Frontend UI (React 18 + Vite)                      │
│  - Live App: https://meetmehedi.github.io/Tactic-Detector/            │
│  - Steve Jobs × AI Researcher Design System (mdmehedihasan.us)          │
│  - SHAP Heatmaps, Risk Index Gauge, Interactive Turn Map Navigation    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    REST API (JSON) / Browser Fallback Engine
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend (Python 3.11)                        │
│  - REST Endpoints: /api/analyze, /api/analyze/demo, /api/health         │
│  - Sliding-Window Context Concatenation ([SEP] Token Joining)           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                 AI/ML Inference & Explainability Engine                 │
│  - Fine-Tuned DistilBERT Transformer (Sequence Classification)          │
│  - Multi-Label Loss Head (BCEWithLogitsLoss + pos_weight Balancing)     │
│  - SHAP Explainer (SHapley Additive exPlanations Token Scoring)         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Tactic Taxonomy

| Tactic | Icon | Description | Key Triggers |
|---|---|---|---|
| **Urgency** | ⏰ | Artificial time pressure & deadlines | *"immediately"*, *"24 hours"*, *"urgent"*, *"today"* |
| **Authority** | 🎖️ | Impersonating banks, police, or officials | *"officer"*, *"security division"*, *"federal"*, *"court"* |
| **Isolation** | 🔒 | Demanding secrecy & no external advice | *"don't tell anyone"*, *"keep it private"*, *"do not hang up"* |
| **Reciprocity** | 🤝 | Exploiting past favors or small gifts | *"wire fee"*, *"gift card"*, *"send code"*, *"deposit check"* |
| **Emotional** | 💔 | Exploiting fear, panic, guilt, or romance | *"stranded"*, *"scared"*, *"consequences"*, *"love you"* |
| **Benign** | ✅ | Standard everyday dialogue | *"hello"*, *"where are you?"*, *"thanks"* |

---

## 📄 Documentation & Academic Submission

For complete project documentation including dataset generation, model fine-tuning loss functions, evaluation metrics, and validation reports, read:

👉 **[`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md)**

---

## 🛠️ Tech Stack

- **Machine Learning**: PyTorch, HuggingFace Transformers (`distilbert-base-uncased`), SHAP, Scikit-learn
- **Backend API**: Python 3.11, FastAPI, Uvicorn, Pydantic
- **Frontend App**: React 18, Vite, Custom Vanilla CSS Design Tokens
- **CI/CD & Hosting**: GitHub Pages, GitHub Actions (`.github/workflows/deploy.yml`)

---

## 💻 Optional Local Setup

If you wish to run the full FastAPI backend server locally alongside the React frontend:

### 1. Backend (FastAPI + PyTorch)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📜 License

Distributed under the **MIT License**. Created by **Md. Mehedi Hasan** for AI Safety & NLP Security Research.
