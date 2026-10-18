#!/usr/bin/env bash
# Raptorz — deploy the frontend (Vite SPA) to Cloud Run.
# Run from the repo root, AFTER infra/setup.sh:
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/deploy-frontend.sh
# Builds from source via Cloud Build (no local Docker needed).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
REGION="${REGION:-us-central1}"
SERVICE="raptorz-bfsi-frontend"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=ultra-mediator-506312-t2" >&2
  exit 1
fi

echo ">> Fetching Firebase config from Secret Manager..."
if gcloud secrets versions access latest --secret=firebase-config --project "$PROJECT_ID" > ./frontend/.env.production 2>/dev/null; then
  echo "   injected firebase-config into the build."
else
  rm -f ./frontend/.env.production
  echo "   WARNING: no 'firebase-config' secret — run infra/set-firebase-secret.sh first, or auth breaks on the deployed site."
fi

# Point the SPA at the live backend by service name (overrides any stale VITE_API_URL).
BACKEND_URL="$(gcloud run services describe raptorz-bfsi-backend --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)"
if [[ -n "$BACKEND_URL" ]]; then
  touch ./frontend/.env.production
  grep -v '^VITE_API_URL=' ./frontend/.env.production > ./frontend/.env.production.tmp 2>/dev/null || true
  mv -f ./frontend/.env.production.tmp ./frontend/.env.production
  echo "VITE_API_URL=${BACKEND_URL}" >> ./frontend/.env.production
  echo "   VITE_API_URL -> ${BACKEND_URL}"
fi

echo ">> Deploying $SERVICE to Cloud Run (project=$PROJECT_ID region=$REGION)..."
gcloud run deploy "$SERVICE" \
  --source ./frontend \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --cpu 1 --memory 256Mi --min-instances 0 --max-instances 3 --concurrency 80

rm -f ./frontend/.env.production
URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "============================================================"
echo " Frontend live: $URL"
echo "   Raptorz console:   $URL"
echo "   Step-up demo:    $URL/#fraud-journey"
echo "============================================================"
