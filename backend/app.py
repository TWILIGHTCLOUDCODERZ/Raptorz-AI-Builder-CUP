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

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import geo
from agents.pipeline import investigate, investigate_stream, prefilter
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


@app.get("/analytics/summary")
def analytics_summary() -> dict:
    """Decision analytics — from BigQuery when configured, else computed from the store."""
    from analytics import bq

    bq_summary = bq.summary()
    if bq_summary:
        return bq_summary
    cases = store.list_cases()
    counts: dict[str, int] = {}
    for c in cases:
        decision = ((c.get("result") or {}).get("decision")) or "Unknown"
        counts[decision] = counts.get(decision, 0) + 1
    by_decision = [{"decision": k, "n": v} for k, v in sorted(counts.items(), key=lambda kv: -kv[1])]
    return {"source": "store", "total": len(cases), "by_decision": by_decision, "bigquery_enabled": bq.enabled()}


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


@app.post("/investigate/stream")
def do_investigate_stream(txn: Transaction, request: Request) -> StreamingResponse:
    _resolve_geo(txn, request)

    def gen():
        for item in investigate_stream(txn, store):
            kind = "case" if isinstance(item, Case) else "step"
            yield f"event: {kind}\ndata: {json.dumps(item.model_dump(), default=str)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


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
