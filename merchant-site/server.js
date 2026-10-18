// Earth Mart / Mars Mart — demo merchant for Raptorz Banking Earth.
// Card / UPI checkout. Malaysia (Earth Mart): auto-pay on -> approved by the agents.
// Singapore (Mars Mart): auto-pay off -> OTP via Twilio (WhatsApp), 60s to verify or
// the card is blocked. Twilio creds come from Secret Manager (TWILIO_CONFIG) — never hardcoded.

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const RAPTORZ_API = process.env.RAPTORZ_API || "https://raptorz-bfsi-backend-282323062361.us-central1.run.app";
const PORT = process.env.PORT || 8080;
const DETECT = String(process.env.DETECT_LOCATION || "").toLowerCase() === "true";
const OTP_TTL_MS = 60 * 1000;

// Twilio config from Secret Manager (TWILIO_CONFIG = JSON) or individual env vars.
let _tw = {};
try { if (process.env.TWILIO_CONFIG) _tw = JSON.parse(process.env.TWILIO_CONFIG); } catch (e) { console.log("[twilio] bad TWILIO_CONFIG json"); }
const TW = {
  sid: _tw.sid || process.env.TWILIO_ACCOUNT_SID,
  token: _tw.token || process.env.TWILIO_AUTH_TOKEN,
  from: _tw.from || process.env.TWILIO_FROM,
  to: _tw.to || process.env.TWILIO_TO,
  contentSid: _tw.contentSid || process.env.TWILIO_CONTENT_SID,
};
const TWILIO_READY = !!(TW.sid && TW.token && TW.from && TW.to);

const CATALOG = {
  MY: { country: "MY", city: "Kuala Lumpur, Malaysia", risk: 18, amount: 450, currency: "MYR", symbol: "RM", item: "Aurora Wireless Headphones", merchant: "Earth Mart Malaysia" },
  SG: { country: "SG", city: "Singapore", risk: 82, amount: 2499, currency: "SGD", symbol: "S$", item: "Apple MacBook Air", merchant: "Mars Mart Singapore" },
};

const PENDING = new Map(); // orderId -> { otp, expires, txn, c }

const maskTo = (to) => {
  const d = String(to || "").replace(/[^0-9]/g, "");
  return d ? "+" + d.slice(0, 2) + " •••• " + d.slice(-3) : "your mobile";
};

async function sendOtp(otp) {
  if (!TWILIO_READY) return { sent: false, reason: "twilio_not_configured" };
  try {
    const body = new URLSearchParams({ To: TW.to, From: TW.from });
    if (TW.contentSid) { body.set("ContentSid", TW.contentSid); body.set("ContentVariables", JSON.stringify({ "1": otp })); }
    else { body.set("Body", `Your Raptorz Banking Earth OTP is ${otp}. Valid for 60 seconds.`); }
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW.sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${TW.sid}:${TW.token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { sent: true, sid: data.sid } : { sent: false, reason: data.message || "twilio_http_" + r.status };
  } catch (e) { return { sent: false, reason: e.message }; }
}

async function investigate(txn) {
  const r = await fetch(`${RAPTORZ_API}/investigate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(txn) });
  const data = await r.json();
  return { result: data.result || {}, detected: data.transaction ? data.transaction.country : txn.country };
}

const baseTxn = (c, extra) => Object.assign({
  id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  customer: "Deepan", card: "1234", amount: c.amount, currency: c.currency, merchant: c.merchant,
  city: DETECT ? "" : c.city, country: DETECT ? "AUTO" : c.country,
  channel: "Web", risk: c.risk, auto_pay: false, otp_verified: null,
}, extra || {});

app.get("/healthz", (_req, res) => res.json({ status: "ok", api: RAPTORZ_API, detect: DETECT, twilio: TWILIO_READY }));
app.get("/config", (_req, res) => res.json({ detect: DETECT, twilioReady: TWILIO_READY }));

app.post("/pay", async (req, res) => {
  const mode = String((req.body && req.body.mode) || "MY").toUpperCase();
  const method = String((req.body && req.body.method) || "card").toLowerCase();
  const c = CATALOG[mode] || CATALOG.MY;

  // Malaysia (Earth Mart): auto-pay enabled, no OTP — approved by the agents.
  if (mode === "MY" && !DETECT) {
    try {
      const { result, detected } = await investigate(baseTxn(c, { auto_pay: true, otp_verified: true }));
      return res.json({ order: "ORD", mode, method, symbol: c.symbol, amount: c.amount, currency: c.currency, needsOtp: false,
        decision: result.decision || "Unknown", reason_codes: result.reason_codes || [], rationale: result.rationale || "", detected_country: detected });
    } catch (e) { return res.status(502).json({ decision: "Error", rationale: "Could not reach Raptorz: " + e.message }); }
  }

  // Singapore (Mars Mart) / detect mode: auto-pay disabled — step-up OTP via Twilio.
  const txn = baseTxn(c, { auto_pay: false, otp_verified: null });
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  PENDING.set(txn.id, { otp, expires: Date.now() + OTP_TTL_MS, txn, c });
  setTimeout(() => PENDING.delete(txn.id), OTP_TTL_MS + 5000);
  const sms = await sendOtp(otp);
  res.json({ order: txn.id, mode, method, symbol: c.symbol, amount: c.amount, currency: c.currency, needsOtp: true, ttl: 60,
    otpSent: sms.sent, maskedTo: maskTo(TW.to), demoOtp: sms.sent ? undefined : otp,
    note: sms.sent ? "OTP sent to your mobile via WhatsApp — enter it within 60 seconds." : "Demo mode (Twilio: " + (sms.reason || "unconfigured") + ") — use the code shown." });
});

app.post("/verify-otp", async (req, res) => {
  const orderId = req.body && req.body.orderId;
  const otp = String((req.body && req.body.otp) || "");
  const p = PENDING.get(orderId);
  if (!p) return res.json({ decision: "Blocked", reason_codes: ["otp_session_expired"], rationale: "Session expired — please start the payment again." });
  const expired = Date.now() > p.expires;
  const ok = !expired && otp === p.otp;
  PENDING.delete(orderId);
  try {
    const { result } = await investigate(Object.assign({}, p.txn, { otp_verified: ok }));
    const rationale = expired ? "No correct OTP within 60 seconds — the card is blocked and a fraud case is opened."
      : ok ? (result.rationale || "OTP verified — payment approved.")
      : "Incorrect OTP — the card is blocked and a fraud case is opened.";
    res.json({ order: orderId, symbol: p.c.symbol, amount: p.c.amount, otpResult: expired ? "timeout" : ok ? "verified" : "wrong",
      decision: result.decision || (ok ? "Approved" : "Blocked"), reason_codes: result.reason_codes || [], rationale });
  } catch (e) { res.status(502).json({ decision: "Error", rationale: "Could not reach Raptorz: " + e.message }); }
});

app.listen(PORT, () => console.log(`Merchant on :${PORT} -> Raptorz API ${RAPTORZ_API} | twilio=${TWILIO_READY}`));
