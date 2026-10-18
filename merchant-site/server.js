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

// Twilio Verify (OTP) config from Secret Manager (TWILIO_CONFIG = JSON) or env vars.
// Twilio Verify generates, sends (SMS) and checks the 6-digit code itself, which works
// on trial accounts (plain SMS/WhatsApp freeform require paid templates).
let _tw = {};
try { if (process.env.TWILIO_CONFIG) _tw = JSON.parse(process.env.TWILIO_CONFIG); } catch (e) { console.log("[twilio] bad TWILIO_CONFIG json"); }
const TW = {
  sid: _tw.sid || process.env.TWILIO_ACCOUNT_SID,
  token: _tw.token || process.env.TWILIO_AUTH_TOKEN,
  to: _tw.to || process.env.TWILIO_TO,                                  // customer's mobile (demo)
  verifyService: _tw.verifyService || process.env.TWILIO_VERIFY_SERVICE, // Verify service SID (VA...)
};
const TWILIO_READY = !!(TW.sid && TW.token && TW.verifyService && TW.to);
const twAuth = () => "Basic " + Buffer.from(`${TW.sid}:${TW.token}`).toString("base64");

const CATALOG = {
  MY: { country: "MY", city: "Kuala Lumpur, Malaysia", risk: 18, amount: 450, currency: "MYR", symbol: "RM", item: "Aurora Wireless Headphones", merchant: "Earth Mart Malaysia" },
  SG: { country: "SG", city: "Singapore", risk: 82, amount: 2499, currency: "SGD", symbol: "S$", item: "Apple MacBook Air", merchant: "Mars Mart Singapore" },
};

const PENDING = new Map(); // orderId -> { otp, expires, txn, c }

const maskTo = (to) => {
  const d = String(to || "").replace(/[^0-9]/g, "");
  return d ? "+" + d.slice(0, 2) + " •••• " + d.slice(-3) : "your mobile";
};

// Ask Twilio Verify to generate + send a one-time code to the customer by SMS.
async function startVerify() {
  if (!TWILIO_READY) return { sent: false, reason: "twilio_not_configured" };
  try {
    const body = new URLSearchParams({ To: TW.to, Channel: "sms" });
    const r = await fetch(`https://verify.twilio.com/v2/Services/${TW.verifyService}/Verifications`, {
      method: "POST", headers: { Authorization: twAuth(), "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
    });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { sent: true, status: data.status } : { sent: false, reason: data.message || "twilio_http_" + r.status };
  } catch (e) { return { sent: false, reason: e.message }; }
}

// Check the code the customer entered against Twilio Verify. approved -> valid.
async function checkVerify(code) {
  try {
    const body = new URLSearchParams({ To: TW.to, Code: String(code || "") });
    const r = await fetch(`https://verify.twilio.com/v2/Services/${TW.verifyService}/VerificationCheck`, {
      method: "POST", headers: { Authorization: twAuth(), "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok && data.status === "approved", status: data.status, reason: data.message };
  } catch (e) { return { ok: false, reason: e.message }; }
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

  // Singapore (Mars Mart) / detect mode: auto-pay disabled — step-up OTP via Twilio Verify.
  const txn = baseTxn(c, { auto_pay: false, otp_verified: null });
  // Phase 1: open a LIVE case in Investigations ("OTP sent — agents waiting").
  let caseId = null;
  try {
    const ir = await fetch(`${RAPTORZ_API}/stepup/initiate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(txn) });
    const id = await ir.json(); caseId = id.id || null;
  } catch (e) { console.log("[stepup] initiate failed:", e.message); }
  // Send via Twilio Verify; if that fails, fall back to a local code shown on screen.
  const sms = await startVerify();
  const useVerify = sms.sent;
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // fallback code only
  PENDING.set(txn.id, { otp: useVerify ? null : otp, useVerify, expires: Date.now() + OTP_TTL_MS, txn, c, caseId });
  setTimeout(() => PENDING.delete(txn.id), OTP_TTL_MS + 5000);
  res.json({ order: txn.id, caseId, mode, method, symbol: c.symbol, amount: c.amount, currency: c.currency, needsOtp: true, ttl: 60,
    otpSent: useVerify, maskedTo: maskTo(TW.to), demoOtp: useVerify ? undefined : otp,
    note: useVerify ? "OTP sent to your mobile via SMS — enter it within 60 seconds." : "Demo mode (Twilio: " + (sms.reason || "unconfigured") + ") — use the code shown." });
});

app.post("/verify-otp", async (req, res) => {
  const orderId = req.body && req.body.orderId;
  const otp = String((req.body && req.body.otp) || "");
  const p = PENDING.get(orderId);
  if (!p) return res.json({ decision: "Blocked", reason_codes: ["otp_session_expired"], rationale: "Session expired — please start the payment again." });
  const expired = Date.now() > p.expires;
  let ok = false;
  if (!expired) {
    if (p.useVerify) { const chk = await checkVerify(otp); ok = chk.ok; }  // validated by Twilio Verify
    else { ok = otp === p.otp; }                                           // fallback: local compare
  }
  PENDING.delete(orderId);
  try {
    // Phase 2: resolve the SAME live case the OTP opened (so Investigations shows
    // the full story: OTP sent -> verified/blocked). Fall back to a fresh case.
    let result = {};
    if (p.caseId) {
      const rr = await fetch(`${RAPTORZ_API}/stepup/resolve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ case_id: p.caseId, otp_verified: ok }) });
      const data = await rr.json(); result = data.result || {};
    } else {
      const inv = await investigate(Object.assign({}, p.txn, { otp_verified: ok })); result = inv.result;
    }
    const rationale = expired ? "No correct OTP within 60 seconds — the card is blocked and a fraud case is opened."
      : ok ? (result.rationale || "OTP verified — payment approved.")
      : "Incorrect OTP — the card is blocked and a fraud case is opened.";
    res.json({ order: orderId, caseId: p.caseId, symbol: p.c.symbol, amount: p.c.amount, otpResult: expired ? "timeout" : ok ? "verified" : "wrong",
      decision: result.decision || (ok ? "Approved" : "Blocked"), reason_codes: result.reason_codes || [], rationale });
  } catch (e) { res.status(502).json({ decision: "Error", rationale: "Could not reach Raptorz: " + e.message }); }
});

app.listen(PORT, () => console.log(`Merchant on :${PORT} -> Raptorz API ${RAPTORZ_API} | twilio=${TWILIO_READY}`));
