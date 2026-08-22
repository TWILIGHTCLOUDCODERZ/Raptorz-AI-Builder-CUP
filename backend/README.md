# Aegis backend — multi-agent investigation service

Python + **FastAPI**, agents on the **Google GenAI SDK** with **Gemini 3.5**
(an accepted hackathon agent framework). Mirrors the UI: Orchestrator →
Investigator · Network Analyst · Intel · Compliance · Critic, then a
memory-aware adaptive decision.

Runs anywhere — if Vertex/Gemini isn't reachable (local, or `AEGIS_MOCK=true`)
it falls back to deterministic mock reasoning so the demo never breaks.

## Files
```
backend/
├── app.py                        # FastAPI endpoints (Cloud Run entrypoint)
├── agents/pipeline.py            # orchestrator + 5 specialists + decision + prefilter
├── tools/investigation_tools.py  # mock evidence tools (history, geo, network, intel, merchant)
├── memory/store.py               # Firestore memory/cases (+ in-memory fallback, seeded)
├── models.py                     # Transaction / AgentStep / DecisionResult / Case
├── requirements.txt · Dockerfile · sample_transaction.json
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | liveness + whether it's in mock mode |
| POST | `/investigate` | run a full investigation, return the `Case` |
| POST | `/investigate/stream` | stream each agent step live (SSE) |
| POST | `/pubsub/push` | Pub/Sub push: pre-filter → investigate if suspicious |

## Run locally (optional; needs Python 3.12)
```bash
cd backend
pip install -r requirements.txt
AEGIS_MOCK=true uvicorn app:app --reload --port 8080
# then:
curl -s -X POST localhost:8080/investigate -H 'content-type: application/json' -d @sample_transaction.json
```

## Deploy (Cloud Run, from repo root)
```bash
PROJECT_ID=aegis-agentic-google-hackathon bash infra/deploy.sh
```
Builds from source via Cloud Build — no local Docker needed. Uses the
`aegis-runtime` service account and Vertex AI (no API keys).

> **Model id:** `.env.example`/deploy default is `gemini-3.5-pro` — confirm the
> exact current id in Vertex **Model Garden** and pass `GEMINI_MODEL=...` if different.
