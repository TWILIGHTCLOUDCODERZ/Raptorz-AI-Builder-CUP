"""Aegis multi-agent investigation pipeline.

Built on the Google GenAI SDK (an accepted hackathon agent framework) with
Gemini 3.5. The pipeline mirrors the UI: an Orchestrator routes to a card-status
gate and five specialists (Investigator, Network Analyst, Intel, Compliance,
Critic), then a memory- and tier-aware adaptive decision.

VIP handling: a reported-stolen/lost/frozen card is a HARD block regardless of
tier (anti-exploit). For VIP/premium clients that are NOT compromised, a false
decline costs more than the fraud, so Aegis prefers a silent approve (on memory
match) or a discreet concierge step-up over a cold decline.

Runs anywhere: if Vertex/Gemini is unavailable (local, or AEGIS_MOCK=true) it
falls back to deterministic mock reasoning so the demo never breaks.
"""
from __future__ import annotations

import json
import os
import uuid
from typing import Iterator, Union

from models import AgentStep, Case, DecisionResult, Transaction
from memory.store import MemoryStore
from tools import investigation_tools as T

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
MOCK = os.getenv("AEGIS_MOCK", "").lower() == "true" or not PROJECT

_COMPROMISED = ("reported_stolen", "lost", "frozen")

_client = None


def _get_client():
    global _client
    if _client is None:
        from google import genai

        _client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    return _client


# ---------------- system prompts ----------------
_SPECIALISTS = {
    "Investigator": "You are a bank fraud investigator. Given a transaction, its 90-day "
    "baseline, device/geo signals, the customer's tier, and card status, state in ONE concise "
    "sentence whether behavior is consistent with the customer. Reference the strongest signal.",
    "Network Analyst": "You are a financial-crime network analyst. In ONE sentence, say "
    "whether the account linkage indicates a mule ring or is clean, citing the evidence.",
    "Intel": "You are a screening analyst. In ONE sentence, summarize sanctions/PEP/"
    "adverse-media and merchant-reputation findings.",
    "Compliance": "You are a compliance officer. In ONE sentence, state whether the proposed "
    "decision satisfies controls and whether any filing (e.g. SAR) or concierge fraud-recovery "
    "step is triggered.",
    "Critic": "You are a QA critic reviewing the investigation. In ONE sentence, confirm the "
    "reasoning is sound or flag a gap.",
}

_DECISION_SYSTEM = (
    "You are Aegis, an autonomous fraud decision engine for a bank. Choose exactly one outcome "
    "from: Approved, Step-up, Held, Blocked. Rules:\n"
    "1) A VIP or premium customer must NEVER be cold-declined — a false decline costs more than "
    "the fraud. If confirmed-legit memory explains the activity, Approve silently. If risk is "
    "elevated but the card is NOT compromised, choose Step-up (a discreet concierge verification), "
    "not Block.\n"
    "2) Prefer the lowest-friction safe outcome for everyone; if memory explains an anomaly, "
    "approve without challenging the customer.\n"
    "Return concise JSON: decision, confidence (0-1), reason_codes (snake_case list), rationale "
    "(one sentence)."
)


def _normalize_decision(value: str) -> str:
    v = (value or "").strip().lower()
    if "block" in v:
        return "Blocked"
    if "step" in v or "challenge" in v:
        return "Step-up"
    if "hold" in v or "held" in v:
        return "Held"
    return "Approved"


# ---------------- LLM helpers (with mock fallback) ----------------
def _specialist(name: str, payload: dict, evidence: list[str]) -> AgentStep:
    if MOCK:
        return AgentStep(agent=name, thought=_mock_thought(name, payload), evidence=evidence)
    try:
        from google.genai import types

        resp = _get_client().models.generate_content(
            model=MODEL,
            contents=json.dumps(payload, default=str),
            config=types.GenerateContentConfig(
                system_instruction=_SPECIALISTS[name],
                temperature=0.2,
                max_output_tokens=1024,
            ),
        )
        return AgentStep(agent=name, thought=(resp.text or "").strip(), evidence=evidence)
    except Exception as exc:  # noqa: BLE001
        return AgentStep(
            agent=name,
            thought=f"{_mock_thought(name, payload)}",
            evidence=evidence + [f"(llm fallback: {exc})"],
        )


def _hard_block(txn: Transaction, card_status: str, tier: str) -> DecisionResult:
    """Deterministic gate: a compromised card is fraud regardless of tier."""
    codes = [f"card_{card_status}"]
    if txn.country and txn.country != "US":
        codes.append("foreign_geo_mismatch")
    if tier in ("vip", "premium"):
        codes.append("vip_priority_recovery")
    recovery = " Concierge fraud recovery and priority reissue initiated." if tier in ("vip", "premium") else ""
    return DecisionResult(
        decision="Blocked",
        confidence=0.99,
        reason_codes=codes,
        rationale=f"Card is {card_status.replace('_', ' ')} — blocked regardless of customer tier.{recovery}",
    )


def _decide(txn: Transaction, findings: list[dict], memory: list[str], card_status: str = "active", tier: str = "standard") -> DecisionResult:
    # Hard gate first — a compromised card never depends on the LLM.
    if card_status in _COMPROMISED:
        return _hard_block(txn, card_status, tier)
    if MOCK:
        return _mock_decision(txn, memory, card_status, tier)
    try:
        from google.genai import types

        prompt = {
            "transaction": txn.model_dump(),
            "customer_tier": tier,
            "card_status": card_status,
            "findings": findings,
            "confirmed_legit_memory": memory,
        }
        resp = _get_client().models.generate_content(
            model=MODEL,
            contents=json.dumps(prompt, default=str),
            config=types.GenerateContentConfig(
                system_instruction=_DECISION_SYSTEM,
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=DecisionResult,
            ),
        )
        result: DecisionResult = getattr(resp, "parsed", None) or DecisionResult(**json.loads(resp.text))
        result.decision = _normalize_decision(result.decision)
        return result
    except Exception as exc:  # noqa: BLE001
        fallback = _mock_decision(txn, memory, card_status, tier)
        fallback.reason_codes.append("llm_fallback")
        return fallback


# ---------------- mock reasoning ----------------
def _mock_thought(name: str, payload: dict) -> str:
    text = json.dumps(payload, default=str)
    if name == "Investigator":
        return "Amount is above baseline but device and channel are consistent with the customer's history."
    if name == "Network Analyst":
        return "Possible mule ring detected." if "mule ring" in text else "No suspicious account linkage detected."
    if name == "Intel":
        return "Sanctions/adverse-media matches present." if "high-risk" in text or "adverse media present" in text else "No sanctions, PEP, or adverse-media matches; merchant reputation acceptable."
    if name == "Compliance":
        return "Controls satisfied; no filing obligation at this stage."
    return "Reasoning chain is complete and internally consistent."


def _mock_decision(txn: Transaction, memory: list[str], card_status: str = "active", tier: str = "standard") -> DecisionResult:
    if card_status in _COMPROMISED:
        return _hard_block(txn, card_status, tier)
    foreign = bool(txn.country) and txn.country != "US"
    memory_explains = any(
        (txn.city and txn.city.split(",")[0] in m) or "confirmed legit" in m.lower()
        for m in memory
    )
    if memory_explains:
        codes = ["confirmed_legit_memory", "device_consistent"]
        if tier == "vip":
            codes.append("vip_white_glove")
        return DecisionResult(
            decision="Approved",
            confidence=0.98,
            reason_codes=codes,
            rationale="Confirmed-legit memory explains the activity; approved without challenging the customer.",
        )
    if txn.channel == "Wire" and txn.amount > 5000 and foreign:
        return DecisionResult(
            decision="Blocked",
            confidence=0.95,
            reason_codes=["new_device", "new_payee", "high_value_foreign_wire"],
            rationale="High-value foreign wire on a new device with a new payee — blocked pending verification.",
        )
    score = txn.risk or ((40 if txn.amount > 1000 else 0) + (25 if foreign else 0) + (25 if txn.channel in ("Wire", "Web") else 0))
    if score >= 85:
        if tier in ("vip", "premium"):
            return DecisionResult(decision="Step-up", confidence=0.82, reason_codes=["elevated_risk", "vip_concierge_verify"], rationale="Elevated risk on a high-value client — discreet concierge verification rather than a decline.")
        return DecisionResult(decision="Blocked", confidence=0.9, reason_codes=["risk_threshold_exceeded"], rationale="Composite risk exceeded the block threshold.")
    if score >= 60:
        return DecisionResult(decision="Step-up", confidence=0.82, reason_codes=["velocity_anomaly"], rationale="Elevated risk — stepping up with a lightweight verification.")
    return DecisionResult(decision="Approved", confidence=0.9, reason_codes=["baseline_match"], rationale="Behavior matches the customer baseline.")


# ---------------- pipeline ----------------
def prefilter(txn: Transaction) -> bool:
    """Cheap pre-filter: True when a transaction needs deep multi-agent investigation."""
    score = txn.risk or (
        (40 if txn.amount > 1000 else 0)
        + (25 if txn.country and txn.country != "US" else 0)
        + (25 if txn.channel in ("Wire", "Web") else 0)
    )
    return score >= 60


def investigate_stream(txn: Transaction, store: MemoryStore) -> Iterator[Union[AgentStep, Case]]:
    """Run the investigation, yielding each AgentStep as it completes, then the final Case."""
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    memory = store.get_customer_memory(txn.customer)
    tier = store.get_customer_tier(txn.customer)
    card = T.check_card_status(txn)
    steps: list[AgentStep] = []

    def emit(step: AgentStep) -> AgentStep:
        steps.append(step)
        store.append_step(case_id, step)
        return step

    yield emit(AgentStep(
        agent="Orchestrator",
        thought=f"Routing {txn.id}: {txn.currency} {txn.amount:.0f} at {txn.merchant}, {txn.city or 'n/a'}. Customer tier: {tier.upper()}. Dispatching specialists.",
        evidence=[f"inbound_risk={txn.risk}", f"channel={txn.channel}", f"tier={tier}"],
    ))

    gate_note = " Stolen/lost/frozen cards are a hard block regardless of tier." if card["card_status"] in _COMPROMISED else ""
    yield emit(AgentStep(
        agent="Card Status",
        thought=f"{card['summary']}.{gate_note}",
        evidence=[f"card_status={card['card_status']}", f"tier={tier}"],
    ))

    hist = T.get_transaction_history(txn)
    dev = T.check_device_and_geo(txn)
    yield emit(_specialist("Investigator", {"transaction": txn.model_dump(), "history": hist, "device_geo": dev, "memory": memory, "customer_tier": tier, "card_status": card["card_status"]}, [hist["summary"], dev["summary"]]))

    net = T.check_network_graph(txn)
    yield emit(_specialist("Network Analyst", {"transaction": txn.model_dump(), "network": net}, [net["summary"]]))

    intel = T.screen_sanctions_and_adverse_media(txn)
    merch = T.check_merchant_reputation(txn)
    yield emit(_specialist("Intel", {"sanctions": intel, "merchant": merch}, [intel["summary"], merch["summary"]]))

    result = _decide(txn, [s.model_dump() for s in steps], memory, card["card_status"], tier)

    yield emit(_specialist("Compliance", {"decision": result.model_dump(), "transaction": txn.model_dump(), "customer_tier": tier}, [f"decision={result.decision}"]))
    yield emit(_specialist("Critic", {"decision": result.model_dump(), "steps": [s.thought for s in steps]}, ["review complete"]))

    case = Case(id=case_id, transaction=txn, steps=steps, memory_hits=memory, result=result)
    store.save_case(case)
    yield case


def investigate(txn: Transaction, store: MemoryStore) -> Case:
    """Run the full investigation and return the completed Case."""
    case: Case | None = None
    for item in investigate_stream(txn, store):
        if isinstance(item, Case):
            case = item
    assert case is not None
    return case
