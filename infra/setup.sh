#!/usr/bin/env bash
# Aegis — Phase 0 GCP setup
# Run in Google Cloud Shell (recommended) or a local shell with gcloud installed + authenticated.
#
# Do these MANUAL steps first, in the Cloud Console (cannot be scripted safely):
#   1. Create a project and note its PROJECT_ID.
#   2. Link a billing account (ensure billing is enabled on the project).
#
# Then run:
#   export PROJECT_ID=your-project-id
#   bash infra/setup.sh
set -euo pipefail

# ---------- config ----------
PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"          # lowercase, e.g. aegis-agentic-google-hackathon
PROJECT_NAME="${PROJECT_NAME:-Aegis-Agentic-Google-Hackathon}"
REGION="${REGION:-us-central1}"
CREATE_PROJECT="${CREATE_PROJECT:-false}"      # set true to create the project
BILLING_ACCOUNT="${BILLING_ACCOUNT:-}"         # e.g. 0X0X0X-0X0X0X-0X0X0X to link billing
RECEIPTS_BUCKET="gs://${PROJECT_ID}-aegis-receipts"
AR_REPO="aegis"
# ----------------------------

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=aegis-agentic-google-hackathon" >&2
  exit 1
fi

if [[ "$CREATE_PROJECT" == "true" ]]; then
  echo ">> Creating project: $PROJECT_ID ($PROJECT_NAME)"
  gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME" \
    || echo "   (project may already exist — continuing.)"
fi

echo ">> Using project: $PROJECT_ID   region: $REGION"
gcloud config set project "$PROJECT_ID"

if [[ -n "$BILLING_ACCOUNT" ]]; then
  echo ">> Linking billing account: $BILLING_ACCOUNT"
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT" \
    || echo "   (billing link failed — link it in the console, then re-run.)"
fi

echo ">> Enabling core APIs (can take a couple of minutes)..."
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  logging.googleapis.com \
  cloudtrace.googleapis.com \
  eventarc.googleapis.com \
  iam.googleapis.com

echo ">> Enabling Model Armor (soft-fail if not yet available in your project)..."
gcloud services enable modelarmor.googleapis.com \
  || echo "   (Model Armor not auto-enabled — turn it on later in the console; continuing.)"

echo ">> Creating Firestore database (Native mode)..."
gcloud firestore databases create --location="$REGION" --type=firestore-native \
  || echo "   (Firestore DB may already exist — continuing.)"

echo ">> Creating Pub/Sub topics..."
gcloud pubsub topics create transactions            || echo "   (topic 'transactions' exists)"
gcloud pubsub topics create transactions-dead-letter || echo "   (dead-letter topic exists)"

echo ">> Creating Cloud Storage bucket for receipts..."
gcloud storage buckets create "$RECEIPTS_BUCKET" --location="$REGION" --uniform-bucket-level-access \
  || echo "   (bucket exists — continuing.)"

echo ">> Creating Artifact Registry (Docker) repo..."
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker --location="$REGION" \
  --description="Aegis container images" \
  || echo "   (repo exists — continuing.)"

echo ">> Creating service accounts..."
gcloud iam service-accounts create aegis-runtime \
  --display-name="Aegis runtime (agents + router)" || echo "   (aegis-runtime exists)"
gcloud iam service-accounts create aegis-sim \
  --display-name="Aegis transaction simulator" || echo "   (aegis-sim exists)"

RUNTIME_SA="aegis-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
SIM_SA="aegis-sim@${PROJECT_ID}.iam.gserviceaccount.com"

echo ">> Granting least-privilege roles to runtime SA..."
for role in \
  roles/aiplatform.user \
  roles/datastore.user \
  roles/pubsub.subscriber \
  roles/pubsub.publisher \
  roles/secretmanager.secretAccessor \
  roles/logging.logWriter \
  roles/cloudtrace.agent; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA}" --role="$role" --condition=None >/dev/null
  echo "   + $role"
done

echo ">> Granting bucket-scoped storage access to runtime SA..."
gcloud storage buckets add-iam-policy-binding "$RECEIPTS_BUCKET" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/storage.objectAdmin" >/dev/null

echo ">> Granting topic-scoped publish access to simulator SA..."
gcloud pubsub topics add-iam-policy-binding transactions \
  --member="serviceAccount:${SIM_SA}" --role="roles/pubsub.publisher" >/dev/null

# Cloud Build (used by `gcloud run deploy --source`) runs as the Compute Engine
# default service account. Orgs that disable automatic IAM grants leave it with
# no permissions, so builds fail to read the uploaded source. Grant the builder role.
echo ">> Granting Cloud Build role to the Compute Engine default service account..."
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder" --condition=None >/dev/null \
  || echo "   (grant may already exist — continuing.)"

echo ""
echo "============================================================"
echo " Phase 0 complete."
echo "   Project:        $PROJECT_ID"
echo "   Region:         $REGION"
echo "   Firestore:      Native mode ($REGION)"
echo "   Pub/Sub:        transactions, transactions-dead-letter"
echo "   Receipts:       $RECEIPTS_BUCKET"
echo "   Artifact repo:  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
echo "   Runtime SA:     $RUNTIME_SA"
echo "   Simulator SA:   $SIM_SA"
echo "============================================================"
echo "Next: Phase 1 — scaffold the ADK agent service in /backend."
