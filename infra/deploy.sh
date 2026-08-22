#!/usr/bin/env bash
# Aegis — deploy the backend to Cloud Run.
# Run from the repo root (the folder containing backend/) AFTER infra/setup.sh:
#   PROJECT_ID=aegis-agentic-google-hackathon bash infra/deploy.sh
# Builds from source via Cloud Build (no local Docker needed).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
REGION="${REGION:-us-central1}"
MODEL="${GEMINI_MODEL:-gemini-3.5-pro}"
ALLOW_UNAUTH="${ALLOW_UNAUTH:-true}"   # demo convenience; set false to require auth
SERVICE="aegis-backend"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=aegis-agentic-google-hackathon" >&2
  exit 1
fi

AUTH_FLAG="--no-allow-unauthenticated"
[[ "$ALLOW_UNAUTH" == "true" ]] && AUTH_FLAG="--allow-unauthenticated"

echo ">> Deploying $SERVICE to Cloud Run (project=$PROJECT_ID region=$REGION)..."
gcloud run deploy "$SERVICE" \
  --source ./backend \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --service-account "aegis-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION},GOOGLE_GENAI_USE_VERTEXAI=true,GEMINI_MODEL=${MODEL}" \
  $AUTH_FLAG

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "============================================================"
echo " Deployed: $URL"
echo " Health:   curl -s $URL/healthz"
echo " Test:     curl -s -X POST $URL/investigate \\"
echo "             -H 'content-type: application/json' \\"
echo "             -d @backend/sample_transaction.json"
echo "============================================================"
