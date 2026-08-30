# Aegis — Demo Video Script

**Runtime:** ~2 min 45 sec · **Format:** voiceover + screen recording of the live console
**Tone:** confident, calm, "this is production-grade," not salesy.

> How to use: the **VOICEOVER** column is what you read aloud. **ON SCREEN** is what to record or show (slide number from the deck, or a live console action). Timings are cumulative targets — trim ruthlessly if you run long.

---

### 1 · Hook — the stakes  ·  0:00–0:18  ·  Slide 1 (Title)
**ON SCREEN:** Deck slide 1 (Aegis title), or a fast montage of card taps / a checkout spinner.

**VOICEOVER:**
> "Every time a card is tapped, a bank has about a hundred milliseconds to answer one question — *is this really the customer?* Get it wrong one way, and fraud walks out the door. Get it wrong the other way, and you decline a loyal customer at checkout. This is Aegis — and it's built to get it right, both ways."

---

### 2 · The problem  ·  0:18–0:42  ·  Slides 2–3
**ON SCREEN:** Slide 2 (Overview), then Slide 3 (Problem — the four cards).

**VOICEOVER:**
> "Today, most banks still run on static rules — frozen if-then logic. Tighten them, and good customers get blocked. Loosen them, and new fraud slips straight through. And whatever the rules miss, a human analyst reviews hours later — long after the money is gone. Banks are forced into an impossible trade-off between catching fraud and keeping customers."

---

### 3 · The solution  ·  0:42–1:05  ·  Slide 4
**ON SCREEN:** Slide 4 (Solution — four pillars). Optional: cut to the Aegis console landing page.

**VOICEOVER:**
> "Aegis replaces that rulebook with something that actually investigates. Low-risk payments still clear in milliseconds. But anything suspicious gets handed to a team of specialist AI agents — running on Gemini 3.5 — that gather evidence, weigh it, and return a decision *with its reasons*. And instead of just declining a borderline payment, Aegis verifies the customer."

---

### 4 · How it works — two-speed architecture  ·  1:05–1:30  ·  Slide 5 / Architecture explorer
**ON SCREEN:** Slide 5 (two-speed diagram) — or the **interactive architecture diagram**: hover Pub/Sub → Router → Vertex AI/Gemini as you narrate.

**VOICEOVER:**
> "Under the hood it's a two-speed engine. On the fast path, a transaction streams in over Pub/Sub, and rules plus a Gemini Flash pre-filter make an instant call. If it's clean — approved, in milliseconds. If it's risky, it escalates to the deep path: an asynchronous, multi-agent investigation that returns Approve, Step-up, Hold, or Block — every verdict carrying reason codes, a confidence score, and an evidence summary."

---

### 5 · Tyson user flow — the live demo  ·  1:30–2:05  ·  LIVE CONSOLE
**ON SCREEN:** Live console. Click the **Tyson** transaction. Show auto-pay OFF / no OTP → **card blocked**. Then flip: OTP verified / auto-pay ON → **approved**.

**VOICEOVER:**
> "Let's watch it decide. Here's Tyson — a large auto-pay charge fires. Auto-pay is turned off, and no one has verified with a one-time passcode. Aegis refuses to let it through — it blocks the card and protects the customer, with a reason the analyst can see instantly.
>
> Now the *same* payment — but this time Tyson confirms with a one-time passcode. Aegis verifies his identity and approves it. Same transaction, two outcomes — because Aegis verifies the customer instead of just declining the charge."

---

### 6 · Behind the scenes — the agents  ·  2:05–2:28  ·  Slide 7 / live agent stream
**ON SCREEN:** Slide 7 (agent grid) — or the **live investigation stream** in the console, agents ticking through their steps.

**VOICEOVER:**
> "And this isn't one model call — it's an investigation team. An Orchestrator convenes specialists: Card Status, Step-Up Control, an Investigator, a Network Analyst, Intel, and Compliance — each with one job. A Critic agent challenges the verdict before it ships. And you watch every step stream live, so the decision is never a black box."

---

### 7 · Results  ·  2:28–2:42  ·  Slide 8
**ON SCREEN:** Slide 8 (metrics — 95.2% / 90.4% / 88.2%).

**VOICEOVER:**
> "We benchmarked Aegis against a rules-only engine on the same labeled transactions. Aegis caught ninety-five percent of fraud — versus thirteen for the baseline — while cutting false declines by ninety percent. It catches more, and turns away far fewer good customers."

---

### 8 · Close  ·  2:42–2:55  ·  Slides 9–10
**ON SCREEN:** Slide 9 (Technology) briefly, then Slide 10 (Conclusion).

**VOICEOVER:**
> "It's built entirely on Google Cloud and Gemini 3.5 — serverless, explainable, and real-time. Aegis turns fraud defense from a static gate into an autonomous investigator that thinks, verifies, and explains. That's Aegis. Thank you."

---

## Quick-record checklist
- [ ] Console is on the **live backend** (not offline) so the agent stream is real.
- [ ] Tyson transaction pre-loaded; know the two toggles (auto-pay / OTP) before recording.
- [ ] Record console at 1080p, hide personal browser chrome / bookmarks.
- [ ] Deck open in fullscreen (press **F**) for the slide cutaways.
- [ ] Keep total under **3:00**. If tight, trim section 2 (problem) first.

## One-line version (for the Devpost tagline)
> Aegis is an autonomous, real-time fraud defense platform: a team of Gemini 3.5 agents that investigates every risky payment, verifies the customer instead of declining them, and explains every decision — catching 95% of fraud while cutting false declines by 90%.
