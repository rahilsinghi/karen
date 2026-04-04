from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from starlette.requests import Request

from models.schemas import Escalation, TriggerRequest
from routers.members import get_member_by_id
from services.karen_service import (
    continue_escalation,
    get_active_escalations,
    get_all_escalations,
    get_escalation,
    get_event_history,
    mark_payment_detected,
    mark_response_detected,
    resolve_escalation,
    subscribe,
    trigger_escalation,
    unsubscribe,
)

router = APIRouter(prefix="/api", tags=["escalation"])


# ── Trigger ──────────────────────────────────────────────────────────────────


@router.post("/trigger", response_model=Escalation)
async def trigger(body: TriggerRequest) -> Escalation:
    initiator = get_member_by_id(body.initiator_id)
    target = get_member_by_id(body.target_id)
    esc = await trigger_escalation(body, initiator, target)
    return esc


# ── SSE Stream ───────────────────────────────────────────────────────────────


@router.get("/escalation/{escalation_id}/stream")
async def escalation_stream(
    escalation_id: str,
    request: Request,
    last_seq: int = -1,
) -> EventSourceResponse:
    esc = get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    # Snapshot history BEFORE subscribing to avoid duplicates:
    # Any event emitted before subscribe() is only in history.
    # Any event emitted after subscribe() lands in the queue.
    history = get_event_history(escalation_id)
    q = subscribe(escalation_id)

    async def event_generator():
        try:
            # Replay only events the client hasn't seen yet
            for past_event in history:
                if await request.is_disconnected():
                    return
                event_seq = past_event.get("seq", -1)
                if event_seq <= last_seq:
                    continue
                yield {"event": past_event.get("type", "message"), "data": json.dumps(past_event)}

            # Live stream from here on
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield {"event": event.get("type", "message"), "data": json.dumps(event)}
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "ping", "data": ""}
        finally:
            unsubscribe(escalation_id, q)

    return EventSourceResponse(event_generator())


# ── Escalation state queries ────────────────────────────────────────────────


@router.get("/escalation/{escalation_id}", response_model=Escalation)
async def get_escalation_detail(escalation_id: str) -> Escalation:
    esc = get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return esc


@router.get("/escalations/active", response_model=list[Escalation])
async def list_active() -> list[Escalation]:
    return get_active_escalations()


@router.get("/escalations", response_model=list[Escalation])
async def list_all() -> list[Escalation]:
    return get_all_escalations()


# ── Response / Payment detection ─────────────────────────────────────────────


@router.post("/escalation/{escalation_id}/response-detected")
async def response_detected(escalation_id: str, from_name: str = "", preview: str = "") -> dict:
    if not mark_response_detected(escalation_id, from_name, preview):
        raise HTTPException(status_code=404, detail="Escalation not found or not active")
    return {"status": "response_detected"}


@router.post("/escalation/{escalation_id}/payment-detected")
async def payment_detected(escalation_id: str, amount: float = 0, from_name: str = "") -> dict:
    if not mark_payment_detected(escalation_id, amount, from_name):
        raise HTTPException(status_code=404, detail="Escalation not found")
    return {"status": "payment_detected"}


@router.post("/escalation/{escalation_id}/continue")
async def continue_anyway(escalation_id: str) -> dict:
    if not continue_escalation(escalation_id):
        raise HTTPException(status_code=404, detail="Escalation not in response_detected state")
    return {"status": "continued"}


# ── Letter PDF download ─────────────────────────────────────────────────────


@router.get("/escalation/{escalation_id}/letter.pdf")
async def get_letter_pdf(escalation_id: str) -> FileResponse:
    esc = get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    pdf_path = Path("/tmp/karen_letters") / f"{escalation_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Letter not yet generated")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"KAREN-{escalation_id.upper()}.pdf",
    )


# ── Resolve / De-escalate ────────────────────────────────────────────────────


@router.post("/escalation/{escalation_id}/resolve")
async def resolve(escalation_id: str) -> dict:
    success = await resolve_escalation(escalation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return {"status": "resolved"}
