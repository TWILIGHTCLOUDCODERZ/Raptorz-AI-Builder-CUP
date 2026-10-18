// Earth Mart — demo online merchant for Raptorz Banking Earth.
// Serves the storefront and proxies "Pay" to the Raptorz fraud backend. A hidden
// store-location switch sends Malaysia or Sydney: a Malaysia payment approves (home),
// a Sydney payment is blocked (impossible travel -> step-up).

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const RAPTORZ_API = process.env.RAPTORZ_API || "https://raptorz-bfsi-backend-282323062361.us-central1.run.app";
const PORT = process.env.PORT || 8080;
// On the VM, set DETECT_LOCATION=true: the real (VPN) egress IP decides the country,
// so turning on a VPN to Australia makes Raptorz block. On Cloud Run leave it off and
// the storefront toggle (Malaysia / Sydney) drives the decision.
const DETECT = String(process.env.DETECT_LOCATION || "").toLowerCase() === "true";

// Per-location catalog: product, price and currency differ by storefront region.
const CATALOG = {
  MY: { country: "MY", city: "Kuala Lumpur, Malaysia", risk: 18, amount: 450, currency: "MYR", symbol: "RM", item: "Aurora Wireless Headphones", merchant: "Earth Mart Malaysia" },
  AU: { country: "AU", city: "Sydney, Australia", risk: 82, amount: 1799, currency: "AUD", symbol: "A$", item: "Apple MacBook Air", merchant: "Earth Mart Australia" },
};

app.get("/healthz", (_req, res) => res.json({ status: "ok", api: RAPTORZ_API, detect: DETECT }));
app.get("/config", (_req, res) => res.json({ detect: DETECT }));

app.post("/pay", async (req, res) => {
  const mode = String((req.body && req.body.mode) || "MY").toUpperCase();
  const c = CATALOG[mode] || CATALOG.MY;

  const txn = {
    id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    customer: "Deepan",
    card: "1234",
    amount: c.amount,
    currency: c.currency,
    merchant: c.merchant,
    // In detect mode the backend geolocates the real (VPN) egress IP; otherwise use the toggle.
    city: DETECT ? "" : c.city,
    country: DETECT ? "AUTO" : c.country,
    channel: "Web",
    risk: c.risk,
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
      amount: c.amount,
      currency: c.currency,
      symbol: c.symbol,
      mode,
      decision: result.decision || "Unknown",
      reason_codes: result.reason_codes || [],
      rationale: result.rationale || "",
      detected_country: data.transaction ? data.transaction.country : c.country,
    });
  } catch (err) {
    res.status(502).json({ decision: "Error", rationale: "Could not reach Raptorz Banking Earth: " + err.message });
  }
});

app.listen(PORT, () => console.log(`Earth Mart on :${PORT} -> Raptorz API ${RAPTORZ_API}`));
