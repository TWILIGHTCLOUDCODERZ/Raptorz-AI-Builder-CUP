# Aegis simulator (Phase 2)

Publishes synthetic transactions to the `transactions` Pub/Sub topic on an interval,
driving the event-driven pipeline that wakes the agents.

- Uses the **`aegis-sim`** service account (publish-only, least privilege).
- Emits a realistic mix (~90% benign) plus scripted "hero" scenarios for the demo
  (Dubai false-positive-avoided, account-takeover-caught).
- **Synthetic data only — no real PII.**

Scaffolded in Phase 2.
