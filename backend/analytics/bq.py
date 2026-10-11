"""BigQuery analytics sink for Aegis decisions.

Every completed case is streamed to a BigQuery table so risk / fraud analytics can
be queried — decisions by outcome, average risk & confidence, by tier / channel /
country, over time. This is the queryable analytics layer behind the eval and any
executive dashboard.

Graceful by design: if ``google-cloud-bigquery`` or credentials are unavailable, or
``AEGIS_BQ=false`` / offline mode is set, every function is a safe no-op and the API
serves a store-computed fallback — the demo never breaks.

Provision the dataset/table once with ``infra/setup-bigquery.sh``.
"""
from __future__ import annotations

import datetime
import os
from typing import Optional

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
DATASET = os.getenv("AEGIS_BQ_DATASET", "aegis")
TABLE = os.getenv("AEGIS_BQ_TABLE", "decisions")
_OFFLINE = os.getenv("AEGIS_OFFLINE", "").lower() == "true" or os.getenv("AEGIS_MOCK", "").lower() == "true"
_ENABLED_ENV = os.getenv("AEGIS_BQ", "true").lower() != "false"

_client = None
_available: Optional[bool] = None


def _get_client():
    global _client, _available
    if _available is False:
        return None
    if _client is None:
        try:
            from google.cloud import bigquery

            _client = bigquery.Client(project=PROJECT)
            _available = True
        except Exception as exc:  # noqa: BLE001 — BigQuery optional
            print(f"[bq] disabled: {exc}")
            _available = False
            _client = None
    return _client


def enabled() -> bool:
    return bool(PROJECT) and _ENABLED_ENV and not _OFFLINE and _get_client() is not None


def table_id() -> str:
    return f"{PROJECT}.{DATASET}.{TABLE}"


def log_decision(case) -> None:
    """Fire-and-forget: stream one decision row to BigQuery. Never raises to the caller."""
    if not enabled():
        return
    try:
        c = case if isinstance(case, dict) else case.model_dump()
        txn = c.get("transaction", {}) or {}
        res = c.get("result", {}) or {}
        row = {
            "case_id": c.get("id"),
            "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "customer": txn.get("customer"),
            "amount": txn.get("amount"),
            "currency": txn.get("currency"),
            "merchant": txn.get("merchant"),
            "city": txn.get("city"),
            "country": txn.get("country"),
            "channel": txn.get("channel"),
            "risk": txn.get("risk"),
            "decision": res.get("decision"),
            "confidence": res.get("confidence"),
            "reason_codes": ",".join(res.get("reason_codes", []) or []),
        }
        errors = _get_client().insert_rows_json(table_id(), [row])
        if errors:
            print(f"[bq] insert errors: {errors}")
    except Exception as exc:  # noqa: BLE001
        print(f"[bq] log_decision skipped: {exc}")


def summary() -> Optional[dict]:
    """Decisions aggregated by outcome from BigQuery, or None if unavailable."""
    if not enabled():
        return None
    try:
        q = f"""
          SELECT decision,
                 COUNT(*)              AS n,
                 ROUND(AVG(confidence), 3) AS avg_confidence,
                 ROUND(AVG(risk), 1)       AS avg_risk
          FROM `{table_id()}`
          GROUP BY decision
          ORDER BY n DESC
        """
        rows = [dict(r) for r in _get_client().query(q).result()]
        total = sum(r["n"] for r in rows)
        return {"source": "bigquery", "table": table_id(), "total": total, "by_decision": rows}
    except Exception as exc:  # noqa: BLE001
        print(f"[bq] summary error: {exc}")
        return None
