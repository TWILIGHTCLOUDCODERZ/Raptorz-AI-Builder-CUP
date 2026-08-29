"""Memory + case store.

Uses Firestore when available (on Cloud Run via the aegis-runtime service
account), and transparently falls back to an in-memory store locally so the
service always runs. Seeded with the "Maya Patel / Dubai" memory so the hero
demo scenario works out of the box.
"""
from __future__ import annotations

from models import AgentStep, Case, Transaction

_SEED_CUSTOMERS = {
    "Maya Patel": {
        "tier": "premium",
        "confirmed_legit": [
            "Confirmed Dubai travel on Mar 3 — recurring each March",
            "Recurring $840 electronics purchase confirmed legit",
        ],
    },
    "Eleanor Whitfield": {
        "tier": "vip",
        "confirmed_legit": [
            "Confirmed annual travel to Monaco each May",
            "Recurring luxury watch & boutique purchases confirmed legit",
        ],
    },
    "Tyson": {
        "tier": "premium",
        "confirmed_legit": [
            "Usual card activity is in Dubai, UAE",
        ],
    },
}


class MemoryStore:
    def __init__(self) -> None:
        self._db = None
        self._mem: dict[str, dict] = {
            "customers": {k: dict(v) for k, v in _SEED_CUSTOMERS.items()},
            "cases": {},
            "transactions": {},
        }
        try:
            from google.cloud import firestore

            self._db = firestore.Client()
            # ensure the seed exists in Firestore too (idempotent)
            for customer, profile in _SEED_CUSTOMERS.items():
                ref = self._db.collection("customers").document(customer)
                if not ref.get().exists:
                    ref.set(profile)
            print("[memory] Firestore connected.")
        except Exception as exc:  # noqa: BLE001
            print(f"[memory] Firestore unavailable, using in-memory store: {exc}")

    # ---- reads ----
    def get_customer_memory(self, customer: str) -> list[str]:
        if self._db:
            try:
                doc = self._db.collection("customers").document(customer).get()
                if doc.exists:
                    return doc.to_dict().get("confirmed_legit", [])
                return []
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] read error: {exc}")
        return self._mem["customers"].get(customer, {}).get("confirmed_legit", [])

    def get_customer_tier(self, customer: str) -> str:
        """standard | premium | vip — drives friction/handling in the decision."""
        if self._db:
            try:
                doc = self._db.collection("customers").document(customer).get()
                if doc.exists:
                    return doc.to_dict().get("tier", "standard")
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] tier read error: {exc}")
        return self._mem["customers"].get(customer, {}).get("tier", "standard")

    # ---- writes ----
    def add_memory(self, customer: str, fact: str) -> None:
        if self._db:
            try:
                from google.cloud import firestore

                self._db.collection("customers").document(customer).set(
                    {"confirmed_legit": firestore.ArrayUnion([fact])}, merge=True
                )
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] write error: {exc}")
        self._mem["customers"].setdefault(customer, {}).setdefault(
            "confirmed_legit", []
        ).append(fact)

    def save_transaction(self, txn: Transaction) -> None:
        if self._db:
            try:
                self._db.collection("transactions").document(txn.id).set(txn.model_dump())
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] txn write error: {exc}")
        self._mem["transactions"][txn.id] = txn.model_dump()

    def save_case(self, case: Case) -> None:
        if self._db:
            try:
                self._db.collection("cases").document(case.id).set(case.model_dump())
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] case write error: {exc}")
        self._mem["cases"][case.id] = case.model_dump()

    def append_step(self, case_id: str, step: AgentStep) -> None:
        """Append a live reasoning step (frontend listens to this in Phase 4)."""
        if self._db:
            try:
                from google.cloud import firestore

                self._db.collection("cases").document(case_id).set(
                    {"steps": firestore.ArrayUnion([step.model_dump()])}, merge=True
                )
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] step write error: {exc}")
        self._mem["cases"].setdefault(case_id, {}).setdefault("steps", []).append(
            step.model_dump()
        )
