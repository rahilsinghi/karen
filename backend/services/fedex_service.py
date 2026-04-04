from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger("karen.fedex")

FEDEX_SANDBOX_URL = "https://apis-sandbox.fedex.com"
FALLBACK_RATE = "28.40"
FALLBACK_SERVICE = "FedEx Priority Overnight"


async def get_auth_token() -> str | None:
    """Get OAuth token from FedEx sandbox."""
    api_key = os.environ.get("FEDEX_API_KEY", "")
    api_secret = os.environ.get("FEDEX_API_SECRET", "")

    if not api_key or not api_secret:
        return None

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{FEDEX_SANDBOX_URL}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": api_key,
                "client_secret": api_secret,
            },
        )
        if resp.status_code != 200:
            return None
        return resp.json().get("access_token")


async def get_rate_quote(target_zip: str) -> tuple[str, str, str]:
    """Get overnight delivery rate from Karen's address to target.

    Returns (rate, service_name, destination).
    Always returns a value — falls back to $28.40 if API fails.
    """
    sender_zip = os.environ.get("FEDEX_SENDER_ZIP", "10001")
    account_number = os.environ.get("FEDEX_ACCOUNT_NUMBER", "")

    token = await get_auth_token()
    if not token or not account_number:
        logger.info("FedEx credentials missing — using fallback rate $%s", FALLBACK_RATE)
        return FALLBACK_RATE, FALLBACK_SERVICE, f"ZIP {target_zip or 'unknown'}"

    payload = {
        "accountNumber": {"value": account_number},
        "requestedShipment": {
            "shipper": {"address": {"postalCode": sender_zip, "countryCode": "US"}},
            "recipient": {"address": {"postalCode": target_zip, "countryCode": "US"}},
            "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
            "serviceType": "PRIORITY_OVERNIGHT",
            "packagingType": "FEDEX_ENVELOPE",
            "requestedPackageLineItems": [
                {"weight": {"units": "LB", "value": 0.5}},
            ],
        },
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{FEDEX_SANDBOX_URL}/rate/v1/rates/quotes",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=10.0,
            )

            if resp.status_code != 200:
                logger.warning("FedEx rate API returned %s — using fallback", resp.status_code)
                return FALLBACK_RATE, FALLBACK_SERVICE, f"ZIP {target_zip}"

            data = resp.json()
            rate_details = (
                data.get("output", {})
                .get("rateReplyDetails", [{}])[0]
                .get("ratedShipmentDetails", [{}])[0]
                .get("totalNetCharge")
            )

            if rate_details is not None:
                rate = f"{float(rate_details):.2f}"
                return rate, "FedEx Priority Overnight", f"ZIP {target_zip}"

    except Exception:
        logger.exception("FedEx rate API call failed — using fallback")

    return FALLBACK_RATE, FALLBACK_SERVICE, f"ZIP {target_zip}"
