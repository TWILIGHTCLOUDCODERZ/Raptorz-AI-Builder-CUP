#!/usr/bin/env bash
# Deploy the Earth Mart merchant site to Cloud Run (a NEW, separate service).
# Builds from source (Dockerfile) via Cloud Build. Run from the repo root:
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/deploy-merchant.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
REGION="${REGION:-us-central1}"
SERVICE="earth-mart"
BACKEND_SERVICE="${BACKEND_SERVICE:-aegis-backend}"   # the Raptorz fraud backend
RAPTORZ_API="${RAPTORZ_API:-}"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first." >&2; exit 1
fi

# Default the backend URL to the deployed Raptorz backend.
if [[ -z "$RAPTORZ_API" ]]; then
  RAPTORZ_API="$(gcloud run services describe "$BACKEND_SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)"
fi
if [[ -z "$RAPTORZ_API" ]]; then
  echo "ERROR: could not find the backend URL. Set RAPTORZ_API=https://<backend>.run.app" >&2; exit 1
fi

echo ">> Deploying $SERVICE (merchant site) -> Raptorz API: $RAPTORZ_API"
gcloud run deploy "$SERVICE" \
  --source ./merchant-site \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "RAPTORZ_API=${RAPTORZ_API}" \
  --cpu 1 --memory 256Mi --min-instances 0 --max-instances 3 --timeout 60

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "============================================================"
echo " Earth Mart live: $URL"
echo " Toggle Malaysia -> approved, Sydney -> blocked (step-up)."
echo " 'Auto-detect' uses the server IP (use the VM + VPN for a real AU flip)."
echo "============================================================"
