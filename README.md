<div align="center">

<img src="frontend/public/Aegis_Logo.png" alt="Aegis" width="96" />

# Aegis — AI Fraud Intelligence

**Autonomous, real-time fraud & financial-crime defense on Gemini + Google Cloud.**

Aegis doesn't just detect fraud — it *investigates*, *verifies the customer*, and blocks only when it must.

`Gemini 3.5` · `Google GenAI SDK` · `Cloud Run` · `Pub/Sub` · `Firestore` · `Firebase Auth` · `React + TypeScript`

</div>

---

## What is Aegis?

Traditional rule engines ask *"is this transaction suspicious?"* — Aegis asks *"does this match the customer's normal identity, device, location and behaviour?"* If not, it **verifies the customer** (step-up OTP) instead of blocking them, and only hard-blocks confirmed fraud (e.g. a reported-stolen card).

A **multi-agent system on Gemini 3.5** runs the investigation: an Orchestrator delegates to specialist agents (Card Status, Step-Up Control, Investigator, Network, Intel, Compliance, Critic), each reasoning over evidence, then a memory- and policy-aware adaptive decision — with a relationship-manager alert and an AI-drafted case for high/critical risk.

## Reference architecture

![Aegis architecture](frontend/public/architecture-diagram.png)

Two speeds: a **fast path** (rules + a Gemini Flash pre-filter) decides in milliseconds; only genuinely suspicious transactions wake the **deep path** (async multi-agent investigation on Gemini 3.5). The **risk engine / policy makes the decision** — generative AI is used only for investigation summaries and explanations, never to authorize the payment.

## The Tyson case flow

![Tyson case flow](frontend/public/tyson-flow.png)

A normal Dubai purchase auto-approves (risk 18). Two hours later the same card is used in Italy — new device, new network, behaviour mismatch → risk 82. Instead of blocking, Aegis **disables auto-pay, requests OTP, and alerts RM Tessa**. Verify → approve; no OTP → block. A reported-stolen card in a new country → risk 97 → **hard block + fraud case** (OTP cannot override a stolen card).

## Results — measured on a synthetic benchmark

Aegis's real decision policy vs. a traditional rules-only engine, over **276 labeled transactions** (`backend/eval/evaluate.py`):

| Metric | Rules-only | **Aegis** |
|---|---|---|
| Fraud caught (recall) | 12.7% | **95.2%** |
| Hard false-decline rate | 39.0% | **3.8%** |
| Block precision | 8.8% | **88.2%** |

- **Caught 95.2% of fraud** vs. 12.7% for rules-only — AI catches the stolen-card, account-takeover and impossible-travel cases blunt rules miss.
- **Cut hard false declines by ~90%** (39% → 3.8%) — memory approves confirmed-legit activity and a lightweight OTP step-up replaces most declines.
- Every decision is automated (approve / step-up / block) in seconds — no manual analyst triage queue.

Reproduce: `python backend/eval/evaluate.py`. Illustrative on synthetic data; production thresholds are calibrated on the bank's historical fraud / false-positive data.

## Key capabilities

- **Multi-agent investigation** on Gemini 3.5, streamed live into the analyst console
- **Memory that stops false declines** — recalls confirmed-legit patterns so it never re-challenges the same activity
- **Risk matrix policy** — Low → auto-approve · Medium → OTP · High → step-up + RM alert · Critical → block + investigation
- **Step-up, not block** — auto-pay disabled → Mobile/Email OTP → verify or block
- **VIP handling** — a false decline costs more than the fraud, so VIPs are never cold-declined; a stolen card is blocked regardless of tier
- **Analyst console** — command center, auto-launching investigations, Customer 360, Compliance/SAR, Network Graph, Architecture
- **Executive step-up demo** — a presentable, self-contained journey

## Monorepo layout

```
project/
├── frontend/     # React + TypeScript + Tailwind — analyst console + executive demo
├── backend/      # FastAPI + Google GenAI SDK + Gemini 3.5 — multi-agent investigation
├── infra/        # GCP setup + Cloud Run deploy scripts + Secret Manager
├── simulator/    # Pub/Sub transaction publisher
└── AEGIS-ROADMAP.md
```

## Google Cloud services

| Service | Role |
|---|---|
| **Vertex AI — Gemini 3.5** | Reasoning for the specialist agents + investigation/RM summaries (global endpoint) |
| **Google GenAI SDK** | Agent framework — orchestrator + specialists, structured decision output |
| **Cloud Run** | Hosts the backend agent service and the static frontend (scales to zero) |
| **Pub/Sub** | Event backbone — transactions stream in and wake the router |
| **Firestore** | Customer memory (confirmed-legit, tier), cases, live agent-step streaming |
| **Secret Manager** | Frontend build config (Firebase web keys) — single source of truth |
| **Cloud Build + Artifact Registry** | Builds and stores container images on every deploy |
| **Model Armor** | Prompt-injection / PII guardrails around the Gemini calls |
| **Cloud Storage** | Receipt / evidence uploads for multimodal verification |
| **Firebase Authentication** | Sign-in / sign-up (email-password + Google); a guest mode needs no account |

---

## Run it locally

### Prerequisites
- **Node.js 20+**
- **Python 3.12+** (only if you want to run the backend locally)

### 1) Frontend (talks to the deployed backend by default)
```bash
cd frontend
npm install
```
Create `frontend/.env` from the example and fill in your Firebase web config:
```bash
# frontend/.env  (see frontend/.env.example)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxx
VITE_API_URL=https://<your-backend>.run.app
```
Start it:
```bash
npm run dev
```
Open **http://localhost:5173** → sign in with Firebase, or **continue as guest** (no account needed).

### 2) Backend (optional — runs in a deterministic mock mode with no cloud)
```bash
cd backend
pip install -r requirements.txt
# PowerShell:
$env:AEGIS_MOCK="true"; uvicorn app:app --reload --port 8080
# bash:
AEGIS_MOCK=true uvicorn app:app --reload --port 8080
```
Point the frontend at it by setting `VITE_API_URL=http://localhost:8080` in `frontend/.env`, then restart `npm run dev`.
For **real Gemini** locally instead of mock: `gcloud auth application-default login`, drop `AEGIS_MOCK`, and set `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION=global` / `GEMINI_MODEL=gemini-3.5-flash`.

---

## Deploy to Google Cloud

All scripts build **from source via Cloud Build** — no local Docker needed. Run them from the repo root (Cloud Shell works out of the box).

```bash
export PROJECT_ID=<your-project-id>

# 1) Provision — APIs, Firestore, Pub/Sub, Storage, Artifact Registry, service accounts
bash infra/setup.sh

# 2) Backend → Cloud Run (Gemini 3.5-flash on the global endpoint)
bash infra/deploy.sh

# 3) Store the frontend config in Secret Manager (one-time — see below)
bash infra/set-firebase-secret.sh

# 4) Frontend → Cloud Run (nginx), injecting the config from Secret Manager
bash infra/deploy-frontend.sh
```
`deploy-frontend.sh` prints the live URL: the analyst console at `/` and the executive demo at `/#fraud-journey`.

---

## Details stored in Secret Manager

The frontend build config (Firebase web keys + the backend URL) is kept in **Secret Manager** as the single source of truth — never hardcoded in committed source.

- Values live in `frontend/.env` locally (gitignored).
- **`infra/set-firebase-secret.sh`** stores that file as the secret **`firebase-config`**.
- **`infra/deploy-frontend.sh`** fetches `firebase-config` and injects it into the build (`.env.production`), then bakes it into the SPA.

```bash
# create/update frontend/.env, then:
PROJECT_ID=<your-project-id> bash infra/set-firebase-secret.sh
```

> Note: Firebase **web** keys are not secret — they identify the project and ship to the browser to initialize Firebase; security comes from Firebase Auth + rules. Secret Manager here keeps them out of committed source and centralizes them, injected at build time.

## Authentication

- **Firebase Auth** — email/password + Google sign-in. Enable the providers in the Firebase console (Authentication → Sign-in method) and add your domains under Authentication → Settings → Authorized domains.
- **Guest mode** — enter a name and proceed; no Firebase setup required (handy for demos).

---

## Creator

**Deepan** — Cloud Architect · [deepantechnoids.github.io](https://deepantechnoids.github.io/)

## Disclaimer

Demo / proof-of-concept. Simulated transactions, risk scoring and OTP — no real payments, messages, or banking integrations. All data is synthetic.
