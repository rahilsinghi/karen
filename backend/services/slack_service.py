from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger("karen.slack")

SLACK_API = "https://slack.com/api"


async def post_message(text: str) -> tuple[bool, str, str]:
    """Post a message to #karen-escalations.

    Returns (success, detail, message_ts).
    message_ts is needed to delete the message later.
    """
    token = os.environ.get("SLACK_BOT_TOKEN", "")
    channel = os.environ.get("SLACK_CHANNEL_ID", "")

    if not token or not channel:
        return False, "Slack credentials not configured (SLACK_BOT_TOKEN / SLACK_CHANNEL_ID)", ""

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SLACK_API}/chat.postMessage",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "channel": channel,
                "text": text,
                "unfurl_links": False,
            },
        )
        data = resp.json()

    if not data.get("ok"):
        error = data.get("error", "unknown")
        return False, f"Slack API error: {error}", ""

    ts = data.get("ts", "")
    return True, f"Posted to #{channel}", ts


async def delete_message(message_ts: str) -> tuple[bool, str]:
    """Delete a Slack message by its timestamp."""
    token = os.environ.get("SLACK_BOT_TOKEN", "")
    channel = os.environ.get("SLACK_CHANNEL_ID", "")

    if not token or not channel or not message_ts:
        return False, "Cannot delete: missing Slack credentials or message timestamp"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SLACK_API}/chat.delete",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "channel": channel,
                "ts": message_ts,
            },
        )
        data = resp.json()

    if not data.get("ok"):
        error = data.get("error", "unknown")
        return False, f"Slack delete failed: {error}"

    return True, "Slack message deleted. The channel will forget. Slack does not."
