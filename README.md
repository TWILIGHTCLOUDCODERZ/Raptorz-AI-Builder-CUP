# Aegis — Autonomous Fraud & Financial-Crime Defense

Google **All Things Agentic** Hackathon · Track: **The Taskmaster**
Built on **Gemini 3.5 (Vertex AI)** + **Google ADK** + **Cloud Run / Pub/Sub / Firestore**.

## Monorepo layout

```
project/
├── frontend/    # Bolt UI (Vite + React + TS + Tailwind) — the analyst command center
├── backend/     # ADK multi-agent service (Python, Gemini 3.5)      [Phase 1]
├── simulator/   # Publishes synthetic transactions to Pub/Sub       [Phase 2]
├── infra/       # GCP setup + deploy scripts
├── AEGIS-ROADMAP.md
└── README.md
```

## Status

- [x] **Phase 0** — GCP foundations & repo structure ← you are here
- [ ] Phase 1 — ADK agent brain (Orchestrator + 5 specialists on Gemini 3.5)
- [ ] Phase 2 — Event-driven pipeline (Pub/Sub → router → agents)
- [ ] Phase 3 — Firestore memory (the real "Dubai recall")
- [ ] Phase 4 — Wire frontend to live data
- [ ] Phase 5 — Customer resolution (multimodal / receipt vision)
- [ ] Phase 6 — Remaining screens
- [ ] Phase 7 — Observability + eval metric
- [ ] Phase 8 — Deploy & submit

Full plan: [AEGIS-ROADMAP.md](AEGIS-ROADMAP.md)

## Phase 0 quickstart

1. **Cloud Console (manual):** create a project, link billing, redeem the $150 hackathon credits.
2. **Provision GCP** (Cloud Shell recommended):
   ```bash
   export PROJECT_ID=your-project-id
   bash infra/setup.sh
   ```
3. **Run the frontend locally:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
ned.
