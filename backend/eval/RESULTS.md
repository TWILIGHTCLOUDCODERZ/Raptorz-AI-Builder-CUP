# Aegis — Evaluation Results

Synthetic benchmark of **276 labeled transactions**
(213 legitimate, 63 fraudulent),
run through Aegis's real decision policy vs. a traditional rules-only engine.

| Metric | Rules-only | **Aegis** |
|---|---|---|
| Fraud caught (recall) | 12.7% | **95.2%** |
| Hard false-decline rate | 39.0% | **3.8%** |
| Block precision | 8.8% | **88.2%** |
| Light step-up instead of decline | — | 14.1% of legit |

## Headline

- **Caught 95.2% of fraud** vs. 12.7% for rules-only — AI catches the stolen-card, account-takeover and impossible-travel cases blunt rules miss.
- **Cut hard false declines by 90.4%** (39.0% → 3.8%) — memory approves confirmed-legit activity and a lightweight OTP step-up replaces most declines.
- **Every decision is automated** (approve / step-up / block) in seconds — vs. a manual analyst queue measured in minutes.

_Illustrative on synthetic data; production thresholds are calibrated on the bank's historical fraud / false-positive data._
