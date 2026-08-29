#!/usr/bin/env bash
# Store the frontend build config (Firebase web keys + API URL) in Secret Manager
# as the single source of truth. Reads from frontend/.env (gitignored) — so the
# values never live in committed source. Run once (and again whenever they change):
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/set-firebase-secret.sh
#
# Note: Firebase web keys are not secret (they ship to the browser); this keeps
# them out of source and lets deploy-frontend.sh inject them at build time.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
SECRET="firebase-config"
DATA_FILE="${1:-./frontend/.env}"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=ultra-mediator-506312-t2" >&2
  exit 1
fi
if [[ ! -f "$DATA_FILE" ]]; then
  echo "ERROR: $DATA_FILE not found — create frontend/.env with your VITE_FIREBASE_* values first." >&2
  exit 1
fi

gcloud services enable secretmanager.googleapis.com --project "$PROJECT_ID" >/dev/null 2>&1 || true

if gcloud secrets describe "$SECRET" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud secrets versions add "$SECRET" --project "$PROJECT_ID" --data-file="$DATA_FILE"
else
  gcloud secrets create "$SECRET" --project "$PROJECT_ID" --replication-policy=automatic --data-file="$DATA_FILE"
fi

echo ">> Stored '$SECRET' from $DATA_FILE. infra/deploy-frontend.sh injects it at build time."
