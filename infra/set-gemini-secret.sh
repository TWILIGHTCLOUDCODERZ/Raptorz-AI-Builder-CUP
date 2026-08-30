#!/usr/bin/env bash
# Store the Gemini API key in Secret Manager (secret: gemini-api-key).
# infra/deploy.sh mounts it to Cloud Run at runtime as env GEMINI_API_KEY.
# Optional — by default the backend authenticates to Vertex AI via the runtime
# service account (Application Default Credentials, no key). Usage:
#   PROJECT_ID=ultra-mediator-506312-t2 GEMINI_API_KEY=AIza... bash infra/set-gemini-secret.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
SECRET="gemini-api-key"
KEY="${GEMINI_API_KEY:-}"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first." >&2; exit 1
fi
if [[ -z "$KEY" ]]; then
  echo "ERROR: set GEMINI_API_KEY=... (the key value)." >&2; exit 1
fi

gcloud services enable secretmanager.googleapis.com --project "$PROJECT_ID" >/dev/null 2>&1 || true

if gcloud secrets describe "$SECRET" --project "$PROJECT_ID" >/dev/null 2>&1; then
  printf '%s' "$KEY" | gcloud secrets versions add "$SECRET" --project "$PROJECT_ID" --data-file=-
else
  printf '%s' "$KEY" | gcloud secrets create "$SECRET" --project "$PROJECT_ID" --replication-policy=automatic --data-file=-
fi

echo ">> Stored '$SECRET' in Secret Manager. Re-run infra/deploy.sh to mount it as env GEMINI_API_KEY."
