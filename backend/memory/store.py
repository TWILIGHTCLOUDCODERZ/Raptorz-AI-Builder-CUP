"""Memory + case store.

Uses Firestore when available (on Cloud Run via the raptorz-runtime service
account), and transparently falls back to an in-memory store locally so the
service always runs. Seeded with the "Maya Patel / Dubai" memory so the hero
demo scenario works out of the box.
"""
from __future__ import annotations

from models import AgentStep, Case, Transaction

_SEED_CUSTOMERS = {
    "Maya Patel": {
        "tier": "premium",
        "home_country": "AE",
        "confirmed_legit": [
            "Confirmed Dubai travel on Mar 3 — recurring each March",
            "Recurring $840 electronics purchase confirmed legit",
        ],
    },
    "Eleanor Whitfield": {
        "tier": "vip",
        "home_country": "GB",
        "confirmed_legit": [
            "Confirmed annual travel to Monaco each May",
            "Recurring luxury watch & boutique purchases confirmed legit",
        ],
    },
    "Deepan": {
        "tier": "vip",
        "home_country": "MY",
        "confirmed_legit": [
            "Resident in Kuala Lumpur, Malaysia — usual card activity is in Kuala Lumpur",
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

    def list_cases(self, limit: int = 500) -> list[dict]:
        """Recent cases, newest first. Firestore when available, else in-memory."""
        if self._db:
            try:
                from google.cloud import firestore

                q = self._db.collection("cases").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
                return [d.to_dict() for d in q.stream()]
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] cases list error: {exc}")
        cases = list(self._mem["cases"].values())
        cases.sort(key=lambda c: c.get("created_at", ""), reverse=True)
        return cases[:limit]

    def get_case(self, case_id: str):
        """A single case by id, or None."""
        if self._db:
            try:
                doc = self._db.collection("cases").document(case_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] case read error: {exc}")
        return self._mem["cases"].get(case_id)

    def get_customer_home(self, customer: str):
        """The customer's home country (ISO-2), or None if unknown. Drives the geo gate."""
        if self._db:
            try:
                doc = self._db.collection("customers").document(customer).get()
                if doc.exists:
                    return doc.to_dict().get("home_country")
            except Exception as exc:  # noqa: BLE001
                print(f"[memory] home read error: {exc}")
        return self._mem["customers"].get(customer, {}).get("home_country")

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
