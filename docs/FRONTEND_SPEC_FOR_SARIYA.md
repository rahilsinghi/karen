# Karen Frontend Spec — For Sariya
### Everything you need to know to design and build Karen's frontend
### Last updated: 2026-04-04

---

## Table of Contents

1. [What Karen Is (The 60-Second Version)](#1-what-karen-is)
2. [The Demo — What We're Building For](#2-the-demo)
3. [All Pages & Their Purpose](#3-all-pages)
4. [Backend API — Every Endpoint You'll Hit](#4-backend-api)
5. [Real-Time: SSE Events & How They Work](#5-real-time-sse)
6. [The Escalation Ladder — All 10 Levels](#6-escalation-ladder)
7. [Karen's 4 Personalities — How They Affect UI](#7-personalities)
8. [Audio Integration — Voice, Music, Effects](#8-audio)
9. [Data Models & TypeScript Types](#9-data-models)
10. [Current Frontend State — What Exists](#10-current-state)
11. [Design System — Colors, Fonts, Motion](#11-design-system)
12. [Page-by-Page Deep Dive](#12-page-deep-dive)
13. [Component Architecture](#13-components)
14. [Hooks — Custom React Hooks](#14-hooks)
15. [Edge Cases, Quirks, & Gotchas](#15-quirks)
16. [The De-Escalation Sequence](#16-deescalation)
17. [Channel Availability & Contact Resolution](#17-channels)
18. [Member Data & The Circle](#18-members)
19. [Environment & Running Locally](#19-environment)
20. [Design Opportunities & Open Questions](#20-opportunities)

---

## 1. What Karen Is

Karen is a follow-up agent that escalates non-responses across 10 communication channels, with 4 distinct personalities, against anyone in "The Circle" (a friend group). She was built for the MischiefClaw Hackathon.

**Karen is not malicious.** She is deeply, committedly, professionally unhinged. She means well. She always has.

**The pitch:** You're owed $23 from dinner two weeks ago. Karen will email, text, WhatsApp, LinkedIn, calendar-invite, Discord @everyone, publicly shame on GitHub, tweet about it, and FedEx a formal letter — all while providing running commentary in her own voice.

**The vibe:** A product that absolutely should not exist, but looks like it definitely exists and has investors.

---

## 2. The Demo

**Duration:** 3 minutes, live on stage

**Setup:**
- Rahil presents on a laptop (main screen: Karen dashboard)
- Bharath's phone is mirrored on a second display
- Audience joins a Discord server via QR code before demo starts
- Hold music plays with progressive distortion as levels escalate

**Flow:**
1. Rahil introduces Karen ("Karen gets results.")
2. Hands phone to front row — they pick Bharath as target, hit "Unleash Karen"
3. 3 minutes of escalation plays out across both screens in real-time
4. Audience sees Discord @everyone fire in their own server (Level 7)
5. Bharath hits "Resolve" on Venmo
6. De-escalation sequence plays out (animated, sequential)
7. Karen says: "Is there anyone else you'd like me to follow up with?"
8. Input field appears. Chinmay's name is pre-filled.
9. Rahil looks at Chinmay. Done.

**Speed:** 10-second intervals between levels (`DEMO_10S` mode) — gives Karen time to speak

**What this means for frontend:**
- Everything must be visually dramatic and legible from 20 feet away
- Transitions and animations are the product — they ARE the demo
- Audio is critical: Karen's voice, hold music, distortion effects
- The countdown timer between levels is a key tension-builder
- The Discord moment (Level 7) needs to land — audience is watching their own phones

---

## 3. All Pages & Their Purpose

| Route | Purpose | Demo Priority |
|-------|---------|---------------|
| `/` | The Circle dashboard — members, active escalations, Karen's status | Medium (starting point) |
| `/trigger` | New escalation form — pick target, grievance, personality, speed | High (audience uses this) |
| `/escalation/[id]` | Live escalation view — real-time timeline + Karen sidebar | **Critical** (this IS the demo) |
| `/open-matters` | Public accountability registry — all escalations listed | Medium (Level 8 lands here) |
| `/join` | Onboarding — 3-screen flow for new users | Low (post-demo feature) |
| `/karen` | Karen lore page — who she is, how she works | Low (easter egg / info) |

---

## 4. Backend API — Every Endpoint You'll Hit

Base URL: `http://localhost:8000` (or `NEXT_PUBLIC_API_URL` env var)

### Members

| Method | Path | What It Does | Response |
|--------|------|-------------|----------|
| `GET` | `/api/members` | All circle members | `{ members: Member[] }` |
| `GET` | `/api/members/{id}` | Single member | `Member` |
| `POST` | `/api/members` | Create member | `Member` (201) |
| `PATCH` | `/api/members/{id}` | Update member | `Member` |
| `DELETE` | `/api/members/{id}` | Remove member | 204 |
| `GET` | `/api/members/{id}/channels` | Available channels for a member | `ChannelStatus[]` |

**The `/channels` endpoint is important for UI.** It returns which communication channels Karen can use for that person. Grey out unavailable channels. Show which ones "unlock" as users fill in contact info.

### Escalation

| Method | Path | What It Does | Response |
|--------|------|-------------|----------|
| `POST` | `/api/trigger` | Start a new escalation | `Escalation` |
| `GET` | `/api/escalation/{id}` | Get escalation state | `Escalation` |
| `GET` | `/api/escalation/{id}/stream` | **SSE stream** (real-time events) | `EventSource` |
| `GET` | `/api/escalations` | All escalations (active + resolved) | `Escalation[]` |
| `GET` | `/api/escalations/active` | Only active escalations | `Escalation[]` |
| `POST` | `/api/escalation/{id}/response-detected` | Signal a response was detected | `{ status }` |
| `POST` | `/api/escalation/{id}/payment-detected` | Signal payment was detected | `{ status }` |
| `POST` | `/api/escalation/{id}/continue` | Continue after response detected | `{ status }` |
| `POST` | `/api/escalation/{id}/resolve` | Trigger de-escalation | `{ status }` |
| `GET` | `/api/escalation/{id}/letter.pdf` | Download the FedEx PDF letter | PDF file |

### Webhooks & Payments

| Method | Path | What It Does | Response |
|--------|------|-------------|----------|
| `POST` | `/api/venmo-webhook` | Venmo sends payment notification | `{ status }` |
| `POST` | `/api/payment-confirm` | Manual payment confirmation | `{ status }` |

### Audio

| Method | Path | What It Does | Response |
|--------|------|-------------|----------|
| `GET` | `/api/audio/quips/{personality}/{file}` | Pre-recorded voice quip | MP3 |
| `GET` | `/api/audio/music/hold-music.mp3` | Background hold music | MP3 |
| `GET` | `/api/audio/tmp/{esc_id}/{file}` | Generated commentary audio | MP3 |

### Health

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/health` | `{ status: "ok", service: "karen" }` |

### Trigger Request Body

```typescript
{
  initiator_id: string,        // who's asking Karen to follow up
  target_id: string,           // who's being followed up with
  grievance_type: "financial" | "object" | "communication",
  grievance_detail: string,    // "dinner — February 8, 2026"
  amount?: number,             // 23 (for financial)
  venmo_handle?: string,       // "@RahilSinghi"
  date_of_incident?: string,   // "2026-02-08"
  personality: "passive_aggressive" | "corporate" | "genuinely_concerned" | "life_coach",
  speed: "demo" | "demo_10s" | "quick" | "standard" | "patient",
  max_level: number            // 1-10
}
```

---

## 5. Real-Time: SSE Events & How They Work

**This is the core of the live escalation view.**

The frontend opens an `EventSource` connection to:
```
GET /api/escalation/{id}/stream?last_seq=-1
```

The `last_seq` parameter tells the server which events you've already seen. On reconnect, pass the last sequence number to avoid duplicate events. The server replays any events you missed, then streams live.

### All SSE Event Types

```typescript
// Escalation started — first event always
{ type: "escalation_started", escalation_id: string, initiator: string, target: string, seq: number }

// A level is about to fire on a specific channel
{ type: "level_start", level: number, channel: string, message_preview: string, seq: number }

// A level completed successfully
{ type: "level_complete", level: number, channel: string, karen_note: string, seq: number }

// A level was skipped (channel unavailable)
{ type: "level_skipped", level: number, reason: string, seq: number }

// Karen's internal monologue (sidebar content)
{ type: "commentary", text: string, timestamp: string, seq: number }

// Target replied to an email/message
{ type: "response_detected", from_name: string, preview: string, seq: number }

// Payment confirmed via webhook or manual button
{ type: "payment_detected", amount: number, from_name: string, seq: number }

// A de-escalation step completed
{ type: "deescalation_step", action: string, status: "ok" | "failed", karen_note?: string, seq: number }

// Escalation fully resolved
{ type: "complete", karen_closing: string, seq: number }

// Something went wrong
{ type: "error", message: string, seq: number }

// Audio clip to play
{ type: "audio", audio_type: "quip" | "commentary", audio_url: string, text?: string, seq: number }
```

### Key SSE Behaviors

1. **Keepalive:** Server sends a ping every 15 seconds if no events. Handle this gracefully.
2. **Reconnection:** Use exponential backoff (2s, 4s, 8s... max 30s). After 5s of stable connection, reset backoff.
3. **Deduplication:** Track the highest `seq` number you've seen. Pass `last_seq` on reconnect.
4. **Event replay:** On connect, the server replays ALL past events (filtered by `last_seq`). This means if someone opens the escalation page mid-escalation, they see the full history instantly.
5. **Refetch escalation state** after: `level_complete`, `response_detected`, `payment_detected`, `complete` — these change the `Escalation` object's fields.

### How Events Map to UI

| Event | What to show |
|-------|-------------|
| `level_start` | New level card appears (slide in), shows "sending..." state |
| `level_complete` | Card updates to "complete", shows karen_note |
| `level_skipped` | Card shows skip reason (grey, no animation) |
| `commentary` | New bubble in Karen's sidebar (typewriter effect) |
| `response_detected` | Green pulsing banner at top with action buttons |
| `payment_detected` | Green banner with "Initiate De-escalation" button |
| `deescalation_step` | Sequential reveal of undo actions (checkmarks / X marks) |
| `complete` | Karen's closing line + "next target" input |
| `audio` | Queue the audio clip for playback |
| `error` | Toast or inline error message |

---

## 6. The Escalation Ladder — All 10 Levels

Each level fires specific channels. At demo speed (10s), there's a countdown timer between levels.

```
Level  1: Email (warm, friendly)                                    Color: GREEN
Level  2: Email (bump) + SMS                                        Color: GREEN
Level  3: Email (tone shift) + WhatsApp + Voice Call                Color: YELLOW
Level  4: Email (CC's a mutual contact) + SMS to CC'd person       Color: YELLOW
Level  5: LinkedIn connection request + InMail                      Color: ORANGE
Level  6: Google Calendar event (3 reminders)                       Color: ORANGE
Level  7: Discord @everyone post                                    Color: RED
Level  8: GitHub commit → Open Matters page goes live               Color: RED
Level  9: Twitter/X post from @KarenFollowsUp                      Color: PURPLE
Level 10: FedEx formal letter (PDF generated)                       Color: NUCLEAR PINK
```

### What the frontend needs to show per level:

1. **Level number + channel name(s)**
2. **Status:** pending / active (sending) / complete / skipped / error
3. **Message preview:** First ~100 chars of what Karen actually sent
4. **Karen's note:** A short (< 15 word) quip specific to that level (e.g., "He was online. I noticed.")
5. **Progress bar:** Fills up during the countdown to the next level
6. **Card border color:** Matches the level color (green → yellow → orange → red → purple → nuclear)

### Channel-specific UI details:

| Channel | Icon | What's shown | Special UI |
|---------|------|-------------|------------|
| Email | `📧` | Subject line + body preview | CC'd person shown at Level 4 |
| SMS | `📱` | Message body (max 160 chars) | — |
| WhatsApp | `💬` | Message body | — |
| Voice Call | `📞` | What Karen said on the call | New in Level 3 |
| LinkedIn | `💼` | Connection request + InMail body | — |
| Calendar | `📅` | Event title + description | "3 reminders" note |
| Discord | `🎮` | Message body | "@everyone" highlighted |
| GitHub | `🔗` | Commit title + body | Link to /open-matters |
| Twitter | `🐦` | Tweet text (max 280 chars) | — |
| FedEx | `📦` | Letter preview | "Download PDF" button |

### Multi-channel levels

Levels 2, 3, and 4 fire multiple channels simultaneously. The UI should show all channels for that level in the same level card — not separate cards per channel.

**Example Level 3 card:**
```
Level 3 · EMAIL + WHATSAPP + VOICE · 🟡
├─ Email: "Re: Following up — $23 from dinner..."
├─ WhatsApp: "Hi Bharath, this is Karen again..."
├─ Voice: "Called target's phone — delivered message via Polly"
└─ Karen's note: "Three channels. He'll notice at least one."
```

---

## 7. Karen's 4 Personalities — How They Affect UI

Each personality changes:
- The messages Karen sends (generated by Claude AI, never hardcoded)
- Karen's internal commentary (sidebar)
- The voice settings for TTS (speed, stability, style)
- The overall VIBE of the escalation

### Passive-Aggressive (Default for demo)

**Emoji behavior:** Emoji count escalates with levels.
- Level 1: one emoji (e.g., "Just checking in 🙂")
- Level 5: three emojis
- Level 9: messages are predominantly emojis
- Level 10: formal letter, emojis in the margins

**Commentary examples:**
- "Sent. 🙂"
- "He was online at 2:34 PM. I noticed."
- "I'm sure they're just busy. For fourteen days."
- "This is not punitive. It is visibility."

**Voice:** Slow (0.85x speed), high stability, measured tone

**UI implication:** Could lean into emoji animations, passive-aggressive formatting (overly polite language rendered in a way that reads as menacing)

### Corporate

**Tone:** Project manager energy. Zero emotional acknowledgment. Pure process.

**Key phrases:** "Per my last communication," "Please advise on timeline," "Looping in [name] for visibility," "This matter requires your action by EOD"

**Commentary examples:**
- "Sent per timeline."
- "Escalation SLA breached."
- "Added stakeholder for alignment."
- "Documentation updated. Audit trail maintained."

**Voice:** Fast (1.15x speed), very stable, no style/emotion

**UI implication:** Could look like a Jira board or project management tool. Status updates, timelines, SLA counters.

### Genuinely Concerned

**Tone:** Actually believes she's saving the friendship. Never winks. No irony.

**Key phrases:** "I just don't want this to become a thing between you," "$23 is not worth a friendship," "I care about both of you. That's why I keep trying."

**Commentary examples:**
- "I hope they work this out."
- "This is about more than the money."
- "I'm doing this because I care."

**Voice:** Slightly slow (0.9x), low stability (more emotional variation), high style

**UI implication:** Softer colors? Warmer tone? Contrast with the actual escalation actions.

### Life Coach

**Tone:** Reframes everything as personal growth and accountability.

**Key phrases:** "Unresolved financial obligations create energetic blocks," "Showing up for people is how we build trust," "The $23 is not the point. The accountability is."

**Commentary examples:**
- "Growth requires discomfort."
- "He's avoiding himself."
- "The universe sends Karen for a reason."

**Voice:** Slowest (0.8x), medium stability, highest style

**UI implication:** Could lean into wellness/mindfulness aesthetics — but still sending FedEx letters.

### Personality Preview

On the trigger form, when you select a personality, a preview of Karen's Level 1 message updates live. This lets the audience see the tone before they hit "Unleash Karen."

---

## 8. Audio Integration

**This is a major part of the demo experience.** The escalation isn't just visual — Karen speaks.

### Three Audio Layers

#### Layer 1: Pre-Recorded Quips
- **What:** 60 short voice clips (1-3 seconds each), 15 per personality
- **When:** Played instantly when a level fires (via `audio` SSE event)
- **Path:** `/api/audio/quips/{personality}/quip_XX.mp3`
- **Examples by personality:**
  - PA: "Sent." / "Noted." / "He's online. I noticed." / "I'll wait." / "As expected."
  - Corporate: "Sent per timeline." / "Action item delivered." / "Proceeding as planned."
  - Concerned: "I just want to help." / "Sent with care." / "Nobody wants this to escalate."
  - Coach: "Growth requires follow-through." / "Accountability delivered." / "Trust the process."

#### Layer 2: Generated Commentary
- **What:** Longer TTS clips (5-15 seconds) generated on-the-fly during the countdown between levels
- **When:** During the wait between levels — Karen narrates what she's thinking
- **Path:** `/api/audio/tmp/{escalation_id}/commentary_L{level}.mp3`
- **Generation:** Backend calls ElevenLabs API, generates MP3, serves it
- **Latency:** 1-3 seconds to generate. The backend fires generation as a background task during the countdown.

#### Layer 3: Background Music
- **What:** Corporate hold music (jazz lounge elevator music)
- **Path:** `/api/audio/music/hold-music.mp3`
- **When:** Plays continuously from when the user enables audio
- **Special behavior:** Progressive Web Audio distortion as escalation levels increase

### Music Distortion Effects

This is one of the coolest parts. The hold music starts clean and gets increasingly unhinged:

| Levels | Filter (Hz) | Distortion | Warble | Playback Rate | Feel |
|--------|-------------|------------|--------|---------------|------|
| 1-2 | 20,000 (full) | 0 | none | 1.0x | Clean, corporate |
| 3-4 | 8,000 | 2 | none | 0.98x | Slightly muffled |
| 5-6 | 4,000 | 10 | slight | 0.95x | Something's off |
| 7-8 | 2,500 | 30 | heavy | 0.90x | Clearly wrong |
| 9 | 1,500 | 60 | fast | 0.87x | Unsettling |
| 10 | 800 | 100 | max | 0.85x | Full chaos |

**Implementation:** Web Audio API chain: `source → BiquadFilter (lowpass) → WaveShaper (distortion) → GainNode → destination`, with an LFO oscillator for pitch warble at higher levels.

### Audio Ducking

When Karen speaks (quip or commentary), the background music ducks to ~6% volume, then fades back up after the clip ends. The `useKarenAudio` hook fires `onPlayStart` and `onPlayEnd` callbacks for this.

### Autoplay Gate

**Browsers block autoplay until user interaction.** The escalation page MUST show an overlay/modal:

```
"Enable Karen's Voice"
[Click to start]
```

Only after clicking does audio start. This is not optional — it's a browser requirement. Design this overlay to be part of the experience, not an annoying popup.

### Audio Event Flow

1. Level fires → backend emits `audio` SSE event with `audio_type: "quip"` and `audio_url`
2. Frontend queues the audio clip
3. Clip plays → music ducks → clip ends → music comes back
4. During countdown: backend generates commentary TTS in background
5. Commentary ready → backend emits `audio` SSE event with `audio_type: "commentary"`
6. Frontend queues it → plays during the countdown → music ducks again

---

## 9. Data Models & TypeScript Types

### Member

```typescript
interface Contacts {
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  twitter: string;
  venmo: string;
  calendar: string;
  address: string;
}

interface Member {
  id: string;           // "rahil", "bharath", etc.
  name: string;         // "Rahil Singhi"
  role: "admin" | "member";
  avatar_emoji: string; // "🦞"
  contacts: Contacts;
}
```

### Channel Status

```typescript
interface ChannelStatus {
  channel: string;      // "email", "sms", "whatsapp", etc.
  available: boolean;   // true if Karen can use this channel
}
```

### Escalation

```typescript
interface Escalation {
  id: string;                    // 12-char hex
  initiator: Member;
  target: Member;
  grievance_type: "financial" | "object" | "communication";
  grievance_detail: string;
  amount?: number;
  personality: Personality;
  speed: EscalationSpeed;
  max_level: number;             // 1-10
  current_level: number;         // 0 = not started yet
  status: EscalationStatus;
  messages_sent: number;
  channels_used: string[];
  channel_metadata: Record<string, any>;  // e.g., { discord_message_id: "..." }
  started_at: string;            // ISO datetime
  resolved_at?: string;
}

type EscalationStatus = "active" | "paused" | "response_detected" | "payment_detected" | "deescalating" | "resolved";
type Personality = "passive_aggressive" | "corporate" | "genuinely_concerned" | "life_coach";
type EscalationSpeed = "demo" | "demo_10s" | "quick" | "standard" | "patient";
```

### KarenEvent (SSE)

```typescript
type KarenEvent =
  | { type: "escalation_started"; escalation_id: string; initiator: string; target: string; seq: number }
  | { type: "level_start"; level: number; channel: string; message_preview: string; seq: number }
  | { type: "level_complete"; level: number; channel: string; karen_note: string; seq: number }
  | { type: "level_skipped"; level: number; reason: string; seq: number }
  | { type: "commentary"; text: string; timestamp: string; seq: number }
  | { type: "response_detected"; from_name: string; preview: string; seq: number }
  | { type: "payment_detected"; amount: number; from_name: string; seq: number }
  | { type: "deescalation_step"; action: string; status: "ok" | "failed"; karen_note?: string; seq: number }
  | { type: "complete"; karen_closing: string; seq: number }
  | { type: "error"; message: string; seq: number }
  | { type: "audio"; audio_type: "quip" | "commentary"; audio_url: string; text?: string; seq: number }
```

---

## 10. Current Frontend State — What Exists

The frontend is **fully functional** but was built for correctness, not beauty. Every page works. Every hook works. Every API integration works. Audio works.

**What exists and works:**
- All 6 pages render and function
- SSE streaming with reconnection and dedup
- Audio playback queue with ducking
- Background music with Web Audio distortion
- Framer Motion animations on level cards
- Typewriter effect on Karen's commentary
- Virtual scrolling on Open Matters table
- Pretext-based text measurement for dynamic layouts
- Responsive layout (basic)
- Custom fonts (Syne, DM Mono, DM Sans)
- Full color system from the spec

**What needs a revamp (design/UX):**
- Visual polish — currently functional but not "looks like it has investors" polished
- Typography hierarchy and spacing
- Animation choreography and timing
- Overall layout and information density
- Mobile responsiveness
- Loading states and skeleton screens
- Error states and empty states
- Navigation between pages
- The "product that should not exist" aesthetic
- Personality-specific visual themes (currently same look regardless of personality)
- The escalation view is the main event — it needs to be DRAMATIC

**Tech stack:**
- Next.js 16 (App Router, React 19)
- Tailwind CSS 4 with custom @theme
- Framer Motion 12 for animations
- @chenglou/pretext for text measurement
- TypeScript strict mode

---

## 11. Design System

### Colors

```
Background:     #0a0a0f  (near black)
Surface:        #12121a  (cards, panels)
Border:         #1e1e2e  (subtle borders)
Text Primary:   #f8f8ff  (off-white)
Text Muted:     #6b6b8a  (secondary text)
Karen Accent:   #f59e0b  (amber — her brand color)

Level Colors:
  1-2:  #22c55e  (green)      — "this is fine"
  3-4:  #eab308  (yellow)     — "getting warm"
  5-6:  #f97316  (orange)     — "this is escalating"
  7-8:  #ef4444  (red)        — "this is serious"
  9:    #a855f7  (purple)     — "oh no"
  10:   #ec4899  (nuclear pink) + glow effect — "oh god"
```

### Typography

```
Display:  "Syne" (400-800)      — headings, names, stats, big numbers
Mono:     "DM Mono" (400, 500)  — Karen's messages, metadata, timestamps, code-like content
Body:     "DM Sans" (400-700)   — descriptions, paragraphs, form labels

Note from CLAUDE.md: "Clash Display" or "Cabinet Grotesk" were also suggested
as alternatives. Feel free to explore.
```

### Motion Principles

```
Level cards:         Slide in from right (Framer Motion)
Progress bars:       Smooth fill with easing
Status badges:       Pulse animations (color-specific: green/yellow/red/nuclear)
De-escalation steps: Sequential reveal with checkmarks
Page transitions:    Fade only, 150ms
Karen commentary:    Typewriter effect (line-by-line, 80ms per line)
Number counters:     Count-up animation on load
Level 9 cards:       Purple glow (2.5s pulse)
Level 10 cards:      Nuclear pink glow (1.5s pulse)
```

### What NOT to Do (from the spec)

- NO generic purple gradients
- NO Inter font
- NO rounded pill buttons ("Karen is precise, not friendly")
- NO friendly/soft aesthetics — this is a product that takes itself seriously

---

## 12. Page-by-Page Deep Dive

### Page 1: The Circle Dashboard (`/`)

**Purpose:** Home base. Shows everything at a glance.

**Header section:**
- "THE CIRCLE" heading
- Karen's current status indicator:
  - `😴 Idle — no active escalations`
  - `⚡ Active — following up with Bharath (Level 4)`
  - `☢️ Nuclear — 3 active escalations`

**Members grid:**
Each member is a card showing:
- Avatar emoji (🦞, 🎯, ⚡, 🌙, 🎨)
- Name + role
- Channel availability icons (filled = available, grey = unavailable)
  - This uses `GET /api/members/{id}/channels`
- Active escalation count (incoming + outgoing)
- Last resolved time
- [Follow Up →] quick action button

**Active escalations feed:**
- Live list of all running escalations
- Shows: initiator → target, level indicator, personality, time elapsed
- Each row clickable → `/escalation/[id]`
- **Polls `/api/escalations` every 3 seconds** for updates

**Recently resolved:**
- Last 5 resolved matters with timestamps
- Karen's closing note for each

**Data flow:**
```
On mount:
  GET /api/members → member list
  GET /api/escalations → all escalations
Every 3s:
  GET /api/escalations → refresh escalation data
```

---

### Page 2: Trigger Form (`/trigger`)

**Purpose:** Create a new escalation. The audience uses this during the demo.

**Fields:**

1. **Who's following up** — dropdown of circle members (default: you/first member)
2. **Who are they following up with** — dropdown of circle members
   - Pre-selected if URL has `?target=bharath`
3. **Grievance type** — 3 options:
   - Financial: shows amount + Venmo handle + date fields
   - Object: shows item name + estimated value
   - Communication: shows platform + days since last response
4. **Grievance detail** — text input (what happened)
5. **Karen's personality** — 4 buttons, highlight selected
   - **Live preview:** Shows a sample Level 1 message that updates as you pick
   - Currently shows hardcoded previews per personality; could be enhanced with real API preview
6. **Escalation speed** — buttons:
   - `5s Demo` / `10s Demo+Audio` / `10m Quick` / `1h Standard` / `1d Patient`
7. **Max level** — slider 1-10
   - Show which channels activate at the selected max
   - Visual indicator of what will happen

**CTA:** "Unleash Karen 🦞"

**After submit:** `POST /api/trigger` → redirect to `/escalation/[new_id]`

**Design opportunity:** The personality preview is a great place to sell the experience. Showing "this is what Karen will say" before you hit go builds anticipation.

**Design opportunity:** Channel preview based on max_level AND target's available channels. Show what Karen CAN do vs. what she WILL do.

---

### Page 3: Live Escalation View (`/escalation/[id]`) — THE MAIN EVENT

**Purpose:** Real-time escalation monitoring. Two-column layout. This is where the demo lives.

#### Header Bar

- Initiator → Target (with emojis and names)
- Grievance detail + personality badge
- Level indicator: "Level [N] / 10"
- Live counters (animated count-up):
  - Messages sent: [n]
  - Channels used: [n]
  - Minutes elapsed: [n]
- Countdown timer to next level (fills visually)
- Connection indicator (green dot if SSE connected)
- "Payment Received" button (manual confirm)

#### Left Column: Escalation Timeline

Each level renders as a card when it fires.

**Level card structure:**
```
┌─ Level [N] · [CHANNEL(S)] · [STATUS EMOJI] ─── [STATUS] ─┐
│                                                            │
│ [Subject / first line of message Karen sent]               │
│ [Full message preview — first 100 chars]                   │
│                                                            │
│ Karen's note: "[short internal quip]"                      │
│                                                            │
│ ████████████████████░░░ Next level in [N]s...              │
└────────────────────────────────────────────────────────────┘
```

- **Card border color** matches level (green → yellow → orange → red → purple → nuclear)
- **Cards slide in from right** when a level fires
- **Progress bar** fills between levels (tension builder!)
- **Multiple channels per level** shown as sub-items within the card
- **Expand/collapse:** Active + last completed levels expanded, others collapsed
- **Level 9 cards:** purple glow animation
- **Level 10 cards:** nuclear pink glow animation

#### Right Column: Karen's Commentary Sidebar

Chat-bubble UI. Karen's avatar: 🦞

- Commentary arrives via `commentary` SSE events
- Each bubble has a **typewriter effect** (text reveals line by line)
- Timestamps shown after typewriter completes
- Auto-scrolls to latest message
- Amber left-border accent on each bubble

**Commentary examples (passive-aggressive personality):**
```
"Sent the initial email. Warm tone. One emoji.
 Very professional. The ball is in his court."

"He was online on LinkedIn at 2:34 PM.
 I noted this. He did not respond.
 This is relevant information."

"The calendar invite has 3 reminders.
 I am thorough.
 Some might say too thorough.
 I am not one of those people."
```

**Key nuance:** Commentary is Karen's INTERNAL monologue — different from what she sends. It's slightly more unhinged, more honest. The comedy comes from the gap between what Karen sends (professional) and what she thinks (obsessive).

#### Banners (Conditional)

**Response detected:**
```
💬 Response detected from [target]. Karen is standing by.
[View response]  [De-escalate now]  [Continue anyway]
```
- Green pulsing bar at top
- "Continue anyway" IS intentional. Karen notes: "Operator chose to continue. Noted."

**Payment detected:**
```
💰 Payment of $[amount] received from [target].
[Initiate De-escalation]
```
- Karen does NOT auto-de-escalate. She waits to be told to stop. This is a product decision.

#### After Resolution

When escalation completes or de-escalation finishes:
- Karen's closing line (always the same): "All resolved. Relationships restored. Is there anyone else you'd like me to follow up with? 🙂"
- Text input field appears immediately
- Pre-filled with next circle member's name
- Manual de-escalation button available at all times during an active escalation

#### Audio on This Page

- Autoplay gate overlay must be clicked first
- Background music starts when enabled
- Music level updates with each new level (`setLevel(currentLevel)`)
- Karen's voice plays via audio queue
- Music ducks when Karen speaks

---

### Page 4: Open Matters (`/open-matters`)

**Purpose:** Public accountability registry. Goes live when Level 8 fires (GitHub commit → Vercel redeploy).

**Header:**
- "OPEN MATTERS" (dynamically sized to fill width — uses pretext library for binary search on font size)
- Subtitle: "Public accountability registry"
- Active matter count with count-up animation

**Stats row (4 cards):**
- Total matters: [n]
- Total outstanding: $[sum]
- Average resolution time: [x] days
- Currently escaping Karen: **0** (always zero — Karen is inescapable)

**Rotating quotes (every 8 seconds):**
- "Karen has sent 847 follow-ups. Karen has never been ignored twice."
- "[random member name] was last seen online 3 minutes ago. Karen noticed."
- "Karen believes in you. Karen also believes in FedEx."
- "Response rate since Karen: 100%. Eventually."
- "Karen has never lost a case. Karen has sent some regrettable FedEx letters."
- "Karen is not angry. Karen is thorough."

**Table columns:**
```
Ref #  |  Name  |  Amount  |  Detail  |  Level  |  Status
```

**Status badges:**
- 🟢 RESOLVED — green, strikethrough text
- 🟡 MONITORING — yellow pulse
- 🔴 ACTIVE — red with level indicator "Level 7"
- ☢️ NUCLEAR — purple glow, for Level 8+

**Hover interaction:**
- Hovering any ACTIVE row shows tooltip: "Would you like Karen to send a reminder?"
- Two buttons: [Yes, do it] and [Karen will do it anyway]
- Second button triggers a new Level 1 escalation instantly (POST /api/trigger)

**Footer (fixed, never changes):**
```
Karen is always watching. Karen means well.
© Karen Automated Correspondence Systems LLC — All rights reserved.
All matters documented. All debts remembered.
```

**Performance note:** The table uses virtual scrolling with binary-search-based row height calculation and 200px overscan. This is already implemented.

---

### Page 5: Onboarding (`/join`)

**Purpose:** For general users (not the pre-seeded 5). Three screens, fast, no account creation.

**Screen 1 — About You:**
- Fields: Full name, email, phone
- Note: "I act through my own accounts on your behalf. Your accounts are never accessed."
- CTA: "Join The Circle →"
- `POST /api/members` to create the user

**Screen 2 — Add Your First Target:**
- Fields: Name (required), email (required), phone (required)
- Optional: WhatsApp (checkbox: same as phone), LinkedIn URL, Venmo handle, address
- **Dynamic channel unlock:** As they fill fields, channel icons animate from grey to filled
  - "More info = more Karen" is displayed live
  - This is a great design moment — watch channels "light up"
- CTA: "Add to Circle" / "Skip — I'll add someone later"
- `POST /api/members` to create the target

**Screen 3 — You're In:**
- Shows The Circle with their name + first target
- Quick-start button: "Start a follow-up →" → `/trigger`
- Demo prompt: "Try it with $1 from a friend you trust 🙂"

**Transitions:** Framer Motion animated between steps

---

### Page 6: Karen Lore (`/karen`)

**Purpose:** Educational/fun page explaining who Karen is.

**Sections:**
1. Hero: 🦞 + "KAREN" + "Automated Correspondence Systems LLC"
2. "Who is Karen?" — narrative description
3. 10-Level Escalation Ladder — visual representation with level colors
4. 4 Personalities — grid with descriptions
5. "How Karen Works" — explanation + sample message
6. Final line: "Karen has never once considered that maybe the other person is just busy."

**Design opportunity:** This could be a beautiful scrolling experience. It's the "About" page of a product that shouldn't exist.

---

## 13. Component Architecture

### Core Components

| Component | Used On | Purpose |
|-----------|---------|---------|
| `MemberCard` | Dashboard | Member info + channels + quick actions |
| `EscalationTimeline` | Escalation view | All level cards stacked vertically |
| `LevelCard` | Inside Timeline | Single level with channels, status, progress |
| `KarenSidebar` | Escalation view | Commentary bubbles with typewriter |
| `DeescalationSequence` | Escalation view | Sequential undo steps |
| `OpenMattersTable` | Open Matters | Virtual scrolling table |
| `OnboardingFlow` | Join page | 3-step form wizard |

### LevelCard — The Most Complex Component

This is the most visually important component. Each card shows:

- **Header:** Level number, channel icon(s), status badge
- **Body (expanded):**
  - Per-channel message preview
  - Karen's note (short quip)
  - Progress bar to next level
- **States:** pending → active → complete / skipped / error
- **Visual effects:**
  - Expand/collapse animation
  - Border color by level
  - Glow effects for levels 9 & 10
  - Slide-in animation when new

The current implementation uses `@chenglou/pretext` for precise text measurement and shrinkwrap chat-bubble sizing. This is sophisticated but could be simplified if the design changes.

### KarenSidebar — Typewriter Bubbles

Each commentary message renders with:
1. Text reveals line-by-line (80ms per line)
2. Blinking cursor during typing
3. Timestamp appears after typewriter completes
4. Amber left-border accent
5. Auto-scroll to newest

This effect is what makes Karen feel "alive" during the demo.

---

## 14. Hooks

### `useCircle()`
**Returns:** `{ members, escalations, loading, fetchChannels, refetch }`
- Fetches members + all escalations on mount
- Polls escalations every 3 seconds
- `fetchChannels(memberId)` → `ChannelStatus[]`

### `useEscalation(escalationId)`
**Returns:** `{ events, escalation, connected, continueAnyway, resolve, confirmPayment }`
- Opens SSE connection with reconnection + backoff
- Deduplicates events by `seq` number
- Provides action methods for response/payment handling
- Refetches escalation object on key events

### `useKarenAudio(events, options?)`
**Side effect:** Plays audio clips from `audio` events
- Sequential queue (one at a time)
- `options.onPlayStart` / `options.onPlayEnd` for music ducking
- Skips failed loads, plays next

### `useBackgroundMusic()`
**Returns:** `{ start, stop, duck, unduck, setLevel }`
- Fetches and loops hold music via Web Audio API
- `setLevel(0-10)` adjusts distortion, filter, warble, playback rate
- `duck()` fades to 6% volume, `unduck()` fades back
- Full effect chain: source → filter → waveshaper → gain → destination

---

## 15. Edge Cases, Quirks, & Gotchas

### State is in-memory (no database)
All escalation state is stored in Python dicts on the backend. **If the server restarts, all active escalations are lost.** This is fine for a hackathon demo but means:
- Don't show historical data that might not exist
- Handle 404s on `/api/escalation/{id}` gracefully
- The SSE stream will close on server restart — reconnect logic is critical

### Channels can be skipped
If a channel isn't available (contact info missing), that level's channel is skipped silently. The backend emits a `level_skipped` event. The UI should show this gracefully — not as an error, but as "Karen couldn't reach them here."

### Multiple channels per level
Levels 2, 3, 4 fire multiple channels at once. The events come in sequence (level_start/level_complete for each channel), but they're all part of the same level.

### Level 4 has a CC'd person
Level 4 CC's a mutual contact (the first circle member who isn't the initiator or target). The email goes to the target AND the CC'd person. The SMS goes to the CC'd person too. The UI should show who was CC'd.

### Discord and GitHub are always "available"
Unlike email/SMS/etc, Discord and GitHub don't depend on the target's contact info — they're community channels. They're available if the backend has the right env vars set.

### FedEx letter is PDF only (for demo)
The backend generates the PDF but doesn't actually ship it via FedEx API (too expensive for demo). The PDF is downloadable at `/api/escalation/{id}/letter.pdf`. The audience should see it rendered or a "Download PDF" button.

### De-escalation: LinkedIn always fails
By design, the LinkedIn InMail deletion step always returns `failed` with note: "LinkedIn InMail cannot be recalled once read. Karen regrets nothing." Show this honestly — the X mark is part of the comedy.

### De-escalation: FedEx may fail
If the escalation reached Level 10, the FedEx step fails: "FedEx letter already in transit. Karen's words are on paper now." If it didn't reach Level 10, it succeeds.

### The "Continue anyway" button
After a response is detected, the user can choose to continue the escalation. This is intentional and should work. Karen's commentary: "Operator chose to continue. Noted." This is a feature, not a bug.

### Karen's closing line is always the same
"All resolved. Relationships restored. Is there anyone else you'd like me to follow up with? 🙂"

Always. Every time. Followed by a pre-filled input for the next target.

### Speed affects countdown display
| Speed | Interval | Timer shows |
|-------|----------|-------------|
| demo | 5s | Seconds countdown |
| demo_10s | 10s | Seconds countdown |
| quick | 10min | Minutes countdown |
| standard | 1hr | Minutes countdown |
| patient | 24hr | Hours countdown |

### SSE keepalive pings
Server sends a ping every 15s of inactivity. Your EventSource handler should ignore these (they're just `:ping` comments).

### Karen footer on every page
"Karen is always watching. Karen means well." — appears at the bottom of every page. This is in the root layout already.

---

## 16. The De-Escalation Sequence

When the operator clicks "Initiate De-escalation" or "Resolve", this sequence plays out:

**Events arrive sequentially via SSE** as `deescalation_step` events.

| Step | Action | Can Fail? | Karen's Note on Success | Karen's Note on Failure |
|------|--------|-----------|------------------------|------------------------|
| 1 | Remove from Open Matters (GitHub) | Yes (if not posted) | "Public record is clean." | Skipped if never posted |
| 2 | Delete Discord post | Yes | "Community will forget. Eventually." | "Message not found" or credentials |
| 3 | Delete LinkedIn InMail | **Always fails** | — | "Cannot be recalled once read. Karen regrets nothing." |
| 4 | Cancel FedEx shipment | Yes (if L10 reached) | "Shipment cancelled before dispatch." | "Already in transit. Karen's words are on paper now." |
| 5 | Send apology to target | Rare fail | Standard apology | Email delivery fail |
| 6 | Send apology to CC'd contacts | Only if L4+ | Standard apology to CC | Skipped if no CC |
| 7 | Send apology TO the apology | Always runs | "Clarification regarding previous correspondence" | — |

**UI:** Each step should reveal sequentially with a delay between them. Show:
- ✅ for success
- ❌ for failure
- Karen's note for each
- Animation: staggered reveal, left to right or top to bottom

The comedy here is that de-escalation is ALSO an escalation (sending 3 apology emails is absurd).

---

## 17. Channel Availability & Contact Resolution

**This is important for multiple UI elements:**

The backend function `get_available_channels(member)` checks each contact field:
- Non-empty AND doesn't contain "FILL" → channel available
- Discord: available if DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID env vars are set
- GitHub: available if GITHUB_TOKEN env var is set

**Where channels matter in the UI:**

1. **Member cards (dashboard):** Show icons for available channels (filled vs grey)
2. **Trigger form:** Show which channels will fire at the selected max_level AND are available for the target
3. **Onboarding flow:** "More info = more Karen" — channels unlock as fields are filled
4. **Level cards:** Skipped channels shown as `level_skipped` events

**Full channel list:**
```
email, sms, whatsapp, voice_call, linkedin, twitter,
calendar, discord, github, fedex
```

**Available for demo target (Bharath):**
Currently only email and calendar have non-FILL values. SMS, Discord, and GitHub work regardless (env var based). Need to fill Bharath's real phone/WhatsApp/address before demo.

---

## 18. Member Data & The Circle

5 pre-seeded members in `backend/data/circle.json`:

| ID | Name | Emoji | Role | Available Channels |
|----|------|-------|------|-------------------|
| rahil | Rahil Singhi | 🦞 | admin | email, discord, github |
| bharath | Bharath Mahesh Gera | 🎯 | member | email, calendar, discord, github |
| chinmay | Chinmay Shringi | ⚡ | member | email, calendar, discord, github |
| sariya | Sariya Rizwan | 🌙 | member | email, calendar, discord, github |
| aishwarya | Aishwarya Ghaiwat | 🎨 | member | discord, github |

New members can be added via:
- `POST /api/members` (programmatic)
- The `/join` onboarding flow (UI)
- Member IDs are auto-generated from the name (lowercase, dash-separated)

---

## 19. Environment & Running Locally

### Prerequisites
- Docker + Docker Compose
- pnpm (for frontend)
- Node.js (via fnm)

### One-command start
```bash
./dev.sh
```
This starts:
- Backend (FastAPI on :8000) via Docker
- Frontend (Next.js on :3000) via pnpm
- OpenClaw (gateway :18789, bridge :18790) via Docker

### Frontend env vars
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Key backend env vars (needed for channels to work)
```
ANTHROPIC_API_KEY          → personality message generation
RESEND_API_KEY             → email (Levels 1-4)
TWILIO_ACCOUNT_SID         → SMS, WhatsApp, Voice (Levels 2-3)
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
DISCORD_BOT_TOKEN          → Discord (Level 7)
DISCORD_CHANNEL_ID
GITHUB_TOKEN               → Open Matters (Level 8)
ELEVENLABS_API_KEY         → Audio (quips + commentary)
ELEVENLABS_VOICE_ID
```

---

## 20. Design Opportunities & Open Questions

### Big Design Opportunities

1. **The Escalation View is the Hero**
   - This is 80% of the demo. It needs to be cinematic.
   - Two-column layout is functional but could be reimagined.
   - The countdown timer between levels is a tension builder — make it dramatic.
   - The transition from green (Level 1) to nuclear (Level 10) should feel like a journey.

2. **Personality-Specific Visual Themes**
   - Currently all 4 personalities look the same in the UI.
   - Passive-Aggressive could have a different visual treatment than Corporate.
   - Could personality affect color accents, typography weight, animation style?
   - The emoji escalation pattern of Passive-Aggressive is begging for visual treatment.

3. **The "Product That Shouldn't Exist" Aesthetic**
   - Karen should look like a real, polished SaaS product.
   - Think: professional landing page for an absurd service.
   - The humor comes from the contrast between the polish and the absurdity.
   - Inspiration: Stripe's dashboard... but for harassment.

4. **Channel Unlock Animation (Onboarding)**
   - As users fill in contact fields, channels animate from grey to active.
   - "More info = more Karen" is displayed as channels light up.
   - This is a delightful micro-interaction opportunity.

5. **Open Matters as a Public Shame Board**
   - Dark background, colorful status badges, rotating Karen quotes.
   - Should feel like a real public accountability tool.
   - The hover interaction ("Karen will do it anyway") is a great comedy beat.

6. **Karen's Voice as a Character**
   - The sidebar commentary is Karen's personality.
   - Typewriter effect, chat bubbles, timestamps.
   - Could the sidebar have more character? Emoji reactions? Mood indicators?

7. **The De-Escalation as a Comedy Sequence**
   - Each step revealing sequentially (some succeeding, some failing).
   - LinkedIn always failing is a punchline.
   - Three apology emails is absurd — lean into it.
   - The final "Is there anyone else?" with pre-filled next target is the kicker.

8. **Audio as Part of the Visual**
   - When Karen speaks, could there be a visual waveform or "speaking" indicator?
   - The music distortion could have a visual analog — the UI gets more "glitchy" as levels rise?
   - The autoplay gate should feel like part of the experience, not a speedbump.

9. **Navigation**
   - Currently no global nav bar. Users navigate via links and buttons.
   - A nav bar or sidebar could show Karen's global status at all times.
   - Consider: should Karen's status be visible from every page?

10. **Mobile Experience**
    - The trigger form is used on a phone during the demo (handed to audience).
    - This page specifically needs to work beautifully on mobile.
    - The escalation view is primarily on laptop — but Bharath might watch on phone too.

### Open Questions for Design

- Should the level color gradient apply to the whole page (background tint shifts green → red)?
- Should there be a "Karen is typing..." indicator before commentary appears?
- How prominent should the countdown timer be? Full-width bar? Circular indicator?
- Should resolved escalations show the full history or a summary?
- What happens when you hover over a member's avatar? Tooltip? Popover with details?
- Should there be sound effects beyond Karen's voice? (Level-up sound? Alert sounds?)
- Should the trigger form have a "confirmation" step or go straight to escalation?
- How should the audience's Discord experience sync with the dashboard? QR code overlay?

### What Backend Can Support That Isn't Wired Up Yet

1. **Live message previews on trigger form** — Could call personality service to generate a real preview (currently hardcoded samples)
2. **Channel metadata display** — Discord message IDs, GitHub SHAs are stored in `channel_metadata` but not shown
3. **FedEx letter preview** — The PDF is generated and downloadable but not rendered inline
4. **Escalation history for members** — API returns all escalations, could show per-member history
5. **Voice call recordings** — Twilio voice calls are made but no recording is captured currently

---

## Appendix A: SSE Event Timeline for a Full Demo Run

Here's exactly what happens in a 10-level passive-aggressive demo at 10s intervals:

```
t=0s    escalation_started { initiator: "Rahil", target: "Bharath" }
t=0s    commentary "Karen here. Following up about $23 from dinner..."
t=0.5s  level_start { level: 1, channel: "email", message_preview: "Hi Bharath..." }
t=1s    level_complete { level: 1, channel: "email", karen_note: "Sent. 🙂" }
t=1s    commentary "Sent the initial email. Warm tone. One emoji..."
t=1s    audio { type: "quip", url: "/api/audio/quips/passive_aggressive/quip_01.mp3" }
t=5s    audio { type: "commentary", url: "/api/audio/tmp/.../commentary_L1.mp3" }
        ... 10 second countdown with progress bar ...
t=10s   level_start { level: 2, channel: "email", message_preview: "Following up..." }
t=10.5s level_complete { level: 2, channel: "email", karen_note: "Bump sent." }
t=11s   level_start { level: 2, channel: "sms", message_preview: "Hi Bharath, Karen here..." }
t=11.5s level_complete { level: 2, channel: "sms", karen_note: "Two channels. Noted." }
t=11.5s commentary "Email and SMS. If he has his phone, he knows."
t=11.5s audio { type: "quip", url: "/api/audio/quips/passive_aggressive/quip_03.mp3" }
        ... continues through all 10 levels ...

At any point:
        response_detected → green banner, pause ladder
        payment_detected → green banner, wait for resolve button
        
On resolve:
        deescalation_step { action: "Remove from Open Matters", status: "ok" }
        deescalation_step { action: "Delete Discord post", status: "ok" }
        deescalation_step { action: "Delete LinkedIn InMail", status: "failed", karen_note: "Cannot be recalled..." }
        deescalation_step { action: "Cancel FedEx", status: "failed", karen_note: "Already in transit..." }
        deescalation_step { action: "Apology to target", status: "ok" }
        deescalation_step { action: "Apology to CC contacts", status: "ok" }
        deescalation_step { action: "Apology to the apology", status: "ok" }
        commentary "De-escalation complete. All channels addressed..."
        complete { karen_closing: "All resolved. Relationships restored..." }
```

---

## Appendix B: File Tree (Frontend Only)

```
frontend/
├── package.json               (Next.js 16, React 19, Framer Motion 12, Tailwind 4)
├── tsconfig.json              (strict mode, @/* path alias)
├── next.config.ts             (minimal config)
├── postcss.config.mjs         (Tailwind CSS 4)
├── public/                    (placeholder assets only)
├── src/
│   ├── app/
│   │   ├── globals.css        (theme colors, fonts, animations, glow effects)
│   │   ├── layout.tsx         (root layout, font loading, footer)
│   │   ├── page.tsx           (/ — Circle dashboard)
│   │   ├── trigger/
│   │   │   └── page.tsx       (/trigger — new escalation form)
│   │   ├── escalation/
│   │   │   └── [id]/
│   │   │       └── page.tsx   (/escalation/[id] — live view)
│   │   ├── open-matters/
│   │   │   └── page.tsx       (/open-matters — public registry)
│   │   ├── join/
│   │   │   └── page.tsx       (/join — onboarding)
│   │   └── karen/
│   │       └── page.tsx       (/karen — lore page)
│   ├── components/
│   │   ├── MemberCard.tsx
│   │   ├── EscalationTimeline.tsx
│   │   ├── LevelCard.tsx      (most complex — text measurement, expand/collapse)
│   │   ├── KarenSidebar.tsx   (typewriter effect, chat bubbles)
│   │   ├── DeescalationSequence.tsx
│   │   ├── OpenMattersTable.tsx (virtual scrolling)
│   │   └── OnboardingFlow.tsx (3-step wizard)
│   ├── hooks/
│   │   ├── useCircle.ts       (members + escalations, 3s polling)
│   │   ├── useEscalation.ts   (SSE stream, reconnection, dedup)
│   │   ├── useKarenAudio.ts   (voice playback queue)
│   │   └── useBackgroundMusic.ts (Web Audio effects chain)
│   └── lib/
│       ├── types.ts           (all TypeScript interfaces)
│       └── constants.ts       (colors, labels, icons, helper functions)
```

---

## Appendix C: Karen's Character Sheet

Because you'll need this for design decisions.

**Name:** Karen
**Title:** Professional Follow-Up Agent
**Company:** Karen Automated Correspondence Systems LLC
**Emoji:** 🦞 (the lobster — persistent, armored, slightly ridiculous)
**Tagline:** "Karen gets results."

**Voice:** ElevenLabs "Rachel" — professional female voice, varied by personality
**Email:** karen.follows.up.nyc@gmail.com
**Color:** Amber (#f59e0b)

**Core traits:**
- Deeply committed to follow-through
- Never considers that the other person might just be busy
- Technically always polite
- Professional to a fault
- Means well. Always has.

**What Karen is NOT:**
- Malicious
- Insecure
- Uncertain
- Apologetic (until de-escalation)
- Lazy (ever)

**Karen's internal monologue is the soul of the product.** The gap between what she sends (professional, measured) and what she thinks (obsessive, detailed, slightly unhinged) is where the comedy lives. The sidebar commentary IS the character.

---

*This document covers everything in the Karen codebase as of 2026-04-04. Every backend endpoint, every SSE event, every audio layer, every quirk. Use it to brainstorm freely — you know what the system can do, what it will do, and where the design opportunities are.*

*Questions? Ping Rahil or read the code — it's all in `/Users/rahilsinghi/Desktop/Karen/`.*

*Karen is always watching. Karen means well.*
