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
