"""Google ADK (Agent Development Kit) orchestration layer for Raptorz.

Each specialist and the adaptive-decision step is a Google ADK ``LlmAgent`` running
on Gemini 3.5. ADK does the *reasoning*; the deterministic policy gates
(stolen-card hard block, auto-pay / OTP step-up) stay in ``pipeline.py`` so bank
policy is enforced in code, never left to the model.

Graceful by design: if ``google-adk`` is not installed, ``ADK_AVAILABLE`` is
False and the pipeline falls back to the Gemini SDK / offline path — the demo and
existing deployment keep working. Set ``RAPTORZ_USE_ADK=false`` to force the SDK path.

Why ADK: it is Google's open-source agent framework, so Raptorz runs on Google's
agent stack end to end (ADK + Gemini 3.5 + Vertex AI on Cloud Run).
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import json
import os
import uuid
from typing import Optional, Type

from pydantic import BaseModel

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
APP_NAME = "raptorz"

# Bridge: ADK reads GOOGLE_API_KEY for the AI Studio path; our deploy may set the
# key as GEMINI_API_KEY. (The default Cloud Run path uses Vertex AI via ADC.)
if os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY") and os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() != "true":
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

try:
    from google.adk.agents import LlmAgent
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    ADK_AVAILABLE = True
except Exception:  # noqa: BLE001 — ADK optional; pipeline falls back without it
    ADK_AVAILABLE = False

_agents: dict[str, "LlmAgent"] = {}
_runners: dict[str, "InMemoryRunner"] = {}


def _get_agent(name: str, instruction: str, output_schema: Optional[Type[BaseModel]] = None) -> "LlmAgent":
    safe = name.replace(" ", "_").replace("-", "_")
    if safe not in _agents:
        kwargs = dict(name=safe, model=MODEL, instruction=instruction, description=f"Raptorz {name} agent")
        if output_schema is not None:
            kwargs["output_schema"] = output_schema  # structured JSON output
        _agents[safe] = LlmAgent(**kwargs)
        _runners[safe] = InMemoryRunner(agent=_agents[safe], app_name=APP_NAME)
    return _agents[safe]


async def _arun(name: str, instruction: str, payload: dict, output_schema) -> str:
    agent = _get_agent(name, instruction, output_schema)
    runner = _runners[agent.name]
    session = await runner.session_service.create_session(
        app_name=APP_NAME, user_id="raptorz", session_id=uuid.uuid4().hex
    )
    message = types.Content(role="user", parts=[types.Part(text=json.dumps(payload, default=str))])
    final = ""
    async for event in runner.run_async(user_id="raptorz", session_id=session.id, new_message=message):
        if event.is_final_response() and event.content and event.content.parts:
            final = event.content.parts[0].text or final
    return (final or "").strip()


def run_agent(name: str, instruction: str, payload: dict, output_schema: Optional[Type[BaseModel]] = None) -> str:
    """Run an ADK agent synchronously — safe from both sync and async callers."""
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk is not installed")
    coro = _arun(name, instruction, payload, output_schema)
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)  # no loop in this thread (sync SSE generator)
    # a loop is already running (e.g. the async Pub/Sub handler) — use a worker thread
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
        return ex.submit(lambda: asyncio.run(coro)).result()
