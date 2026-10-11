"""Lightweight IP geolocation for the VPN / VM demo.

When a payment arrives without an explicit country (``country`` is empty or the
sentinel ``"AUTO"``), Raptorz geolocates the caller's public IP to a country. On
Cloud Run the caller IP is the first entry in ``X-Forwarded-For``; when the merchant
site runs inside a Compute Engine VM behind a VPN, that IP is the VPN's egress (e.g.
Sydney, Australia), so turning the VPN on flips the detected country to ``AU`` and the
geo gate blocks the payment.

Uses the free ip-api.com endpoint over stdlib ``urllib`` (no extra dependency), a
short timeout, and a safe fallback (returns ``None`` on any error / private IP).
"""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Optional

GEO_URL = os.getenv("AEGIS_GEO_URL", "http://ip-api.com/json/{ip}?fields=status,countryCode,query")
_TIMEOUT = float(os.getenv("AEGIS_GEO_TIMEOUT", "2.5"))
_PRIVATE = ("10.", "192.168.", "172.16.", "127.", "::1", "fc", "fd")


def client_ip(headers, fallback: Optional[str]) -> Optional[str]:
    """First public IP from X-Forwarded-For, else the socket peer."""
    xff = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return fallback


def country_from_ip(ip: Optional[str]) -> Optional[str]:
    """ISO-2 country for a public IP, or None (private IP / lookup failure)."""
    if not ip or ip.startswith(_PRIVATE):
        return None
    try:
        with urllib.request.urlopen(GEO_URL.format(ip=ip), timeout=_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("status") == "success":
            return data.get("countryCode")
    except Exception as exc:  # noqa: BLE001 — geo is best-effort
        print(f"[geo] lookup failed for {ip}: {exc}")
    return None
