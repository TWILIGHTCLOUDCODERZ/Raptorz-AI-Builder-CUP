"""Shared data models for the Aegis backend."""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

DecisionValue = Literal["Approved", "Step-up", "Held", "Blocked"]


class Transaction(BaseModel):
    id: str
    customer: str
    card: str = ""
    amount: float
    currency: str = "USD"
    merchant: str
    city: str = ""
    country: str = ""
    channel: str = "Card"
    risk: int = 0  # optional inbound pre-score (0-100); 0 = unknown


class AgentStep(BaseModel):
    agent: str
    thought: str
    evidence: list[str] = Field(default_factory=list)
    status: Literal["running", "done"] = "done"


class DecisionResult(BaseModel):
    # kept as plain str (not Literal) for robust LLM structured output; normalized in code
    decision: str
    confidence: float
    reason_codes: list[str]
    rationale: str


class Case(BaseModel):
    id: str
    transaction: Transaction
    steps: list[AgentStep] = Field(default_factory=list)
    memory_hits: list[str] = Field(default_factory=list)
    result: Optional[DecisionResult] = None
