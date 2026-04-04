# KAREN — Next Steps

Last updated: 2026-04-04

---

## Current State

All 10 channels are coded and tested. v2 escalation ladder is implemented.
Steps 1-16 of the build order are DONE. Audio integration is DONE.

**Working channels:** Email (Resend), SMS, WhatsApp, Voice Call, OSINT Research,
Email CC, Slack, Discord, Google Calendar, GitHub, FedEx PDF.

**Remaining:** Full demo run, polish, pre-demo prep.

---

## Priority 1: Demo-Critical (must do before demo)

### 1. Full 10-Level Demo Run (Step 17)

Trigger a complete escalation with all 10 levels firing. Watch every channel.

```bash
# Start everything
cd ~/Desktop/Karen && docker compose up -d
cd frontend && pnpm dev

# Trigger (5s intervals, all 10 levels)
curl -s -X POST http://localhost:8000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"initiator_id":"rahil","target_id":"bharath","grievance_type":"financial","grievance_detail":"$23 dinner — February 8, 2026","personality":"passive_aggressive","speed":"demo","max_level":10}'
```

**Watch for:**
- L1 Email arrives (check rahilsinghi300@gmail.com inbox)
- L2 SMS arrives on phone
- L3 WhatsApp + voice call fire
- L4 Research animation plays in UI, follow-up SMS fires
- L5 Email CC sends (CC's the "discovered" coworker from research)
- L6 Slack message appears in #karen-escalations
- L7 Discord message appears in Karen EvilClaw server
- L8 Calendar event appears on Rahil's Google Calendar
- L9 GitHub commit lands in rahilsinghi/portfolio
- L10 FedEx PDF generated + rate quote shown in UI
- Audio: quips play per level, background music distorts progressively
- SSE stream stays connected throughout
- De-escalation sequence works (click Neutralize after completion)

### 2. Fix Everything That Breaks (Step 18)

After the demo run, document every failure and fix it. Common issues:
- SSE reconnect dropping events
- Channel timeouts blocking the ladder
- Audio not playing (autoplay gate, ducking issues)
- Calendar/Slack/Discord rate limits

### 3. Fill Bharath's Real Contact Info

Replace test data in `backend/data/circle.json`:
- email → Bharath's real email
- phone → Bharath's real phone number
- whatsapp → Bharath's real WhatsApp number
- venmo → Bharath's real Venmo handle

Then:
1. Verify Bharath's phone in Twilio Console (Settings → Verified Caller IDs)
2. `docker compose down backend && docker compose up -d backend`

### 4. Resend Domain Verification (email to non-account addresses)

Without a verified domain, Resend only delivers to rahilsinghi300@gmail.com.
Options:
- **Option A:** Verify a domain on Resend (e.g. `mail.makekismet.com`) — add DNS records, then update `KAREN_FROM_EMAIL` in `.env`
- **Option B:** For demo, set Bharath's email to rahilsinghi300@gmail.com and show the email on your screen

### 5. Remove `--reload` for Demo

File saves during demo wipe in-memory escalation state. Use production compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
```

### 6. Second Full Demo Run (Step 19)

After all fixes, run the complete demo again with 10s intervals (audio demo):

```bash
curl -s -X POST http://localhost:8000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"initiator_id":"rahil","target_id":"bharath","grievance_type":"financial","grievance_detail":"$23 dinner — February 8, 2026","personality":"passive_aggressive","speed":"demo_10s","max_level":10}'
```

This is the dress rehearsal. Everything must work.

---

## Priority 2: Frontend Polish (see FRONTEND_CHANGES.md for Sariya)

These are documented in detail in `FRONTEND_CHANGES.md` for Sariya to implement.

- **Navigation bar** — No global nav exists. Pages only reachable by URL.
- **Karen lore page (/karen)** — Escalation arsenal is outdated (shows v1 levels). Needs v2 update.
- **Open Matters table** — Missing 3 columns (Days, Attempts, Karen's Note).
- **Escalation view tweaks** — Level card timeline for left sidebar, typewriter commentary.

---

## Priority 3: Nice-to-Have Polish

### 1. FedEx Sandbox Credentials (optional)

The rate API falls back to $28.40 hardcoded. To show a real rate quote:
1. Sign up at developer.fedex.com
2. Create a sandbox project
3. Add to `.env`:
   ```
   FEDEX_API_KEY=...
   FEDEX_API_SECRET=...
   FEDEX_ACCOUNT_NUMBER=...
   ```
4. Rebuild backend

### 2. WhatsApp for Bharath

Twilio trial only sends to verified numbers. To reach Bharath's WhatsApp:
1. Twilio Console → Verified Caller IDs → Add Bharath's number
2. Bharath confirms the verification code
3. WhatsApp messages will then deliver to his actual number

### 3. Generate Fresh Quips

If personality quips sound stale or you want more variety:

```bash
docker compose exec backend python scripts/generate_quips.py
```

Generates 60 mp3s (15 per personality). Skips existing files.
To regenerate all: delete `backend/audio/quips/` contents first.

### 4. FedEx PDF Print Test

Trigger a Level 10, download the PDF, print it. Verify it's holdable on stage.

```bash
curl -s http://localhost:8000/api/escalation/<ID>/letter.pdf -o karen-letter.pdf
open karen-letter.pdf
```

---

## Pre-Demo Checklist

### Credentials
- [x] RESEND_API_KEY set and working (to account email)
- [x] ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID set
- [x] SLACK_BOT_TOKEN and SLACK_CHANNEL_ID set
- [x] GOOGLE_CALENDAR_CREDENTIALS and GOOGLE_CALENDAR_ID set
- [x] TWILIO credentials set (SID, token, phone number)
- [x] DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID set
- [x] GITHUB_TOKEN set (fine-grained PAT)
- [ ] Resend domain verified (or Bharath's email set to Rahil's)
- [ ] FEDEX_* set (optional — fallback works)

### Data
- [ ] Bharath's real contact info in circle.json
- [ ] Bharath's phone verified in Twilio Console
- [x] Research cache populated (research_cache.json)
- [x] Quips generated (backend/audio/quips/)
- [x] hold-music.mp3 present (backend/audio/music/)

### Infrastructure
- [ ] Frontend deployed (molly.rahilsinghi.com) or running locally
- [ ] Backend running with prod compose (no `--reload`)
- [ ] `CORS_ORIGINS` includes frontend URL
- [ ] ngrok tunnel active (if needed for webhooks)

### Demo Setup
- [ ] Discord: Audience invite QR code ready
- [ ] Second display ready for Bharath's phone mirror
- [ ] FedEx PDF printed and ready to hold up
- [ ] Laptop speakers / external audio working
- [ ] Full 10-level test run completed successfully
- [ ] Demo script rehearsed (3 minutes)

---

## Commands Cheat Sheet

```bash
# Start everything (dev)
cd ~/Desktop/Karen && docker compose up -d
cd frontend && pnpm dev

# Start everything (production — no hot reload)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild backend (after code or requirements changes)
docker compose up -d --build backend

# Reload env vars (MUST use down+up, NOT restart)
docker compose down backend && docker compose up -d backend

# View backend logs
docker compose logs backend --tail=50 -f

# Trigger escalation (5s demo)
curl -s -X POST http://localhost:8000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"initiator_id":"rahil","target_id":"bharath","grievance_type":"financial","grievance_detail":"$23 dinner — February 8, 2026","personality":"passive_aggressive","speed":"demo","max_level":10}'

# Trigger escalation (10s demo with audio)
curl -s -X POST http://localhost:8000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"initiator_id":"rahil","target_id":"bharath","grievance_type":"financial","grievance_detail":"$23 dinner — February 8, 2026","personality":"passive_aggressive","speed":"demo_10s","max_level":10}'

# Watch SSE stream
curl -s -N http://localhost:8000/api/escalation/<ID>/stream

# Resolve escalation
curl -s -X POST http://localhost:8000/api/payment-confirm \
  -H "Content-Type: application/json" \
  -d '{"escalation_id":"<ID>","amount":23,"from_name":"Bharath"}'

# Download FedEx letter
curl -s http://localhost:8000/api/escalation/<ID>/letter.pdf -o karen-letter.pdf

# Generate quips
docker compose exec backend python scripts/generate_quips.py
```
