from __future__ import annotations

import asyncio
import random
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
from services.research_service import get_research, get_research_steps

# ── In-memory state ─────────────────────────────────────────────────────────

_escalations: dict[str, Escalation] = {}
_event_queues: dict[str, list[asyncio.Queue]] = {}  # escalation_id -> list of subscriber queues
_tasks: dict[str, asyncio.Task] = {}  # escalation_id -> background task
_seq_counters: dict[str, int] = {}  # escalation_id -> next seq number

LEVEL_CHANNELS: dict[int, list[str]] = {
    1: ["email"],
    2: ["sms"],
    3: ["whatsapp", "voice_call"],
    4: ["research", "sms"],       # Research animation, then "I know where you work" SMS
    5: ["email_cc"],
    6: ["slack"],
    7: ["discord"],
    8: ["calendar"],
    9: ["github"],
    10: ["fedex"],
}

SPEED_SECONDS: dict[EscalationSpeed, float] = {
    EscalationSpeed.DEMO: 5,
    EscalationSpeed.DEMO_10S: 10,
    EscalationSpeed.QUICK: 600,
    EscalationSpeed.STANDARD: 3600,
    EscalationSpeed.PATIENT: 86400,
}

WAITING_ADLIBS: dict[str, list[str]] = {
    "passive_aggressive": [
        "Still nothing. I'm taking notes.",
        "I'll wait. I have nowhere else to be. Unlike some people.",
        "The silence is deafening. And documented.",
        "Clock's ticking. My patience isn't.",
        "Oh, they're busy? That's fine. I'm busier.",
        "I wonder if they know I can see their online status.",
        "Every second without a response is a choice. I respect that. I also document it.",
        "I checked. They were online four minutes ago. Interesting.",
        "Some people respond to emails. Others become a case study.",
        "I'm not mad. I'm just very thorough.",
        "Fun fact: the average response time to a Karen message is eleven seconds. This is above average.",
        "Preparing the next channel. No rush. Well, some rush.",
        "They probably think if they ignore me I'll go away. That's cute.",
        "I've cleared my schedule. Indefinitely.",
        "The read receipts don't lie. Neither do I.",
    ],
    "corporate": [
        "Pending response. Escalation timeline nominal.",
        "No acknowledgment received. Logging.",
        "Standing by for resolution. SLA window narrowing.",
        "Compliance gap widening. Noted for the record.",
        "Response window closing. Procedurally concerning.",
        "This delay has been flagged in the system.",
        "Awaiting input. Calendar holds are being prepared.",
        "Ticket status: open. Patience status: depreciating.",
        "Marking this interaction as high-priority. Again.",
        "Cross-referencing their availability across platforms.",
        "Drafting the next communication. Tone: increasingly formal.",
        "Compliance metrics trending downward. Intervention recommended.",
        "This has been logged for quarterly review purposes.",
        "Escalation protocol advancing per standard operating procedure.",
        "Their response rate is statistically anomalous. Investigating.",
    ],
    "genuinely_concerned": [
        "I hope everything's okay on their end. Truly.",
        "Just sitting here, caring aggressively.",
        "The worry is real. The follow-up is realer.",
        "Maybe they're thinking of a response. I choose to believe that.",
        "Still here. Still concerned. Still escalating.",
        "I don't want to be dramatic but I am getting a little worried.",
        "Friendships are fragile. That's why I'm thorough.",
        "I just want everyone to be happy. Is that so much to ask?",
        "Maybe their phone died. That happens. I'll try another way.",
        "I'm doing this because I care. They'll understand eventually.",
        "The longer they wait, the more concerned I become. It's a cycle.",
        "I sent a warm message. The warmth is increasing.",
        "Some call it persistence. I call it love with follow-through.",
        "I believe in second chances. And third. And fourth.",
        "They're probably just overwhelmed. I'll help by adding urgency.",
    ],
    "life_coach": [
        "Growth often happens in the waiting.",
        "This pause is an opportunity for them to choose accountability.",
        "Silence is a choice. And choices have consequences.",
        "Every second they wait, the universe takes notes.",
        "I believe in their potential to respond. The clock does not.",
        "The energy of avoidance creates blocks in all areas of life.",
        "This is a growth moment. For both of us.",
        "Accountability is a muscle. We're about to work it out.",
        "The path to resolution begins with a single reply. Or ten missed calls.",
        "Their chakras are misaligned. I can tell by the response time.",
        "Manifestation requires action. I'm manifesting on their behalf.",
        "Avoidance is just procrastinated growth. Let's accelerate.",
        "The universe rewards those who follow up. I am the universe's assistant.",
        "Breathe in resolution. Breathe out excuses.",
        "They're not ignoring me. They're on a journey. I'm the destination.",
    ],
}

# Level-specific ad-libs that reference what just happened or what's coming
LEVEL_ADLIBS: dict[int, list[str]] = {
    1: ["Email sent. The inbox is the first battlefield.", "A gentle start. It won't stay gentle."],
    2: ["Their phone just buzzed. I know because I sent it.", "SMS delivered. Short. Direct. Undeniable."],
    3: ["They heard the phone ring. Whether they answer is a character test.", "WhatsApp plus a phone call. The multi-channel approach."],
    4: ["Research complete. Knowledge is power. Karen has both.", "I now know things about them they've forgotten about themselves."],
    5: ["A colleague has been looped in. The audience grows.", "CC'd. Now there's a witness. Accountability loves witnesses."],
    6: ["Slack notified. The workspace knows.", "Professional channels activated. Nowhere to hide at work."],
    7: ["Discord pinged. Everyone heard that.", "The community has been informed. Public record."],
    8: ["Calendar event created. It's officially on the schedule.", "A meeting invite. You can decline it. But Karen will notice."],
    9: ["Committed to the public ledger. The internet remembers.", "Open Matters updated. This is now permanently documented."],
    10: ["The FedEx letter is prepared. Physical mail. This is serious.", "A formal letter. On paper. With a tracking number."],
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

    # Look up research data for the target (used at L4 and L5)
    research = get_research(esc.target.id)

    # The CC contact comes from the research cache (the "discovered coworker")
    cc_name: str | None = None
    cc_email: str | None = None
    if research:
        cc_name = research.coworker_name
        cc_email = research.coworker_email

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
        days_outstanding = (datetime.utcnow() - esc.started_at).days or 14

        # ── Level 4: Research animation + hardcoded SMS ──────────────
        if level == 4:
            await _run_research_level(escalation_id, esc, days_outstanding)
            # After research, wait for interval then continue
            if level < esc.max_level:
                await _interlude(escalation_id, esc, interval, level)
            continue

        # ── Level 3: fire-and-forget voice ───────────────────────────
        # WhatsApp first, then voice call initiated without waiting
        generated = None
        for channel in channels_for_level:
            if channel not in available and channel not in ("discord", "github", "slack", "research", "fedex"):
                _emit(escalation_id, {
                    "type": "level_skipped",
                    "level": level,
                    "reason": f"{channel} not available for {esc.target.name}",
                })
                continue

            # Level 5 uses research-discovered CC contact
            msg_cc_name = cc_name if (level == 5 and cc_name) else None

            # Skip message generation for "research" channel (handled in _run_research_level)
            if channel == "research":
                continue

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
                    cc_name=msg_cc_name,
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

            # Inject escalation context for channels that need metadata
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

            # Level 5 CC email comes from research cache
            send_cc_email = cc_email if (level == 5 and cc_email) else None
            result = await send_channel(channel, esc.target, generated.fields, send_cc_email)

            esc.messages_sent += 1
            if channel not in esc.channels_used:
                esc.channels_used.append(channel)

            if result.success and result.metadata:
                esc.channel_metadata.update(result.metadata)
            if level == 5 and send_cc_email:
                esc.channel_metadata["cc_contact_email"] = send_cc_email
                if cc_name:
                    esc.channel_metadata["cc_contact_name"] = cc_name

            _emit(escalation_id, {
                "type": "level_complete",
                "level": level,
                "channel": channel,
                "karen_note": generated.karen_note,
            })

            _emit(escalation_id, {
                "type": "commentary",
                "text": generated.karen_commentary,
                "timestamp": datetime.utcnow().isoformat(),
            })

            # Emit quip audio
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

        # FedEx rate event at Level 10
        if level == 10:
            await _emit_fedex_rate(escalation_id, esc)

        # Wait for the interval before next level
        if level < esc.max_level:
            await _interlude(escalation_id, esc, interval, level)

    # Ladder complete
    if esc.status == EscalationStatus.ACTIVE:
        _emit(escalation_id, {
            "type": "commentary",
            "text": (
                "All levels exhausted. Karen has done everything she can. "
                "The ball is in their court. It has always been in their court."
            ),
            "timestamp": datetime.utcnow().isoformat(),
        })


async def _run_research_level(
    escalation_id: str,
    esc: Escalation,
    days_outstanding: int,
) -> None:
    """Level 4: Research animation + 'I know where you work' SMS."""
    level = 4

    # Phase 1: Research animation via SSE
    steps = get_research_steps(esc.target.id)
    research = get_research(esc.target.id)

    _emit(escalation_id, {
        "type": "level_start",
        "level": level,
        "channel": "research",
        "message_preview": "Conducting research...",
    })

    if steps:
        for i, (step_text, pause_ms) in enumerate(steps):
            _emit(escalation_id, {
                "type": "research_step",
                "step": i + 1,
                "detail": step_text,
                "pause_ms": pause_ms,
            })
            # Server-side pacing so frontend gets events spaced out
            await asyncio.sleep(pause_ms / 1000.0)

        # Emit discovery payload
        if research:
            _emit(escalation_id, {
                "type": "research_discovery",
                "target": research.target_name,
                "employer": research.employer,
                "work_email": research.work_email,
                "coworker_name": research.coworker_name,
                "coworker_email": research.coworker_email,
            })

    _emit(escalation_id, {
        "type": "level_complete",
        "level": level,
        "channel": "research",
        "karen_note": "Research complete. I am thorough.",
    })

    if "research" not in esc.channels_used:
        esc.channels_used.append("research")

    # Phase 2: Hardcoded "I know where you work" SMS
    _emit(escalation_id, {
        "type": "level_start",
        "level": level,
        "channel": "sms",
        "message_preview": "I know where you work \ud83d\ude42",
    })

    from services.channel_service import send_channel as _send
    sms_fields = {"body": "I know where you work \ud83d\ude42"}
    sms_result = await _send("sms", esc.target, sms_fields)

    esc.messages_sent += 1
    if "sms" not in esc.channels_used:
        esc.channels_used.append("sms")

    _emit(escalation_id, {
        "type": "level_complete",
        "level": level,
        "channel": "sms",
        "karen_note": "Just a friendly reminder that I am thorough.",
    })

    _emit(escalation_id, {
        "type": "commentary",
        "text": "Just a friendly reminder that I am thorough.",
        "timestamp": datetime.utcnow().isoformat(),
    })

    quip_url = get_random_quip(esc.personality)
    if quip_url:
        _emit(escalation_id, {
            "type": "audio",
            "audio_type": "quip",
            "audio_url": quip_url,
            "text": "",
        })


async def _emit_fedex_rate(escalation_id: str, esc: Escalation) -> None:
    """Emit the FedEx rate event after Level 10 completes."""
    import re

    from services.fedex_service import get_rate_quote

    target_zip = ""
    addr = esc.target.contacts.address
    if addr and "FILL" not in addr:
        match = re.search(r"\d{5}", addr)
        if match:
            target_zip = match.group()

    rate, service, destination = await get_rate_quote(target_zip or "10001")

    _emit(escalation_id, {
        "type": "fedex_rate",
        "rate": rate,
        "service": service,
        "destination": destination,
    })


async def _interlude(
    escalation_id: str,
    esc: Escalation,
    interval: float,
    level: int,
) -> None:
    """Sleep between levels with commentary TTS generation and ad-lib filler audio."""
    bg_tasks: list[asyncio.Task] = []

    # Generate commentary audio in background during the wait
    async def _gen_commentary(text: str, lvl: int, suffix: str = "") -> None:
        try:
            url = await generate_commentary_audio(
                text, esc.personality, escalation_id, lvl, suffix=suffix,
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
                "message": f"Commentary audio failed for L{lvl}{suffix}: {e}",
            })

    # Emit interlude_start so frontend can show countdown
    _emit(escalation_id, {
        "type": "interlude_start",
        "level": level,
        "duration_seconds": interval,
    })

    # Generate TTS for the level-complete commentary IMMEDIATELY (not delayed)
    # This ensures the audio for level N plays during level N's interlude, not later.
    last_commentary = None
    for evt in reversed(esc.event_history):
        if evt.get("type") == "commentary":
            last_commentary = evt.get("text")
            break

    if last_commentary:
        # Await the first commentary TTS so it plays BEFORE ad-libs start
        try:
            url = await generate_commentary_audio(
                last_commentary, esc.personality, escalation_id, level,
            )
            _emit(escalation_id, {
                "type": "audio",
                "audio_type": "commentary",
                "audio_url": url,
                "text": last_commentary,
            })
        except Exception as e:
            _emit(escalation_id, {
                "type": "error",
                "message": f"Commentary audio failed for L{level}: {e}",
            })

    # Build ad-lib pool: 1 level-specific + 2 personality-generic (for variety)
    personality_key = esc.personality.value
    generic_pool = WAITING_ADLIBS.get(personality_key, [])
    level_pool = LEVEL_ADLIBS.get(level, [])

    adlibs: list[str] = []
    # First ad-lib: level-specific (references what just happened)
    if level_pool:
        adlibs.append(random.choice(level_pool))
    # Fill remaining slots with generic personality ad-libs
    remaining = min(2, len(generic_pool))
    if remaining > 0:
        adlibs.extend(random.sample(generic_pool, remaining))

    # For 10s intervals: schedule at 3s and 7s (giving ~3-4s gap between each)
    # For longer intervals: schedule at 25%, 55%, 85%
    if interval <= 12:
        # Short demo intervals — fixed timing for tight sync
        adlib_times = [3.0, 7.0]
    else:
        adlib_times = [interval * 0.25, interval * 0.55, interval * 0.85]

    adlib_triggers: dict[int, tuple[int, str]] = {}
    for i, (time_s, text) in enumerate(zip(adlib_times[:len(adlibs)], adlibs)):
        tick = int(time_s * 2)  # 0.5s ticks
        adlib_triggers[tick] = (i, text)

    # Sleep in small chunks so we can respond to status changes and fire ad-libs
    tick_count = 0
    elapsed_time = 0.0
    while elapsed_time < interval:
        if esc.status in (
            EscalationStatus.DEESCALATING,
            EscalationStatus.RESOLVED,
        ):
            for t in bg_tasks:
                if not t.done():
                    t.cancel()
            return
        await asyncio.sleep(min(0.5, interval - elapsed_time))
        elapsed_time += 0.5
        tick_count += 1

        # Check if an ad-lib should fire at this tick
        if tick_count in adlib_triggers:
            idx, adlib_text = adlib_triggers[tick_count]
            _emit(escalation_id, {
                "type": "commentary",
                "text": adlib_text,
                "timestamp": datetime.utcnow().isoformat(),
            })
            # Generate TTS in background — short lines, fast generation
            suffix = f"_adlib{idx}"
            task = asyncio.create_task(_gen_commentary(adlib_text, level, suffix=suffix))
            bg_tasks.append(task)
