from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from datetime import datetime
from typing import Any, Callable

import httpx

from models.schemas import Escalation

logger = logging.getLogger("karen.deescalation")


async def run_deescalation(
    escalation_id: str,
    esc: Escalation,
    emit: Callable[[str, dict[str, Any]], None],
) -> None:
    """Sequential de-escalation. Each step shown as it completes.

    Order per spec v2:
    1. Remove from Open Matters (GitHub)
    2. Delete Slack message
    3. Delete Discord post
    4. Delete Calendar event
    5. Cancel FedEx shipment (fails if already shipped)
    6. Send apology to target (email)
    7. Send apology to CC'd contacts (email, Level 5+)
    8. Send apology to the apology ("caused confusion")
    """

    steps: list[tuple[str, Any, bool]] = [
        ("Remove from Open Matters", _remove_open_matters, "github" in esc.channels_used),
        ("Delete Slack message", _delete_slack, "slack" in esc.channels_used),
        ("Delete Discord post", _delete_discord, "discord" in esc.channels_used),
        ("Delete Calendar event", _delete_calendar, "calendar" in esc.channels_used),
        ("Cancel FedEx shipment", _cancel_fedex, "fedex" in esc.channels_used),
        ("Send apology to target", _send_apology_target, True),
        ("Send apology to CC'd contacts", _send_apology_cc, esc.current_level >= 5),
        ("Send apology to the apology", _send_apology_apology, True),
    ]

    for action_name, handler, should_run in steps:
        if not should_run:
            continue

        await asyncio.sleep(0.8)  # pacing for the animation

        try:
            success, note = await handler(esc)
            emit(escalation_id, {
                "type": "deescalation_step",
                "action": action_name,
                "status": "ok" if success else "failed",
                "karen_note": note,
            })
        except Exception as e:
            logger.exception("De-escalation step %s failed", action_name)
            emit(escalation_id, {
                "type": "deescalation_step",
                "action": action_name,
                "status": "failed",
                "karen_note": str(e),
            })

    # Karen's closing commentary
    emit(escalation_id, {
        "type": "commentary",
        "text": (
            "De-escalation complete. All channels addressed. "
            "Some things cannot be undone. Most things can. "
            "Karen has done her best."
        ),
        "timestamp": datetime.utcnow().isoformat(),
    })


# ── Step 1: GitHub Open Matters removal ─────────────────────────────────────


async def _remove_open_matters(esc: Escalation) -> tuple[bool, str]:
    """Remove the target from open-matters.json via GitHub API."""
    token = os.environ.get("GITHUB_TOKEN", "")
    repo = os.environ.get("GITHUB_REPO", "rahilsinghi/portfolio")

    if not token:
        return False, "No GitHub token -- cannot remove from Open Matters."

    file_path = "data/open-matters.json"
    api_base = f"https://api.github.com/repos/{repo}/contents/{file_path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }

    async with httpx.AsyncClient() as client:
        get_resp = await client.get(api_base, headers=headers)
        if get_resp.status_code != 200:
            return False, "Open Matters file not found in repo."

        existing = get_resp.json()
        content = json.loads(base64.b64decode(existing["content"]).decode())
        original_count = len(content.get("matters", []))

        # Remove all entries matching this target
        content["matters"] = [
            m for m in content.get("matters", [])
            if m.get("target") != esc.target.name
        ]

        if len(content["matters"]) == original_count:
            return True, "Target was not in Open Matters. Nothing to remove."

        encoded = base64.b64encode(
            json.dumps(content, indent=2).encode()
        ).decode()

        put_resp = await client.put(api_base, headers=headers, json={
            "message": f"Karen: resolve matter for {esc.target.name}",
            "content": encoded,
            "sha": existing["sha"],
        })
        put_resp.raise_for_status()

    return True, "Removed from Open Matters. Vercel will redeploy. The public record is clean."


# ── Step 2: Discord message deletion ────────────────────────────────────────


async def _delete_discord(esc: Escalation) -> tuple[bool, str]:
    """Delete Karen's Discord message using the stored message_id."""
    bot_token = os.environ.get("DISCORD_BOT_TOKEN", "")
    channel_id = os.environ.get("DISCORD_CHANNEL_ID", "")
    message_id = esc.channel_metadata.get("discord_message_id", "")

    if not bot_token or not channel_id:
        return False, "Discord credentials not configured. The post remains."

    if not message_id:
        return False, "No message ID stored. Karen cannot find what she posted. It lives on."

    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"https://discord.com/api/v10/channels/{channel_id}/messages/{message_id}",
            headers={"Authorization": f"Bot {bot_token}"},
        )

    if resp.status_code == 204:
        return True, "Discord post deleted. The community will forget. Eventually."
    if resp.status_code == 404:
        return False, "Message already deleted or not found. Someone beat Karen to it."

    return False, f"Discord API returned {resp.status_code}. The post survives."


# ── Delete Slack message ───────────────────────────────────────────────────


async def _delete_slack(esc: Escalation) -> tuple[bool, str]:
    """Delete Karen's Slack message using the stored timestamp."""
    from services.slack_service import delete_message

    message_ts = esc.channel_metadata.get("slack_message_ts", "")
    if not message_ts:
        return False, "No Slack message timestamp stored. Karen cannot unsay what she said."

    success, detail = await delete_message(message_ts)
    return success, detail


# ── Delete Calendar event ──────────────────────────────────────────────────


async def _delete_calendar(esc: Escalation) -> tuple[bool, str]:
    """Delete the Google Calendar event using the stored event ID."""
    from services.calendar_service import delete_event

    event_id = esc.channel_metadata.get("calendar_event_id", "")
    if not event_id:
        return False, "No calendar event ID stored. The meeting stands."

    success, detail = await delete_event(event_id)
    return success, detail


# ── FedEx cancellation ────────────────────────────────────────────────────


async def _cancel_fedex(esc: Escalation) -> tuple[bool, str]:
    """Cancel FedEx shipment if not yet collected."""
    if esc.current_level >= 10:
        return False, (
            "FedEx letter already in transit. Karen's words are on paper now. "
            "This cannot be undone."
        )
    return True, "FedEx shipment cancelled before dispatch."


# ── Step 5: Apology to target ──────────────────────────────────────────────


async def _send_apology_target(esc: Escalation) -> tuple[bool, str]:
    """Send apology email to the target."""
    from services.channel_service import send_channel

    fields = {
        "subject": "Resolution notice -- Karen Automated Correspondence Systems LLC",
        "body": (
            f"Hi {esc.target.name},\n\n"
            f"This is Karen. I'm writing to inform you that the matter regarding "
            f'"{esc.grievance_detail}" has been resolved.\n\n'
            f"All escalation activities have been terminated. "
            f"Any inconvenience caused during the follow-up process is acknowledged.\n\n"
            f"Karen Automated Correspondence Systems LLC wishes you well.\n\n"
            f"Regards,\nKaren"
        ),
    }
    result = await send_channel("email", esc.target, fields)
    if result.success:
        return True, "Apology sent. Karen means it. Mostly."
    return False, f"Could not send apology: {result.detail}"


# ── Step 6: Apology to CC'd contacts ───────────────────────────────────────


async def _send_apology_cc(esc: Escalation) -> tuple[bool, str]:
    """Send apology to anyone who was CC'd at Level 4."""
    cc_email = esc.channel_metadata.get("cc_contact_email", "")
    cc_name = esc.channel_metadata.get("cc_contact_name", "")

    if not cc_email:
        return True, "No CC'd contacts on record. No apology needed. Karen is relieved."

    api_key = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("KAREN_FROM_EMAIL", "Karen <karen@resend.dev>")

    if not api_key:
        return False, "No email API key. Karen cannot apologize to CC'd contacts."

    greeting = f"Hi {cc_name}" if cc_name else "Hi"
    payload = {
        "from": from_email,
        "to": [cc_email],
        "subject": "Apology for earlier correspondence -- Karen",
        "text": (
            f"{greeting},\n\n"
            f"This is Karen from Karen Automated Correspondence Systems LLC.\n\n"
            f"You were included in a recent correspondence regarding "
            f'"{esc.grievance_detail}" involving {esc.target.name}. '
            f"This matter has now been resolved.\n\n"
            f"I apologize for any disruption the visibility may have caused. "
            f"Your inclusion was procedural, not personal.\n\n"
            f"Regards,\nKaren\n"
            f"Karen Automated Correspondence Systems LLC"
        ),
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )

    if resp.status_code in (200, 201):
        return True, f"Apology sent to {cc_name or cc_email}. Karen apologizes for the visibility."
    return False, f"Failed to send CC apology (HTTP {resp.status_code}): {resp.text}"


# ── Step 7: Apology to the apology ─────────────────────────────────────────


async def _send_apology_apology(esc: Escalation) -> tuple[bool, str]:
    """Send an apology for the apology. Karen's signature move."""
    from services.channel_service import send_channel

    fields = {
        "subject": "Clarification regarding previous correspondence -- Karen",
        "body": (
            f"Hi {esc.target.name},\n\n"
            f"This is Karen again. I wanted to follow up on my previous apology "
            f"to clarify that it was genuine and not a further escalation.\n\n"
            f"I recognize this may have caused confusion. That was not my intent.\n\n"
            f"Regards,\nKaren\nKaren Automated Correspondence Systems LLC"
        ),
    }
    result = await send_channel("email", esc.target, fields)
    if result.success:
        return True, "Apology to the apology sent. Karen caused confusion. Karen is sorry about that too."
    return False, f"Could not send: {result.detail}"
