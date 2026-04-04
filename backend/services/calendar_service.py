from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

logger = logging.getLogger("karen.calendar")


async def create_event(
    target_email: str,
    title: str,
    description: str,
) -> tuple[bool, str, str]:
    """Create a Google Calendar event inviting the target.

    Returns (success, detail, event_id).
    """
    creds_path = os.environ.get("GOOGLE_CALENDAR_CREDENTIALS", "")
    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", "primary")

    if not creds_path:
        return False, "No GOOGLE_CALENDAR_CREDENTIALS configured", ""

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        scopes = ["https://www.googleapis.com/auth/calendar"]
        credentials = service_account.Credentials.from_service_account_file(
            creds_path, scopes=scopes,
        )
        service = build("calendar", "v3", credentials=credentials)

        now = datetime.utcnow()
        start = now + timedelta(minutes=30)
        end = start + timedelta(minutes=30)

        event_body = {
            "summary": title,
            "description": description,
            "location": "Wherever accountability finds you",
            "start": {
                "dateTime": start.isoformat() + "Z",
                "timeZone": "America/New_York",
            },
            "end": {
                "dateTime": end.isoformat() + "Z",
                "timeZone": "America/New_York",
            },
            "attendees": [{"email": target_email}],
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 10},
                    {"method": "popup", "minutes": 5},
                    {"method": "popup", "minutes": 1},
                ],
            },
        }

        result = service.events().insert(
            calendarId=calendar_id,
            body=event_body,
            sendUpdates="all",
        ).execute()

        event_id = result.get("id", "")
        return True, f"Calendar event created: {title}", event_id

    except ImportError:
        return False, "google-api-python-client not installed", ""
    except Exception as e:
        logger.exception("Calendar event creation failed")
        return False, f"Calendar error: {e}", ""


async def delete_event(event_id: str) -> tuple[bool, str]:
    """Delete a Google Calendar event."""
    creds_path = os.environ.get("GOOGLE_CALENDAR_CREDENTIALS", "")
    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", "primary")

    if not creds_path or not event_id:
        return False, "Cannot delete: missing credentials or event ID"

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        scopes = ["https://www.googleapis.com/auth/calendar"]
        credentials = service_account.Credentials.from_service_account_file(
            creds_path, scopes=scopes,
        )
        service = build("calendar", "v3", credentials=credentials)

        service.events().delete(
            calendarId=calendar_id,
            eventId=event_id,
        ).execute()

        return True, "Calendar event deleted. The meeting has been cancelled. The obligation has not."

    except Exception as e:
        logger.exception("Calendar event deletion failed")
        return False, f"Calendar delete error: {e}"
