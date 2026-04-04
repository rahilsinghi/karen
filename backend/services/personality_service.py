from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path

import anthropic

from models.schemas import Personality

_PERSONALITY_DIR = Path("/openclaw/personalities")
_personality_prompts: dict[str, str] = {}
_client: anthropic.AsyncAnthropic | None = None

_MODEL = "claude-haiku-4-5-20251001"


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
        )
    return _client


async def _generate_with_retry(
    client: anthropic.AsyncAnthropic,
    system: str,
    prompt: str,
    max_retries: int = 3,
) -> str:
    """Call Claude with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            response = await client.messages.create(
                model=_MODEL,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except anthropic.RateLimitError:
            if attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                await asyncio.sleep(wait)
                continue
            raise
    raise RuntimeError("Unreachable")


def _load_personality(personality: Personality) -> str:
    """Load and cache the personality markdown file."""
    if personality.value not in _personality_prompts:
        path = _PERSONALITY_DIR / f"{personality.value}.md"
        _personality_prompts[personality.value] = path.read_text()
    return _personality_prompts[personality.value]


# Channel-specific constraints Karen must follow
_CHANNEL_RULES: dict[str, str] = {
    "email": (
        "Format: Return a JSON object with 'subject' and 'body' keys. "
        "The body should be a full email. Include a sign-off from Karen."
    ),
    "sms": (
        "Format: Return a JSON object with 'body' key only. "
        "Keep it under 160 characters. Punchy. No greeting."
    ),
    "whatsapp": (
        "Format: Return a JSON object with 'body' key only. "
        "Can be longer than SMS. Emoji-friendly. Conversational."
    ),
    "linkedin": (
        "Format: Return a JSON object with 'subject' and 'body' keys. "
        "Professional InMail tone. Karen is connecting/messaging on LinkedIn."
    ),
    "twitter": (
        "Format: Return a JSON object with 'body' key only. "
        "Max 280 characters. Public tweet from @KarenFollowsUp. "
        "Don't @ the target's handle unless provided."
    ),
    "calendar": (
        "Format: Return a JSON object with 'title' and 'description' keys. "
        "Title is the calendar event name. Description explains the meeting purpose. "
        "Karen is creating a calendar event for the target."
    ),
    "discord": (
        "Format: Return a JSON object with 'body' key only. "
        "Discord server message. Can use **bold** and line breaks. "
        "At Level 7 this is an @everyone post."
    ),
    "github": (
        "Format: Return a JSON object with 'title' and 'body' keys. "
        "Title is the open matter entry. Body is a one-line summary. "
        "This goes on the public Open Matters page."
    ),
    "fedex": (
        "Format: Return a JSON object with 'body' key only. "
        "Formal letter body paragraphs only (no header/closing — the template handles those). "
        "Multiple paragraphs. Legal-adjacent tone. Print-ready."
    ),
}

# What each level looks like
_LEVEL_CONTEXT: dict[int, str] = {
    1: "First contact. Warm. Friendly. One chance to resolve this nicely.",
    2: "Follow-up bump. Slightly less warm. They didn't respond to Level 1.",
    3: "Tone shift. Karen is noticing the silence. Concern is creeping in.",
    4: "CC'ing a mutual contact for 'visibility'. The audience is growing.",
    5: "LinkedIn. Karen is bringing this to their professional life.",
    6: "Calendar event. Karen is scheduling time to discuss this matter.",
    7: "Discord @everyone. The community now knows. Public accountability.",
    8: "Open Matters page. Permanently documented on the internet.",
    9: "Twitter. The world now knows. There is no going back.",
    10: "FedEx formal letter. Physical mail. Karen's magnum opus. Maximum formality.",
}


def _strip_fences(text: str) -> str:
    """Strip markdown code fences from LLM output."""
    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    return m.group(1).strip() if m else text.strip()


class GeneratedMessage:
    """Result of personality service generation."""

    def __init__(self, fields: dict[str, str], karen_note: str, karen_commentary: str) -> None:
        self.fields = fields            # channel-specific fields (subject, body, title, etc.)
        self.karen_note = karen_note    # short note for the level card
        self.karen_commentary = karen_commentary  # unhinged sidebar monologue


_SYSTEM_MESSAGE = "You are Karen, a professional follow-up agent from Karen Automated Correspondence Systems LLC. You respond with ONLY valid JSON. No markdown fences. No explanation. Just the JSON object."

_COMMENTARY_SYSTEM = "You are Karen's internal monologue — her private thoughts visible only on the operator's dashboard sidebar. You respond with ONLY valid JSON. No markdown fences. No explanation. Just the JSON object."


def _build_message_prompt(
    personality_prompt: str,
    channel_rules: str,
    level_context: str,
    level: int,
    channel: str,
    initiator_name: str,
    target_name: str,
    grievance_type: str,
    grievance_detail: str,
    days_outstanding: int,
    cc_name: str | None,
) -> str:
    return f"""{personality_prompt}

CRITICAL RULES:
- Karen always identifies herself: "I'm Karen, reaching out on behalf of [initiator]"
- Karen never impersonates the initiator
- Karen is not malicious — she is deeply, committedly, professionally unhinged
- Karen means well. Karen always has.
- Generate the ACTUAL message Karen sends. Not a template. Not a placeholder.

CONTEXT:
- Initiator: {initiator_name}
- Target: {target_name}
- Grievance type: {grievance_type}
- Grievance detail: {grievance_detail}
- Days outstanding: {days_outstanding}
- Current escalation level: {level}/10
- Level meaning: {level_context}
- Channel: {channel}
{"- CC'd contact: " + cc_name if cc_name else ""}

{channel_rules}

Generate Karen's message now."""


def _build_commentary_prompt(
    personality_prompt: str,
    level_context: str,
    level: int,
    channel: str,
    initiator_name: str,
    target_name: str,
    grievance_detail: str,
    days_outstanding: int,
) -> str:
    return f"""This is NOT what Karen sends. This is what Karen THINKS while sending it.

{personality_prompt}

The internal monologue is:
- More honest than the sent message
- Slightly more unhinged
- Notices things (when people were last online, read receipts, etc.)
- Short: 2-4 sentences max
- Written in first person as Karen

CONTEXT:
- Karen just sent a Level {level} {channel} message to {target_name} on behalf of {initiator_name}
- Grievance: {grievance_detail} ({days_outstanding} days outstanding)
- Level meaning: {level_context}

Also generate a short (under 15 words) "karen_note" — this appears on the level card.

Return JSON with keys "karen_note" and "karen_commentary".

Generate Karen's internal monologue now."""


async def generate_message(
    personality: Personality,
    level: int,
    channel: str,
    initiator_name: str,
    target_name: str,
    grievance_type: str,
    grievance_detail: str,
    days_outstanding: int,
    cc_name: str | None = None,
) -> GeneratedMessage:
    """Generate a Karen message for a specific personality, level, and channel."""

    personality_prompt = _load_personality(personality)
    channel_rules = _CHANNEL_RULES.get(channel, _CHANNEL_RULES["email"])
    level_context = _LEVEL_CONTEXT.get(level, f"Level {level} escalation.")

    client = _get_client()

    msg_prompt = _build_message_prompt(
        personality_prompt, channel_rules, level_context,
        level, channel, initiator_name, target_name,
        grievance_type, grievance_detail, days_outstanding, cc_name,
    )
    commentary_prompt = _build_commentary_prompt(
        personality_prompt, level_context,
        level, channel, initiator_name, target_name,
        grievance_detail, days_outstanding,
    )

    msg_text, commentary_text = await asyncio.gather(
        _generate_with_retry(client, _SYSTEM_MESSAGE, msg_prompt),
        _generate_with_retry(client, _COMMENTARY_SYSTEM, commentary_prompt),
    )

    try:
        fields = json.loads(_strip_fences(msg_text))
    except (json.JSONDecodeError, TypeError):
        fields = {"body": msg_text or "Karen is drafting a message."}

    try:
        commentary_data = json.loads(_strip_fences(commentary_text))
    except (json.JSONDecodeError, TypeError):
        commentary_data = {
            "karen_note": "Karen is processing.",
            "karen_commentary": commentary_text or "I sent it. They'll respond. They always do.",
        }

    return GeneratedMessage(
        fields=fields,
        karen_note=commentary_data.get("karen_note", "Karen sent a message."),
        karen_commentary=commentary_data.get("karen_commentary", "I sent it. They'll respond. They always do."),
    )
