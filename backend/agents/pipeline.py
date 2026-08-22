"""Aegis multi-agent investigation pipeline.

Built on the Google GenAI SDK (an accepted hackathon agent framework) with
Gemini 3.5. The pipeline mirrors the UI: an Orchestrator routes to five
specialists (Investigator, Network Analyst, Intel, Compliance, Critic), each
reasoning over evidence from the tools, then a memory-aware adaptive decision.

Runs anywhere: if Vertex/Gemini is unavailable (e.g. local dev with no creds,
or AEGIS_MOCK=true) it falls back to deterministic mock reasoning so the demo
never breaks.
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
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-pro")
MOCK = os.getenv("AEGIS_MOCK", "").lower() == "true" or not PROJECT

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
    "baseline, and device/geo signals, state in ONE concise sentence whether behavior is "
    "consistent with the customer. Reference the strongest signal.",
    "Network Analyst": "You are a financial-crime network analyst. In ONE sentence, say "
    "whether the account linkage indicates a mule ring or is clean, citing the evidence.",
    "Intel": "You are a screening analyst. In ONE sentence, summarize sanctions/PEP/"
    "adverse-media and merchant-reputation findings.",
    "Compliance": "You are a compliance officer. In ONE sentence, state whether the proposed "
    "decision satisfies controls and if any filing (e.g. SAR) obligation is triggered.",
    "Critic": "You are a QA critic reviewing the investigation. In ONE sentence, confirm the "
    "reasoning is sound or flag a gap.",
}

_DECISION_SYSTEM = (
    "You are Aegis, an autonomous fraud decision engine for a bank. Weigh all findings and "
    "the customer's confirmed-legit memory. Prefer the LOWEST-friction safe outcome: if memory "
    "explains an anomaly, approve without challenging the customer. Choose exactly one decision "
    "from: Approved, Step-up, Held, Blocked. Return concise machine-readable JSON with fields: "
    "decision, confidence (0-1), reason_codes (snake_case list), rationale (one sentence)."
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
                max_output_tokens=200,
            ),
        )
        return AgentStep(agent=name, thought=(resp.text or "").strip(), evidence=evidence)
    except Exception as exc:  # noqa: BLE001
        return AgentStep(
            agent=name,
            thought=f"{_mock_thought(name, payload)}",
            evidence=evidence + [f"(llm fallback: {exc})"],
        )


def _decide(txn: Transaction, findings: list[dict], memory: list[str]) -> DecisionResult:
    if MOCK:
        return _mock_decision(txn, memory)
    try:
        from google.genai import types

        prompt = {"transaction": txn.model_dump(), "findings": findings, "confirmed_legit_memory": memory}
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
        fallback = _mock_decision(txn, memory)
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


def _mock_decision(txn: Transaction, memory: list[str]) -> DecisionResult:
    foreign = bool(txn.country) and txn.country != "US"
    memory_explains = any(
        (txn.city and txn.city.split(",")[0] in m) or "confirmed legit" in m.lower()
        for m in memory
    )
    if memory_explains:
        return DecisionResult(
            decision="Approved",
            confidence=0.98,
            reason_codes=["travel_memory_match", "device_consistent"],
            rationale="Confirmed-legit memory explains the anomaly; approved without challenging the customer.",
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
    steps: list[AgentStep] = []

    def emit(step: AgentStep) -> AgentStep:
        steps.append(step)
        store.append_step(case_id, step)
        return step

    yield emit(AgentStep(
        agent="Orchestrator",
        thought=f"Routing {txn.id}: {txn.currency} {txn.amount:.0f} at {txn.merchant}, {txn.city or 'n/a'}. Dispatching specialists.",
        evidence=[f"inbound_risk={txn.risk}", f"channel={txn.channel}"],
    ))

    hist = T.get_transaction_history(txn)
    dev = T.check_device_and_geo(txn)
    yield emit(_specialist("Investigator", {"transaction": txn.model_dump(), "history": hist, "device_geo": dev, "memory": memory}, [hist["summary"], dev["summary"]]))

    net = T.check_network_graph(txn)
    yield emit(_specialist("Network Analyst", {"transaction": txn.model_dump(), "network": net}, [net["summary"]]))

    intel = T.screen_sanctions_and_adverse_media(txn)
    merch = T.check_merchant_reputation(txn)
    yield emit(_specialist("Intel", {"sanctions": intel, "merchant": merch}, [intel["summary"], merch["summary"]]))

    result = _decide(txn, [s.model_dump() for s in steps], memory)

    yield emit(_specialist("Compliance", {"decision": result.model_dump(), "transaction": txn.model_dump()}, [f"decision={result.decision}"]))
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
