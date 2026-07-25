# Tactic Detector: AI-Powered Social Engineering Manipulation Analyzer
> **Comprehensive System Documentation & Technical Report**  
> **Author**: Md. Mehedi Hasan  
> **Live Web Application**: [https://meetmehedi.github.io/Tactic-Detector/](https://meetmehedi.github.io/Tactic-Detector/)  
> **GitHub Repository**: [https://github.com/meetmehedi/Tactic-Detector](https://github.com/meetmehedi/Tactic-Detector)

---

## Executive Summary

**Tactic Detector** is an end-to-end Machine Learning system designed to detect, classify, and visually explain psychological manipulation tactics used in multi-turn social engineering conversations (e.g., romance scams, tech support fraud, bank phishing, and fake job offers).

Unlike traditional keyword filters, Tactic Detector models conversation context across speaker turns using a fine-tuned **DistilBERT Transformer** for **multi-label sequence classification**. It provides **explainable AI (XAI)** capabilities by leveraging **SHAP (SHapley Additive exPlanations)** token-level attribution heatmaps to pinpoint exact manipulative phrases.

The solution features a high-performance **FastAPI backend**, a sleek **React + Vite frontend** styled after modern futuristic design principles, and an automated **GitHub Pages deployment pipeline** equipped with a client-side fallback inference engine for zero-downtime execution.

---

## 1. System Architecture

The project consists of three core layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Frontend UI (React 18 + Vite)                      │
│ - Steve Jobs × AI Researcher Design System (mdmehedihasan.us inspired)  │
│ - Widescreen 1400px responsive layout & Dark/Light mode support        │
│ - Turn-by-Turn SHAP Heatmaps, Risk Index Gauge, Interactive Turn Map   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    REST API (JSON) / Offline Fallback
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend (Python 3.11)                        │
│ - REST Endpoints: /api/analyze, /api/analyze/demo, /api/health         │
│ - Sliding-Window Conversation Context Assembly                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                 AI/ML Inference & Explainability Engine                 │
│ - PyTorch + HuggingFace DistilBERT (Fine-Tuned Transformer)            │
│ - Multi-Label Classification Head (Sigmoid + BCEWithLogitsLoss)         │
│ - SHAP Explainer for Token Attribution Heatmap Generation               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Machine Learning Pipeline & Model Architecture

### 2.1 Model Specification
- **Base Architecture**: `distilbert-base-uncased` (66 Million Parameters)
- **Task Type**: Multi-Label Text Classification
- **Input Representation**: Contextual sliding-window sequence ($[SEP]$ tokens joining up to 2 prior conversation turns).
- **Output Layer**: 6 linear outputs with Sigmoid activation ($threshold = 0.5$).

### 2.2 Tactic Taxonomy & Label Classes
The model classifies input text into six non-mutually exclusive categories:

| Tactic Label | Symbol | Description | Psychological Mechanism |
|---|---|---|---|
| **Urgency** | URG | Artificial time pressure or deadlines | Forces hasty compliance by bypassing analytical thinking |
| **Authority** | AUT | Impersonation of officials, banks, or law | Exploits ingrained obedience to established authority figures |
| **Isolation** | ISO | Secrecy demands and discouraging external help | Prevents victims from seeking second opinions or sanity checks |
| **Reciprocity** | REC | Leveraging past favors or small gifts | Triggers social obligations to return favors or make payments |
| **Emotional** | EMO | Exploiting fear, panic, romance, or guilt | Clouding judgment through heightened emotional state |
| **Benign** | BEN | Normal non-manipulative conversation | Control class for standard everyday dialogue |

### 2.3 Sliding-Window Context Concatenation
Single turns in a conversation often lack sufficient context (e.g., *"Why do I need to do that?"*). To resolve ambiguity:
$$\text{Input Sequence} = \text{Turn}_{i-2} \text{ [SEP] } \text{Turn}_{i-1} \text{ [SEP] } \text{Turn}_i$$

This allows the model to process contextual state changes across turns.

---

## 3. Dataset & Training Methodology

### 3.1 Dataset Preparation
The dataset consists of multi-turn conversational transcripts collected from real scam logs, public phishing benchmarks, and domain-specific synthetic scenario generation.

- **Total Records**: Multi-turn dialogue instances parsed into individual turns.
- **Data Preprocessing**: Deduplication based on text prefix hashes, normalization of speaker tags (`Scammer:`, `Victim:`), and multi-hot vector encoding.

### 3.2 Imbalance Mitigation & Loss Function
Social engineering tactics occur in varying frequencies. To address class imbalance:

1. **Weighted Sampling**: Used `WeightedRandomSampler` during DataLoader initialization:
   $$w_r = \frac{1}{\min_{t \in \text{tactics}(r)} \text{count}(t)}$$

2. **Weighted Binary Cross-Entropy Loss**:
   $$\mathcal{L}_{BCE} = -\frac{1}{N} \sum_{i=1}^N \left[ y_i \cdot \log(\sigma(x_i)) \cdot p_i + (1 - y_i) \cdot \log(1 - \sigma(x_i)) \right]$$
   where positive weights $p_i = \frac{N_{\text{neg}}}{N_{\text{pos}}}$ balance rare tactic classes.

### 3.3 Training Hyperparameters
- **Optimizer**: AdamW ($lr = 2 \times 10^{-5}$, weight decay $= 0.01$)
- **Scheduler**: Linear warmup over 10% total steps with linear decay
- **Batch Size**: 16
- **Epochs**: 5
- **Split Ratio**: 80% Train / 10% Validation / 10% Test

---

## 4. Explainable AI (SHAP Token Attribution)

To eliminate "black-box" model outputs, Tactic Detector uses **SHAP (SHapley Additive exPlanations)** based on game theory:

$$\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} (v(S \cup \{i\}) - v(S))$$

### Token Attribution Highlighting Rules
Each word $w$ is scored based on its marginal contribution to the predicted tactic logits:
- **High Risk (>65%)**: Critical scam trigger words (e.g., *"wire"*, *"passcode"*, *"suspended"*, *"police"*)
- **Medium Risk (40–65%)**: Contextual pressure words (e.g., *"urgent"*, *"today"*, *"immediately"*)
- **Low Risk (20–40%)**: Supporting narrative words

---

## 5. Frontend UI & Design System

The frontend was built with **React 18** and **Vite** adhering to modern aesthetic principles inspired by `mdmehedihasan.us`:

1. **Pitch-Black Dark & Light Modes**: CSS variable design system (`--bg`, `--surface`, `--text-1`, `--border`) with smooth theme transitions.
2. **Turn-by-Turn Analysis Cards**: Per-turn breakdown displaying speaker badges, risk confidence percentages, SHAP highlighted text, and tactic badges.
3. **Interactive Turn Map**: Quick-jump navigation grid mapping out flagged turns across long transcripts.
4. **SVG Risk Meter Gauge**: Radial risk score visualization ($0\% \text{ to } 100\%$).
5. **Score Drawers**: Expandable per-tactic score distribution bars ($0\% \text{ to } 100\%$).

---

## 6. Deployment & GitHub Pages Static Hosting

To ensure the web application is instantly accessible on **GitHub Pages** without requiring a live Python server:

1. **Vite Relative Build**: `base: './'` configured in `vite.config.js`.
2. **Client-Side Fallback Engine (`api.js`)**: Includes a lightweight pattern-matching inference fallback that dynamically scores text, calculates risk metrics, and highlights tokens directly in the browser when the REST backend is offline.
3. **Automated CI/CD Deployment**: Added `.github/workflows/deploy.yml` to automatically build and publish to the `gh-pages` branch on every `git push origin main`.

---

## 7. Project Structure

```
Tactic-Detector/
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions CI/CD Pages deployment workflow
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI application routes
│   │   ├── models.py          # Pydantic schemas for request/response validation
│   │   └── inference.py       # DistilBERT model loading & SHAP explanation engine
│   ├── training/
│   │   └── train.py           # Model fine-tuning & evaluation pipeline
│   └── requirements.txt       # Python dependencies (PyTorch, Transformers, SHAP)
├── frontend/
│   ├── src/
│   │   ├── api.js             # API client + client-side fallback inference
│   │   ├── App.jsx            # Main React application & view controller
│   │   ├── index.css          # Design system CSS tokens & component styles
│   │   └── components/
│   │       ├── TranscriptInput.jsx # Input card with preset scenario chips
│   │       ├── TurnAnalysis.jsx    # Turn-by-turn list with SHAP token heatmaps
│   │       ├── TacticTimeline.jsx  # Sidebar overview, Risk Meter & Turn Map
│   │       └── RiskBadge.jsx       # Header overall risk status badge
│   ├── vite.config.js         # Vite build configuration
│   └── package.json           # Frontend dependencies & deploy scripts
└── PROJECT_DOCUMENTATION.md   # Complete project documentation
```

---

## 8. Deployment & Live Application Access

The project is fully built, packaged, and deployed on **GitHub Pages**:

- **Live Application URL**: **[https://meetmehedi.github.io/Tactic-Detector/](https://meetmehedi.github.io/Tactic-Detector/)**
- **Deployment Pipeline**: Static production bundle generated via Vite (`npm run build`), deployed automatically to the `gh-pages` branch via GitHub Actions (`.github/workflows/deploy.yml`).
- **Execution Strategy**: Hybrid model architecture featuring browser-side fallback inference for zero-downtime execution without requiring external server hosting.

---

## 9. Conclusion & Future Work

Tactic Detector demonstrates how transformer-based multi-label NLP classification paired with XAI token attribution can effectively identify social engineering threats in multi-turn dialogue.

### Future Enhancements
- **Audio Transcript Processing**: Integration with Whisper API for real-time phone call fraud detection.
- **Multilingual Support**: Extending classification to multilingual social engineering scenarios (e.g., Bengali, Spanish).
- **Real-Time Extension**: Packaging into a Chrome Extension for live webmail & chat monitoring.

