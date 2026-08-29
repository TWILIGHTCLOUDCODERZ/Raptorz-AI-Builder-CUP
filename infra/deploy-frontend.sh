#!/usr/bin/env bash
# Aegis — deploy the frontend (Vite SPA) to Cloud Run.
# Run from the repo root, AFTER infra/setup.sh:
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/deploy-frontend.sh
# Builds from source via Cloud Build (no local Docker needed).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
REGION="${REGION:-us-central1}"
SERVICE="aegis-frontend"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=ultra-mediator-506312-t2" >&2
  exit 1
fi

echo ">> Deploying $SERVICE to Cloud Run (project=$PROJECT_ID region=$REGION)..."
gcloud run deploy "$SERVICE" \
  --source ./frontend \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --cpu 1 --memory 256Mi --min-instances 0 --max-instances 3 --concurrency 80

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "============================================================"
echo " Frontend live: $URL"
echo "   Aegis console:   $URL"
echo "   Step-up demo:    $URL/#fraud-journey"
echo "============================================================"
