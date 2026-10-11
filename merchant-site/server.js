// Earth Mart — demo online merchant for Raptorz Banking Earth.
// Serves the storefront and proxies "Pay" to the Raptorz fraud backend.
// Because the proxy call is server-side, when this server runs inside a VM behind a
// VPN the backend sees the VPN's egress IP — so "Auto-detect" location flips to the
// VPN country (e.g. Sydney, Australia) and the payment is blocked.

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const RAPTORZ_API = process.env.RAPTORZ_API || "https://aegis-backend-282323062361.us-central1.run.app";
const PORT = process.env.PORT || 8080;

// Location presets the storefront toggle maps to.
const LOCATIONS = {
  MY: { country: "MY", city: "Kuala Lumpur, Malaysia", risk: 18 },
  AU: { country: "AU", city: "Sydney, Australia", risk: 82 },
  AUTO: { country: "AUTO", city: "", risk: 50 }, // backend geolocates the caller IP (VPN/VM)
};

app.get("/healthz", (_req, res) => res.json({ status: "ok", api: RAPTORZ_API }));

app.post("/pay", async (req, res) => {
  const mode = String((req.body && req.body.mode) || "MY").toUpperCase();
  const amount = Number((req.body && req.body.amount) || 480);
  const loc = LOCATIONS[mode] || LOCATIONS.MY;

  const txn = {
    id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    customer: "Deepan",
    card: "1234",
    amount,
    currency: "USD",
    merchant: "Earth Mart",
    city: loc.city,
    country: loc.country,
    channel: "Web",
    risk: loc.risk,
    auto_pay: false,
    otp_verified: null,
  };

  try {
    const r = await fetch(`${RAPTORZ_API}/investigate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(txn),
    });
    const data = await r.json();
    const result = data.result || {};
    res.json({
      order: txn.id,
      amount,
      mode,
      decision: result.decision || "Unknown",
      reason_codes: result.reason_codes || [],
      rationale: result.rationale || "",
      detected_country: data.transaction ? data.transaction.country : loc.country,
    });
  } catch (err) {
    res.status(502).json({ decision: "Error", rationale: "Could not reach Raptorz Banking Earth: " + err.message });
  }
});

app.listen(PORT, () => console.log(`Earth Mart on :${PORT} -> Raptorz API ${RAPTORZ_API}`));
