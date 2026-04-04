from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import Any

from models.schemas import (
    Escalation,
    EscalationSpeed,
    EscalationStatus,
    GrievanceType,
    Member,
    Personality,
    TriggerRequest,
)
from services.audio_service import generate_commentary_audio, get_random_quip
from services.channel_service import get_available_channels, send_channel
from services.personality_service import generate_message

# ── In-memory state ─────────────────────────────────────────────────────────

_escalations: dict[str, Escalation] = {}
_event_queues: dict[str, list[asyncio.Queue]] = {}  # escalation_id -> list of subscriber queues
_tasks: dict[str, asyncio.Task] = {}  # escalation_id -> background task
_seq_counters: dict[str, int] = {}  # escalation_id -> next seq number

# Which channels fire at each level
LEVEL_CHANNELS: dict[int, list[str]] = {
    1: ["email"],
    2: ["email", "sms"],
    3: ["email", "whatsapp", "voice_call"],
    4: ["email", "sms"],  # email CC's a mutual, SMS to CC'd person
    5: ["linkedin"],
    6: ["calendar"],
    7: ["discord"],
    8: ["github"],
    9: ["twitter"],
    10: ["fedex"],
}

SPEED_SECONDS: dict[EscalationSpeed, float] = {
    EscalationSpeed.DEMO: 5,
    EscalationSpeed.DEMO_10S: 10,
    EscalationSpeed.QUICK: 600,
    EscalationSpeed.STANDARD: 3600,
    EscalationSpeed.PATIENT: 86400,
}


# ── Event broadcasting ───────────────────────────────────────────────────────


def _emit(escalation_id: str, event: dict[str, Any]) -> None:
    """Push an SSE event to all subscribers and buffer in event history."""
    seq = _seq_counters.get(escalation_id, 0)
    _seq_counters[escalation_id] = seq + 1
    event["seq"] = seq
    esc = _escalations.get(escalation_id)
    if esc is not None:
        esc.event_history.append(event)
    for q in _event_queues.get(escalation_id, []):
        q.put_nowait(event)


def subscribe(escalation_id: str) -> asyncio.Queue:
    """Create a new subscriber queue for SSE streaming."""
    q: asyncio.Queue = asyncio.Queue()
    _event_queues.setdefault(escalation_id, []).append(q)
    return q


def unsubscribe(escalation_id: str, q: asyncio.Queue) -> None:
    queues = _event_queues.get(escalation_id, [])
    if q in queues:
        queues.remove(q)


# ── Public API ───────────────────────────────────────────────────────────────


def get_escalation(escalation_id: str) -> Escalation | None:
    return _escalations.get(escalation_id)


def get_active_escalations() -> list[Escalation]:
    return [e for e in _escalations.values() if e.status == EscalationStatus.ACTIVE]


def get_all_escalations() -> list[Escalation]:
    return list(_escalations.values())


def get_event_history(escalation_id: str) -> list[dict[str, Any]]:
    """Return a snapshot of all events emitted so far for replay on SSE connect."""
    esc = _escalations.get(escalation_id)
    if esc is None:
        return []
    return list(esc.event_history)


async def trigger_escalation(
    request: TriggerRequest,
    initiator: Member,
    target: Member,
) -> Escalation:
    """Create and start a new escalation."""
    escalation_id = uuid.uuid4().hex[:12]

    escalation = Escalation(
        id=escalation_id,
        initiator=initiator,
        target=target,
        grievance_type=request.grievance_type,
        grievance_detail=request.grievance_detail,
        amount=request.amount,
        personality=request.personality,
        speed=request.speed,
        max_level=request.max_level,
    )
    _escalations[escalation_id] = escalation

    # Start the ladder in the background
    task = asyncio.create_task(_run_ladder(escalation_id))
    _tasks[escalation_id] = task

    return escalation


def mark_response_detected(escalation_id: str, from_name: str, preview: str) -> bool:
    esc = _escalations.get(escalation_id)
    if not esc or esc.status != EscalationStatus.ACTIVE:
        return False
    esc.status = EscalationStatus.RESPONSE_DETECTED
    _emit(escalation_id, {
        "type": "response_detected",
        "from": from_name,
        "preview": preview,
    })
    return True


def mark_payment_detected(escalation_id: str, amount: float, from_name: str) -> bool:
    esc = _escalations.get(escalation_id)
    if not esc:
        return False
    esc.status = EscalationStatus.PAYMENT_DETECTED
    _emit(escalation_id, {
        "type": "payment_detected",
        "amount": amount,
        "from": from_name,
    })
    return True


def continue_escalation(escalation_id: str) -> bool:
    """Operator chose 'Continue anyway' after response detected."""
    esc = _escalations.get(escalation_id)
    if not esc or esc.status != EscalationStatus.RESPONSE_DETECTED:
        return False
    esc.status = EscalationStatus.ACTIVE
    _emit(escalation_id, {
        "type": "commentary",
        "text": "Operator chose to continue. Noted.",
        "timestamp": datetime.utcnow().isoformat(),
    })
    return True


async def resolve_escalation(escalation_id: str) -> bool:
    """Operator clicked [INITIATE DE-ESCALATION]."""
    esc = _escalations.get(escalation_id)
    if not esc:
        return False

    esc.status = EscalationStatus.DEESCALATING

    # Cancel the ladder task if still running
    task = _tasks.get(escalation_id)
    if task and not task.done():
        task.cancel()

    # Run de-escalation
    from services.deescalation_service import run_deescalation
    await run_deescalation(escalation_id, esc, _emit)

    esc.status = EscalationStatus.RESOLVED
    esc.resolved_at = datetime.utcnow()

    _emit(escalation_id, {
        "type": "complete",
        "karen_closing": (
            "All resolved. Relationships restored. "
            "Is there anyone else you'd like me to follow up with? 🙂"
        ),
    })
    return True


# ── The Ladder ───────────────────────────────────────────────────────────────


async def _run_ladder(escalation_id: str) -> None:
    esc = _escalations.get(escalation_id)
    if not esc:
        return

    interval = SPEED_SECONDS[esc.speed]
    available = get_available_channels(esc.target)

    # Pick a CC contact for Level 4 (first circle member who isn't initiator or target)
    from routers.members import get_all_members
    cc_member: Member | None = None
    for m in get_all_members():
        if m.id != esc.initiator.id and m.id != esc.target.id:
            cc_member = m
            break

    _emit(escalation_id, {
        "type": "escalation_started",
        "escalation_id": escalation_id,
        "initiator": esc.initiator.name,
        "target": esc.target.name,
        "grievance_type": esc.grievance_type.value,
        "grievance_detail": esc.grievance_detail,
        "personality": esc.personality.value,
        "speed": esc.speed.value,
        "max_level": esc.max_level,
        "available_channels": available,
        "timestamp": datetime.utcnow().isoformat(),
    })

    _emit(escalation_id, {
        "type": "commentary",
        "text": (
            f"Escalation initiated. Target: {esc.target.name}. "
            f"Personality: {esc.personality.value}. "
            f"Available channels: {', '.join(available)}. "
            f"Let's begin."
        ),
        "timestamp": datetime.utcnow().isoformat(),
    })

    for level in range(1, esc.max_level + 1):
        # Check if we should stop
        if esc.status in (EscalationStatus.DEESCALATING, EscalationStatus.RESOLVED):
            break

        # Wait for resume if response detected
        while esc.status == EscalationStatus.RESPONSE_DETECTED:
            await asyncio.sleep(0.5)
            if esc.status in (EscalationStatus.DEESCALATING, EscalationStatus.RESOLVED):
                return

        # Wait for de-escalation trigger if payment detected
        if esc.status == EscalationStatus.PAYMENT_DETECTED:
            _emit(escalation_id, {
                "type": "commentary",
                "text": "Payment received. Awaiting operator confirmation to stand down.",
                "timestamp": datetime.utcnow().isoformat(),
            })
            while esc.status == EscalationStatus.PAYMENT_DETECTED:
                await asyncio.sleep(0.5)
            if esc.status in (EscalationStatus.DEESCALATING, EscalationStatus.RESOLVED):
                return

        esc.current_level = level
        channels_for_level = LEVEL_CHANNELS.get(level, ["email"])
        days_outstanding = (datetime.utcnow() - esc.started_at).days or 14  # demo default

        for channel in channels_for_level:
            if channel not in available and channel not in ("discord", "github"):
                _emit(escalation_id, {
                    "type": "level_skipped",
                    "level": level,
                    "reason": f"{channel} not available for {esc.target.name}",
                })
                continue

            # Generate the message
            cc_name = cc_member.name if (level == 4 and cc_member) else None
            try:
                generated = await generate_message(
                    personality=esc.personality,
                    level=level,
                    channel=channel,
                    initiator_name=esc.initiator.name,
                    target_name=esc.target.name,
                    grievance_type=esc.grievance_type.value,
                    grievance_detail=esc.grievance_detail,
                    days_outstanding=days_outstanding,
                    cc_name=cc_name,
                )
            except Exception as e:
                _emit(escalation_id, {
                    "type": "error",
                    "message": f"Message generation failed for L{level} {channel}: {e}",
                })
                continue

            preview = generated.fields.get("subject") or generated.fields.get("body", "")
            _emit(escalation_id, {
                "type": "level_start",
                "level": level,
                "channel": channel,
                "message_preview": preview[:100],
            })

            # Inject escalation context for channels that need it (e.g. FedEx PDF)
            if channel == "fedex":
                generated.fields["_escalation_id"] = escalation_id
                generated.fields["_initiator_name"] = esc.initiator.name
                generated.fields["_grievance_detail"] = esc.grievance_detail
                generated.fields["_level"] = str(level)
                generated.fields["_max_level"] = str(esc.max_level)
                generated.fields["_start_date"] = esc.started_at.strftime("%B %d, %Y")
                generated.fields["_messages_sent"] = str(esc.messages_sent)
                generated.fields["_channels_used"] = str(len(esc.channels_used))
                generated.fields["_days_elapsed"] = str(days_outstanding)

            # Send it
            cc_email = cc_member.contacts.email if (level == 4 and cc_member) else None
            result = await send_channel(channel, esc.target, generated.fields, cc_email)

            esc.messages_sent += 1
            if channel not in esc.channels_used:
                esc.channels_used.append(channel)

            # Store channel metadata for de-escalation
            if result.success and result.metadata:
                esc.channel_metadata.update(result.metadata)
            if level == 4 and cc_email:
                esc.channel_metadata["cc_contact_email"] = cc_email
                if cc_member:
                    esc.channel_metadata["cc_contact_name"] = cc_member.name

            _emit(escalation_id, {
                "type": "level_complete",
                "level": level,
                "channel": channel,
                "karen_note": generated.karen_note,
            })

            # Karen's sidebar commentary
            _emit(escalation_id, {
                "type": "commentary",
                "text": generated.karen_commentary,
                "timestamp": datetime.utcnow().isoformat(),
            })

            # Emit quip audio (pre-recorded, instant)
            quip_url = get_random_quip(esc.personality)
            if quip_url:
                _emit(escalation_id, {
                    "type": "audio",
                    "audio_type": "quip",
                    "audio_url": quip_url,
                    "text": "",
                })

            if not result.success:
                _emit(escalation_id, {
                    "type": "error",
                    "message": f"Channel {channel} failed: {result.detail}",
                })

        # Wait for the interval before next level
        if level < esc.max_level:
            # Fire off commentary TTS generation in background
            commentary_task: asyncio.Task | None = None
            last_commentary = generated.karen_commentary if generated else None
            if last_commentary:
                async def _gen_commentary(text: str, lvl: int) -> None:
                    try:
                        url = await generate_commentary_audio(
                            text, esc.personality, escalation_id, lvl,
                        )
                        _emit(escalation_id, {
                            "type": "audio",
                            "audio_type": "commentary",
                            "audio_url": url,
                            "text": text,
                        })
                    except Exception as e:
                        _emit(escalation_id, {
                            "type": "error",
                            "message": f"Commentary audio failed for L{lvl}: {e}",
                        })

                commentary_task = asyncio.create_task(_gen_commentary(last_commentary, level))

            # Sleep in small chunks so we can respond to status changes
            elapsed_time = 0.0
            while elapsed_time < interval:
                if esc.status in (
                    EscalationStatus.DEESCALATING,
                    EscalationStatus.RESOLVED,
                ):
                    if commentary_task and not commentary_task.done():
                        commentary_task.cancel()
                    return
                await asyncio.sleep(min(0.5, interval - elapsed_time))
                elapsed_time += 0.5

    # Ladder complete — all levels exhausted
    if esc.status == EscalationStatus.ACTIVE:
        _emit(escalation_id, {
            "type": "commentary",
            "text": (
                "All levels exhausted. Karen has done everything she can. "
                "The ball is in their court. It has always been in their court."
            ),
            "timestamp": datetime.utcnow().isoformat(),
        })
