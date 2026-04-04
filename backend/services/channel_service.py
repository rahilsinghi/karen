from __future__ import annotations

import json
import os
from html import escape as html_escape
from pathlib import Path

import httpx

from models.schemas import Member


def _is_filled(value: str) -> bool:
    return bool(value) and "FILL" not in value


def get_available_channels(member: Member) -> list[str]:
    """Return channels Karen can reach this member on.

    Skips any contact field that is empty or still contains
    the FILL_BEFORE_DEMO placeholder. More info = more Karen.
    """
    c = member.contacts
    channels: list[str] = []

    if _is_filled(c.email):
        channels.append("email")
        channels.append("email_cc")
    if _is_filled(c.phone):
        channels.append("sms")
        channels.append("voice_call")
    if _is_filled(c.whatsapp):
        channels.append("whatsapp")
    if _is_filled(c.calendar):
        channels.append("calendar")
    # Discord, GitHub, Slack are global — always available if env vars are set
    channels.append("discord")
    channels.append("github")
    channels.append("slack")
    # Research is always available (pre-cached)
    channels.append("research")
    if _is_filled(c.address):
        channels.append("fedex")

    return channels


# ── Channel dispatch ─────────────────────────────────────────────────────────


class ChannelResult:
    def __init__(
        self,
        channel: str,
        success: bool,
        detail: str = "",
        metadata: dict[str, str] | None = None,
    ) -> None:
        self.channel = channel
        self.success = success
        self.detail = detail
        self.metadata = metadata or {}


async def send_channel(
    channel: str,
    target: Member,
    fields: dict[str, str],
    cc_email: str | None = None,
) -> ChannelResult:
    """Dispatch a message to the appropriate channel."""
    dispatch = {
        "email": _send_email,
        "email_cc": _send_email,  # Same handler, CC passed via cc_email param
        "sms": _send_sms,
        "whatsapp": _send_whatsapp,
        "voice_call": _send_voice_call,
        "slack": _send_slack,
        "calendar": _send_calendar,
        "discord": _send_discord,
        "github": _send_github,
        "fedex": _send_fedex,
    }
    handler = dispatch.get(channel)
    if handler is None:
        return ChannelResult(channel, False, f"Unknown channel: {channel}")
    try:
        return await handler(target, fields, cc_email)
    except Exception as e:
        return ChannelResult(channel, False, str(e))


# ── 5a. Email (Gmail SMTP) ──────────────────────────────────────────────────


async def _send_email(
    target: Member,
    fields: dict[str, str],
    cc_email: str | None = None,
) -> ChannelResult:
    api_key = os.environ["RESEND_API_KEY"]
    from_email = os.environ.get("KAREN_FROM_EMAIL", "Karen <karen@resend.dev>")

    payload: dict = {
        "from": from_email,
        "to": [target.contacts.email],
        "subject": fields.get("subject", "A follow-up from Karen"),
        "text": fields.get("body", ""),
    }
    if cc_email:
        payload["cc"] = [cc_email]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        resp.raise_for_status()

    return ChannelResult("email", True, f"Sent to {target.contacts.email}")


# ── 5b. SMS (Twilio) ────────────────────────────────────────────────────────


async def _send_sms(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    from_number = os.environ["TWILIO_PHONE_NUMBER"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
            auth=(account_sid, auth_token),
            data={
                "From": from_number,
                "To": target.contacts.phone,
                "Body": fields.get("body", ""),
            },
        )
        resp.raise_for_status()

    return ChannelResult("sms", True, f"Sent to {target.contacts.phone}")


# ── 5c. WhatsApp (Twilio) ───────────────────────────────────────────────────


async def _send_whatsapp(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    from_number = os.environ.get("TWILIO_WHATSAPP_NUMBER", os.environ["TWILIO_PHONE_NUMBER"])

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
            auth=(account_sid, auth_token),
            data={
                "From": f"whatsapp:{from_number}",
                "To": f"whatsapp:{target.contacts.whatsapp}",
                "Body": fields.get("body", ""),
            },
        )
        resp.raise_for_status()

    return ChannelResult("whatsapp", True, f"Sent to {target.contacts.whatsapp}")


# ── 5c½. Voice Call (Twilio) ────────────────────────────────────────────────


async def _send_voice_call(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER", "")

    if not all((account_sid, auth_token, from_number)):
        return ChannelResult("voice_call", False, "Twilio credentials not configured")

    to_number = target.contacts.phone
    if not _is_filled(to_number):
        return ChannelResult("voice_call", False, "No phone number for target")

    body = html_escape(fields.get("body", ""), quote=True)
    closing = "This was a message from Karen Automated Correspondence Systems. Goodbye."

    twiml = (
        "<Response>"
        '<Pause length="1"/>'
        f'<Say voice="Polly.Joanna">{body}</Say>'
        '<Pause length="1"/>'
        f'<Say voice="Polly.Joanna">{closing}</Say>'
        "</Response>"
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json",
            auth=(account_sid, auth_token),
            data={
                "From": from_number,
                "To": to_number,
                "Twiml": twiml,
                "MachineDetection": "DetectMessageEnd",
            },
        )
        resp.raise_for_status()
        call_sid = resp.json().get("sid", "")

    return ChannelResult(
        "voice_call",
        True,
        f"Call initiated to {to_number} (fire-and-forget)",
        metadata={"voice_call_sid": call_sid},
    )


# ── Google Calendar ─────────────────────────────────────────────────────────


async def _send_calendar(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    from services.calendar_service import create_event

    title = fields.get("title", "Discuss Outstanding Matter — Karen")
    description = fields.get("description", "")
    target_email = target.contacts.calendar

    if not _is_filled(target_email):
        return ChannelResult("calendar", False, "No calendar email for target")

    success, detail, event_id = await create_event(target_email, title, description)
    metadata = {"calendar_event_id": event_id} if event_id else {}
    return ChannelResult("calendar", success, detail, metadata=metadata)


# ── Slack ──────────────────────────────────────────────────────────────────


async def _send_slack(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    from services.slack_service import post_message

    text = fields.get("body", "")
    success, detail, ts = await post_message(text)
    metadata = {"slack_message_ts": ts} if ts else {}
    return ChannelResult("slack", success, detail, metadata=metadata)


# ── Discord ────────────────────────────────────────────────────────────────


async def _send_discord(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    bot_token = os.environ["DISCORD_BOT_TOKEN"]
    channel_id = os.environ["DISCORD_CHANNEL_ID"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://discord.com/api/v10/channels/{channel_id}/messages",
            headers={"Authorization": f"Bot {bot_token}"},
            json={"content": fields.get("body", "")},
        )
        resp.raise_for_status()
        message_id = resp.json().get("id", "")

    return ChannelResult(
        "discord",
        True,
        f"Posted to channel {channel_id}",
        metadata={"discord_message_id": message_id},
    )


# ── 5g. GitHub (Open Matters commit) ────────────────────────────────────────


async def _send_github(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    token = os.environ["GITHUB_TOKEN"]
    repo = os.environ.get("GITHUB_REPO", "rahilsinghi/portfolio")
    file_path = "data/open-matters.json"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }
    api_base = f"https://api.github.com/repos/{repo}/contents/{file_path}"

    async with httpx.AsyncClient() as client:
        # Get current file (if exists)
        get_resp = await client.get(api_base, headers=headers)
        if get_resp.status_code == 200:
            existing = get_resp.json()
            sha = existing["sha"]
            import base64
            current_content = json.loads(base64.b64decode(existing["content"]).decode())
        else:
            sha = None
            current_content = {"matters": []}

        # Append new matter
        new_matter = {
            "target": target.name,
            "title": fields.get("title", "Outstanding matter"),
            "detail": fields.get("body", ""),
            "status": "ACTIVE",
        }
        current_content["matters"].append(new_matter)

        import base64
        encoded = base64.b64encode(json.dumps(current_content, indent=2).encode()).decode()

        put_data: dict = {
            "message": f"Karen: add open matter for {target.name}",
            "content": encoded,
        }
        if sha:
            put_data["sha"] = sha

        put_resp = await client.put(api_base, headers=headers, json=put_data)
        put_resp.raise_for_status()
        commit_sha = put_resp.json().get("commit", {}).get("sha", "")

    return ChannelResult(
        "github",
        True,
        f"Open matter committed for {target.name}",
        metadata={"github_sha": commit_sha},
    )


# ── FedEx (PDF + ship) ────────────────────────────────────────────────────


async def _send_fedex(
    target: Member,
    fields: dict[str, str],
    _cc_email: str | None = None,
) -> ChannelResult:
    from services.pdf_service import generate_letter_pdf

    escalation_id = fields.get("_escalation_id", "unknown")
    initiator_name = fields.get("_initiator_name", "Unknown")
    grievance_detail = fields.get("_grievance_detail", "Outstanding matter")
    level = int(fields.get("_level", "10"))
    max_level = int(fields.get("_max_level", "10"))
    start_date = fields.get("_start_date", "")
    messages_sent = int(fields.get("_messages_sent", "0"))
    channels_used = int(fields.get("_channels_used", "0"))
    days_elapsed = int(fields.get("_days_elapsed", "14"))

    target_address = target.contacts.address
    if not _is_filled(target_address):
        target_address = "Address on file"

    body_html = fields.get("body", "")
    # Wrap plain text paragraphs in <p> tags if not already HTML
    if "<p>" not in body_html:
        paragraphs = [p.strip() for p in body_html.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [p.strip() for p in body_html.split("\n") if p.strip()]
        body_html = "".join(f"<p>{p}</p>" for p in paragraphs)

    pdf_bytes = generate_letter_pdf(
        target_name=target.name,
        target_address=target_address,
        initiator_name=initiator_name,
        body_html=body_html,
        grievance_ref=grievance_detail,
        ref_number=f"KAREN-{escalation_id.upper()}",
        level=level,
        max_level=max_level,
        start_date=start_date,
        attempt_count=messages_sent,
        channel_count=channels_used,
        days_elapsed=days_elapsed,
    )

    out_dir = Path("/tmp/karen_letters")
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / f"{escalation_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    return ChannelResult(
        "fedex",
        True,
        f"Formal letter generated → {pdf_path}. Queued for {target.contacts.address}",
    )
