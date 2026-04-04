# Audio Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ElevenLabs TTS voice-overs, pre-recorded quips, and progressive-distortion background music to Karen's escalation flow.

**Architecture:** Backend generates all TTS via ElevenLabs SDK, saves mp3s to disk, serves via new `/api/audio/` endpoint. Frontend plays voice clips via HTMLAudioElement and applies real-time Web Audio effects to looping background music. Pre-recorded quips play instantly on level fire; on-the-fly commentary TTS plays during the countdown between levels.

**Tech Stack:** ElevenLabs Python SDK (`elevenlabs`), FastAPI static file serving, Web Audio API (frontend effects chain), HTMLAudioElement (frontend voice playback).

**Spec:** `docs/superpowers/specs/2026-03-31-audio-integration-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/services/audio_service.py` | Create | ElevenLabs TTS wrapper, quip pool loader |
| `backend/routers/audio.py` | Create | `GET /api/audio/{path}` static file serve |
| `backend/scripts/generate_quips.py` | Create | One-time quip generation script |
| `backend/models/schemas.py` | Modify | Add `DEMO_10S` speed, `AudioEvent` SSE model |
| `backend/services/karen_service.py` | Modify | Wire audio into ladder loop + new SSE events |
| `backend/main.py` | Modify | Mount audio router |
| `backend/requirements.txt` | Modify | Add `elevenlabs` |
| `frontend/src/lib/types.ts` | Modify | Add `audio` event type, `demo_10s` speed |
| `frontend/src/lib/constants.ts` | Modify | Add `demo_10s` speed label + seconds mapping |
| `frontend/src/hooks/useKarenAudio.ts` | Create | Voice clip playback queue |
| `frontend/src/hooks/useBackgroundMusic.ts` | Create | Music loop + Web Audio effects chain |
| `frontend/src/hooks/useEscalation.ts` | Modify | Add `audio` to SSE event types |
| `frontend/src/app/escalation/[id]/page.tsx` | Modify | Wire audio hooks, remove beep tones, add autoplay gate |
| `frontend/src/app/trigger/page.tsx` | Modify | Add `demo_10s` to speed selector |

---

### Task 1: Add `elevenlabs` dependency

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add elevenlabs to requirements.txt**

Add this line after the existing `anthropic` line:

```
elevenlabs>=1.0.0
```

Full file after edit:

```
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
pydantic>=2.10.0
python-dotenv>=1.1.0
sse-starlette>=2.2.0
httpx>=0.28.0
python-multipart>=0.0.18
google-genai>=1.14.0
anthropic>=0.42.0
weasyprint>=63.0
elevenlabs>=1.0.0
```

- [ ] **Step 2: Rebuild backend container**

Run: `cd /Users/rahilsinghi/Desktop/Karen && docker compose up -d --build backend`

Expected: Container rebuilds with `elevenlabs` installed.

- [ ] **Step 3: Verify installation**

Run: `docker compose exec backend python -c "import elevenlabs; print('ok')"`

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: add elevenlabs SDK dependency"
```

---

### Task 2: Add `DEMO_10S` speed + `AudioEvent` schema

**Files:**
- Modify: `backend/models/schemas.py:90-95` (EscalationSpeed enum)
- Modify: `backend/models/schemas.py:200-210` (KarenEvent union)
- Modify: `backend/services/karen_service.py:41-46` (SPEED_SECONDS dict)

- [ ] **Step 1: Add DEMO_10S to EscalationSpeed enum**

In `backend/models/schemas.py`, change the `EscalationSpeed` enum:

```python
class EscalationSpeed(str, Enum):
    DEMO = "demo"          # 5s
    DEMO_10S = "demo_10s"  # 10s (with audio)
    QUICK = "quick"        # 10m
    STANDARD = "standard"  # 1h
    PATIENT = "patient"    # 1d
```

- [ ] **Step 2: Add AudioEvent model**

In `backend/models/schemas.py`, add before the `KarenEvent` union type:

```python
class AudioEvent(BaseModel):
    type: Literal["audio"] = "audio"
    audio_type: Literal["quip", "commentary"]
    audio_url: str
    text: str = ""
```

- [ ] **Step 3: Add AudioEvent to KarenEvent union**

Update the `KarenEvent` union to include `AudioEvent`:

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
)
```

- [ ] **Step 4: Add DEMO_10S to SPEED_SECONDS in karen_service.py**

In `backend/services/karen_service.py`, update `SPEED_SECONDS`:

```python
SPEED_SECONDS: dict[EscalationSpeed, float] = {
    EscalationSpeed.DEMO: 5,
    EscalationSpeed.DEMO_10S: 10,
    EscalationSpeed.QUICK: 600,
    EscalationSpeed.STANDARD: 3600,
    EscalationSpeed.PATIENT: 86400,
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/models/schemas.py backend/services/karen_service.py
git commit -m "feat(schemas): add DEMO_10S speed and AudioEvent SSE model"
```

---

### Task 3: Create audio service (`backend/services/audio_service.py`)

**Files:**
- Create: `backend/services/audio_service.py`

- [ ] **Step 1: Create the audio service**

Create `backend/services/audio_service.py`:

```python
from __future__ import annotations

import os
import random
from pathlib import Path

from elevenlabs import ElevenLabs

from models.schemas import Personality

# ── Configuration ───────────────────────────────────────────────────────────

_client: ElevenLabs | None = None
_MODEL = "eleven_turbo_v2_5"

# Per-personality voice settings: (speed, stability, similarity_boost, style)
VOICE_SETTINGS: dict[Personality, dict] = {
    Personality.PASSIVE_AGGRESSIVE: {
        "speed": 0.85,
        "stability": 0.8,
        "similarity_boost": 0.8,
        "style": 0.4,
    },
    Personality.CORPORATE: {
        "speed": 1.15,
        "stability": 0.9,
        "similarity_boost": 0.8,
        "style": 0.1,
    },
    Personality.GENUINELY_CONCERNED: {
        "speed": 0.9,
        "stability": 0.5,
        "similarity_boost": 0.8,
        "style": 0.6,
    },
    Personality.LIFE_COACH: {
        "speed": 0.8,
        "stability": 0.6,
        "similarity_boost": 0.8,
        "style": 0.7,
    },
}

# Directories
_QUIP_DIR = Path(__file__).parent.parent / "audio" / "quips"
_MUSIC_DIR = Path(__file__).parent.parent / "audio" / "music"
_TMP_AUDIO_DIR = Path("/tmp/karen_audio")


def _get_client() -> ElevenLabs:
    global _client
    if _client is None:
        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            raise RuntimeError("ELEVENLABS_API_KEY not set")
        _client = ElevenLabs(api_key=api_key)
    return _client


def _get_voice_id() -> str:
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID")
    if not voice_id:
        raise RuntimeError("ELEVENLABS_VOICE_ID not set")
    return voice_id


# ── TTS Generation ──────────────────────────────────────────────────────────


async def generate_tts(
    text: str,
    personality: Personality,
    output_path: Path,
) -> Path:
    """Generate an mp3 from text using ElevenLabs. Saves to output_path."""
    import asyncio

    client = _get_client()
    voice_id = _get_voice_id()
    settings = VOICE_SETTINGS.get(personality, VOICE_SETTINGS[Personality.PASSIVE_AGGRESSIVE])

    # ElevenLabs SDK is synchronous — run in executor
    def _generate() -> bytes:
        audio_iter = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=_MODEL,
            voice_settings={
                "stability": settings["stability"],
                "similarity_boost": settings["similarity_boost"],
                "style": settings["style"],
                "speed": settings["speed"],
            },
        )
        # convert returns an iterator of bytes chunks
        return b"".join(audio_iter)

    audio_bytes = await asyncio.get_event_loop().run_in_executor(None, _generate)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(audio_bytes)
    return output_path


# ── Commentary TTS (on-the-fly) ─────────────────────────────────────────────


async def generate_commentary_audio(
    text: str,
    personality: Personality,
    escalation_id: str,
    level: int,
) -> str:
    """Generate commentary TTS for a specific level. Returns relative URL path."""
    esc_dir = _TMP_AUDIO_DIR / escalation_id
    filename = f"commentary_L{level}.mp3"
    output_path = esc_dir / filename

    await generate_tts(text, personality, output_path)

    return f"/api/audio/tmp/{escalation_id}/{filename}"


# ── Quip Pool ───────────────────────────────────────────────────────────────


def get_random_quip(personality: Personality) -> str | None:
    """Pick a random pre-recorded quip mp3. Returns URL path or None if no quips exist."""
    quip_dir = _QUIP_DIR / personality.value
    if not quip_dir.exists():
        return None
    quips = list(quip_dir.glob("*.mp3"))
    if not quips:
        return None
    chosen = random.choice(quips)
    return f"/api/audio/quips/{personality.value}/{chosen.name}"


# ── Music path ──────────────────────────────────────────────────────────────


def get_music_url() -> str:
    """Return the URL for the background hold music."""
    return "/api/audio/music/hold-music.mp3"


# ── File resolution (for the audio router) ──────────────────────────────────


def resolve_audio_path(url_path: str) -> Path | None:
    """Resolve a relative audio URL to an absolute filesystem path.

    Accepted prefixes:
      /api/audio/tmp/{esc_id}/{file}  -> /tmp/karen_audio/{esc_id}/{file}
      /api/audio/quips/{pers}/{file}  -> backend/audio/quips/{pers}/{file}
      /api/audio/music/{file}         -> backend/audio/music/{file}
    """
    # Strip the /api/audio/ prefix
    stripped = url_path.removeprefix("/api/audio/")

    if stripped.startswith("tmp/"):
        relative = stripped.removeprefix("tmp/")
        candidate = _TMP_AUDIO_DIR / relative
    elif stripped.startswith("quips/"):
        relative = stripped.removeprefix("quips/")
        candidate = _QUIP_DIR / relative
    elif stripped.startswith("music/"):
        relative = stripped.removeprefix("music/")
        candidate = _MUSIC_DIR / relative
    else:
        return None

    # Prevent path traversal
    try:
        candidate = candidate.resolve()
    except (OSError, ValueError):
        return None

    allowed_roots = [_TMP_AUDIO_DIR.resolve(), _QUIP_DIR.resolve(), _MUSIC_DIR.resolve()]
    if not any(str(candidate).startswith(str(root)) for root in allowed_roots):
        return None

    if candidate.exists() and candidate.is_file():
        return candidate
    return None
```

- [ ] **Step 2: Create audio directories**

Run:
```bash
mkdir -p /Users/rahilsinghi/Desktop/Karen/backend/audio/quips/{passive_aggressive,corporate,genuinely_concerned,life_coach}
mkdir -p /Users/rahilsinghi/Desktop/Karen/backend/audio/music
```

- [ ] **Step 3: Add .gitkeep files so empty dirs are tracked**

Run:
```bash
touch /Users/rahilsinghi/Desktop/Karen/backend/audio/quips/passive_aggressive/.gitkeep
touch /Users/rahilsinghi/Desktop/Karen/backend/audio/quips/corporate/.gitkeep
touch /Users/rahilsinghi/Desktop/Karen/backend/audio/quips/genuinely_concerned/.gitkeep
touch /Users/rahilsinghi/Desktop/Karen/backend/audio/quips/life_coach/.gitkeep
touch /Users/rahilsinghi/Desktop/Karen/backend/audio/music/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add backend/services/audio_service.py backend/audio/
git commit -m "feat(audio): add ElevenLabs audio service with quip pool and commentary TTS"
```

---

### Task 4: Create audio router (`backend/routers/audio.py`)

**Files:**
- Create: `backend/routers/audio.py`
- Modify: `backend/main.py:9,28` (import + mount)

- [ ] **Step 1: Create the audio router**

Create `backend/routers/audio.py`:

```python
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from services.audio_service import resolve_audio_path, get_music_url

router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/{path:path}")
async def serve_audio(path: str) -> FileResponse:
    """Serve audio files (quips, commentary, music)."""
    full_url = f"/api/audio/{path}"
    resolved = resolve_audio_path(full_url)
    if resolved is None:
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=str(resolved),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )
```

- [ ] **Step 2: Mount the router in main.py**

In `backend/main.py`, add the import:

```python
from routers.audio import router as audio_router
```

And add the router mount after the existing router includes:

```python
app.include_router(audio_router)
```

The imports block should look like:

```python
from routers.escalation import router as escalation_router
from routers.members import load_members, router as members_router
from routers.webhook import router as webhook_router
from routers.audio import router as audio_router
```

And the router block:

```python
app.include_router(members_router)
app.include_router(escalation_router)
app.include_router(webhook_router)
app.include_router(audio_router)
```

- [ ] **Step 3: Verify endpoint loads**

Run: `docker compose up -d --build backend && sleep 3 && docker compose exec backend curl -s http://localhost:8000/api/audio/music/hold-music.mp3 -o /dev/null -w "%{http_code}"`

Expected: `404` (file doesn't exist yet, but the route is mounted and responding)

- [ ] **Step 4: Commit**

```bash
git add backend/routers/audio.py backend/main.py
git commit -m "feat(audio): add audio file serving endpoint"
```

---

### Task 5: Create quip generation script (`backend/scripts/generate_quips.py`)

**Files:**
- Create: `backend/scripts/generate_quips.py`

- [ ] **Step 1: Create the script**

Create `backend/scripts/generate_quips.py`:

```python
#!/usr/bin/env python3
"""One-time script to generate Karen's pre-recorded quip pool via ElevenLabs.

Usage (inside backend container):
    docker compose exec backend python scripts/generate_quips.py

Generates ~15 quips per personality, saves to backend/audio/quips/{personality}/.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Add parent dir so we can import from backend modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.schemas import Personality
from services.audio_service import generate_tts

QUIP_DIR = Path(__file__).parent.parent / "audio" / "quips"

# Generic one-liners that work for any escalation
QUIPS: dict[Personality, list[str]] = {
    Personality.PASSIVE_AGGRESSIVE: [
        "Sent.",
        "Noted.",
        "Interesting.",
        "I'll wait.",
        "He's online. I noticed.",
        "Read receipt received.",
        "Delivering.",
        "This is fine.",
        "Proceeding.",
        "Acknowledged.",
        "Moving on.",
        "Escalating.",
        "As expected.",
        "They'll respond. They always do.",
        "I have all day.",
    ],
    Personality.CORPORATE: [
        "Sent per timeline.",
        "Action item delivered.",
        "Noted for the record.",
        "Flagged for visibility.",
        "Escalating per protocol.",
        "Delivering as discussed.",
        "Proceeding as planned.",
        "Acknowledged. Moving to next action.",
        "Logged and delivered.",
        "On track. Next milestone approaching.",
        "Visibility increased.",
        "Stakeholder notified.",
        "Follow-up dispatched.",
        "Per our previous discussion.",
        "Aligning on next steps.",
    ],
    Personality.GENUINELY_CONCERNED: [
        "I just want to help.",
        "Sent with care.",
        "I hope they're okay.",
        "Just checking in.",
        "This matters.",
        "Reaching out again.",
        "I care about this.",
        "Sending with love.",
        "I believe in resolution.",
        "Nobody wants this to escalate.",
        "Almost there.",
        "They'll come around.",
        "Friendship is worth it.",
        "I'm here for both of you.",
        "One more try.",
    ],
    Personality.LIFE_COACH: [
        "Growth requires follow-through.",
        "Sent with intention.",
        "Accountability delivered.",
        "The universe is listening.",
        "Energy flows where attention goes.",
        "Showing up matters.",
        "Integrity in action.",
        "Another step forward.",
        "Trust the process.",
        "Alignment is near.",
        "Boundaries create freedom.",
        "This is the work.",
        "Presence over avoidance.",
        "Delivered with purpose.",
        "The journey continues.",
    ],
}


async def main() -> None:
    total = sum(len(v) for v in QUIPS.values())
    print(f"Generating {total} quips across {len(QUIPS)} personalities...")

    for personality, lines in QUIPS.items():
        out_dir = QUIP_DIR / personality.value
        out_dir.mkdir(parents=True, exist_ok=True)

        for i, text in enumerate(lines, 1):
            filename = f"quip_{i:02d}.mp3"
            out_path = out_dir / filename

            if out_path.exists():
                print(f"  [{personality.value}] {filename} already exists, skipping")
                continue

            print(f"  [{personality.value}] Generating {filename}: \"{text}\"")
            try:
                await generate_tts(text, personality, out_path)
            except Exception as e:
                print(f"  ERROR: {e}")
                continue

    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Commit**

```bash
git add backend/scripts/generate_quips.py
git commit -m "feat(audio): add quip generation script for ElevenLabs TTS"
```

Note: Don't run the script yet — we need `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` set in `.env` first. Running the script is a manual step during setup.

---

### Task 6: Wire audio into the escalation ladder

**Files:**
- Modify: `backend/services/karen_service.py:1-17` (imports)
- Modify: `backend/services/karen_service.py:269-377` (inside `_run_ladder`, the per-channel loop and inter-level wait)

This is the core integration. Two audio events are emitted per level:
1. **Quip** — immediately after `level_complete`, from pre-recorded pool
2. **Commentary** — during the countdown wait, generated on-the-fly via ElevenLabs

- [ ] **Step 1: Add audio imports to karen_service.py**

Add to the imports at the top of `backend/services/karen_service.py`:

```python
from services.audio_service import generate_commentary_audio, get_random_quip
```

- [ ] **Step 2: Emit quip audio after level_complete**

In `_run_ladder`, after the `level_complete` and `commentary` emissions (after line 347 in the current file), add quip emission:

Find this block at the end of the per-channel for loop:

```python
            _emit(escalation_id, {
                "type": "commentary",
                "text": generated.karen_commentary,
                "timestamp": datetime.utcnow().isoformat(),
            })

            if not result.success:
```

Insert between the commentary emit and the failure check:

```python
            # Emit quip audio (pre-recorded, instant)
            quip_url = get_random_quip(esc.personality)
            if quip_url:
                _emit(escalation_id, {
                    "type": "audio",
                    "audio_type": "quip",
                    "audio_url": quip_url,
                    "text": "",
                })
```

- [ ] **Step 3: Generate and emit commentary audio during countdown**

In `_run_ladder`, find the inter-level wait block (the `if level < esc.max_level:` section near the end):

```python
        # Wait for the interval before next level
        if level < esc.max_level:
            # Sleep in small chunks so we can respond to status changes
            elapsed = 0.0
            while elapsed < interval:
                if esc.status in (
                    EscalationStatus.DEESCALATING,
                    EscalationStatus.RESOLVED,
                ):
                    return
                await asyncio.sleep(min(0.5, interval - elapsed))
                elapsed += 0.5
```

Replace with:

```python
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
```

- [ ] **Step 4: Verify backend starts cleanly**

Run: `docker compose up -d --build backend && sleep 3 && docker compose logs backend --tail=20`

Expected: No import errors. FastAPI starts normally.

- [ ] **Step 5: Commit**

```bash
git add backend/services/karen_service.py
git commit -m "feat(audio): wire quip and commentary TTS into escalation ladder"
```

---

### Task 7: Update frontend types and constants

**Files:**
- Modify: `frontend/src/lib/types.ts:75-84` (KarenEvent union)
- Modify: `frontend/src/lib/types.ts:33` (EscalationSpeed type)
- Modify: `frontend/src/lib/constants.ts:50-55` (SPEED_LABELS)
- Modify: `frontend/src/app/escalation/[id]/page.tsx:75-79` (SPEED_SECONDS)

- [ ] **Step 1: Add audio event type and demo_10s speed**

In `frontend/src/lib/types.ts`, update `EscalationSpeed`:

```typescript
export type EscalationSpeed = "demo" | "demo_10s" | "quick" | "standard" | "patient";
```

Add the audio event to the `KarenEvent` union (before the closing semicolon):

```typescript
export type KarenEvent =
  | { type: "level_start"; level: number; channel: string; message_preview: string }
  | { type: "level_complete"; level: number; channel: string; karen_note: string }
  | { type: "level_skipped"; level: number; reason: string }
  | { type: "commentary"; text: string; timestamp: string }
  | { type: "response_detected"; from: string; preview: string }
  | { type: "payment_detected"; amount: number; from: string }
  | { type: "deescalation_step"; action: string; status: "ok" | "failed"; karen_note?: string }
  | { type: "complete"; karen_closing: string }
  | { type: "error"; message: string }
  | { type: "audio"; audio_type: "quip" | "commentary"; audio_url: string; text?: string };
```

- [ ] **Step 2: Add demo_10s to constants**

In `frontend/src/lib/constants.ts`, update `SPEED_LABELS`:

```typescript
export const SPEED_LABELS: Record<string, string> = {
  demo: "5s (Demo)",
  demo_10s: "10s (Demo + Audio)",
  quick: "10m (Quick)",
  standard: "1h (Standard)",
  patient: "1d (Patient)",
};
```

- [ ] **Step 3: Add demo_10s to SPEED_SECONDS in escalation page**

In `frontend/src/app/escalation/[id]/page.tsx`, update `SPEED_SECONDS`:

```typescript
const SPEED_SECONDS: Record<string, number> = {
  demo: 5,
  demo_10s: 10,
  quick: 600,
  standard: 3600,
  patient: 86400,
};
```

- [ ] **Step 4: Add `audio` to SSE event types in useEscalation**

In `frontend/src/hooks/useEscalation.ts`, update `EVENT_TYPES`:

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
] as const;
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/constants.ts frontend/src/hooks/useEscalation.ts frontend/src/app/escalation/\[id\]/page.tsx
git commit -m "feat(frontend): add audio event type and demo_10s speed option"
```

---

### Task 8: Create `useKarenAudio` hook

**Files:**
- Create: `frontend/src/hooks/useKarenAudio.ts`

- [ ] **Step 1: Create the hook**

Create `frontend/src/hooks/useKarenAudio.ts`:

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";
import type { KarenEvent } from "@/lib/types";

interface UseKarenAudioOptions {
  /** Called when a voice clip starts playing */
  onPlayStart?: () => void;
  /** Called when a voice clip finishes playing */
  onPlayEnd?: () => void;
}

/**
 * Manages Karen's voice audio playback — quips and commentary.
 * Queues clips so they play sequentially (quip first, then commentary).
 * Emits play start/end callbacks for music ducking.
 */
export function useKarenAudio(
  events: KarenEvent[],
  options: UseKarenAudioOptions = {}
) {
  const { onPlayStart, onPlayEnd } = options;
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const lastProcessedRef = useRef(0);
  const onPlayStartRef = useRef(onPlayStart);
  const onPlayEndRef = useRef(onPlayEnd);

  // Keep callback refs current
  onPlayStartRef.current = onPlayStart;
  onPlayEndRef.current = onPlayEnd;

  const playNext = useCallback(() => {
    if (playingRef.current || queueRef.current.length === 0) return;

    const url = queueRef.current.shift()!;
    playingRef.current = true;
    onPlayStartRef.current?.();

    const audio = new Audio(`${API_URL}${url}`);
    audio.volume = 0.9;

    audio.onended = () => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      // Play next in queue if any
      playNext();
    };

    audio.onerror = () => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      // Skip failed audio, try next
      playNext();
    };

    audio.play().catch(() => {
      playingRef.current = false;
      onPlayEndRef.current?.();
      playNext();
    });
  }, []);

  // Process new audio events
  useEffect(() => {
    if (events.length <= lastProcessedRef.current) return;

    const newEvents = events.slice(lastProcessedRef.current);
    lastProcessedRef.current = events.length;

    for (const event of newEvents) {
      if (event.type === "audio" && event.audio_url) {
        queueRef.current.push(event.audio_url);
      }
    }

    // Try to start playback
    playNext();
  }, [events, playNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueRef.current = [];
      playingRef.current = false;
    };
  }, []);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useKarenAudio.ts
git commit -m "feat(frontend): add useKarenAudio hook for voice clip playback"
```

---

### Task 9: Create `useBackgroundMusic` hook

**Files:**
- Create: `frontend/src/hooks/useBackgroundMusic.ts`

- [ ] **Step 1: Create the hook**

Create `frontend/src/hooks/useBackgroundMusic.ts`:

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "@/lib/constants";

/**
 * Background music with progressive Web Audio distortion effects.
 * Music starts clean (levels 1-2) and becomes increasingly distorted
 * through level 10 (full chaos).
 *
 * Effect chain: source → filter → waveshaper → gain → destination
 */
export function useBackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const distortionRef = useRef<WaveShaperNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);
  const levelRef = useRef(0);
  const normalVolumeRef = useRef(0.3);

  // Generate distortion curve
  const makeDistortionCurve = useCallback((amount: number): Float32Array => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) /
        (Math.PI / 2 + amount * Math.abs(x));
    }
    return curve;
  }, []);

  // Fetch and decode the music file
  const loadMusic = useCallback(async () => {
    if (bufferRef.current) return; // Already loaded

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const response = await fetch(`${API_URL}/api/audio/music/hold-music.mp3`);
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      bufferRef.current = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      // Music is optional — don't break anything
    }
  }, []);

  const start = useCallback(async () => {
    if (playingRef.current) return;

    await loadMusic();

    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // Create nodes
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20000; // Start fully open
    filter.Q.value = 1;

    const distortion = ctx.createWaveShaperNode();
    distortion.curve = makeDistortionCurve(0);
    distortion.oversample = "4x";

    const gain = ctx.createGain();
    gain.gain.value = normalVolumeRef.current;

    // LFO for pitch warble (starts disconnected)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0;
    lfoGain.gain.value = 0;
    lfo.connect(lfoGain);
    lfoGain.connect(source.detune);
    lfo.start();

    // Chain: source → filter → distortion → gain → destination
    source.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    sourceRef.current = source;
    filterRef.current = filter;
    distortionRef.current = distortion;
    gainRef.current = gain;
    lfoRef.current = lfo;
    lfoGainRef.current = lfoGain;
    playingRef.current = true;
  }, [loadMusic, makeDistortionCurve]);

  const stop = useCallback(() => {
    try {
      sourceRef.current?.stop();
      lfoRef.current?.stop();
    } catch {
      // Already stopped
    }
    playingRef.current = false;
    sourceRef.current = null;
  }, []);

  // Duck volume when Karen speaks
  const duck = useCallback(() => {
    if (!gainRef.current || !ctxRef.current) return;
    gainRef.current.gain.linearRampToValueAtTime(
      0.06, // ~20% of normal
      ctxRef.current.currentTime + 0.3
    );
  }, []);

  // Restore volume after Karen finishes speaking
  const unduck = useCallback(() => {
    if (!gainRef.current || !ctxRef.current) return;
    gainRef.current.gain.linearRampToValueAtTime(
      normalVolumeRef.current,
      ctxRef.current.currentTime + 0.5
    );
  }, []);

  // Apply effects based on escalation level
  const setLevel = useCallback(
    (level: number) => {
      levelRef.current = level;
      const filter = filterRef.current;
      const distortion = distortionRef.current;
      const lfo = lfoRef.current;
      const lfoGain = lfoGainRef.current;
      const source = sourceRef.current;
      if (!filter || !distortion || !lfo || !lfoGain) return;

      if (level <= 2) {
        // Clean
        filter.frequency.value = 20000;
        distortion.curve = makeDistortionCurve(0);
        lfo.frequency.value = 0;
        lfoGain.gain.value = 0;
        if (source) source.playbackRate.value = 1.0;
      } else if (level <= 4) {
        // Slight filter + pitch drop
        filter.frequency.value = 8000;
        distortion.curve = makeDistortionCurve(2);
        lfo.frequency.value = 0;
        lfoGain.gain.value = 0;
        if (source) source.playbackRate.value = 0.97;
      } else if (level <= 6) {
        // More aggressive
        filter.frequency.value = 4000;
        distortion.curve = makeDistortionCurve(10);
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 20;
        if (source) source.playbackRate.value = 0.95;
      } else if (level <= 8) {
        // Heavy distortion + warble
        filter.frequency.value = 2500;
        distortion.curve = makeDistortionCurve(30);
        lfo.frequency.value = 2;
        lfoGain.gain.value = 50;
        if (source) source.playbackRate.value = 0.92;
      } else if (level === 9) {
        // All effects cranked
        filter.frequency.value = 1500;
        distortion.curve = makeDistortionCurve(60);
        lfo.frequency.value = 4;
        lfoGain.gain.value = 100;
        if (source) source.playbackRate.value = 0.88;
      } else {
        // Level 10: full chaos
        filter.frequency.value = 800;
        distortion.curve = makeDistortionCurve(100);
        lfo.frequency.value = 8;
        lfoGain.gain.value = 200;
        if (source) source.playbackRate.value = 0.85;
      }
    },
    [makeDistortionCurve]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [stop]);

  return { start, stop, duck, unduck, setLevel };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useBackgroundMusic.ts
git commit -m "feat(frontend): add useBackgroundMusic hook with progressive distortion effects"
```

---

### Task 10: Wire audio hooks into escalation page

**Files:**
- Modify: `frontend/src/app/escalation/[id]/page.tsx`

This task replaces the old beep tone system with the new audio hooks and adds an autoplay gate.

- [ ] **Step 1: Remove old audio code (lines 20-69)**

Remove the entire block from `let audioCtx: AudioContext | null = null;` through `function playLevelCompleteTone(level: number)` (the `getAudioCtx`, `playTone`, `playLevelStartTone`, `playLevelCompleteTone` functions).

- [ ] **Step 2: Add new audio imports**

Add to the imports at the top of the file:

```typescript
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
```

- [ ] **Step 3: Add audio hooks inside the component**

Inside the `EscalationPage` component, after the existing `useCircle()` call and `paymentPending` state, add:

```typescript
  // --- Audio ---
  const [audioEnabled, setAudioEnabled] = useState(false);
  const music = useBackgroundMusic();

  useKarenAudio(audioEnabled ? events : [], {
    onPlayStart: music.duck,
    onPlayEnd: music.unduck,
  });
```

- [ ] **Step 4: Replace old sound effect useEffect**

Find the `// --- Sound notifications on level events ---` useEffect and replace the entire block with:

```typescript
  // --- Audio: start music on escalation_started, update level on level_start ---
  useEffect(() => {
    if (!audioEnabled) return;

    const prevCount = prevEventCountRef.current;
    if (events.length <= prevCount) return;

    const newEvents = events.slice(prevCount);
    prevEventCountRef.current = events.length;

    // Skip on initial SSE replay batch
    if (prevCount === 0) return;

    for (const event of newEvents) {
      if (event.type === "escalation_started") {
        music.start();
      } else if (event.type === "level_start") {
        music.setLevel(event.level);
      } else if (event.type === "complete") {
        music.stop();
      }
    }
  }, [events, audioEnabled, music]);
```

Note: also handle the `escalation_started` event — add `"escalation_started"` to the SSE EVENT_TYPES in `useEscalation.ts` if not already present (it already is per the current code).

- [ ] **Step 5: Add autoplay gate overlay**

Before the main `return` of the component (after `if (!escalation)` loading state), add:

```typescript
  // Autoplay gate — browsers require user interaction before playing audio
  const audioGate = !audioEnabled && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center"
    >
      <button
        onClick={() => setAudioEnabled(true)}
        className="border border-karen text-karen font-mono text-sm px-6 py-3 hover:bg-karen/10 transition-colors"
      >
        Enable Karen&apos;s Voice 🔊
      </button>
    </motion.div>
  );
```

Then in the main return, render it:

```typescript
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <AnimatePresence>{audioGate}</AnimatePresence>
      {/* Header */}
      ...
```

- [ ] **Step 6: Verify frontend compiles**

Run: `cd /Users/rahilsinghi/Desktop/Karen/frontend && pnpm build`

Expected: Build succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/escalation/\[id\]/page.tsx
git commit -m "feat(frontend): wire audio hooks into escalation page, replace beep tones"
```

---

### Task 11: Source hold music file

**Files:**
- Add: `backend/audio/music/hold-music.mp3`

- [ ] **Step 1: Find and download a royalty-free corporate hold music mp3**

Options:
- Search Pixabay, Freesound, or similar CC0 audio sites for "corporate hold music" or "elevator music"
- Needs to be ~2-3 minutes, loopable, starts clean/pleasant
- Save to `backend/audio/music/hold-music.mp3`

- [ ] **Step 2: Verify the file plays**

Run: `file /Users/rahilsinghi/Desktop/Karen/backend/audio/music/hold-music.mp3`

Expected: `audio/mpeg` or similar audio type.

- [ ] **Step 3: Commit**

```bash
git add backend/audio/music/hold-music.mp3
git commit -m "feat(audio): add corporate hold music track"
```

---

### Task 12: Update .env.example and add ElevenLabs credentials

**Files:**
- Modify: `backend/.env.example`

- [ ] **Step 1: Add ElevenLabs env vars to .env.example**

Add to `backend/.env.example`:

```
# ElevenLabs TTS
ELEVENLABS_API_KEY=              # Creator plan API key
ELEVENLABS_VOICE_ID=             # Voice ID (e.g. Rachel: 21m00Tcm4TlvDq8ikWAM)
```

- [ ] **Step 2: Set real values in .env**

Add your actual ElevenLabs API key and chosen voice ID to `backend/.env` (not committed):

```
ELEVENLABS_API_KEY=<your-key>
ELEVENLABS_VOICE_ID=<chosen-voice-id>
```

To find the voice ID: Go to ElevenLabs → Voices → pick a voice → copy the Voice ID from the URL or settings panel.

- [ ] **Step 3: Commit .env.example only**

```bash
git add backend/.env.example
git commit -m "chore: add ElevenLabs env vars to .env.example"
```

---

### Task 13: End-to-end test

- [ ] **Step 1: Rebuild and start backend**

```bash
cd /Users/rahilsinghi/Desktop/Karen && docker compose down backend && docker compose up -d --build backend
```

- [ ] **Step 2: Generate quips (requires ELEVENLABS_API_KEY set in .env)**

```bash
docker compose exec backend python scripts/generate_quips.py
```

Expected: ~60 mp3 files generated across 4 personality directories.

- [ ] **Step 3: Verify quip files exist**

```bash
docker compose exec backend ls -la audio/quips/passive_aggressive/
```

Expected: ~15 `.mp3` files.

- [ ] **Step 4: Verify audio endpoint serves quips**

```bash
curl -s http://localhost:8000/api/audio/quips/passive_aggressive/quip_01.mp3 -o /tmp/test_quip.mp3 -w "%{http_code}"
```

Expected: `200` and a valid mp3 file.

- [ ] **Step 5: Start frontend and trigger escalation**

1. Start frontend: `cd /Users/rahilsinghi/Desktop/Karen/frontend && pnpm dev`
2. Open http://localhost:3000/trigger
3. Select speed: "10s (Demo + Audio)"
4. Hit "Unleash Karen"
5. On escalation page, click "Enable Karen's Voice"
6. Verify:
   - Background music starts playing
   - Quip audio plays after each level fires
   - Commentary audio plays during countdown
   - Music distortion increases with each level
   - Music ducks when Karen speaks

- [ ] **Step 6: Commit any fixes needed**

If anything broke during testing, fix and commit with descriptive messages.

---

### Optional: Visual sync (sidebar typewriter on audio play)

The spec mentions syncing sidebar typewriter to audio playback. Currently, commentary text appears via typewriter when the SSE event arrives, and audio follows ~2-3s later. For the hackathon demo with 10s intervals, this gap is natural and not jarring. If it bothers you, this can be added later by:

1. Passing an `audioPlayingText` prop from the escalation page to `KarenSidebar`
2. Having the sidebar delay typewriter for commentary entries until the matching audio event fires
3. Adding a subtle amber pulse/glow on the active bubble while audio plays

This is purely cosmetic polish — skip for now unless the demo feels off.
