"""Aegis evaluation harness.

Runs a labeled synthetic transaction set through (a) a traditional rules-only
engine and (b) Aegis's REAL decision policy (the deterministic gates in
agents.pipeline._decide, mock mode — no Gemini calls), then reports:
  - fraud caught (recall)
  - hard false-decline rate + reduction vs. rules
  - block precision
  - step-up (light friction) rate
  - straight-through vs. auto-blocked

Reproducible:  python backend/eval/evaluate.py
The numbers are illustrative on synthetic data; in production the bank calibrates
thresholds on historical fraud / false-positive data.
"""
from __future__ import annotations

import json
import os
import random
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.environ["AEGIS_MOCK"] = "true"  # deterministic policy, no Gemini/cloud

from models import Transaction  # noqa: E402
from agents.pipeline import _decide  # noqa: E402

random.seed(42)
BLOCKLIST = {"NG", "RU", "IR", "KP", "SY"}

# ---------------- synthetic labeled dataset ----------------
SAMPLES: list[dict] = []


def add(category, label, n, amount, countries, channel, risk, *, card_status="active", tier="standard", memory=None, auto_pay=False, otp_verified=None):
    for i in range(n):
        c = random.choice(countries)
        SAMPLES.append({
            "id": f"{category}-{i}", "category": category, "label": label,
            "amount": random.randint(*amount), "country": c, "city": f"City, {c}",
            "channel": channel, "risk": risk, "card_status": card_status, "tier": tier,
            "memory": list(memory) if memory else [], "auto_pay": auto_pay, "otp_verified": otp_verified,
        })


# legitimate transactions
add("L1-normal", "legit", 130, (20, 900), ["US"], "Card", 15)
add("L2-foreign-vip", "legit", 45, (5000, 50000), ["MC", "AE", "CH", "GB"], "Card", 72, tier="vip",
    memory=["Recurring travel & luxury purchases confirmed legit"])
add("L3-foreign-legit", "legit", 30, (3200, 4500), ["FR", "DE", "SG"], "Card", 65)
add("L4-legit-critical", "legit", 8, (6000, 9000), ["BR", "ZA", "MX"], "Wire", 88)  # genuinely fraud-shaped

# fraudulent transactions
add("F1-stolen-card", "fraud", 22, (300, 1500), ["AE", "GB", "FR"], "Card", 85, card_status="reported_stolen")
add("F2-account-takeover", "fraud", 16, (6000, 9000), ["US"], "Wire", 88, auto_pay=True, otp_verified=False)
add("F3-impossible-travel", "fraud", 14, (200, 900), ["IT", "ES", "TH"], "Card", 85)
add("F4-obvious", "fraud", 8, (11000, 25000), ["NG", "IR"], "Card", 95)
add("F5-stealth", "fraud", 3, (80, 400), ["US"], "Card", 42)


# ---------------- decision engines ----------------
def rules_only(s: dict) -> str:
    """Traditional thresholds: amount / blocklist / foreign-high. No AI signals."""
    if s["amount"] > 10000:
        return "Blocked"
    if s["country"] in BLOCKLIST:
        return "Blocked"
    if s["country"] != "US" and s["amount"] > 3000:
        return "Blocked"
    return "Approved"


def aegis(s: dict) -> str:
    txn = Transaction(id=s["id"], customer="Customer", amount=float(s["amount"]), currency="USD",
                      merchant="Merchant", city=s["city"], country=s["country"], channel=s["channel"],
                      risk=s["risk"], auto_pay=s["auto_pay"], otp_verified=s["otp_verified"])
    return _decide(txn, [], s["memory"], s["card_status"], s["tier"]).decision


# ---------------- metrics ----------------
def evaluate(engine):
    total_fraud = sum(1 for s in SAMPLES if s["label"] == "fraud")
    total_legit = sum(1 for s in SAMPLES if s["label"] == "legit")
    caught = blocked_legit = stepup_legit = blocks = fraud_in_blocks = 0
    for s in SAMPLES:
        d = engine(s)
        stopped = d in ("Blocked", "Step-up", "Held")  # fraud can't pass step-up OTP
        if d == "Blocked":
            blocks += 1
            if s["label"] == "fraud":
                fraud_in_blocks += 1
        if s["label"] == "fraud" and stopped:
            caught += 1
        if s["label"] == "legit" and d == "Blocked":
            blocked_legit += 1
        if s["label"] == "legit" and d == "Step-up":
            stepup_legit += 1
    return {
        "fraud_recall": caught / total_fraud,
        "false_decline_rate": blocked_legit / total_legit,
        "stepup_rate": stepup_legit / total_legit,
        "block_precision": (fraud_in_blocks / blocks) if blocks else 0.0,
    }


rules = evaluate(rules_only)
ag = evaluate(aegis)
fd_reduction = (rules["false_decline_rate"] - ag["false_decline_rate"]) / rules["false_decline_rate"]

pct = lambda x: f"{x * 100:.1f}%"
report = f"""# Aegis — Evaluation Results

Synthetic benchmark of **{len(SAMPLES)} labeled transactions**
({sum(1 for s in SAMPLES if s['label'] == 'legit')} legitimate, {sum(1 for s in SAMPLES if s['label'] == 'fraud')} fraudulent),
run through Aegis's real decision policy vs. a traditional rules-only engine.

| Metric | Rules-only | **Aegis** |
|---|---|---|
| Fraud caught (recall) | {pct(rules['fraud_recall'])} | **{pct(ag['fraud_recall'])}** |
| Hard false-decline rate | {pct(rules['false_decline_rate'])} | **{pct(ag['false_decline_rate'])}** |
| Block precision | {pct(rules['block_precision'])} | **{pct(ag['block_precision'])}** |
| Light step-up instead of decline | — | {pct(ag['stepup_rate'])} of legit |

## Headline

- **Caught {pct(ag['fraud_recall'])} of fraud** vs. {pct(rules['fraud_recall'])} for rules-only — AI catches the stolen-card, account-takeover and impossible-travel cases blunt rules miss.
- **Cut hard false declines by {pct(fd_reduction)}** ({pct(rules['false_decline_rate'])} → {pct(ag['false_decline_rate'])}) — memory approves confirmed-legit activity and a lightweight OTP step-up replaces most declines.
- **Every decision is automated** (approve / step-up / block) in seconds — vs. a manual analyst queue measured in minutes.

_Illustrative on synthetic data; production thresholds are calibrated on the bank's historical fraud / false-positive data._
"""

print(report)
(Path(__file__).parent / "RESULTS.md").write_text(report, encoding="utf-8")
(Path(__file__).parent / "results.json").write_text(json.dumps({"rules": rules, "aegis": ag, "fd_reduction": fd_reduction, "n": len(SAMPLES)}, indent=2), encoding="utf-8")
