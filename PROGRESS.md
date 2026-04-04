# KAREN — Build Progress

Last updated: 2026-04-04 (Session 4)

---

## Build Order Status

| Step | Task | Status |
|------|------|--------|
| 1 | Project scaffold + Docker + OpenClaw running | DONE |
| 2 | Pre-seeded circle.json + /api/members endpoint | DONE |
| 3 | Contact resolution logic (get_available_channels) | DONE |
| 4 | Personality service (Claude Haiku 4.5) | DONE |
| 5a | Email (Resend API) | WORKING — free tier, sends to account email only |
| 5b | SMS (Twilio) | WORKING |
| 5c | WhatsApp (Twilio) | WORKING — to verified numbers only |
| 5d | Voice call (Twilio) | WORKING (trial account disclaimer) |
| 5e | OSINT Research (pre-cached) | WORKING — research_cache.json + SSE animation |
| 5f | Slack bot | WORKING — Karen HQ workspace, #karen-escalations |
| 5g | Discord bot | WORKING |
| 5h | GitHub API → Open Matters | WORKING |
| 5i | Google Calendar API (real) | WORKING — service account on shared calendar |
| 5j | FedEx (PDF + rate API) | WORKING — PDF done, rate uses $28.40 fallback |
| ~~5x~~ | ~~LinkedIn~~ | REMOVED in v2 |
| ~~5y~~ | ~~Twitter/X~~ | REMOVED in v2 |
| 6 | Karen orchestration service (escalation ladder) | DONE |
| 7 | FastAPI endpoints + SSE stream | DONE |
| 8 | De-escalation service | DONE |
| 9 | Response detection (Gmail polling) | NOT IMPLEMENTED — manual only |
| 10 | Payment webhook + resolve endpoint | DONE |
| 11 | Frontend: Circle dashboard (/) | DONE |
| 12 | Frontend: Live escalation view (/escalation/[id]) | DONE |
| 13 | Frontend: Open Matters page | DONE |
| 14 | Frontend: Trigger form (/trigger) | DONE |
| 15 | Frontend: Onboarding flow (/join) | DONE |
| 16 | Frontend: Karen lore page (/karen) | DONE |
| 17 | Full demo run — all 10 levels | PARTIAL — see Known Issues |
| 18 | Fix everything that breaks | IN PROGRESS |
| 19 | Second full demo run | NOT STARTED |

---

## Channel Status (as of 2026-04-04)

### WORKING (confirmed delivery)
- **Email (Resend)** — Sends via Resend API. Free tier only delivers to rahilsinghi300@gmail.com without verified domain. Need domain verification for real targets.
- **SMS (Twilio)** — Messages delivered to +16467296148 (Rahil's verified number)
- **Voice call (Twilio)** — Calls to verified numbers, Polly.Joanna TTS. Trial disclaimer plays first.
- **Slack** — Karen bot posts to #karen-escalations in Karen HQ workspace. Post + delete both work.
- **Discord** — Bot posts to #karen-text-demo-channel in Karen EvilClaw server
- **Google Calendar** — Real integration via service account on Rahil's shared calendar. Create + delete work. No attendee invites (service account limitation — events just appear on shared calendar).
- **GitHub** — Commits to rahilsinghi/portfolio, data/open-matters.json created
- **FedEx PDF** — WeasyPrint generates print-ready letter, downloadable at `/api/escalation/{id}/letter.pdf`
- **OSINT Research** — Pre-cached data in research_cache.json, animated SSE display

### CODE DONE — works with limitations
- **WhatsApp (Twilio)** — WORKING to verified numbers (Rahil's +16467296148). Bharath's number needs verification before demo.
- **FedEx Rate API** — Falls back to $28.40 hardcoded. Sandbox credentials optional.

### REMOVED in v2
- **LinkedIn** — Stub removed. No replacement needed.
- **Twitter/X** — 402 CreditsDepleted. Removed entirely.

---

## Recent Fixes (Session 2)

1. **SSE infinite duplication** — Events replayed on every reconnect without deduplication. Fixed: backend adds `seq` counter to events, frontend deduplicates by seq number. Added exponential backoff (2s → 4s → 8s → 30s cap).
2. **Timeline showing Level 3 three times** — Was keyed by `level-channel` so multi-channel levels showed separate cards. Fixed: timeline groups by level number, one card per level showing all channels.
3. **Level 1 SSE race condition** — Level 1 events fired before subscriber connected. Fixed: event history buffer + replay on SSE connect (was fixed in Session 1, confirmed working).
4. **Backend request flooding** — Each replayed `level_complete` triggered `fetchEscalation()`. Fixed: seq dedup skips replayed events before they trigger fetches.
5. **Sound effects added** — Web Audio API tones on level_start/level_complete, escalating urgency by level.
6. **Countdown timer added** — Circular SVG progress ring between levels with rAF-driven updates.
7. **Voice call channel added** — Level 3 now fires email + whatsapp + voice_call. Uses Twilio Polly.Joanna TTS.
8. **Personality preview** — Trigger form shows live preview card for selected personality.
9. **CORS from env var** — `CORS_ORIGINS` read from environment, not hardcoded.
10. **docker-compose.prod.yml** — Overrides CMD to remove `--reload` for production stability.

---

## Credentials Status (backend/.env)

| Credential | Status |
|------------|--------|
| ANTHROPIC_API_KEY | SET (Claude Haiku 4.5 — claude-haiku-4-5-20251001) |
| RESEND_API_KEY | SET (re_7hrD48b...) — free tier, no verified domain |
| TWILIO_ACCOUNT_SID | SET |
| TWILIO_AUTH_TOKEN | SET |
| TWILIO_PHONE_NUMBER | SET (+12602548913) |
| SLACK_BOT_TOKEN | SET (xoxb-...) — Karen HQ workspace |
| SLACK_CHANNEL_ID | SET (C0AQPUX88F5) — #karen-escalations |
| DISCORD_BOT_TOKEN | SET |
| DISCORD_CHANNEL_ID | SET (1488041144070705153) |
| DISCORD_SERVER_ID | SET (1488037490744098866) |
| GITHUB_TOKEN | SET (fine-grained PAT, push to rahilsinghi/portfolio) |
| GITHUB_REPO | SET (rahilsinghi/portfolio) |
| GOOGLE_CALENDAR_CREDENTIALS | SET (gcp-sa-key.json) — service account |
| GOOGLE_CALENDAR_ID | SET (rahilsinghi300@gmail.com) |
| ELEVENLABS_API_KEY | SET |
| ELEVENLABS_VOICE_ID | SET (21m00Tcm4TlvDq8ikWAM — Rachel) |
| FEDEX_* | NOT SET — using $28.40 fallback |

**Important:** Email code uses `RESEND_API_KEY`, NOT `KAREN_GMAIL_APP_PASSWORD`. Calendar uses service account (no attendee invites — events appear directly on shared calendar).

---

## Demo Test Data

- **Initiator**: Rahil Singhi (rahil)
- **Target**: Bharath Mahesh Gera (bharath)
- **Grievance**: $23 dinner — February 8, 2026 (50 days outstanding)
- **Personality**: passive_aggressive
- **Speed**: demo (5s intervals)
- **Bharath's contacts** (testing mode): phone/whatsapp = Rahil's number, email = Rahil's email
- **Twilio**: Trial account ($15.50), only Rahil's number verified

---

## Architecture Decisions

1. **AI Model**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — cheapest, works well for personality generation.
2. **Email**: Switched from Gmail SMTP to **Resend API** — simpler auth, no 2FA/app password needed. Free tier only sends to signup email without verified domain.
3. **SSE Dedup**: Backend tags events with sequential `seq` numbers. Frontend skips events with `seq <= lastSeen` on reconnect. Eliminates duplicate events + request flooding.
4. **Timeline Grouping**: Level cards group by level number, not by channel. Multi-channel levels (L1-4) show all channels in one card.
5. **Docker env vars**: `docker compose restart` does NOT re-read .env files. Must use `docker compose down && docker compose up -d`.
6. **Twilio trial**: Can only send to verified numbers. Trial disclaimer plays on voice calls.
7. **Voice calls**: Added as bonus channel at Level 3 (not in original CLAUDE.md spec).

---

## Audio Integration (Session 3 — 2026-03-31)

### WORKING (verified end-to-end)
- **ElevenLabs TTS** — Karen speaks via Rachel voice (eleven_turbo_v2_5 model)
- **Pre-recorded quips** — 60 mp3s (15 per personality) in `backend/audio/quips/`
- **On-the-fly commentary** — Generated during countdown via ElevenLabs, served as mp3
- **Background music** — Jazz lounge hold music with progressive Web Audio distortion per level
- **Volume ducking** — Music ducks to 20% when Karen speaks, fades back
- **Autoplay gate** — "Enable Karen's Voice" overlay on escalation page
- **DEMO_10S speed** — 10-second intervals for audio demo
- **New SSE event type** — `audio` events with `quip_url` or `commentary_url`

### New Files
```
backend/services/audio_service.py      — ElevenLabs wrapper
backend/routers/audio.py               — GET /api/audio/{path}
backend/scripts/generate_quips.py      — One-time quip generation
backend/audio/quips/{personality}/      — 60 pre-recorded quip mp3s
backend/audio/music/hold-music.mp3     — Jazz lounge elevator music
frontend/src/hooks/useKarenAudio.ts    — Voice clip playback queue
frontend/src/hooks/useBackgroundMusic.ts — Music + progressive distortion
```

### New Env Vars
```
ELEVENLABS_API_KEY=sk_b52...   # Creator plan
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM   # Rachel
```

### Design Decisions
1. **Backend-centric audio** — All TTS generated server-side, served via `/api/audio/` endpoint
2. **Hybrid quip strategy** — Pre-recorded quips for instant playback, on-the-fly commentary for personalized content
3. **ElevenLabs over VibeVoice** — Evaluated VibeVoice (Microsoft open-source TTS) but ElevenLabs wins for hackathon: no GPU needed, better voices, already paid for
4. **Web Audio effects for music** — No music processing library needed; native browser API applies filter, distortion, LFO warble per level
5. **Spec docs** — `docs/superpowers/specs/2026-03-31-audio-integration-design.md`

---

## Escalation Ladder v2 (Session 4 — 2026-04-04)

### What Changed
Full redesign of the 10-level escalation ladder. Every level now fires a unique channel — no repeats.

| Level | v1 | v2 |
|-------|----|----|
| 1 | Email | Email (same) |
| 2 | Email + SMS | SMS only |
| 3 | Email + WhatsApp + Voice | WhatsApp + Voice (no email) |
| 4 | Email CC + SMS | OSINT Research (NEW) |
| 5 | LinkedIn (stub) | Email CC (payoff from research) |
| 6 | Calendar (stub) | Slack (NEW) |
| 7 | Discord | Discord (same) |
| 8 | GitHub | GitHub (same) |
| 9 | Twitter (broken) | Google Calendar (real) |
| 10 | FedEx PDF | FedEx (legal letter + rate quote) |

### New Integrations Needed
- **Slack** — Bot token + channel, replaces LinkedIn stub
- **OSINT Research** — Pre-cached data + animated SSE display
- **Google Calendar** — Real integration via Karen's Gmail
- **FedEx Rate API** — Actual rate quotes for the letter

### Session 4 Fixes
1. **SSE reconnect flooding** — Frontend reset backoff on every onopen. Fixed: only reset after 5s stable connection.
2. **SSE history replay too large** — 68+ events replayed on reconnect through tunnel. Fixed: `last_seq` query param skips already-seen events.
3. **Background music never started** — Music depended on catching `escalation_started` event live. Fixed: starts immediately when audio enabled + escalation active.
4. **EscalationTimeline missing demo_10s** — `SPEED_SECONDS` map was missing the 10s interval. Fixed.
5. **dev.sh rewritten** — Single startup script starts Docker + Next.js together with health checks and clean shutdown on Ctrl+C.
6. **Git repo initialized** — 10 structured commits pushed to github.com/rahilsinghi/karen.

### Spec Doc
`docs/superpowers/specs/2026-04-04-escalation-ladder-v2-design.md`

---

## Known Issues

1. **No navigation bar** — Pages only reachable by URL or in-app links. No global nav.
2. **Response detection not automated** — Gmail polling not implemented. Must use manual API endpoint or dashboard buttons.
3. **Open Matters table missing columns** — Spec calls for Days, Attempts, Karen's Note. Currently only has Ref, Name, Amount, Detail, Level, Status.
4. **Hot reload kills escalations** — Backend `--reload` flag means file saves during demo wipe in-memory state. Use `docker-compose.prod.yml` for demo.
