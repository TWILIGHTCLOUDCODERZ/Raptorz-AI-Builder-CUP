#!/usr/bin/env bash
# Run the Earth Mart merchant site inside a Compute Engine VM, so you can turn on a
# VPN to Australia and have Raptorz detect the location from the VM's egress IP.
# The container runs with host networking, so a VPN on the VM also routes the
# container's calls to Raptorz. Run from the repo root:
#   PROJECT_ID=ultra-mediator-506312-t2 bash infra/setup-merchant-vm.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-CHANGE_ME}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-asia-southeast1-a}"            # Singapore — closest baseline to Malaysia (home)
VM="${VM:-earth-mart-vm}"
BACKEND_SERVICE="${BACKEND_SERVICE:-aegis-backend}"
IMAGE="gcr.io/${PROJECT_ID}/earth-mart"
RAPTORZ_API="${RAPTORZ_API:-}"

if [[ "$PROJECT_ID" == "CHANGE_ME" ]]; then
  echo "ERROR: set PROJECT_ID first." >&2; exit 1
fi
if [[ -z "$RAPTORZ_API" ]]; then
  RAPTORZ_API="$(gcloud run services describe "$BACKEND_SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)"
fi
[[ -z "$RAPTORZ_API" ]] && { echo "ERROR: set RAPTORZ_API=https://<backend>.run.app" >&2; exit 1; }

echo ">> Enabling APIs..."
gcloud services enable compute.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --project "$PROJECT_ID" >/dev/null

echo ">> Building the merchant image via Cloud Build -> $IMAGE"
gcloud builds submit ./merchant-site --project "$PROJECT_ID" --tag "$IMAGE"

echo ">> Creating VM $VM in $ZONE with a Docker startup script..."
STARTUP=$(cat <<EOF
#!/bin/bash
set -e
which docker || (apt-get update && apt-get install -y docker.io)
systemctl enable --now docker
gcloud auth configure-docker gcr.io -q || true
docker rm -f earth-mart 2>/dev/null || true
docker run -d --name earth-mart --restart always --network host \
  -e PORT=8080 -e RAPTORZ_API=${RAPTORZ_API} ${IMAGE}
EOF
)
gcloud compute instances create "$VM" \
  --project "$PROJECT_ID" --zone "$ZONE" \
  --machine-type e2-small --image-family debian-12 --image-project debian-cloud \
  --scopes cloud-platform --tags http-server \
  --metadata startup-script="$STARTUP"

gcloud compute firewall-rules create earth-mart-8080 \
  --project "$PROJECT_ID" --allow tcp:8080 --target-tags http-server 2>/dev/null || echo "   firewall rule exists — ok"

IP="$(gcloud compute instances describe "$VM" --project "$PROJECT_ID" --zone "$ZONE" --format='value(networkInterfaces[0].accessConfigs[0].natIP)')"
echo ""
echo "============================================================"
echo " Earth Mart VM: http://${IP}:8080   (give it ~60s to boot & pull)"
echo ""
echo " Demo the VPN detection:"
echo "   1) Baseline (no VPN, VM is in Singapore/Asia): on the storefront pick"
echo "      'Auto-detect' -> detected country is near home -> approved."
echo "   2) SSH in and connect a VPN to AUSTRALIA:"
echo "        gcloud compute ssh ${VM} --zone ${ZONE} --project ${PROJECT_ID}"
echo "        sudo apt-get install -y openvpn            # or wireguard"
echo "        sudo openvpn --config <your-australia>.ovpn &"
echo "      (the container uses --network host, so the VPN routes its traffic too)"
echo "   3) Pick 'Auto-detect' again -> Raptorz geolocates the AU egress IP ->"
echo "      payment BLOCKED (detected: AU, impossible travel)."
echo "============================================================"
