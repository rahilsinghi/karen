from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.karen_service import get_active_escalations, mark_payment_detected

router = APIRouter(prefix="/api", tags=["webhooks"])


class VenmoWebhookPayload(BaseModel):
    from_name: str
    amount: float
    note: str = ""


@router.post("/venmo-webhook")
async def venmo_webhook(payload: VenmoWebhookPayload) -> dict:
    """Receive Venmo payment notification.

    Checks active escalations to see if the payer matches any target.
    Karen does NOT auto-de-escalate — she waits for the operator.
    """
    matched = False
    for esc in get_active_escalations():
        target_venmo = esc.target.contacts.venmo
        if target_venmo and payload.from_name.lower() in target_venmo.lower():
            mark_payment_detected(esc.id, payload.amount, payload.from_name)
            matched = True

    if not matched:
        return {"status": "no_match", "detail": "No active escalation matched this payment"}
    return {"status": "payment_detected"}


class ManualPaymentConfirm(BaseModel):
    escalation_id: str
    amount: float
    from_name: str


@router.post("/payment-confirm")
async def payment_confirm(body: ManualPaymentConfirm) -> dict:
    """Manual payment confirmation from the dashboard."""
    if not mark_payment_detected(body.escalation_id, body.amount, body.from_name):
        raise HTTPException(status_code=404, detail="Escalation not found")
    return {"status": "payment_detected"}
