"""Raptorz backend — FastAPI service for Cloud Run.

Endpoints:
  GET  /healthz            liveness probe
  POST /investigate        run a full investigation, return the Case (JSON)
  POST /investigate/stream stream each agent step live (SSE) then the final case
  POST /pubsub/push        Pub/Sub push handler: pre-filter, investigate if suspicious
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import geo
from agents.pipeline import initiate_stepup, investigate, investigate_stream, prefilter, resolve_stepup
from memory.store import MemoryStore
from models import Case, Transaction

app = FastAPI(title="Raptorz Banking Earth — Fraud Intelligence", version="0.2.0")
store = MemoryStore()


def _resolve_geo(txn: Transaction, request: Request) -> Transaction:
    """If country is empty/AUTO, geolocate the caller IP (VM + VPN demo)."""
    if (txn.country or "").upper() in ("", "AUTO"):
        ip = geo.client_ip(request.headers, request.client.host if request.client else None)
        txn.country = geo.country_from_ip(ip) or ""
    return txn

_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "mock_mode": os.getenv("RAPTORZ_MOCK", "").lower() == "true" or not os.getenv("GOOGLE_CLOUD_PROJECT")}


@app.get("/cases")
def list_cases(limit: int = 20) -> list[dict]:
    """Recent investigation cases (newest first) for the analyst console feed."""
    out = []
    for c in store.list_cases(limit=limit):
        t = c.get("transaction") or {}
        r = c.get("result") or {}
        out.append({
            "id": c.get("id"),
            "created_at": c.get("created_at"),
            "customer": t.get("customer"),
            "merchant": t.get("merchant"),
            "amount": t.get("amount"),
            "currency": t.get("currency"),
            "city": t.get("city"),
            "country": t.get("country"),
            "channel": t.get("channel"),
            "risk": t.get("risk"),
            "decision": r.get("decision"),
            "confidence": r.get("confidence"),
            "steps": len(c.get("steps") or []),
        })
    return out


@app.get("/cases/{case_id}")
def get_case(case_id: str) -> dict:
    """Full case with its multi-agent reasoning steps and decision."""
    case = store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return case


@app.post("/investigate")
def do_investigate(txn: Transaction, request: Request) -> dict:
    return investigate(_resolve_geo(txn, request), store).model_dump()


class StepUpResolve(BaseModel):
    case_id: str
    otp_verified: bool


@app.post("/stepup/initiate")
def stepup_initiate(txn: Transaction, request: Request) -> dict:
    """Open a live 'OTP sent — awaiting verification' case (shows in Investigations)."""
    return initiate_stepup(_resolve_geo(txn, request), store).model_dump()


@app.post("/stepup/resolve")
def stepup_resolve(body: StepUpResolve) -> dict:
    """Finish a step-up case: Approved if OTP verified, Blocked if not."""
    try:
        return resolve_stepup(body.case_id, body.otp_verified, store).model_dump()
    except KeyError:
        raise HTTPException(status_code=404, detail="case not found")


@app.post("/investigate/stream")
def do_investigate_stream(txn: Transaction, request: Request) -> StreamingResponse:
    _resolve_geo(txn, request)

    def gen():
        for item in investigate_stream(txn, store):
            kind = "case" if isinstance(item, Case) else "step"
            yield f"event: {kind}\ndata: {json.dumps(item.model_dump(), default=str)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


# ===================== Relationship Manager (RM) voice-call workbench =====================
# For a blocked card, the RM places an automated Twilio voice call. The AI agent explains the
# situation and asks the customer to approve an unblock (keeping AutoPay disabled). The card is
# unblocked ONLY after a validated "yes" on the call — never otherwise.

RM_CUSTOMER = "Deepan"
RM_PROFILE = {
    "name": "Deepan",
    "tier": "VIP · Private Bank",
    "card_last4": "1234",
    "home": "Kuala Lumpur, Malaysia",
    "phone_masked": "+96 •••• 18",
    "email_masked": "d•••••••@gmail.com",
    "rm_name": "Priya Nair",
    "autopay": "Disabled",
    "last_block_reason": "Suspicious transaction from Singapore · cross-border · OTP not verified",
}
RM_SCRIPT = (
    "There has been a suspicious transaction originating from Singapore. "
    "AutoPay has been disabled, and OTP verification is required for future transactions. "
    "Your card is currently blocked. Would you like to unblock your card while keeping AutoPay disabled?"
)


def _iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _rm_log(event: str, detail: str = "", outcome: str = "info") -> dict:
    entry = {"time": _iso(), "event": event, "detail": detail, "outcome": outcome}
    store.append_rm_log(RM_CUSTOMER, entry)
    return entry


def _twilio_cfg() -> dict:
    cfg = {}
    raw = os.getenv("TWILIO_CONFIG")
    if raw:
        try:
            cfg = json.loads(raw)
        except Exception:  # noqa: BLE001
            cfg = {}
    return {
        "sid": cfg.get("sid") or os.getenv("TWILIO_ACCOUNT_SID"),
        "token": cfg.get("token") or os.getenv("TWILIO_AUTH_TOKEN"),
        "from": cfg.get("from") or os.getenv("TWILIO_FROM"),
        "to": cfg.get("to") or os.getenv("TWILIO_TO"),
    }


def _public_base(request: Request) -> str:
    env = os.getenv("RAPTORZ_PUBLIC_URL")
    if env:
        return env.rstrip("/")
    base = str(request.base_url).rstrip("/")
    if base.startswith("http://"):  # Cloud Run terminates TLS at the proxy
        base = "https://" + base[len("http://"):]
    return base


def _mask_num(n: str) -> str:
    d = "".join(ch for ch in str(n or "") if ch.isdigit())
    return "+" + d[:2] + " •••• " + d[-2:] if d else str(n)


def _xml_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _twiml(body: str) -> Response:
    return Response(content=f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>', media_type="application/xml")


def _place_call(cfg: dict, url: str, status_cb: str) -> dict:
    # Trial accounts reject extra params (StatusCallback/Method) — send only To/From/Url.
    # Twilio POSTs to the Url by default, which matches our /rm/voice handler.
    data = {"To": cfg["to"], "From": cfg["from"], "Url": url}
    req = urllib.request.Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{cfg['sid']}/Calls.json",
        data=urllib.parse.urlencode(data).encode(), method="POST",
    )
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{cfg['sid']}:{cfg['token']}".encode()).decode())
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="ignore")
        try:
            detail = json.loads(detail).get("message", detail)
        except Exception:  # noqa: BLE001
            pass
        raise RuntimeError(str(detail)[:200])


@app.get("/rm/customer")
def rm_customer() -> dict:
    """Customer details, live card status and the voice-call activity log for the RM section."""
    status = store.get_card_status(RM_CUSTOMER)
    return {
        **RM_PROFILE,
        "card_status": "Blocked" if status == "blocked" else "Unblocked",
        "card_status_raw": status,
        "script": RM_SCRIPT,
        "logs": store.get_rm_logs(RM_CUSTOMER),
    }


@app.post("/rm/call")
def rm_call(request: Request) -> dict:
    """Place the automated AI voice call to the customer (Twilio)."""
    cfg = _twilio_cfg()
    if not (cfg["sid"] and cfg["token"] and cfg["from"] and cfg["to"]):
        _rm_log("Voice call could not start", "Twilio voice is not configured on the server.", "error")
        return {"ok": False, "reason": "twilio_not_configured"}
    base = _public_base(request)
    try:
        res = _place_call(cfg, url=f"{base}/rm/voice", status_cb=f"{base}/rm/voice/status")
        _rm_log("AI voice call initiated",
                f"Dialling {_mask_num(cfg['to'])}. The RM voice agent will read the unblock request.", "info")
        return {"ok": True, "call_sid": res.get("sid"), "status": res.get("status")}
    except Exception as exc:  # noqa: BLE001
        _rm_log("Voice call failed to start", str(exc)[:160], "error")
        return {"ok": False, "reason": str(exc)[:160]}


@app.post("/rm/voice")
async def rm_voice(request: Request) -> Response:
    """TwiML: the AI agent explains the situation and gathers the customer's yes/no."""
    base = _public_base(request)
    _rm_log("Customer answered the call", "AI agent is explaining the suspicious Singapore transaction.", "info")
    say = RM_SCRIPT + " Say yes, or press 1, to unblock your card. Say no, or press 2, to keep it blocked."
    body = (
        f'<Gather input="speech dtmf" numDigits="1" timeout="6" speechTimeout="auto" '
        f'actionOnEmptyResult="true" action="{base}/rm/voice/collect" method="POST" '
        f'hints="yes,no,unblock,keep it blocked">'
        f'<Say>{_xml_escape(say)}</Say></Gather>'
    )
    return _twiml(body)


@app.post("/rm/voice/collect")
async def rm_voice_collect(request: Request) -> Response:
    """TwiML: interpret the spoken/keypad answer and update the card ONLY on an explicit yes."""
    form = await request.form()
    digits = (form.get("Digits") or "").strip()
    speech = (form.get("SpeechResult") or "").strip().lower()
    heard = speech or (f"keypad {digits}" if digits else "(silence)")

    said_no = digits == "2" or any(w in speech for w in ("no", "nope", "keep", "don't", "do not", "cancel", "leave it"))
    said_yes = digits == "1" or any(w in speech for w in ("yes", "yeah", "yep", "sure", "unblock", "confirm", "go ahead", "please do"))

    if said_yes and not said_no:
        store.set_card_status(RM_CUSTOMER, "active")
        _rm_log("Customer approved on the call", f'Heard: "{heard}". Explicit consent to unblock captured.', "approved")
        _rm_log("Card unblocked", "RM re-enabled the card after validated approval. AutoPay stays DISABLED; OTP still required on future payments.", "approved")
        return _twiml('<Say>Thank you. Your card has been unblocked. AutoPay stays disabled and you will be asked for a one time passcode on future payments. Goodbye.</Say>')
    if said_no:
        _rm_log("Customer declined on the call", f'Heard: "{heard}". Customer chose to keep the card blocked.', "declined")
        return _twiml('<Say>Understood. Your card will remain blocked for your protection. Goodbye.</Say>')

    _rm_log("No clear response", f'Heard: "{heard}". Card remains blocked.', "warn")
    return _twiml('<Say>Sorry, we could not confirm your choice, so your card will remain blocked. Goodbye.</Say>')


@app.post("/rm/voice/status")
async def rm_voice_status(request: Request) -> Response:
    """Twilio call-status callback — record calls that were not answered."""
    form = await request.form()
    cs = (form.get("CallStatus") or "").lower()
    if cs in ("no-answer", "busy", "failed", "canceled"):
        _rm_log("Call not completed", f"Outcome: {cs}. Card remains blocked.", "warn")
    return Response(status_code=204)


@app.post("/rm/reset")
def rm_reset() -> dict:
    """Reset the RM demo: card back to Blocked, logs cleared."""
    store.reset_rm(RM_CUSTOMER)
    _rm_log("RM session reset", "Card set back to Blocked for a new demo run.", "info")
    return {"ok": True, "card_status": "Blocked"}


class RMSimulate(BaseModel):
    choice: str  # yes | no | noanswer


@app.post("/rm/simulate")
def rm_simulate(body: RMSimulate) -> dict:
    """Drive the SAME card state machine as the live voice call, for demos where the Twilio
    trial account can't ring the number. The card still unblocks ONLY on an explicit yes."""
    c = (body.choice or "").lower()
    _rm_log("AI voice call placed (simulated)",
            "Twilio trial cannot ring a live number — demonstrating the call outcome.", "info")
    if c == "yes":
        _rm_log("Customer answered the call", "AI agent explained the suspicious Singapore transaction.", "info")
        store.set_card_status(RM_CUSTOMER, "active")
        _rm_log("Customer approved on the call", 'Customer said "yes" — explicit consent to unblock captured.', "approved")
        _rm_log("Card unblocked", "RM re-enabled the card after validated approval. AutoPay stays DISABLED; OTP still required on future payments.", "approved")
        return {"ok": True, "card_status": "Unblocked"}
    if c == "no":
        _rm_log("Customer answered the call", "AI agent explained the suspicious Singapore transaction.", "info")
        _rm_log("Customer declined on the call", 'Customer said "no" — chose to keep the card blocked.', "declined")
        return {"ok": True, "card_status": "Blocked"}
    _rm_log("Call not answered", "Customer did not pick up within the ring window. Card remains blocked.", "warn")
    return {"ok": True, "card_status": "Blocked"}


@app.post("/pubsub/push")
async def pubsub_push(request: Request) -> Response:
    """Cloud Pub/Sub push endpoint. Decodes the transaction, runs the router."""
    envelope = await request.json()
    message = (envelope or {}).get("message", {})
    data = message.get("data")
    if not data:
        return Response(status_code=204)

    txn = Transaction(**json.loads(base64.b64decode(data).decode("utf-8")))
    store.save_transaction(txn)

    if prefilter(txn):
        investigate(txn, store)  # writes the case (+ live steps) to Firestore

    return Response(status_code=204)
