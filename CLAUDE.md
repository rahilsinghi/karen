# KAREN — CLAUDE.md
# Karen Automated Correspondence Systems LLC
# "Karen gets results."
#
# READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.
# This is the authoritative spec. Do not invent, assume, or deviate.

---

## What Karen Is

Karen is a mischievous OpenClaw-powered follow-up agent built for the
MischiefClaw Hackathon. She treats every non-response as a crisis and
every crisis as an opportunity to escalate — across 10 channels, with
4 distinct personalities, against anyone in The Circle.

She is not malicious. She is not insecure. She is deeply, committedly,
professionally unhinged. She means well. She always has.

This is a hackathon project. The demo is the product.

---

## Project Structure

```
karen/
├── CLAUDE.md                  ← you are here
├── PROJECT.md                 ← setup guide (accounts, env vars, deploy)
├── dev.sh                     ← starts everything with one command
├── docker-compose.yml         ← OpenClaw + backend together
│
├── openclaw/
│   ├── SKILL.md               ← Karen's escalation brain
│   ├── HEARTBEAT.md           ← response monitoring loop
│   ├── personalities/
│   │   ├── passive_aggressive.md
│   │   ├── corporate.md
│   │   ├── genuinely_concerned.md
│   │   └── life_coach.md
│   └── templates/
│       └── formal_letter.html ← FedEx letter template
│
├── backend/
│   ├── main.py                ← FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   ├── routers/
│   │   ├── escalation.py      ← /api/trigger, /api/escalation/[id] SSE, /api/resolve
│   │   ├── members.py         ← /api/members CRUD
│   │   └── webhook.py         ← /api/venmo-webhook, /api/payment-confirm
│   ├── services/
│   │   ├── karen_service.py   ← orchestrates escalation ladder
│   │   ├── channel_service.py ← all 10 channel integrations
│   │   ├── personality_service.py ← generates messages per personality
│   │   ├── pdf_service.py     ← generates Karen's formal letter
│   │   ├── deescalation_service.py ← teardown sequence
│   │   └── audio_service.py   ← ElevenLabs TTS wrapper (quips + commentary)
│   ├── routers/
│   │   ├── escalation.py      ← /api/trigger, /api/escalation/[id] SSE, /api/resolve
│   │   ├── members.py         ← /api/members CRUD
│   │   ├── webhook.py         ← /api/venmo-webhook, /api/payment-confirm
│   │   └── audio.py           ← GET /api/audio/{path} — serves mp3s
│   ├── scripts/
│   │   └── generate_quips.py  ← one-time: generates 60 quip mp3s via ElevenLabs
│   ├── audio/
│   │   ├── quips/{personality}/ ← 15 pre-recorded quips per personality (60 total)
│   │   └── music/hold-music.mp3 ← jazz lounge elevator music
│   ├── models/
│   │   └── schemas.py         ← all Pydantic models
│   └── data/
│       └── circle.json        ← pre-seeded member data (see below)
│
└── frontend/                  ← Next.js 15, molly.rahilsinghi.com
    ├── app/
    │   ├── page.tsx           ← The Circle dashboard
    │   ├── trigger/page.tsx   ← New escalation form
    │   ├── escalation/
    │   │   └── [id]/page.tsx  ← Live escalation view (SSE)
    │   ├── open-matters/page.tsx ← Public accountability registry
    │   ├── join/page.tsx      ← Onboarding flow (3 screens)
    │   └── karen/page.tsx     ← Karen lore page
    ├── components/
    │   ├── EscalationTimeline.tsx
    │   ├── KarenSidebar.tsx   ← Karen's live commentary
    │   ├── MemberCard.tsx
    │   ├── LevelCard.tsx
    │   ├── DeescalationSequence.tsx
    │   ├── OpenMattersTable.tsx
    │   └── OnboardingFlow.tsx
    ├── hooks/
    │   ├── useEscalation.ts   ← SSE connection
    │   ├── useCircle.ts       ← member state
    │   ├── useKarenAudio.ts   ← voice clip playback queue (quips + commentary)
    │   └── useBackgroundMusic.ts ← hold music + progressive Web Audio distortion
    └── lib/
        ├── types.ts
        └── constants.ts

---

## Pre-Seeded Circle Members (backend/data/circle.json)

These 5 members are hardcoded for the demo. Do not require onboarding
for these members. They are loaded on backend startup.

```json
{
  "members": [
    {
      "id": "rahil",
      "name": "Rahil Singhi",
      "role": "admin",
      "avatar_emoji": "🦞",
      "contacts": {
        "email": "rahil@makekismet.com",
        "phone": "FILL_BEFORE_DEMO",
        "whatsapp": "FILL_BEFORE_DEMO",
        "linkedin": "linkedin.com/in/rahilsinghi",
        "twitter": "@rahilsinghi",
        "venmo": "@RahilSinghi",
        "calendar": "rahil@makekismet.com",
        "address": "FILL_BEFORE_DEMO"
      }
    },
    {
      "id": "bharath",
      "name": "Bharath Mahesh Gera",
      "role": "member",
      "avatar_emoji": "🎯",
      "contacts": {
        "email": "bharathmaheshgera@stern.nyu.edu",
        "phone": "FILL_BEFORE_DEMO",
        "whatsapp": "FILL_BEFORE_DEMO",
        "linkedin": "linkedin.com/in/bharath-mahesh-gera",
        "twitter": "FILL_BEFORE_DEMO",
        "venmo": "FILL_BEFORE_DEMO",
        "calendar": "bharathmaheshgera@stern.nyu.edu",
        "address": "FILL_BEFORE_DEMO"
      }
    },
    {
      "id": "chinmay",
      "name": "Chinmay Shringi",
      "role": "member",
      "avatar_emoji": "⚡",
      "contacts": {
        "email": "cs7810@nyu.edu",
        "phone": "FILL_BEFORE_DEMO",
        "whatsapp": "FILL_BEFORE_DEMO",
        "linkedin": "FILL_BEFORE_DEMO",
        "twitter": "FILL_BEFORE_DEMO",
        "venmo": "FILL_BEFORE_DEMO",
        "calendar": "cs7810@nyu.edu",
        "address": "FILL_BEFORE_DEMO"
      }
    },
    {
      "id": "sariya",
      "name": "Sariya Rizwan",
      "role": "member",
      "avatar_emoji": "🌙",
      "contacts": {
        "email": "sariyakh25@gmail.com",
        "phone": "FILL_BEFORE_DEMO",
        "whatsapp": "FILL_BEFORE_DEMO",
        "linkedin": "FILL_BEFORE_DEMO",
        "twitter": "FILL_BEFORE_DEMO",
        "venmo": "FILL_BEFORE_DEMO",
        "calendar": "sariyakh25@gmail.com",
        "address": "FILL_BEFORE_DEMO"
      }
    },
    {
      "id": "aishwarya",
      "name": "Aishwarya Ghaiwat",
      "role": "member",
      "avatar_emoji": "🎨",
      "contacts": {
        "email": "FILL_BEFORE_DEMO",
        "phone": "FILL_BEFORE_DEMO",
        "whatsapp": "FILL_BEFORE_DEMO",
        "linkedin": "FILL_BEFORE_DEMO",
        "twitter": "FILL_BEFORE_DEMO",
        "venmo": "FILL_BEFORE_DEMO",
        "calendar": "FILL_BEFORE_DEMO",
        "address": "FILL_BEFORE_DEMO"
      }
    }
  ]
}
```

FILL_BEFORE_DEMO fields are placeholders. Collect real values from each
person before the hackathon. Karen only executes channels where a real
value exists — she skips channels with FILL_BEFORE_DEMO.

---

## Karen's Accounts (all dedicated, none are Rahil's personal accounts)

| Account | Value | Purpose |
|---------|-------|---------|
| Gmail | karen.follows.up.nyc@gmail.com | All email escalations |
| Twilio number | TBD (buy during setup) | SMS + WhatsApp Business |
| LinkedIn | Karen Follows-Up | Professional escalations |
| Twitter/X | @KarenFollowsUp | Public posts |
| Discord | Karen bot (token in .env) | Server announcements |
| ElevenLabs | Creator plan (expires ~2026-04-14) | Karen's TTS voice (Rachel) |

Karen always sends AS herself, ON BEHALF OF the initiator:
"Hi [target], I'm Karen — reaching out on behalf of [initiator]
about [grievance]. [initiator] has asked me to follow up."

Never impersonate the initiator. Always be Karen.

---

## Karen's 4 Personalities

Stored in openclaw/personalities/[name].md
Generated dynamically — never hardcode message strings.
The personality service receives: (level, initiator, target,
grievance_type, grievance_detail, days_outstanding) and returns
a complete message for that channel.

### PASSIVE_AGGRESSIVE (default for demo)
Emoji-heavy. Technically polite. Radiates menace.
Escalates emoji count as levels increase.
Level 1: one 🙂. Level 5: three 🙂🙂🙂. Level 9: just emojis.
Karen's internal notes are passive aggressive too.
"He was online. I noticed."

### CORPORATE
Project manager energy. Zero emotional acknowledgment.
"Per my last communication, please advise on timeline."
"Looping in [name] for visibility and alignment."
"This matter requires your action by EOD."

### GENUINELY_CONCERNED
Thinks she is helping. Never winks. Genuinely believes
she is saving the friendship.
"I just don't want this to become a thing between you."
"$23 is not worth a friendship. Please resolve this."
"I care about both of you. That's why I keep trying."

### LIFE_COACH
Reframes every escalation as personal growth.
"Unresolved financial obligations create energetic blocks."
"Showing up for people is how we build trust."
"The $23 is not the point. The accountability is."

---

## Contact Resolution Logic

Karen checks available channels before executing each level.
She never crashes on missing info — she skips gracefully.

```python
def get_available_channels(member_id: str) -> list[str]:
    member = db.get_member(member_id)
    c = member.contacts
    channels = []

    if c.email and "FILL" not in c.email:
        channels.append("email")
    if c.phone and "FILL" not in c.phone:
        channels.append("sms")
    if c.whatsapp and "FILL" not in c.whatsapp:
        channels.append("whatsapp")
    if c.linkedin and "FILL" not in c.linkedin:
        channels.append("linkedin")
    if c.twitter and "FILL" not in c.twitter:
        channels.append("twitter")
    if c.calendar and "FILL" not in c.calendar:
        channels.append("calendar")
    if c.address and "FILL" not in c.address:
        channels.append("fedex")

    return channels

# Karen skips unavailable channels and continues.
# More info = more Karen. This is by design.
```

The dashboard shows which channels are available for a target
BEFORE the escalation starts. Greyed-out channels = Karen can't
reach them there. It's a feature, not a bug.

---

## The Escalation Ladder

10 levels. Configurable interval (default 5s for demo, 1hr production).
Each level: one or more channels fire simultaneously.

```
Level 1:  Email (warm)
Level 2:  Email (bump) + SMS
Level 3:  Email (tone shift) + WhatsApp
Level 4:  Email (CC mutual contact) + SMS to CC'd person
Level 5:  LinkedIn connection request + LinkedIn InMail
Level 6:  Google Calendar event (3 reminders)
Level 7:  Discord @everyone post
Level 8:  GitHub commit → rahilsinghi.com/open-matters live
Level 9:  Twitter/X post from @KarenFollowsUp
Level 10: FedEx formal letter (PDF generated + shipped)
```

### Response detection
Karen polls the Gmail thread every [interval/2] seconds.
If a reply is detected:
  - Dashboard shows "RESPONSE DETECTED" green banner
  - Current level completes (already in flight)
  - Next level is cancelled
  - Karen notes: "Response detected. Completing current action.
    I had already drafted this. It would be wasteful not to send."

### Payment detection
Venmo webhook OR manual "Resolve" button in dashboard.
Karen does NOT auto-deescalate on payment.
She waits for the operator to click [INITIATE DE-ESCALATION].
This is a product decision. Karen wants to be told to stop.

---

## De-escalation Sequence

Sequential. Animated. Each action shown as it completes.
Failures shown honestly (FedEx cannot be cancelled — shown as ✗).

```
Order of de-escalation:
1. Remove from Open Matters (GitHub commit + Vercel deploy)
2. Delete Discord post
3. Delete LinkedIn InMail (if still unread)
4. Cancel FedEx shipment
   → If already collected: show ✗ with Karen's note
5. Send apology to target
6. Send apology to CC'd contacts
7. Send apology to the apology (Karen's note: "caused confusion")
8. Karen's closing line + next target prompt
```

Karen's closing line (always):
"All resolved. Relationships restored.
Is there anyone else you'd like me to follow up with? 🙂"

Input field appears immediately. Pre-filled with next circle member.

---

## The Onboarding Flow (/join) — For General Users

3 screens. Fast. No account creation required on their end.
Karen acts through HER accounts on their behalf.

### Screen 1 — About You
Fields: Full name, email, phone
Karen explains: "I act through my own accounts on your behalf.
Your accounts are never accessed."
CTA: "Join The Circle →"

### Screen 2 — Add Your First Target
Fields: Their name (required), their email (required),
their phone (required), their WhatsApp (checkbox: same number),
their LinkedIn URL (optional), their Venmo handle (optional),
their address (optional — "Karen may need this later 🙂")

Show which Karen channels unlock as they fill fields.
Greyed channels → filled channels animation as they type.
"More info = more Karen" is displayed live as channels unlock.

CTA: "Add to Circle" / "Skip — I'll add someone later"

### Screen 3 — You're In
Shows: The Circle with their name + first target
Quick-start button: "Start a follow-up →" → goes to /trigger
Shows demo prompt: "Try it with $1 from a friend you trust 🙂"

---

## The Trigger Form (/trigger)

Fields:
1. Who's following up: [dropdown — circle member, default: you]
2. Who are they following up with: [dropdown — circle member]
3. What do they owe / what happened:
   - Financial: amount + Venmo handle + date of incident
   - Object: item name + estimated value
   - Communication: platform + days since last response
4. Karen's personality: [PA / Corporate / Concerned / Coach]
   → Preview of Karen's Level 1 message updates live as you pick
5. Escalation speed: [5s demo / 10s demo+audio / 10m quick / 1h standard / 1d patient]
6. Max escalation level: slider 1-10
   → Shows which channels will be used at the selected max

CTA: "Unleash Karen 🦞"

After trigger → redirect to /escalation/[id] live view.

---

## Open Matters Page (/open-matters)

Driven by /data/open-matters.json in the portfolio repo.
Karen commits to this file. Vercel redeploys. Page goes live.

### UI Spec
Dark background. Colorful. Feels like a real SaaS product
that has been running longer than it should have.

Header stats row (4 cards):
- Total matters: [n]
- Total outstanding: $[sum]
- Average resolution time: [x] days
- Currently escaping Karen: 0

Table columns:
Ref # | Name | Amount | Item | Days | Attempts | Status | Karen's Note

Status badges:
- 🟢 RESOLVED — green, strikethrough text
- 🟡 MONITORING — yellow pulse
- 🔴 ACTIVE — red with level indicator "Level 7"
- ☢️ NUCLEAR — purple glow, for Level 8+

Easter eggs (rotating, fresh on each load):
In header area — quotes rotate every 8 seconds:
"Karen has sent 847 follow-ups. Karen has never been ignored twice."
"[random circle member name] was last seen online 3 minutes ago. Karen noticed."
"Karen believes in you. Karen also believes in FedEx."
"Response rate since Karen: 100%. Eventually."
"Karen has never lost a case. Karen has sent some regrettable FedEx letters."

On hover over any ACTIVE row:
Tooltip: "Would you like Karen to send a reminder?"
Buttons: [Yes, do it] [Karen will do it anyway]
→ Second button triggers Level 1 of a new escalation instantly

Footer (always, never changes):
"Karen is always watching. Karen means well."
"© Karen Automated Correspondence Systems LLC — All rights reserved.
 All matters documented. All debts remembered."

---

## Live Escalation View (/escalation/[id])

Two-column layout. SSE stream from backend.

### Left column — Escalation Timeline
Each level renders as a card when it fires.

Level card anatomy:
```
┌─ Level [N] · [CHANNEL] · [EMOJI] ──────── [STATUS] ─┐
│ [Subject or first line of message sent]              │
│ [Full message preview — first 100 chars]             │
│                                                      │
│ Karen's note: "[internal monologue]"                 │
│                                                      │
│ ████████████████████░░░ Next level in [N]s...        │
└──────────────────────────────────────────────────────┘
```

Color of card border = escalation level color:
Green (1-2) → Yellow (3-4) → Orange (5-6) → Red (7-8) →
Purple (9) → Nuclear ☢️ (10)

Progress bar fills between levels. Pauses if response detected.

### Right column — Karen's Commentary
Chat bubble UI. Karen's avatar: 🦞
Timestamps on every message.
Karen's commentary is her INTERNAL monologue —
different from what she actually sends.
Slightly more unhinged. More honest.

Examples:
"Sent the initial email. Warm tone. One emoji.
 Very professional. The ball is in his court."

"He was online on LinkedIn at 2:34 PM.
 I noted this. He did not respond.
 This is relevant information."

"Added Chinmay to the thread.
 I want to be clear this is not punitive.
 It is visibility.
 Chinmay will understand."

"The calendar invite has 3 reminders.
 I am thorough.
 Some might say too thorough.
 I am not one of those people."

### Header of escalation view
Shows: Initiator → Target · Grievance · Mode · Level [N]/10
Live counter: "Messages sent: [n] · Channels used: [n] · Minutes elapsed: [n]"

### Response/Payment banner
When response detected: pulsing green bar at top
"💬 Response detected from [target]. Karen is standing by.
 [View response] [De-escalate now] [Continue anyway]"

"Continue anyway" is there. It does what it sounds like.
Karen will add a note: "Operator chose to continue. Noted."

---

## The Circle Dashboard (/)

Main page. Shows everything at a glance.

Top: "THE CIRCLE" heading + Karen's current status
Karen status: "😴 Idle — no active escalations"
             "⚡ Active — following up with Bharath (Level 4)"
             "☢️ Nuclear — 3 active escalations"

Members grid: each person shown as a card
Member card shows:
- Name + avatar emoji
- "Can Karen reach them via:" → channel icons (filled = yes, grey = no)
- "Active escalations: [n incoming] [n outgoing]"
- "Last resolved: [time ago]"
- Quick action: [Follow Up →]

Active escalations feed:
Live list of all running escalations with level indicators.
Each row clickable → goes to /escalation/[id]

Recently resolved feed:
Last 5 resolved matters with de-escalation timestamps.
Karen's closing note for each.

---

## Design System

Typography:
- Display: "Clash Display" or "Syne" — for headings, names, stats
- Mono: "DM Mono" — for Karen's messages, metadata, timestamps
- Body: "Cabinet Grotesk" — for descriptions

Color palette:
- Background: #0a0a0f (near black)
- Surface: #12121a
- Border: #1e1e2e
- Level colors:
  Level 1-2: #22c55e (green)
  Level 3-4: #eab308 (yellow)
  Level 5-6: #f97316 (orange)
  Level 7-8: #ef4444 (red)
  Level 9:   #a855f7 (purple)
  Level 10:  #ec4899 + glow (nuclear pink)
- Karen accent: #f59e0b (amber — her brand color)
- Text primary: #f8f8ff
- Text muted: #6b6b8a

Motion:
- All level cards: slide in from right (Framer Motion)
- Progress bar: smooth fill with easing
- Status badges: pulse animations
- De-escalation: sequential reveal with checkmarks
- Page transitions: fade only, 150ms
- Karen's commentary: typewriter effect on each bubble
- Number counters: count up animation

NO generic purple gradients. NO Inter font.
NO rounded pill buttons (Karen is precise, not friendly).
This is a product that should not exist. It should look
like it definitely exists and has investors.

---

## Environment Variables

### backend/.env
```
# Karen's accounts
KAREN_GMAIL=karen.follows.up.nyc@gmail.com
KAREN_GMAIL_PASSWORD=
KAREN_GMAIL_APP_PASSWORD=   # Google App Password for SMTP

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=        # Karen's number e.g. +19175551234

# LinkedIn (browser automation credentials)
LINKEDIN_EMAIL=             # Karen's LinkedIn login
LINKEDIN_PASSWORD=

# Twitter/X API v2
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_BEARER_TOKEN=

# Discord
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=           # The demo server ID
DISCORD_CHANNEL_ID=         # #general channel ID

# Google APIs
GOOGLE_CALENDAR_CREDENTIALS=  # Service account JSON path
GITHUB_TOKEN=               # Fine-grained PAT for portfolio repo
GITHUB_REPO=rahilsinghi/portfolio

# FedEx
FEDEX_API_KEY=
FEDEX_API_SECRET=
FEDEX_ACCOUNT_NUMBER=

# Karen's return address (for FedEx sender)
KAREN_ADDRESS_LINE1=Karen Automated Correspondence Systems LLC
KAREN_ADDRESS_LINE2=New York, NY 10001

# ElevenLabs TTS (Karen's voice)
ELEVENLABS_API_KEY=         # Creator plan key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel voice

# App
CORS_ORIGINS=http://localhost:3000,https://molly.rahilsinghi.com
ESCALATION_DEMO_INTERVAL_SECONDS=5
ESCALATION_PRODUCTION_INTERVAL_SECONDS=3600
SECRET_KEY=                 # For session management
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## WebSocket / SSE Protocol

Backend sends SSE events on GET /api/escalation/[id]/stream

Event types:
```typescript
type KarenEvent =
  | { type: "escalation_started"; escalation_id: string; initiator: string; target: string }
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
```

---

## Build Order — Do Not Deviate

1. Project scaffold + Docker + OpenClaw running
2. Pre-seeded circle.json loaded + /api/members endpoint working
3. Contact resolution logic (get_available_channels)
4. Personality service (generates all 40 message variants)
5. Channel integrations one at a time:
   a. Email (Gmail SMTP) — test: Karen sends email ✓
   b. SMS (Twilio) — test: Karen sends text ✓
   c. WhatsApp (Twilio) — test: Karen sends WhatsApp ✓
   d. LinkedIn (browser automation) — test: connection request ✓
   e. Google Calendar API — test: event created ✓
   f. Discord bot — test: message in server ✓
   g. GitHub API commit → Vercel deploy — test: Open Matters updates ✓
   h. Twitter/X API v2 — test: tweet posted + deleted ✓
   i. FedEx API + PDF generation — test: label generated ✓
6. Karen orchestration service (runs the ladder, calls channels)
7. FastAPI escalation endpoints + SSE stream
8. De-escalation service
9. Response detection (Gmail polling)
10. Payment webhook + resolve endpoint
11. Frontend: Circle dashboard
12. Frontend: Live escalation view (SSE)
13. Frontend: Open Matters page
14. Frontend: Trigger form
15. Frontend: Onboarding flow (/join)
16. Frontend: Karen lore page
17. Full demo run — all 10 levels, 5s intervals
18. Fix everything that breaks
19. Second full demo run ✓

---

## Demo Configuration

Initiator: Rahil Singhi
Target: Bharath Mahesh Gera
Grievance type: Financial
Grievance detail: "$23 dinner — February 8, 2026"
Days outstanding: 14
Personality: PASSIVE_AGGRESSIVE
Interval: 5 seconds
Max level: 10

Bharath is briefed: he knows he's the target.
He does not know exactly what's coming or when.
He has Venmo open on his phone.
His phone screen is mirrored on the second display.

Discord server is set up. Audience is invited at the start
of the presentation with a QR code. They join before the
demo starts. They are in the server when Level 7 fires.

---

## Demo Script (memorized, 3 minutes)

"This is Karen. Karen is my follow-up agent.
 Karen Automated Correspondence Systems LLC.
 Karen gets results.

 Karen has never once considered that maybe
 the other person is just busy.

 I asked Karen to follow up about $23 from dinner
 two weeks ago. This is what happened."

[hand phone to front row — they pick Bharath, hit Unleash Karen]

[3 minutes of Karen. The room watches both screens.]

[Bharath hits Resolve.]

[De-escalation plays out.]

[Karen: "Is there anyone else you'd like me to follow up with? 🙂"]

[input field. Chinmay's name pre-filled.]

[you look at Chinmay.]

[done.]

---

## Audio Integration

Karen speaks. Background music plays. The demo has sound.

### Karen's Voice (ElevenLabs)
- Voice: Rachel (ID: `21m00Tcm4TlvDq8ikWAM`), Model: `eleven_turbo_v2_5`
- Per-personality voice settings (speed, stability, style vary)
- **Quips**: 60 pre-recorded mp3s (15 per personality) in `backend/audio/quips/`
  Played instantly when a level fires ("Sent." / "He was online. I noticed.")
- **Commentary**: Generated on-the-fly via ElevenLabs during countdown between levels
  Longer, personalized lines about the escalation context
- All TTS generated server-side, served via `GET /api/audio/{path}`
- Frontend plays via HTMLAudioElement queue (useKarenAudio hook)

### Background Music
- Corporate hold music (`backend/audio/music/hold-music.mp3`)
- Progressive Web Audio distortion as levels escalate:
  Clean (1-2) → filter+pitch (3-4) → distortion+warble (5-6) →
  heavy (7-8) → cranked (9) → full chaos (10)
- Effect chain: source → BiquadFilter → WaveShaper → GainNode → destination
- LFO oscillator for pitch warble at higher levels
- Volume ducks to 20% when Karen speaks, fades back after

### Autoplay Gate
Browsers require user interaction before audio. Escalation page shows
"Enable Karen's Voice" overlay that must be clicked before audio starts.

### Demo Speed: DEMO_10S
10-second intervals between levels. Gives Karen time to speak
before the next level fires. Use for audio demos.

### Generating Quips (one-time setup)
```bash
docker compose exec backend python scripts/generate_quips.py
```
Generates 60 mp3s across 4 personalities. Skips existing files.

---

## Non-Negotiables

- No hardcoded message strings. All messages generated by personality service.
- No hardcoded demo data except circle.json pre-seeded members.
- Karen always identifies herself. Never impersonates.
- get_available_channels() must be called before every escalation level.
- SSE stream must stay open for the full escalation. Reconnect logic required.
- ngrok tunnel must auto-reconnect. Never let the demo die on a tunnel drop.
- FedEx letter PDF must be print-ready. Hold it up on stage.
- The "Continue anyway" button on response detection must work.
- Karen's closing line is always the same. Always followed by the next target input.
- "Karen is always watching. Karen means well." — appears on every page footer.
