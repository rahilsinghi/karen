# Escalation Ladder v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Karen's 10-level escalation ladder so every level fires a unique channel with real integrations, no stubs, no repeats, and maximum demo impact.

**Architecture:** Backend-first approach. Update schemas and data files, then build new services (research, slack, calendar, fedex rate), then rewire the orchestrator (karen_service) and channel dispatcher (channel_service), then update frontend types/components. Each task produces a working commit.

**Tech Stack:** Python 3.12 / FastAPI / httpx / Pydantic v2 / WeasyPrint / qrcode / google-api-python-client / Next.js 15 / TypeScript / Tailwind CSS / Framer Motion

**Spec:** `docs/superpowers/specs/2026-04-04-escalation-ladder-v2-design.md`

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `backend/services/research_service.py` | OSINT animation — reads pre-cached data, returns timed discovery steps |
| `backend/services/slack_service.py` | Slack Web API — post and delete messages |
| `backend/services/calendar_service.py` | Google Calendar API — create and delete events |
| `backend/services/fedex_service.py` | FedEx Rate API + $28.40 fallback |
| `backend/data/research_cache.json` | Pre-populated research results per target |
| `backend/data/legal_letter_template.md` | Pre-written legal letter with {variables} |
| `frontend/src/components/ResearchAnimation.tsx` | Terminal-style OSINT research display |

### Modified files
| File | What changes |
|------|-------------|
| `backend/models/schemas.py` | Add new channels (SLACK, EMAIL_CC, RESEARCH), remove LINKEDIN/TWITTER, add new SSE event models |
| `backend/services/channel_service.py` | Add slack/research/calendar/email_cc/fedex_rate dispatch, remove linkedin/twitter, add voicemail branch to voice_call |
| `backend/services/karen_service.py` | New LEVEL_CHANNELS, Level 4 research+SMS flow, fire-and-forget voice at L3, CC logic at L5 |
| `backend/services/deescalation_service.py` | Add Slack delete + Calendar delete, remove LinkedIn step |
| `backend/services/personality_service.py` | New _LEVEL_CONTEXT, new _CHANNEL_RULES for slack/email_cc/voice_call, remove linkedin/twitter rules |
| `backend/services/pdf_service.py` | Add QR code generation (base64 PNG embedded in HTML) |
| `openclaw/templates/formal_letter.html` | Add {{qr_code}} placeholder + CSS for QR |
| `backend/requirements.txt` | Add qrcode, pillow, google-api-python-client, google-auth |
| `frontend/src/lib/types.ts` | Add research_step, research_discovery, fedex_rate event types |
| `frontend/src/lib/constants.ts` | Update LEVEL_LABELS, CHANNEL_ICONS, add SATISFACTION_LABELS |
| `frontend/src/components/EscalationTimeline.tsx` | Handle research level rendering |
| `frontend/src/components/LevelCard.tsx` | Display research_step events, fedex_rate display |
| `frontend/src/app/escalation/[id]/page.tsx` | Add satisfaction score indicator in header |
| `dev.sh` | Add research cache pre-check before startup |

---

## Task Dependency Graph

```
Task 1 (schemas + data)
  ├─> Task 2 (research service)
  ├─> Task 3 (slack service)
  ├─> Task 4 (calendar service)
  ├─> Task 5 (fedex rate + QR)
  ├─> Task 6 (personality service)
  └─> Task 10 (frontend types + constants)
        ├─> Task 11 (ResearchAnimation)
        ├─> Task 12 (satisfaction score)
        └─> Task 13 (LevelCard updates)

Tasks 2-6 ──> Task 7 (channel_service overhaul)
Task 7 ──> Task 8 (karen_service ladder v2)
Task 7 ──> Task 9 (deescalation updates)
Task 14 (dev.sh + requirements) — independent
```

Tasks 2, 3, 4, 5, 6 are independent and can run in parallel.
Tasks 10, 11, 12, 13 are frontend and can run in parallel with backend tasks.

---

### Task 1: Schema & Data Foundation

**Files:**
- Modify: `backend/models/schemas.py`
- Create: `backend/data/research_cache.json`
- Create: `backend/data/legal_letter_template.md`

- [ ] **Step 1: Update Channel enum in schemas.py**

Replace lines 53-63 in `backend/models/schemas.py`:

```python
class Channel(str, Enum):
    EMAIL = "email"
    EMAIL_CC = "email_cc"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE_CALL = "voice_call"
    RESEARCH = "research"
    SLACK = "slack"
    CALENDAR = "calendar"
    DISCORD = "discord"
    GITHUB = "github"
    FEDEX = "fedex"
```

- [ ] **Step 2: Add new SSE event models**

Add after the `AudioEvent` class (after line 205) in `backend/models/schemas.py`:

```python
class ResearchStepEvent(BaseModel):
    type: Literal["research_step"] = "research_step"
    step: int
    detail: str
    pause_ms: int = 400


class ResearchDiscoveryEvent(BaseModel):
    type: Literal["research_discovery"] = "research_discovery"
    target: str
    employer: str
    work_email: str
    coworker_name: str
    coworker_email: str


class FedexRateEvent(BaseModel):
    type: Literal["fedex_rate"] = "fedex_rate"
    rate: str
    service: str
    destination: str
```

- [ ] **Step 3: Update KarenEvent union**

Replace the `KarenEvent` union (lines 208-219) with:

```python
KarenEvent = (
    LevelStartEvent
    | LevelCompleteEvent
    | LevelSkippedEvent
    | CommentaryEvent
    | ResponseDetectedEvent
    | PaymentDetectedEvent
    | DeescalationStepEvent
    | CompleteEvent
    | ErrorEvent
    | AudioEvent
    | ResearchStepEvent
    | ResearchDiscoveryEvent
    | FedexRateEvent
)
```

- [ ] **Step 4: Create research_cache.json**

Create `backend/data/research_cache.json`:

```json
{
  "bharath": {
    "target_name": "Bharath Mahesh Gera",
    "portfolio_url": "linkedin.com/in/bharath-mahesh-gera",
    "employer": "NYU Stern School of Business",
    "role": "MBA Candidate",
    "domain": "stern.nyu.edu",
    "work_email": "bharathmaheshgera@stern.nyu.edu",
    "coworker_name": "Chinmay Shringi",
    "coworker_email": "cs7810@nyu.edu",
    "discovery_steps": [
      "Scanning Bharath Mahesh Gera's public web presence...",
      "Found LinkedIn profile: linkedin.com/in/bharath-mahesh-gera",
      "Work history: NYU Stern School of Business — MBA Candidate",
      "Domain discovered: stern.nyu.edu. Inferring work email...",
      "Work email: bharathmaheshgera@stern.nyu.edu. Confidence: high.",
      "Identifying colleagues for visibility escalation...",
      "Colleague identified: Chinmay Shringi (cs7810@nyu.edu)"
    ]
  },
  "rahil": {
    "target_name": "Rahil Singhi",
    "portfolio_url": "rahilsinghi.com",
    "employer": "Kismet",
    "role": "AI/Data Engineering Intern",
    "domain": "makekismet.com",
    "work_email": "rahil@makekismet.com",
    "coworker_name": "Sariya Rizwan",
    "coworker_email": "sariyakh25@gmail.com",
    "discovery_steps": [
      "Scanning Rahil Singhi's public web presence...",
      "Found portfolio at rahilsinghi.com",
      "Work history: Kismet — AI/Data Engineering Intern",
      "Domain discovered: makekismet.com. Inferring work email...",
      "Work email: rahil@makekismet.com. Confidence: high.",
      "Identifying colleagues for visibility escalation...",
      "Colleague identified: Sariya Rizwan (sariyakh25@gmail.com)"
    ]
  }
}
```

- [ ] **Step 5: Create legal_letter_template.md**

Create `backend/data/legal_letter_template.md`:

```markdown
# FORMAL NOTICE OF UNRESOLVED FINANCIAL OBLIGATION

Dear {target_name},

This letter constitutes formal notice from Karen Automated Correspondence Systems LLC, acting on behalf of {initiator_name}, regarding an unresolved financial obligation in the amount of **${amount}**.

## Background

On {start_date}, a financial obligation was incurred. Despite {attempt_count} prior communications across {channel_count} channels over a period of {days_elapsed} days, this matter remains unresolved.

## Channels of Communication Utilized

The following channels have been employed in pursuit of resolution: {channels_list}.

## Notice

Please be advised that Karen Automated Correspondence Systems LLC intends to pursue all available administrative follow-up procedures until this matter is satisfactorily resolved.

A record of this matter has been documented at https://rahilsinghi.com/open-matters for public accountability purposes.

## Resolution

To resolve this matter immediately, please remit payment of ${amount} to {initiator_name} via Venmo or other agreed-upon payment method.

---

Respectfully and with considerable follow-through,

**Karen**
Karen Automated Correspondence Systems LLC

Ref: KAREN-{escalation_id}

*Karen is always watching. Karen means well.*
```

- [ ] **Step 6: Verify schema changes parse correctly**

Run: `cd /Users/rahilsinghi/Desktop/Karen && docker compose exec backend python -c "from models.schemas import Channel, ResearchStepEvent, ResearchDiscoveryEvent, FedexRateEvent, KarenEvent; print('All schema imports OK')"`

Expected: `All schema imports OK`

- [ ] **Step 7: Commit**

```bash
git add backend/models/schemas.py backend/data/research_cache.json backend/data/legal_letter_template.md
git commit -m "feat(schemas): add v2 channel types, SSE events, research cache, legal letter template"
```

---

### Task 2: Research Service

**Files:**
- Create: `backend/services/research_service.py`

- [ ] **Step 1: Create the research service**

Create `backend/services/research_service.py`:

```python
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("karen.research")

_CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "research_cache.json"
_cache: dict[str, dict] | None = None


@dataclass
class ResearchResult:
    target_name: str
    portfolio_url: str
    employer: str
    role: str
    domain: str
    work_email: str
    coworker_name: str
    coworker_email: str
    discovery_steps: list[str]


def _load_cache() -> dict[str, dict]:
    global _cache
    if _cache is None:
        if not _CACHE_PATH.exists():
            logger.warning("Research cache not found at %s", _CACHE_PATH)
            _cache = {}
        else:
            _cache = json.loads(_CACHE_PATH.read_text())
    return _cache


def get_research(target_id: str) -> ResearchResult | None:
    """Look up pre-cached research for a target member."""
    cache = _load_cache()
    entry = cache.get(target_id)
    if not entry:
        return None
    return ResearchResult(
        target_name=entry["target_name"],
        portfolio_url=entry["portfolio_url"],
        employer=entry["employer"],
        role=entry["role"],
        domain=entry["domain"],
        work_email=entry["work_email"],
        coworker_name=entry["coworker_name"],
        coworker_email=entry["coworker_email"],
        discovery_steps=entry["discovery_steps"],
    )


def get_research_steps(target_id: str) -> list[tuple[str, int]]:
    """Return (step_text, pause_ms_after) pairs for the research animation.

    Default pause is 400ms. Step 4 (domain/email inference) uses 800ms.
    """
    result = get_research(target_id)
    if not result:
        return []

    steps: list[tuple[str, int]] = []
    for i, step in enumerate(result.discovery_steps):
        # Step index 3 (0-based) is the domain/email inference — longer pause
        pause = 800 if i == 3 else 400
        steps.append((step, pause))
    return steps
```

- [ ] **Step 2: Verify the service loads the cache**

Run: `docker compose exec backend python -c "from services.research_service import get_research; r = get_research('bharath'); print(r.employer if r else 'NOT FOUND')"`

Expected: `NYU Stern School of Business`

- [ ] **Step 3: Commit**

```bash
git add backend/services/research_service.py
git commit -m "feat(research): add OSINT research service with pre-cached data"
```

---

### Task 3: Slack Service

**Files:**
- Create: `backend/services/slack_service.py`

- [ ] **Step 1: Create the Slack service**

Create `backend/services/slack_service.py`:

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/slack_service.py
git commit -m "feat(slack): add Slack Web API service for post and delete"
```

---

### Task 4: Calendar Service

**Files:**
- Create: `backend/services/calendar_service.py`

- [ ] **Step 1: Create the calendar service**

Create `backend/services/calendar_service.py`:

```python
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
            calendarId="primary",
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
            calendarId="primary",
            eventId=event_id,
        ).execute()

        return True, "Calendar event deleted. The meeting has been cancelled. The obligation has not."

    except Exception as e:
        logger.exception("Calendar event deletion failed")
        return False, f"Calendar delete error: {e}"
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/calendar_service.py
git commit -m "feat(calendar): add Google Calendar API service for create and delete"
```

---

### Task 5: FedEx Rate Service + QR Code in Letter

**Files:**
- Create: `backend/services/fedex_service.py`
- Modify: `backend/services/pdf_service.py`
- Modify: `openclaw/templates/formal_letter.html`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add qrcode and pillow to requirements.txt**

Add to the end of `backend/requirements.txt`:

```
qrcode>=7.4.2
pillow>=10.0.0
google-api-python-client>=2.100.0
google-auth>=2.25.0
```

- [ ] **Step 2: Create the FedEx rate service**

Create `backend/services/fedex_service.py`:

```python
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
```

- [ ] **Step 3: Add QR code generation to pdf_service.py**

Replace the full contents of `backend/services/pdf_service.py`:

```python
from __future__ import annotations

import base64
import io
from datetime import datetime
from pathlib import Path

from weasyprint import HTML

_TEMPLATE_PATH = Path(__file__).resolve().parent.parent.parent / "openclaw" / "templates" / "formal_letter.html"


def generate_qr_code(url: str) -> str:
    """Generate a QR code as a base64-encoded PNG data URI."""
    import qrcode

    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def generate_letter_pdf(
    target_name: str,
    target_address: str,
    initiator_name: str,
    body_html: str,
    grievance_ref: str,
    ref_number: str,
    level: int,
    max_level: int,
    start_date: str,
    attempt_count: int,
    channel_count: int,
    days_elapsed: int,
    open_matters_url: str = "https://rahilsinghi.com/open-matters",
) -> bytes:
    """Render the formal letter template to a print-ready PDF with QR code."""
    template = _TEMPLATE_PATH.read_text()

    qr_data_uri = generate_qr_code(open_matters_url)

    html = (
        template
        .replace("{{date}}", datetime.utcnow().strftime("%B %d, %Y"))
        .replace("{{target_name}}", target_name)
        .replace("{{target_address}}", target_address)
        .replace("{{initiator_name}}", initiator_name)
        .replace("{{body}}", body_html)
        .replace("{{grievance_ref}}", grievance_ref)
        .replace("{{ref_number}}", ref_number)
        .replace("{{level}}", str(level))
        .replace("{{max_level}}", str(max_level))
        .replace("{{start_date}}", start_date)
        .replace("{{attempt_count}}", str(attempt_count))
        .replace("{{channel_count}}", str(channel_count))
        .replace("{{days_elapsed}}", str(days_elapsed))
        .replace("{{qr_code}}", qr_data_uri)
    )

    return HTML(string=html).write_pdf()
```

- [ ] **Step 4: Update formal_letter.html with QR code**

Replace the full contents of `openclaw/templates/formal_letter.html`:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: letter; margin: 1in; }
  body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; color: #000; }
  .header { text-align: center; margin-bottom: 2em; border-bottom: 2px solid #000; padding-bottom: 1em; }
  .header h1 { font-size: 16pt; margin: 0; letter-spacing: 2px; }
  .header p { font-size: 9pt; margin: 4px 0; color: #333; }
  .date { text-align: right; margin-bottom: 2em; }
  .recipient { margin-bottom: 2em; }
  .body { margin-bottom: 2em; }
  .body p { text-indent: 2em; margin-bottom: 1em; }
  .closing { margin-top: 3em; }
  .signature { margin-top: 2em; font-style: italic; }
  .ref { font-size: 9pt; color: #666; margin-top: 3em; border-top: 1px solid #ccc; padding-top: 0.5em; }
  .qr-section { margin-top: 2em; text-align: center; }
  .qr-section img { width: 120px; height: 120px; }
  .qr-section p { font-size: 8pt; color: #666; margin-top: 0.5em; }
</style>
</head>
<body>
  <div class="header">
    <h1>KAREN AUTOMATED CORRESPONDENCE SYSTEMS LLC</h1>
    <p>Professional Follow-Up Services</p>
    <p>New York, NY 10001</p>
    <p>karen.follows.up.nyc@gmail.com</p>
  </div>

  <div class="date">{{date}}</div>

  <div class="recipient">
    <p>{{target_name}}</p>
    <p>{{target_address}}</p>
  </div>

  <p>RE: {{grievance_ref}} — Outstanding matter on behalf of {{initiator_name}}</p>

  <div class="body">
    {{body}}
  </div>

  <div class="closing">
    <p>Respectfully and with considerable follow-through,</p>
    <div class="signature">
      <p>Karen</p>
      <p>Karen Automated Correspondence Systems LLC</p>
      <p>Ref: {{ref_number}}</p>
    </div>
  </div>

  <div class="qr-section">
    <img src="{{qr_code}}" alt="Open Matters QR Code" />
    <p>Scan for public record: rahilsinghi.com/open-matters</p>
  </div>

  <div class="ref">
    <p>This correspondence is Level {{level}} of a {{max_level}}-level escalation sequence initiated on {{start_date}}.</p>
    <p>Previous attempts: {{attempt_count}} across {{channel_count}} channels over {{days_elapsed}} days.</p>
    <p>Karen is always watching. Karen means well.</p>
  </div>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add backend/services/fedex_service.py backend/services/pdf_service.py openclaw/templates/formal_letter.html backend/requirements.txt
git commit -m "feat(fedex): add rate API service, QR code in letter, update requirements"
```

---

### Task 6: Personality Service Updates

**Files:**
- Modify: `backend/services/personality_service.py`

- [ ] **Step 1: Update _CHANNEL_RULES**

Replace `_CHANNEL_RULES` (lines 63-105 in `backend/services/personality_service.py`) with:

```python
_CHANNEL_RULES: dict[str, str] = {
    "email": (
        "Format: Return a JSON object with 'subject' and 'body' keys. "
        "The body should be a full email. Include a sign-off from Karen."
    ),
    "email_cc": (
        "Format: Return a JSON object with 'subject' and 'body' keys. "
        "This email is CC'ing a coworker for visibility. Acknowledge the CC'd person. "
        "Tone shift: there is now an audience. Be professionally formal."
    ),
    "sms": (
        "Format: Return a JSON object with 'body' key only. "
        "Keep it under 160 characters. Punchy. No greeting."
    ),
    "whatsapp": (
        "Format: Return a JSON object with 'body' key only. "
        "Can be longer than SMS. Emoji-friendly. Conversational."
    ),
    "voice_call": (
        "Format: Return a JSON object with 'body' key only. "
        "This text will be read aloud by text-to-speech on a phone call. "
        "Write it as spoken words. No special characters. Clear and direct."
    ),
    "slack": (
        "Format: Return a JSON object with 'body' key only. "
        "Slack channel message. Can use *bold*, _italic_, and line breaks. "
        "Karen is posting in a professional workspace channel."
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
```

- [ ] **Step 2: Update _LEVEL_CONTEXT**

Replace `_LEVEL_CONTEXT` (lines 108-119) with:

```python
_LEVEL_CONTEXT: dict[int, str] = {
    1: "First contact. Email only. Warm and friendly. One chance to resolve this nicely.",
    2: "SMS. Direct to their phone. They can't miss this. Short and punchy.",
    3: "WhatsApp + Voice Call. Karen is calling them. The phone will ring. Urgency rising.",
    4: "OSINT Research. Karen found where they work. The SMS 'I know where you work' was just sent. Intelligence phase.",
    5: "Email with CC. Karen found a coworker. Now there's an audience. Professional pressure.",
    6: "Slack. Karen is posting in a professional channel. Colleagues can see this.",
    7: "Discord @everyone. The community now knows. Public accountability.",
    8: "Calendar event. Karen is scheduling a meeting to discuss this. It's on the calendar now.",
    9: "Open Matters page. Permanently documented on the internet for all to see.",
    10: "FedEx formal letter. Physical mail. Legal-adjacent language. Karen's magnum opus.",
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/personality_service.py
git commit -m "feat(personality): update channel rules and level context for v2 ladder"
```

---

### Task 7: Channel Service Overhaul

**Files:**
- Modify: `backend/services/channel_service.py`

This is the largest backend change. We need to:
- Add `slack`, `email_cc`, `research`, `fedex_rate` dispatch entries
- Remove `linkedin`, `twitter` handlers
- Add voicemail branch to `voice_call`
- Update `get_available_channels()` to add `slack` (always available like discord/github) and remove linkedin/twitter
- Add `_send_slack()`, `_send_research()` (no-op — research is handled in karen_service directly)

- [ ] **Step 1: Update get_available_channels()**

Replace the `get_available_channels` function (lines 17-45) with:

```python
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
```

- [ ] **Step 2: Update the dispatch table in send_channel()**

Replace the `dispatch` dict in `send_channel()` (lines 72-83) with:

```python
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
```

- [ ] **Step 3: Add machineDetection to voice_call handler**

Replace the `_send_voice_call` function (lines 181-222) with:

```python
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
```

- [ ] **Step 4: Replace calendar stub with real implementation**

Replace the `_send_calendar` function (lines 246-261) with:

```python
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
```

- [ ] **Step 5: Add _send_slack() handler**

Add after the `_send_calendar` function:

```python
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
```

- [ ] **Step 6: Delete linkedin and twitter handlers**

Remove the following functions entirely:
- `_send_linkedin` (lines 228-240)
- `_send_twitter` (lines 356-411)

And their section comments.

- [ ] **Step 7: Verify dispatch works**

Run: `docker compose exec backend python -c "from services.channel_service import send_channel; print('dispatch OK')"`

Expected: `dispatch OK`

- [ ] **Step 8: Commit**

```bash
git add backend/services/channel_service.py
git commit -m "feat(channels): add slack/email_cc/calendar, remove linkedin/twitter, machineDetection on voice"
```

---

### Task 8: Karen Service — Ladder v2

**Files:**
- Modify: `backend/services/karen_service.py`

This is the core orchestration change. New LEVEL_CHANNELS, Level 4 research animation + SMS, Level 3 fire-and-forget voice, Level 5 CC from research cache.

- [ ] **Step 1: Update LEVEL_CHANNELS**

Replace `LEVEL_CHANNELS` (lines 29-40) with:

```python
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
```

- [ ] **Step 2: Add research service import**

Add to the imports at the top of `karen_service.py` (after line 19):

```python
from services.research_service import get_research, get_research_steps
```

- [ ] **Step 3: Rewrite _run_ladder() for v2**

Replace the entire `_run_ladder` function (lines 203-414) with:

```python
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
            if channel not in available and channel not in ("discord", "github", "slack", "research"):
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
    from services.fedex_service import get_rate_quote

    target_zip = ""
    addr = esc.target.contacts.address
    if addr and "FILL" not in addr:
        # Try to extract zip from address (last 5 digits)
        import re
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
    """Sleep between levels with commentary TTS generation."""
    commentary_task: asyncio.Task | None = None

    # Try to generate commentary audio in the background
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

    # Use a generic commentary if we don't have a specific one
    commentary_text = f"Level {level} complete. Preparing level {level + 1}."
    commentary_task = asyncio.create_task(_gen_commentary(commentary_text, level))

    elapsed = 0.0
    while elapsed < interval:
        if esc.status in (EscalationStatus.DEESCALATING, EscalationStatus.RESOLVED):
            if commentary_task and not commentary_task.done():
                commentary_task.cancel()
            return
        await asyncio.sleep(min(0.5, interval - elapsed))
        elapsed += 0.5
```

- [ ] **Step 4: Verify the module imports cleanly**

Run: `docker compose exec backend python -c "from services.karen_service import LEVEL_CHANNELS; print(LEVEL_CHANNELS)"`

Expected: The new v2 LEVEL_CHANNELS dict.

- [ ] **Step 5: Commit**

```bash
git add backend/services/karen_service.py
git commit -m "feat(ladder): rewrite escalation ladder for v2 — unique channel per level"
```

---

### Task 9: De-escalation Updates

**Files:**
- Modify: `backend/services/deescalation_service.py`

- [ ] **Step 1: Rewrite the de-escalation steps**

Replace the `steps` list (lines 36-44) with:

```python
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
```

Note: CC apology threshold changed from `>= 4` to `>= 5` because CC now happens at Level 5.

- [ ] **Step 2: Add _delete_slack handler**

Add after the `_delete_discord` function:

```python
# ── Delete Slack message ───────────────────────────────────────────────────


async def _delete_slack(esc: Escalation) -> tuple[bool, str]:
    """Delete Karen's Slack message using the stored timestamp."""
    from services.slack_service import delete_message

    message_ts = esc.channel_metadata.get("slack_message_ts", "")
    if not message_ts:
        return False, "No Slack message timestamp stored. Karen cannot unsay what she said."

    success, detail = await delete_message(message_ts)
    return success, detail
```

- [ ] **Step 3: Add _delete_calendar handler**

Add after the `_delete_slack` function:

```python
# ── Delete Calendar event ──────────────────────────────────────────────────


async def _delete_calendar(esc: Escalation) -> tuple[bool, str]:
    """Delete the Google Calendar event using the stored event ID."""
    from services.calendar_service import delete_event

    event_id = esc.channel_metadata.get("calendar_event_id", "")
    if not event_id:
        return False, "No calendar event ID stored. The meeting stands."

    success, detail = await delete_event(event_id)
    return success, detail
```

- [ ] **Step 4: Remove _delete_linkedin handler**

Delete the `_delete_linkedin` function entirely (lines 163-165) and its section comment.

- [ ] **Step 5: Commit**

```bash
git add backend/services/deescalation_service.py
git commit -m "feat(deescalation): add Slack/Calendar delete, remove LinkedIn step"
```

---

### Task 10: Frontend Types & Constants

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/constants.ts`

- [ ] **Step 1: Add new SSE event types to types.ts**

Replace the `KarenEvent` type (lines 75-86) in `frontend/src/lib/types.ts` with:

```typescript
export type KarenEvent =
  | { type: "escalation_started"; escalation_id: string; initiator: string; target: string; [key: string]: unknown }
  | { type: "level_start"; level: number; channel: string; message_preview: string }
  | { type: "level_complete"; level: number; channel: string; karen_note: string }
  | { type: "level_skipped"; level: number; reason: string }
  | { type: "commentary"; text: string; timestamp: string }
  | { type: "response_detected"; from: string; preview: string }
  | { type: "payment_detected"; amount: number; from: string }
  | { type: "deescalation_step"; action: string; status: "ok" | "failed"; karen_note?: string }
  | { type: "complete"; karen_closing: string }
  | { type: "error"; message: string }
  | { type: "audio"; audio_type: "quip" | "commentary"; audio_url: string; text?: string }
  | { type: "research_step"; step: number; detail: string; pause_ms?: number }
  | { type: "research_discovery"; target: string; employer: string; work_email: string; coworker_name: string; coworker_email: string }
  | { type: "fedex_rate"; rate: string; service: string; destination: string };
```

- [ ] **Step 2: Update LEVEL_LABELS in constants.ts**

Replace `LEVEL_LABELS` (lines 17-28) with:

```typescript
export const LEVEL_LABELS: Record<number, string> = {
  1: "Email",
  2: "SMS",
  3: "WhatsApp + Voice",
  4: "OSINT Research",
  5: "Email CC",
  6: "Slack",
  7: "Discord @everyone",
  8: "Google Calendar",
  9: "Open Matters",
  10: "FedEx Letter",
};
```

- [ ] **Step 3: Update CHANNEL_ICONS in constants.ts**

Replace `CHANNEL_ICONS` (lines 30-41) with:

```typescript
export const CHANNEL_ICONS: Record<string, string> = {
  email: "📧",
  email_cc: "📧",
  sms: "📱",
  whatsapp: "💬",
  voice_call: "📞",
  research: "🔍",
  slack: "💼",
  calendar: "📅",
  discord: "🎮",
  github: "📋",
  fedex: "📦",
};
```

- [ ] **Step 4: Add SATISFACTION_LABELS to constants.ts**

Add after the `KAREN_QUOTES` array:

```typescript
export const SATISFACTION_LABELS: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "😴", label: "Awaiting Instructions" },
  1: { emoji: "😐", label: "Mildly Concerned" },
  2: { emoji: "🙂", label: "Politely Persistent" },
  3: { emoji: "🤨", label: "Increasingly Motivated" },
  4: { emoji: "🧐", label: "Conducting Research" },
  5: { emoji: "😤", label: "Professionally Invested" },
  6: { emoji: "😠", label: "Channeling Energy" },
  7: { emoji: "🔥", label: "Community Engaged" },
  8: { emoji: "📅", label: "Scheduling Accountability" },
  9: { emoji: "🦞", label: "Fully Committed" },
  10: { emoji: "☢️", label: "At Peace" },
};
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/constants.ts
git commit -m "feat(frontend): update types and constants for v2 ladder"
```

---

### Task 11: ResearchAnimation Component

**Files:**
- Create: `frontend/src/components/ResearchAnimation.tsx`

- [ ] **Step 1: Create the ResearchAnimation component**

Create `frontend/src/components/ResearchAnimation.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KarenEvent } from "@/lib/types";

interface ResearchAnimationProps {
  events: KarenEvent[];
}

interface ResearchStep {
  step: number;
  detail: string;
  pauseMs: number;
}

export default function ResearchAnimation({ events }: ResearchAnimationProps) {
  const [visibleSteps, setVisibleSteps] = useState<ResearchStep[]>([]);
  const [discoveryData, setDiscoveryData] = useState<{
    target: string;
    employer: string;
    work_email: string;
    coworker_name: string;
    coworker_email: string;
  } | null>(null);

  useEffect(() => {
    const steps: ResearchStep[] = [];
    let discovery = null;

    for (const event of events) {
      if (event.type === "research_step") {
        steps.push({
          step: event.step,
          detail: event.detail,
          pauseMs: event.pause_ms ?? 400,
        });
      }
      if (event.type === "research_discovery") {
        discovery = {
          target: event.target,
          employer: event.employer,
          work_email: event.work_email,
          coworker_name: event.coworker_name,
          coworker_email: event.coworker_email,
        };
      }
    }

    setVisibleSteps(steps);
    setDiscoveryData(discovery);
  }, [events]);

  if (visibleSteps.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] p-4 font-mono text-sm">
      <div className="mb-2 text-xs text-[#6b6b8a] uppercase tracking-wider">
        Karen OSINT Module
      </div>
      <AnimatePresence mode="popLayout">
        {visibleSteps.map((step) => {
          // Check if this is the work email step (contains "Work email:" or "Confidence:")
          const isWorkEmail = step.detail.includes("Confidence:");
          // Check if this is the domain step (longer pause)
          const isDomainStep = step.detail.includes("Inferring work email");

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-1 flex items-start gap-2 ${
                isWorkEmail
                  ? "text-[#ef4444] font-bold"
                  : isDomainStep
                  ? "text-[#eab308]"
                  : "text-[#22c55e]"
              }`}
            >
              <span className="text-[#6b6b8a] select-none">{">"}</span>
              <TypewriterText
                text={step.detail}
                speed={isWorkEmail ? 30 : 15}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {discoveryData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 rounded border border-[#22c55e]/30 bg-[#22c55e]/5 p-3"
        >
          <div className="text-xs text-[#22c55e] uppercase tracking-wider mb-2">
            Research Complete
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#6b6b8a]">Employer:</span>{" "}
              <span className="text-[#f8f8ff]">{discoveryData.employer}</span>
            </div>
            <div>
              <span className="text-[#6b6b8a]">Work Email:</span>{" "}
              <span className="text-[#ef4444]">{discoveryData.work_email}</span>
            </div>
            <div>
              <span className="text-[#6b6b8a]">Colleague:</span>{" "}
              <span className="text-[#f8f8ff]">{discoveryData.coworker_name}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <span className="animate-pulse text-[#22c55e]">_</span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ResearchAnimation.tsx
git commit -m "feat(frontend): add ResearchAnimation terminal-style component"
```

---

### Task 12: Satisfaction Score in Escalation Header

**Files:**
- Modify: `frontend/src/app/escalation/[id]/page.tsx`

- [ ] **Step 1: Add SATISFACTION_LABELS import**

Add to the imports in `frontend/src/app/escalation/[id]/page.tsx`:

```typescript
import { SATISFACTION_LABELS } from "@/lib/constants";
```

(If `SATISFACTION_LABELS` is not already imported from constants.)

- [ ] **Step 2: Add satisfaction score display**

In the escalation page header section, find the line that shows the current level (the `Level {currentLevel}/{maxLevel}` text). Add the satisfaction score display next to or below it.

Find the header area that shows level info and add after the level indicator:

```tsx
{/* Satisfaction Score */}
{escalation && (() => {
  const sat = SATISFACTION_LABELS[escalation.current_level] ?? SATISFACTION_LABELS[0];
  return (
    <motion.div
      key={escalation.current_level}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 text-sm"
    >
      <span className="text-xl">{sat.emoji}</span>
      <span className="text-[#6b6b8a]">{sat.label}</span>
    </motion.div>
  );
})()}
```

This requires reading the exact page structure to place correctly. The implementer should read the full escalation page and find the header metrics section.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/escalation/[id]/page.tsx
git commit -m "feat(frontend): add Karen's Satisfaction Score to escalation header"
```

---

### Task 13: LevelCard + EscalationTimeline Updates

**Files:**
- Modify: `frontend/src/components/EscalationTimeline.tsx`
- Modify: `frontend/src/components/LevelCard.tsx`

- [ ] **Step 1: Update EscalationTimeline to handle research events**

In `frontend/src/components/EscalationTimeline.tsx`, update the `useMemo` hook to also recognize `research_step` and `research_discovery` events — these should be associated with Level 4. The timeline already groups by level number, so research events at Level 4 will naturally group.

Add `"research_step"` and `"research_discovery"` to the EVENT_TYPES array in `frontend/src/hooks/useEscalation.ts` if not already present.

- [ ] **Step 2: Update LevelCard to show research animation**

In `frontend/src/components/LevelCard.tsx`, when the level is 4 and the channel is "research", render the `ResearchAnimation` component instead of the normal message preview.

Add import at top of LevelCard.tsx:
```tsx
import ResearchAnimation from "./ResearchAnimation";
```

In the expanded content section, add a check:
```tsx
{level === 4 && (
  <ResearchAnimation events={researchEvents} />
)}
```

Where `researchEvents` are the research_step and research_discovery events filtered from the parent's event list. The implementer will need to thread these events through as a prop or filter them from the global events list.

- [ ] **Step 3: Add FedEx rate display in LevelCard**

For Level 10, find `fedex_rate` events and display the rate:

```tsx
{fedexRate && (
  <div className="mt-2 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-3 py-2 text-sm">
    <span className="text-[#f59e0b] font-mono">
      ${fedexRate.rate} — {fedexRate.service} to {fedexRate.destination}
    </span>
  </div>
)}
```

- [ ] **Step 4: Update useEscalation.ts EVENT_TYPES**

In `frontend/src/hooks/useEscalation.ts`, add the new event types to the EVENT_TYPES array:

```typescript
const EVENT_TYPES = [
  "escalation_started",
  "level_start",
  "level_complete",
  "level_skipped",
  "commentary",
  "response_detected",
  "payment_detected",
  "deescalation_step",
  "complete",
  "error",
  "audio",
  "research_step",
  "research_discovery",
  "fedex_rate",
];
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/EscalationTimeline.tsx frontend/src/components/LevelCard.tsx frontend/src/hooks/useEscalation.ts
git commit -m "feat(frontend): research animation in timeline, FedEx rate display, new event types"
```

---

### Task 14: Infrastructure — dev.sh + Requirements

**Files:**
- Modify: `dev.sh`

- [ ] **Step 1: Add research cache pre-check to dev.sh**

Add after the frontend `.env.local` check (after line 48) and before the "Install frontend deps" section:

```bash
# ── Research cache validation ────────────────────────────────────────

echo "Checking research cache..."
python3 -c "
import json, sys
cache_path = '$ROOT_DIR/backend/data/research_cache.json'
try:
    with open(cache_path) as f:
        cache = json.load(f)
except FileNotFoundError:
    print('ERROR: research_cache.json not found at ' + cache_path)
    print('Create it from the template in the v2 design spec.')
    sys.exit(1)

target = cache.get('bharath', {})
unfilled = [k for k, v in target.items() if isinstance(v, str) and 'FILL' in v]
if unfilled:
    print(f'ERROR: research_cache.json has unfilled fields for bharath: {unfilled}')
    sys.exit(1)
print('✓ Research cache OK')
" || exit 1
```

- [ ] **Step 2: Commit**

```bash
git add dev.sh
git commit -m "chore(dev): add research cache pre-check to startup script"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] L1 Email — existing, no change needed
- [x] L2 SMS — new LEVEL_CHANNELS (Task 8)
- [x] L3 WhatsApp + Voice (fire-and-forget) — Task 7 (machineDetection), Task 8 (ladder)
- [x] L4 OSINT Research + SMS payoff — Tasks 1, 2, 8 (research_cache, research_service, _run_research_level)
- [x] L5 Email CC — Tasks 6, 7, 8 (channel rules, email_cc dispatch, CC from research cache)
- [x] L6 Slack — Tasks 3, 7 (slack_service, _send_slack)
- [x] L7 Discord — existing, no change
- [x] L8 Calendar — Tasks 4, 7 (calendar_service, _send_calendar)
- [x] L9 GitHub — existing, moved from L8 in LEVEL_CHANNELS
- [x] L10 FedEx + rate + QR — Tasks 5, 8 (fedex_service, _emit_fedex_rate, QR in PDF)
- [x] Satisfaction Score — Tasks 10, 12 (SATISFACTION_LABELS, header component)
- [x] Research animation — Tasks 11, 13 (ResearchAnimation, LevelCard integration)
- [x] New SSE events — Tasks 1, 10 (backend + frontend types)
- [x] De-escalation — Task 9 (Slack delete, Calendar delete, remove LinkedIn)
- [x] Personality updates — Task 6 (_LEVEL_CONTEXT, _CHANNEL_RULES)
- [x] dev.sh pre-check — Task 14
- [x] Requirements.txt — Task 5

**Placeholder scan:** No TBD/TODO/placeholders found.

**Type consistency:** `ResearchResult` dataclass fields match `research_cache.json` keys. `research_step`/`research_discovery`/`fedex_rate` event types match across backend schemas and frontend types. `SATISFACTION_LABELS` keys 0-10 match level range. `slack_message_ts` and `calendar_event_id` metadata keys are consistent between channel_service and deescalation_service.
