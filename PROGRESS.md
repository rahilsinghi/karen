# KAREN — Build Progress

Last updated: 2026-03-31 (Session 3)

---

## Build Order Status

| Step | Task | Status |
|------|------|--------|
| 1 | Project scaffold + Docker + OpenClaw running | DONE |
| 2 | Pre-seeded circle.json + /api/members endpoint | DONE |
| 3 | Contact resolution logic (get_available_channels) | DONE |
| 4 | Personality service (Claude Haiku 4.5) | DONE |
| 5a | Email (Resend API) | CODE DONE — needs RESEND_API_KEY |
| 5b | SMS (Twilio) | WORKING |
| 5c | WhatsApp (Twilio) | CODE DONE — needs sandbox setup |
| 5d | LinkedIn | STUB — skip for demo |
| 5e | Google Calendar API | STUB — needs service account |
| 5f | Discord bot | WORKING |
| 5g | GitHub API → Open Matters | WORKING |
| 5h | Twitter/X API v2 | SKIPPED — 402 CreditsDepleted (needs $100/mo) |
| 5i | FedEx PDF generation | WORKING (PDF only, no shipping) |
| 5j | Voice call (Twilio) | WORKING (trial account disclaimer) |
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

## Channel Status (as of 2026-03-30)

### WORKING (confirmed delivery)
- **SMS (Twilio)** — Messages delivered to +16467296148 (Rahil's verified number)
- **Voice call (Twilio)** — Calls to verified numbers, Polly.Joanna TTS. Trial disclaimer plays first.
- **Discord** — Bot posts to #karen-text-demo-channel in Karen EvilClaw server
- **GitHub** — Commits to rahilsinghi/portfolio, data/open-matters.json created
- **FedEx PDF** — WeasyPrint generates print-ready letter, downloadable at `/api/escalation/{id}/letter.pdf`

### CODE DONE — needs credentials/setup
- **Email (Resend)** — Code uses Resend API (NOT Gmail SMTP despite CLAUDE.md spec). Need `RESEND_API_KEY` in `.env`. Free tier: 10k emails/month, sends only to signup email without verified domain.
- **WhatsApp (Twilio)** — Code works, Twilio returns 400. Need WhatsApp sandbox setup + recipient must join sandbox.

### STUBS (skip for demo)
- **LinkedIn** — Returns fake success. Would need Playwright browser automation.
- **Google Calendar** — Returns fake success. Needs service account + google-api-python-client.
- **Twitter/X** — Auth works but 402 CreditsDepleted. Needs Basic plan ($100/mo). Skip.

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
| RESEND_API_KEY | EMPTY — need to create account + key |
| TWILIO_ACCOUNT_SID | SET |
| TWILIO_AUTH_TOKEN | SET |
| TWILIO_PHONE_NUMBER | SET (+12602548913) |
| DISCORD_BOT_TOKEN | SET |
| DISCORD_CHANNEL_ID | SET (1488041144070705153) |
| DISCORD_SERVER_ID | SET (1488037490744098866) |
| GITHUB_TOKEN | SET (fine-grained PAT, push to rahilsinghi/portfolio) |
| GITHUB_REPO | SET (rahilsinghi/portfolio) |
| TWITTER_* | SET but unusable (402 CreditsDepleted) |
| GOOGLE_CALENDAR_CREDENTIALS | EMPTY — needs service account JSON |
| LINKEDIN_* | EMPTY — skipping |
| FEDEX_* | EMPTY — skipping |

**Important:** Email code uses `RESEND_API_KEY`, NOT `KAREN_GMAIL_APP_PASSWORD`. The CLAUDE.md spec says Gmail SMTP but the implementation uses Resend. Update .env accordingly.

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

## Known Issues

1. **No navigation bar** — Pages only reachable by URL or in-app links. No global nav.
2. **Response detection not automated** — Gmail polling not implemented. Must use manual API endpoint or dashboard buttons.
3. **LinkedIn fakes success** — UI shows green but nothing actually sends. Audience won't notice.
4. **Calendar fakes success** — Same as LinkedIn.
5. **Open Matters table missing columns** — Spec calls for Days, Attempts, Karen's Note. Currently only has Ref, Name, Amount, Detail, Level, Status.
6. **Hot reload kills escalations** — Backend `--reload` flag means file saves during demo wipe in-memory state. Use `docker-compose.prod.yml` for demo.
7. **Git repo not initialized** — No commits yet. Need to `git init` and make initial commit.
