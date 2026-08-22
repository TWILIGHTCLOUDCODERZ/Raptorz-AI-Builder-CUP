# Aegis — Completion Roadmap, Services & Security

Track: **The Taskmaster** (event-driven workflow with autonomous routing).
Hackathon hard requirements: **Gemini 3.5+**, **a Google agent framework (ADK)**, **≥1 Google Cloud service**.

---

## Where the project stands today
- Frontend (Bolt): Command Center + Investigations render from a **client-side mock simulation**; Network Graph, Customer 360, Compliance/SAR, Customer App are placeholders.
- Everything agentic (memory recall, the 5 agents, the decision, KPIs) is **hardcoded**.
- `@supabase/supabase-js` is installed but unused — **remove it**; use Firestore to satisfy the Google Cloud requirement.
- No secrets in the frontend yet — **keep it that way** (all Gemini calls go through the backend).

---

## Target architecture (event-driven, two-speed)

```
 Transaction simulator ──▶ Pub/Sub (transactions) ──▶ Cloud Run: Router
                                                          │
                                    fast path (cheap)  ◀──┤  Gemini Flash/rules score
                                                          │  ~90% auto-approve → Firestore
                                                          ▼  suspicious only
                                              Cloud Run: Agent service (ADK)
                                        Orchestrator → Investigator / Network /
                                          Intel / Compliance / Critic  (Gemini 3.5)
                                                          │  tools: history, geo,
                                                          │  sanctions, adverse-media
                                                          ▼
                                   Firestore (customers/memory, cases, transactions)
                                                          │  onSnapshot (live)
                                                          ▼
                                        Frontend (Bolt) — reads real-time
```

**Two-speed = the credibility move.** A cheap pre-filter (rules or Gemini Flash/Gemma) clears the boring 90%; only genuinely suspicious transactions wake the expensive multi-agent investigation. Protects the $150 credit and shows engineering discipline.

---

## Build roadmap — phase by phase

### Phase 0 — GCP foundations
- Create a GCP project; activate the $300 free trial + $150 hackathon credits.
- Enable APIs: **Vertex AI**, **Cloud Run**, **Pub/Sub**, **Firestore**, **Secret Manager**, **Cloud Logging/Trace**, **Cloud Storage** (receipt images), **Model Armor**.
- Install `gcloud`, authenticate, set default project/region.
- Repo layout: `/frontend` (Bolt app), `/backend` (ADK agents), `/infra` (deploy scripts), `/simulator`.

### Phase 1 — The agent brain (ADK + Gemini) ← the core
- Scaffold a Python backend with **Google ADK**.
- Build the multi-agent system that mirrors the UI: **Orchestrator** → **Investigator**, **Network Analyst**, **Intel**, **Compliance**, **Critic**.
- Wire **Gemini 3.5** via **Vertex AI** (preferred — IAM, no raw key) for reasoning.
- Define agent **tools** (mocked datasets are fine for the demo): transaction history, device/geo, sanctions/PEP + adverse-media, merchant reputation.
- Output: given a transaction → returns a decision + reason codes + confidence + the full step trace.

### Phase 2 — Event-driven pipeline (Taskmaster requirement)
- Pub/Sub topic `transactions`.
- **Simulator** (Cloud Run job or script) publishes synthetic transactions on an interval.
- **Router** (Cloud Run, push subscription) runs the fast pre-filter, writes approvals straight to Firestore, forwards suspicious ones to the agent service.
- This *is* the "event-driven workflow with autonomous routing."

### Phase 3 — Memory & state (Firestore) ← the differentiator
- Collections: `customers` (behavioral fingerprint + **confirmed-legit memory**), `cases` (investigation + streamed trace), `transactions`.
- Make the **memory recall real**: the Investigator queries `customers/{id}/memory` for confirmed patterns (the "Dubai travel" fact) and skips the challenge.
- The **"Add to memory"** button writes back → closes the learning loop.

### Phase 4 — Wire the frontend to real data (real-time)
- Add the `firebase` SDK; replace the mock `setInterval` in `App.tsx` with Firestore **`onSnapshot`** listeners for the feed, alert queue, and KPIs.
- Stream the live agent trace by having the agent **write each step incrementally** to `cases/{id}/steps`; the Investigation panel listens and renders them as they land (no WebSocket needed).
- Remove `@supabase/supabase-js`.

### Phase 5 — Autonomous customer resolution (multimodal)
- Make the **Customer App** screen functional: the agent posts a verification request; customer taps Yes/No; the case resolves automatically.
- Add **receipt-photo upload** → Cloud Storage → **Gemini vision** reads it → confirms legitimacy. (Targets the Best Multimodal UX prize.)

### Phase 6 — Fill the remaining screens with real data
- **Network Graph** from Firestore transaction relationships (mule-ring highlight).
- **Customer 360** renders the real fingerprint + memory.
- **Compliance/SAR**: Gemini generates the SAR narrative from a case, with a human "Review & Sign".

### Phase 7 — Observability, cost, eval
- Cloud Trace/Logging; track **cost + latency per decision**.
- Build a small labeled synthetic dataset and report the **headline metric** (false-decline reduction, precision/recall, mean-time-to-resolution). This feeds the 40% utility score.

### Phase 8 — Deploy & submit
- Backend → **Cloud Run**; frontend → **Firebase Hosting** (or Cloud Run).
- Deliverables: architecture diagram, 4-min demo video (show live Cloud Run deployment), README spin-up, public repo.

---

## Services required

| Purpose | Service | Required? |
|---|---|---|
| Reasoning LLM | **Gemini 3.5** via **Vertex AI** | ✅ mandatory |
| Agent framework | **Google ADK** | ✅ mandatory |
| Agent + API hosting | **Cloud Run** | ✅ (Google Cloud req.) |
| Event stream | **Pub/Sub** | Core to Taskmaster |
| Memory + state + real-time | **Firestore** | Core |
| Secrets | **Secret Manager** | Security |
| Receipt images | **Cloud Storage** | Phase 5 |
| Vision (receipts) | **Gemini multimodal** | Phase 5 |
| Prompt-injection / PII guardrails | **Model Armor** | Security |
| Logs / tracing | **Cloud Logging + Trace** | Phase 7 |
| Cheap pre-filter (optional) | **Gemini Flash / Gemma** | Cost control |
| Frontend hosting | **Firebase Hosting** | Phase 8 |
| Bonus points | Gemma / Veo / Lyria | Optional |

---

## Securing Aegis

### A. Infrastructure & app security (must-do hygiene)
- **Never put the Gemini/Vertex key in the frontend.** All model calls go through the backend. No `VITE_*` secret keys, ever.
- **Secret Manager** for all keys/credentials; nothing sensitive in git. Confirm `.env` and any service-account JSON are `.gitignore`d.
- **IAM least privilege**: one service account per service, minimum roles. Use Workload Identity, not downloaded keys, where possible.
- **Firestore Security Rules**: do **not** ship open/test-mode rules. Frontend reads only what an authenticated analyst may see; the backend writes via the **Admin SDK** (bypasses rules server-side).
- **Cloud Run auth**: internal services `--no-allow-unauthenticated`; Pub/Sub push uses an OIDC service-account token; public API behind auth.
- **CORS** locked to your frontend origin; input validation + **rate limiting** (Cloud Armor / API Gateway) on public endpoints.
- **PII handling**: use **synthetic data** for the demo (no real PII). In the pipeline, **tokenize/redact PII before it reaches the LLM** (Cloud DLP); store minimal PII.
- **Audit logging**: Cloud Audit Logs on, plus your own immutable case trace.

### B. Product security features (part of Aegis — also scores architecture/enterprise points)
- **Prompt-injection defense**: wrap every Gemini call with **Model Armor** (screens malicious input in merchant names/memos, filters PII leaks in responses).
- **PII-leak prevention** on agent outputs before they hit the UI or customer.
- **Zero-trust + RBAC**: analyst roles, scoped access, every action attributable.
- **Explainability / reasoning-chain tracing**: the immutable audit trail already surfaced in the Investigation panel — make it real and exportable.
- **Adverse-action reason codes**: human-readable "why we blocked/challenged" (regulatory-grade).
- **Human-in-the-loop authority**: override + kill switch; progressive autonomy (shadow → advisory → autonomous).

---

## Hackathon requirement checklist
- [ ] Gemini 3.5+ (Vertex AI)
- [ ] Google agent framework (ADK)
- [ ] ≥1 Google Cloud service (Cloud Run + Pub/Sub + Firestore)
- [ ] Event-driven autonomous routing (Taskmaster)
- [ ] Public repo + README spin-up instructions
- [ ] System architecture diagram
- [ ] 4-min demo video with proof of Google Cloud deployment
- [ ] (Bonus) Multimodal UX, blog/social with #AllThingsAgenticHackathon
