# KAREN — Next Steps

Ordered by demo impact. Pick up here next session.

---

## Quick Wins (< 15 min each)

### 1. Set up Resend API key for email (10 min)

**Unlocks:** Levels 1-4 (email is the primary channel)

Email uses Resend API, NOT Gmail SMTP. Steps:
1. Go to resend.com → Sign up with karen.follows.up.nyc@gmail.com
2. Settings → API Keys → Create → Copy key
3. Add to `backend/.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Domain verification** (optional but recommended): Add + verify a custom domain (e.g. `mail.makekismet.com`) on Resend dashboard. Without it, free tier only delivers to the signup email address.
5. Recreate container: `docker compose down backend && docker compose up -d backend`
6. Test: trigger a level 1 escalation

### 2. Set up WhatsApp Sandbox (10 min)

**Unlocks:** Level 3 WhatsApp message on Bharath's phone

Steps:
1. Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Follow sandbox setup (send join code to sandbox number)
3. Recipient phone must also send join code to join sandbox
4. Test: trigger a level 3 escalation

### 3. Fill Bharath's real contact info (5 min)

Currently Bharath's phone/email/whatsapp are Rahil's numbers (for testing). Before demo:
1. Replace in `backend/data/circle.json`:
   - email → Bharath's real email
   - phone → Bharath's real phone
   - whatsapp → Bharath's real WhatsApp number
   - venmo → Bharath's real Venmo handle
2. Verify Bharath's phone number in Twilio Console (trial account requirement)
3. Have Bharath join WhatsApp sandbox
4. Restart: `docker compose down backend && docker compose up -d backend`

### 4. Remove `--reload` for demo (2 min)

Use production compose to prevent file-save crashes:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
```

### 5. Test FedEx PDF printability (5 min)

Trigger a Level 10 escalation, download PDF from `/api/escalation/{id}/letter.pdf`, print it. Verify it's holdable on stage.

---

## Polish (30 min each)

### 6. Add navigation bar

No global nav exists. Audience can't navigate between pages. Add a minimal header nav:
- Links: The Circle (/) | Trigger (/trigger) | Open Matters (/open-matters) | Karen (/karen)
- Karen logo/name on the left
- Current page highlighted
- Dark theme, matches design system

### 7. Open Matters table — add missing columns

Spec calls for: Ref # | Name | Amount | Item | Days | Attempts | Status | Karen's Note
Currently missing: Days, Attempts, Karen's Note.
- Days: calculate from `started_at`
- Attempts: use `messages_sent`
- Karen's Note: store last `karen_note` on the Escalation model (currently excluded from JSON)

### 8. Google Calendar setup (15 min)

Steps in detail:
1. GCP Console → askNYC project → Enable Calendar API
2. Create service account → Download JSON key
3. Share target's calendar with service account email
4. Implement actual calendar event creation in `_send_calendar()` (currently a stub)
5. Add `google-api-python-client` to requirements.txt

---

## Skipped / Won't Do

- **Twitter/X** — 402 CreditsDepleted, needs $100/mo Basic plan. Karen skips L9 gracefully.
- **LinkedIn** — Would need Playwright browser automation, too fragile for demo.
- **FedEx shipping** — PDF generation works. Actual shipping is overkill for hackathon.
- **Response detection (Gmail polling)** — No automated polling implemented. Use dashboard buttons for demo.

---

## Pre-Demo Checklist

- [ ] RESEND_API_KEY set and email tested
- [ ] Bharath's real contact info in circle.json
- [ ] Bharath's phone verified in Twilio Console
- [ ] WhatsApp sandbox: Bharath joined
- [ ] Discord: Audience invite QR code ready
- [ ] Frontend running (localhost:3000 or molly.rahilsinghi.com)
- [ ] Backend running with prod compose (no `--reload`)
- [ ] ngrok tunnel active (if using tunnel)
- [ ] `CORS_ORIGINS` includes frontend URL
- [ ] Second display ready for Bharath's phone mirror
- [ ] FedEx PDF printed and ready to hold up
- [ ] Demo script rehearsed (3 minutes)
- [ ] Backup plan: if a channel fails mid-demo, Karen continues to next level
- [ ] ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID set in .env
- [ ] Quips generated: `docker compose exec backend python scripts/generate_quips.py`
- [ ] hold-music.mp3 present in `backend/audio/music/`
- [ ] Audio test: trigger demo_10s escalation, click "Enable Karen's Voice", confirm quips + music play
- [ ] Laptop speakers / external audio working (audience needs to hear Karen)

---

## Commands Cheat Sheet

```bash
# Start everything (dev)
cd ~/Desktop/Karen && docker compose up -d

# Start everything (production — no hot reload)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild backend (after code or requirements changes)
docker compose up -d --build backend

# Reload env vars (MUST use down+up, NOT restart)
docker compose down backend && docker compose up -d backend

# View backend logs
docker compose logs backend --tail=50 -f

# Start frontend
cd frontend && pnpm dev

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

# Manual payment confirm
curl -s -X POST http://localhost:8000/api/payment-confirm \
  -H "Content-Type: application/json" \
  -d '{"escalation_id":"<ID>","amount":23,"from_name":"Bharath"}'

# Download FedEx letter
curl -s http://localhost:8000/api/escalation/<ID>/letter.pdf -o karen-letter.pdf

# Generate quips (one-time, requires ELEVENLABS_API_KEY in .env)
docker compose exec backend python scripts/generate_quips.py

# Re-generate a single personality's quips
docker compose exec backend python -c "
from scripts.generate_quips import generate_for_personality
generate_for_personality('passive_aggressive')
"
```
