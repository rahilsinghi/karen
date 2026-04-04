# Karen Audio Integration — Design Spec

**Date:** 2026-03-31
**Status:** Approved
**ElevenLabs subscription:** Creator plan, expires ~2026-04-14

---

## Overview

Add a full audio experience to Karen's escalation flow:
1. **Karen's voice** — ElevenLabs TTS one-liners and commentary for every escalation level
2. **Background music** — Corporate hold music that progressively distorts as levels escalate
3. **Demo interval** — 10-second intervals to give Karen time to speak between levels

All audio is generated/served by the backend. Frontend plays URLs and applies real-time effects to background music.

---

## Architecture: Backend-Centric Audio (Approach A)

Backend owns all TTS generation. Audio files are saved to disk and served via a new endpoint. Frontend receives audio URLs in SSE events and plays them. Background music is a static mp3 served from the backend with Web Audio effects applied client-side.

```
ElevenLabs API
     │
     ▼
audio_service.py ──► /tmp/karen_audio/{esc_id}/*.mp3
     │                        │
     ▼                        ▼
karen_service.py ──SSE──► frontend plays URL
                          (HTMLAudioElement for voice,
                           Web Audio API for music effects)
```

---

## 1. Audio Service (`backend/services/audio_service.py`)

### Responsibilities
- Wraps ElevenLabs Python SDK (`elevenlabs` package)
- Single voice ID configured via `ELEVENLABS_VOICE_ID` env var
- Per-personality voice settings (speed, stability, similarity_boost, style)
- Saves mp3s to `/tmp/karen_audio/{escalation_id}/`

### ElevenLabs Configuration

**Model:** `eleven_turbo_v2_5` — fastest, cheapest per character, sufficient quality for demo.

**Recommended voice:** "Rachel" — professional, clear, slightly warm. Configurable via env var.

**Character budget:** Creator plan ~100k chars/month. Each commentary ~100-200 chars. 10 levels x 200 chars = 2k per escalation. Pre-recorded quips ~1k chars one-time. Plenty of headroom.

### Personality Voice Settings

| Personality | Speed | Stability | Style | Vibe |
|-------------|-------|-----------|-------|------|
| passive_aggressive | 0.85 | 0.8 | 0.4 | Controlled, deliberate |
| corporate | 1.15 | 0.9 | 0.1 | Clipped, efficient |
| genuinely_concerned | 0.9 | 0.5 | 0.6 | Slightly wobbly, earnest |
| life_coach | 0.8 | 0.6 | 0.7 | Warm, deliberate |

### Methods

```python
async def generate_quip_audio(text: str, personality: Personality) -> str:
    """Generate a short quip mp3. Returns relative file path."""

async def generate_commentary_audio(
    text: str,
    personality: Personality,
    escalation_id: str,
    level: int,
) -> str:
    """Generate commentary mp3 for a specific level. Returns relative file path."""
```

---

## 2. Pre-Recorded Quip Pool

### Generation
- Script: `backend/scripts/generate_quips.py`
- Generates ~15-20 generic one-liners per personality via ElevenLabs
- Saved to `backend/audio/quips/{personality}/quip_01.mp3` etc.
- Run once during setup inside the backend container: `docker compose exec backend python scripts/generate_quips.py`
- One-time character cost (~1k chars total)

### Example Quips
"Sent.", "Noted.", "Interesting.", "I'll wait.", "He's online.",
"Read receipt received.", "Delivering.", "This is fine.", "Proceeding.",
"Acknowledged.", "Moving on.", "Escalating.", "As expected.",
"They'll respond. They always do.", "Continuing."

### Selection
Random pick per level-fire event from the matching personality's pool.

---

## 3. Escalation Ladder Integration

### Changes to `karen_service.py`

**On level fire (per-channel loop):**
1. After `send_channel()` completes, pick a random pre-recorded quip mp3
2. Include `quip_audio_url` in the `level_complete` SSE event

**During countdown (between levels):**
1. After emitting `commentary` SSE event, call `generate_commentary_audio(karen_commentary, personality)`
2. Emit new SSE event: `{ type: "audio", audio_type: "commentary", audio_url: "...", text: "..." }`
3. Async — countdown continues regardless. If ElevenLabs is slow, audio arrives late, frontend handles gracefully

### New SSE Event Types

```typescript
| { type: "audio"; audio_type: "quip"; audio_url: string }
| { type: "audio"; audio_type: "commentary"; audio_url: string; text: string }
```

### Modified SSE Events

`level_complete` gains: `quip_audio_url: string | null`

### New Endpoint

```
GET /api/audio/{path:path}
```
Serves files from `/tmp/karen_audio/` and `backend/audio/quips/` and `backend/audio/music/`.

### Demo Interval

New speed option: `DEMO_10S` (10 seconds) added to `EscalationSpeed` enum. Existing `DEMO` (5s) preserved for quick testing.

---

## 4. Background Music System

### Source
Single royalty-free corporate hold music mp3 (~2-3 min, loopable).
Served from `backend/audio/music/hold-music.mp3` via `/api/audio/music/hold-music.mp3`.

### Frontend Playback (`frontend/src/hooks/useBackgroundMusic.ts`)

Starts on `escalation_started` SSE event. Loops until completion/de-escalation.

**Web Audio effect chain:** source → filter → distortion → gain → destination

**Per-level effects:**

| Level | Effects |
|-------|---------|
| 1-2 | Clean. No effects. Pleasant hold music. |
| 3-4 | Slight low-pass filter, subtle pitch drop (-50 cents) |
| 5-6 | More aggressive filter, light distortion node, reverb increase |
| 7-8 | Heavy distortion, pitch warble (LFO modulation), bitcrusher effect |
| 9 | All effects cranked, stereo panning oscillation |
| 10 | Full chaos — ring modulator, extreme distortion, barely recognizable |

### Volume Ducking
When a voice clip plays, music drops to ~20% volume, fades back up when clip ends.

### Volume Hierarchy
1. Karen's voice (loudest)
2. Quip sounds (medium)
3. Background music (lowest, ducked during voice)

---

## 5. Frontend Audio Playback

### New Hook: `frontend/src/hooks/useKarenAudio.ts`

- Manages all voice audio playback (quips + commentary)
- Listens for `audio` SSE events from `useEscalation`
- Plays audio via `HTMLAudioElement`
- Queues audio if multiple clips arrive close together (quip first, commentary after)
- Emits `onPlayStart` / `onPlayEnd` callbacks so music hook can duck

### Integration with Existing Code

- Replace current Web Audio beep tones with quip system
- `useEscalation` hook passes `audio` events through to consumers
- Escalation page wires up: `useBackgroundMusic` + `useKarenAudio` + existing `useEscalation`

### Autoplay Gate

Browsers block autoplay until user interaction. On the escalation page, show a brief "Enable Karen's Voice" overlay button if AudioContext is suspended. One tap, then everything plays.

### Visual Sync

- Karen's sidebar commentary text highlights/pulses when audio plays
- Typewriter effect on commentary text starts when audio clip starts playing (not when SSE arrives)

---

## 6. File Structure

### New Files

```
backend/
├── services/audio_service.py          # ElevenLabs wrapper
├── routers/audio.py                   # GET /api/audio/{path}
├── scripts/generate_quips.py          # One-time quip generation
└── audio/
    ├── quips/                         # Pre-recorded quip mp3s
    │   ├── passive_aggressive/
    │   ├── corporate/
    │   ├── genuinely_concerned/
    │   └── life_coach/
    └── music/
        └── hold-music.mp3             # Royalty-free corporate hold music

frontend/src/
├── hooks/
│   ├── useBackgroundMusic.ts          # Music + Web Audio effects
│   └── useKarenAudio.ts              # Voice clip playback + queue
```

### Modified Files

```
backend/services/karen_service.py      # Audio calls in ladder + new SSE events
backend/main.py                        # Mount audio router
backend/requirements.txt               # + elevenlabs
backend/models/schemas.py              # New DEMO_10S speed option
backend/.env.example                   # + ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

frontend/src/app/escalation/[id]/page.tsx  # Wire up audio hooks, remove beep tones
frontend/src/hooks/useEscalation.ts        # Pass audio events through
frontend/src/lib/types.ts                  # New audio event types
```

### New Dependencies

- Backend: `elevenlabs` (pip)
- Frontend: none (Web Audio API + HTMLAudioElement are native)

---

## 7. Environment Variables

Added to `backend/.env.example`:

```
# ElevenLabs TTS
ELEVENLABS_API_KEY=              # Creator plan API key
ELEVENLABS_VOICE_ID=             # e.g. Rachel voice ID
```

---

## 8. Hold Music Sourcing

Need one royalty-free corporate hold music mp3 (~2-3 min, loopable). CC0 or similar license. Will source during implementation.
