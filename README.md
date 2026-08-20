# FinGuard

AI-powered real-time fraud detection system for inclusive finance. Built for MIRAGE 2026 / AGENTRIX 2026.

**Team "Seedhe Code"** — Dipin Roka (ML/AI), Arya Nileshkumar Manoj (Backend), Darshan Naresh Pardesh (Frontend), Lakhan Singh (Data/BI)

## Features

- **XGBoost Fraud Detection** — ML model with ROC-AUC 0.9999, SHAP-powered explainability (top-3 human-readable reason codes per transaction)
- **Real-time Transaction Simulator** — WebSocket replay of the PaySim dataset at configurable speed
- **Fraud Ring Detection** — NetworkX + Louvain community detection on shared device/IP metadata
- **Consumer Alert Simulation** — Pre-transaction safety check with 4 risk presets (Safe, Suspicious, Fraud Ring, Account Draining)
- **Analyst Dashboard** — Glassmorphism UI with live feed, risk donut chart, case queue with status tracking, fraud ring explorer

## Tech Stack

| Layer | Tech |
|-------|------|
| ML / AI | Python, XGBoost, SHAP, scikit-learn, pandas, NetworkX, Louvain |
| Backend | Python 3.11, FastAPI, SQLAlchemy, WebSockets, SQLite (local) / PostgreSQL (prod) |
| Frontend | React 18, Vite 5, Tailwind CSS 3, react-router-dom 6 |
| Deploy | Vercel (frontend), Railway (backend) |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **PaySim dataset** — `PS_20174392719_1491204439457_log.csv` (6.36M rows, 11 columns)

Place the dataset at the project root:

```
finguard/
  archive/
    PS_20174392719_1491204439457_log.csv
```

---

## Quick Start (Local)

### 1. Clone & enter the project

```bash
git clone <repo-url> && cd finguard
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model (generates ml/models/xgboost_fraud.json)
python -m ml.train

# Start the API server (defaults to SQLite)
uvicorn app.main:app --reload --port 8000
```

The backend auto-creates `finguard.db` on first run and starts serving at `http://localhost:8000`.

### 3. Frontend

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend is available at `http://localhost:3000`.

---

## Docker (Optional)

Spin up everything (Postgres + backend) with Docker:

```bash
docker-compose up --build
```

This trains the model and starts the backend on port `8000`. Start the frontend separately with `npm run dev`.

---

## Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example backend/.env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./finguard.db` | Database connection string |
| `DATASET_PATH` | `../archive/PS_...csv` | Path to PaySim CSV |
| `MODEL_PATH` | `ml/models/xgboost_fraud.json` | Trained XGBoost model path |
| `FRAUD_SCORE_THRESHOLD` | `60` | Risk score to flag a transaction |
| `CONSUMER_ALERT_THRESHOLD` | `75` | Risk score to trigger consumer alert |
| `SIMULATION_SPEED` | `0.5` | Replay speed multiplier (1.0 = real-time) |

---

## Project Structure

```
finguard/
  backend/
    app/
      main.py          # FastAPI routes, WebSocket handler, case auto-creation
      config.py        # pydantic-settings config
    db/
      models.py        # SQLAlchemy ORM (Transaction, Case, AuditLog, FraudRing, ...)
    ml/
      train.py         # XGBoost training pipeline
      scorer.py        # Model inference + SHAP explainability
      features.py      # Feature engineering
    graph/
      engine.py        # NetworkX fraud ring detection (Louvain)
    simulator/
      stream.py        # Async WebSocket transaction replay
    requirements.txt
    Dockerfile
    railway.json
  frontend/
    src/
      pages/
        Dashboard.jsx  # Stat cards, live feed, risk chart, ring preview
        Cases.jsx      # Case queue with search, filters, status transitions
        Rings.jsx      # Fraud ring list + canvas network graph
        ConsumerAlert.jsx  # Pre-transaction safety simulator
      components/
        RiskChart.jsx  # SVG donut chart
      api/
        client.js      # REST + WebSocket client with reconnect
      index.css        # Glassmorphism design system
      App.jsx          # Router + sidebar
    package.json
    vercel.json
  archive/             # PaySim dataset (not in git)
  docker-compose.yml
  .env.example
```

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Framework: **Vite**, Root Directory: `frontend/`
4. Deploy

### Backend (Railway)

1. Push to GitHub
2. Import repo on [railway.app](https://railway.app)
3. Set `DATABASE_URL` to a Railway PostgreSQL instance
4. Railway auto-builds via `railway.json`

---

## License

MIT
