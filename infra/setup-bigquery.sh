#!/usr/bin/env bash
# Provision the Raptorz BigQuery analytics dataset + decisions table, and grant the
# Cloud Run runtime service account access to stream rows and run queries.
# Run from the repo root (Cloud Shell works out of the box):
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/setup-bigquery.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
DATASET="${RAPTORZ_BQ_DATASET:-raptorz}"
TABLE="${RAPTORZ_BQ_TABLE:-decisions}"
LOCATION="${BQ_LOCATION:-US}"
RUNTIME_SA="raptorz-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first:  export PROJECT_ID=<your-project-id>" >&2
  exit 1
fi

echo ">> Enabling BigQuery API..."
gcloud services enable bigquery.googleapis.com --project "$PROJECT_ID" >/dev/null

echo ">> Creating dataset ${DATASET} (location ${LOCATION})..."
bq --location="$LOCATION" --project_id="$PROJECT_ID" mk --dataset "${PROJECT_ID}:${DATASET}" 2>/dev/null \
  || echo "   dataset already exists — ok"

echo ">> Creating table ${DATASET}.${TABLE}..."
bq --project_id="$PROJECT_ID" mk --table "${PROJECT_ID}:${DATASET}.${TABLE}" \
  case_id:STRING,ts:TIMESTAMP,customer:STRING,amount:FLOAT,currency:STRING,merchant:STRING,city:STRING,country:STRING,channel:STRING,risk:INTEGER,decision:STRING,confidence:FLOAT,reason_codes:STRING 2>/dev/null \
  || echo "   table already exists — ok"

echo ">> Granting the runtime service account BigQuery access..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/bigquery.dataEditor" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/bigquery.jobUser" --condition=None >/dev/null

echo ""
echo "============================================================"
echo " BigQuery ready: ${PROJECT_ID}.${DATASET}.${TABLE}"
echo " Raptorz streams every decision here; GET /analytics/summary reads it."
echo " Query it:"
echo "   bq query --use_legacy_sql=false \\"
echo "     'SELECT decision, COUNT(*) n FROM \`${PROJECT_ID}.${DATASET}.${TABLE}\` GROUP BY decision ORDER BY n DESC'"
echo "============================================================"
