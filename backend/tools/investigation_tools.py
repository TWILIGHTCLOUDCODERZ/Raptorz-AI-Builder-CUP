"""Mock investigation tools.

Each returns synthetic-but-believable evidence derived from the transaction so
demos are deterministic and safe (no real PII, no external calls). Swap these
for real integrations (core banking, device intel, sanctions APIs) later —
the agent pipeline calls them through this stable interface.
"""
from __future__ import annotations

from models import Transaction

_HIGH_RISK_COUNTRIES = {"NG", "RU", "KP", "IR", "SY"}


def get_transaction_history(txn: Transaction) -> dict:
    """90-day behavioral baseline for the customer."""
    return {
        "avg_ticket_usd": round(max(40.0, txn.amount * 0.35), 2),
        "txns_last_30d": 42,
        "typical_channels": ["Card", "Mobile"],
        "home_country": "US",
        "recent_foreign_activity": (
            "Dubai, AE (Mar 2026)" if "Dubai" in txn.city else "none in last 90d"
        ),
        "summary": (
            f"Customer averages ~${max(40.0, txn.amount * 0.35):.0f}/txn; "
            f"this transaction is {txn.amount / max(1.0, txn.amount * 0.35):.1f}x the baseline."
        ),
    }


def check_device_and_geo(txn: Transaction) -> dict:
    """Device fingerprint + geo-velocity signals."""
    new_device = txn.amount > 1000 and txn.channel in ("Web", "Wire")
    foreign = bool(txn.country) and txn.country != "US"
    return {
        "device_known": not new_device,
        "geo_velocity_kmh": 780 if foreign else 12,
        "ip_reputation": "suspicious" if new_device else "clean",
        "summary": (
            f"device_known={not new_device}, "
            f"{'foreign geo, high velocity' if foreign else 'local geo'}, "
            f"ip={'suspicious' if new_device else 'clean'}"
        ),
    }


def check_network_graph(txn: Transaction) -> dict:
    """Transaction-graph / mule-ring signals."""
    ring = txn.channel == "Wire" and txn.amount > 5000
    return {
        "connected_accounts": 3 if ring else 0,
        "shared_device_cluster": ring,
        "mule_ring_match": ring,
        "summary": (
            "New device linked to 3 accounts funneling to one payout — possible mule ring"
            if ring
            else "No suspicious account linkage detected"
        ),
    }


def screen_sanctions_and_adverse_media(txn: Transaction) -> dict:
    """Sanctions / PEP / adverse-media screening."""
    hit = txn.country in _HIGH_RISK_COUNTRIES
    return {
        "sanctions_hit": hit,
        "pep_match": False,
        "adverse_media": hit,
        "summary": (
            "Counterparty jurisdiction on high-risk list; adverse media present"
            if hit
            else "No sanctions, PEP, or adverse-media matches"
        ),
    }


def check_merchant_reputation(txn: Transaction) -> dict:
    """Merchant reputation lookup."""
    risky = txn.merchant.lower() in {"coinbase", "wire transfer", "unknown"}
    return {
        "merchant": txn.merchant,
        "reputation": "elevated" if risky else "clean",
        "chargeback_rate": "3.2%" if risky else "0.4%",
        "summary": (
            f"Merchant '{txn.merchant}' reputation {'elevated' if risky else 'clean'}"
        ),
    }
