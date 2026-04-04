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
