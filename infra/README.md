# Aegis infra — Phase 0

## Manual steps first (Cloud Console — not scripted)

1. **Create project** — [console.cloud.google.com](https://console.cloud.google.com) → project picker → **New Project**. Note the `PROJECT_ID`.
2. **Billing + credits** — Billing → link an account, then **Billing → Credits** and redeem the hackathon **$150** code (from the Devpost *Resources* page). The standard free trial adds $300.

## What `setup.sh` provisions

- **APIs enabled:** Vertex AI, Cloud Run, Cloud Build, Artifact Registry, Pub/Sub, Firestore, Secret Manager, Cloud Storage, Logging, Trace, Eventarc, Model Armor.
- **Firestore** — Native mode.
- **Pub/Sub topics** — `transactions`, `transactions-dead-letter`.
- **Cloud Storage bucket** — `gs://<PROJECT_ID>-aegis-receipts` (receipt uploads).
- **Artifact Registry** — Docker repo `aegis` (Cloud Run images).
- **Service accounts (least privilege):**
  - `aegis-runtime` — agents + router (Vertex, Firestore, Pub/Sub, Secrets, bucket-scoped Storage, Logging, Trace).
  - `aegis-sim` — simulator (publish to the `transactions` topic only).

## Run

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1        # optional; this is the default
bash setup.sh
```

Recommended: run in **Google Cloud Shell** — gcloud is pre-installed and already authenticated, so nothing to install on Windows.

## Local dev auth (later phases)

The backend uses **Application Default Credentials** — no API keys in code. Locally:

```bash
gcloud auth application-default login
```

Deployed Cloud Run services use the `aegis-runtime` service account automatically.
