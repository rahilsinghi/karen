# KAREN — Frontend Changes for Sariya

Last updated: 2026-04-04

These are frontend-only changes. The backend is complete — all 10 channels
work, SSE events stream correctly, and the API is stable. These tasks are
about polishing the UI to match the spec and improve the demo experience.

**Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion
**Fonts:** Silkscreen (display), VT323 (mono)
**Theme:** Minecraft-inspired pixel art — dark backgrounds, pixel borders, redstone glow

**Important:** Read `frontend/AGENTS.md` before writing code — this Next.js version
has breaking changes from what you might expect. Check `node_modules/next/dist/docs/`
for the actual API.

---

## Change 1: Global Navigation Bar

**Priority:** High — audiences can't navigate between pages without this

**What:** Add a persistent nav bar to the root layout.

**File to modify:** `frontend/src/app/layout.tsx`

**New component:** `frontend/src/components/NavBar.tsx`

**Spec:**
- Fixed at top of every page
- Links: The Circle (/) | Trigger (/trigger) | Open Matters (/open-matters) | Karen (/karen)
- Karen skull logo (💀) + "KAREN" on the left
- Current page highlighted (use `usePathname()` from `next/navigation`)
- Dark theme: `bg-stone-900/95 border-b-4 border-stone-800`
- Font: `font-display` (Silkscreen), all uppercase
- Active link: `text-red-500 text-shadow-pixel`
- Inactive link: `text-stone-500 hover:text-stone-300`
- Height: `h-14` — compact, doesn't steal space from content
- Should NOT appear on `/escalation/[id]` page (that's full-screen immersive)
- Should NOT appear on `/join` page (that's a standalone flow)

**Implementation notes:**
- The escalation page is `fixed inset-0` so it fills the viewport — the nav should be hidden there
- Check `pathname` and conditionally render: hide on paths starting with `/escalation` or `/join`
- The nav bar needs `"use client"` for `usePathname()`
- Add the NavBar to `layout.tsx` above `{children}`

---

## Change 2: Update Karen Lore Page — Escalation Arsenal (v2)

**Priority:** High — currently shows v1 levels which are wrong

**File to modify:** `frontend/src/app/karen/page.tsx`

**What:** The "Escalation Arsenal" section lists v1 levels. Update to v2.

**Current (wrong):**
```
L1: EMAIL (WARMUP)
L2: EMAIL BUMP + SMS PROBE
L3: TONE SHIFT + WHATSAPP BREACH
L4: CC DOMINANCE + SURROGATE SMS
L5: LINKEDIN INMAIL INTRUSION
L6: CALENDAR HIJACK (THE GHOST MEETING)
L7: DISCORD @EVERYONE COLLATERAL
L8: PUBLIC WAR ROOM (OPEN MATTERS)
L9: X/TWITTER BROADCAST (SOCIAL DEATH)
L10: FEDEX FORMAL STRIKE (PHYSICAL REALITY)
```

**Correct (v2):**
```
L1:  EMAIL WARMUP — "Just checking in 🙂" (📧, green)
L2:  SMS PROBE — "Karen has your number now" (📱, green)
L3:  WHATSAPP + VOICE CALL — "Karen calls. Karen always calls." (📞, yellow)
L4:  OSINT RESEARCH — "Karen knows where you work" (🔍, yellow)
L5:  EMAIL CC — "Looping in your coworker for visibility" (👁️, orange)
L6:  SLACK ESCALATION — "Posted to #karen-escalations" (💼, orange)
L7:  DISCORD @EVERYONE — "The server has been notified" (🚨, red)
L8:  GOOGLE CALENDAR — "The meeting has been scheduled. Attendance is mandatory." (📅, red)
L9:  GITHUB OPEN MATTERS — "Your debt is now public record" (📖, purple)
L10: FEDEX FORMAL LETTER — "A physical letter is en route. Karen means business." (☢️, nuclear pink)
```

**Level colors (from constants.ts):**
- L1-2: `text-green-500` / `text-green-400`
- L3-4: `text-yellow-500` / `text-yellow-400`
- L5-6: `text-orange-500` / `text-orange-400`
- L7-8: `text-red-500` / `text-red-400`
- L9: `text-purple-500`
- L10: `text-pink-500` with `animate-pulse` and glow

---

## Change 3: Open Matters Table — Add Missing Columns

**Priority:** Medium — the spec calls for 8 columns, we have 6

**File to modify:** `frontend/src/components/OpenMattersTable.tsx`

**Current columns (6):**
ID | TARGET | BOUNTY | GRIEVANCE | PHASE | STATUS

**Spec columns (8):**
ID | TARGET | BOUNTY | GRIEVANCE | DAYS | ATTEMPTS | PHASE | STATUS

**What to add:**

1. **DAYS column** — Days since escalation started
   - Calculate: `Math.floor((Date.now() - new Date(escalation.started_at).getTime()) / 86400000)`
   - Display: `${days}d` (e.g. "14d")
   - If resolved: show total days from start to resolution
   - Color: `text-stone-400` for < 7d, `text-yellow-500` for 7-14d, `text-red-500` for 14d+

2. **ATTEMPTS column** — Number of messages sent
   - Source: `escalation.messages_sent` (this field exists on the Escalation model)
   - Display: just the number
   - Color: `text-stone-400`

**Grid update:**
Current: `grid-cols-[8%_18%_10%_34%_10%_20%]`
New: `grid-cols-[6%_14%_8%_26%_8%_8%_10%_20%]`

**Backend note:** The `/api/escalation` list endpoint already returns `messages_sent`
and `started_at` on each escalation. No backend changes needed.

---

## Change 4: Karen's Commentary — Typewriter Effect

**Priority:** Low — nice-to-have for demo wow factor

**File to modify:** `frontend/src/components/KarenBossCard.tsx`

**What:** Karen's commentary text currently appears instantly. Add a typewriter
effect so each character appears one at a time, like Karen is typing.

**Spec from CLAUDE.md:**
> Karen's commentary: typewriter effect on each bubble

**Implementation:**
- When `commentary` prop changes, animate the new text character by character
- Speed: ~30ms per character (fast enough to not feel slow, slow enough to notice)
- Use a `useEffect` + `setInterval` pattern or a CSS animation
- Show a blinking cursor (`▌`) at the end while typing
- Once complete, cursor disappears

---

## Change 5: Escalation Timeline Cards (Left Sidebar)

**Priority:** Low — the current mission log is minimal

**File:** `frontend/src/app/escalation/[id]/page.tsx` (left sidebar section)

**What:** The left sidebar shows a minimal "MISSION_LOG" with the last 5 events
as text lines. The CLAUDE.md spec calls for richer level cards.

**Spec level card anatomy:**
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

**Color of card border = escalation level color:**
- Green (1-2) → Yellow (3-4) → Orange (5-6) → Red (7-8) → Purple (9) → Nuclear (10)

**Data available from SSE events:**
- `level_start` event has: `level`, `channel`, `message_preview`
- `level_complete` event has: `level`, `channel`, `karen_note`
- `commentary` event has: `text`

**Implementation:**
- Create a `LevelCard` component
- Accumulate level data from events (start → complete)
- Show progress bar between levels (fills over the interval duration)
- Stack cards vertically, newest at top
- Use `LEVEL_LABELS` and `CHANNEL_ICONS` from `constants.ts`
- Border color: use `getLevelColorClass(level)` from `constants.ts`

---

## Change 6: Footer on All Pages

**Priority:** Low

**What:** CLAUDE.md spec says every page should have:

> "Karen is always watching. Karen means well."
> "© Karen Automated Correspondence Systems LLC — All rights reserved.
>  All matters documented. All debts remembered."

**File:** `frontend/src/app/layout.tsx`

**Current:** There may be a footer already — check the layout. If not, add one.

**Style:**
- `font-mono text-[10px] text-stone-600 text-center py-4 border-t border-stone-900`
- Two lines, centered
- Should NOT appear on `/escalation/[id]` (same hide logic as nav)

---

## Reference: Design System

### Colors
```
Background:    #0d0d0d (--color-bg)
Surface:       #1a1a1a (--color-surface / obsidian)
Border:        #000000 (pixel border)
Text:          #e0e0e0
Muted:         #5a5a5a
Karen accent:  #ff0000 (redstone red)

Level 1-2:     green-500 / green-400
Level 3-4:     yellow-500 / yellow-400
Level 5-6:     orange-500 / orange-400
Level 7-8:     red-500 / red-400
Level 9:       purple-500
Level 10:      pink-500 + glow + pulse
```

### Fonts
- Display: `font-display` → Silkscreen (headings, labels)
- Mono: `font-mono` → VT323 (data, Karen's text, timestamps)

### CSS Classes (defined in globals.css / pixel-theme.css)
- `pixel-border-stone` — stone-colored pixel border
- `pixel-border-obsidian` — dark pixel border
- `pixel-border-red` — red pixel border
- `text-shadow-pixel` — retro text shadow
- `boss-frame-obsidian` — boss card frame style
- `redstone-circuit` — subtle background pattern
- `redstone-glow` — red glow effect
- `nuclear-glow-pink` — Level 10 glow

### Animation patterns (use Framer Motion)
- Cards: `initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}`
- Badges: pulse animation for active states
- Numbers: count-up animation with `useEffect` + `setInterval`
- Page transitions: fade only, 150ms

---

## Reference: v2 Escalation Levels

| Level | Channel | Emoji | Label |
|-------|---------|-------|-------|
| 1 | Email | 📧 | FIRST CONTACT |
| 2 | SMS | 📱 | TEXT ASSAULT |
| 3 | WhatsApp + Voice | 📞 | VOICE BREACH |
| 4 | OSINT Research | 🔍 | INTEL GATHERING |
| 5 | Email CC | 👁️ | CC DOMINANCE |
| 6 | Slack | 💼 | CORPORATE ESCALATION |
| 7 | Discord @everyone | 🚨 | SOCIAL BLAST |
| 8 | Google Calendar | 📅 | THE MEETING |
| 9 | GitHub Open Matters | 📖 | PUBLIC RECORD |
| 10 | FedEx Letter | ☢️ | NUCLEAR OPTION |

These are defined in `frontend/src/lib/constants.ts` as `LEVEL_LABELS` and
`CHANNEL_ICONS` — use those instead of hardcoding.

---

## How to Test

```bash
# Start frontend
cd ~/Desktop/Karen/frontend && pnpm dev

# Backend should be running via docker compose
# Check: curl http://localhost:8000/api/members

# Trigger a test escalation
curl -s -X POST http://localhost:8000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"initiator_id":"rahil","target_id":"bharath","grievance_type":"financial","grievance_detail":"$23 dinner","personality":"passive_aggressive","speed":"demo","max_level":3}'

# Use max_level:3 for quick tests (only fires 3 levels)
# Use max_level:10 for full run
```

---

## File Map

| File | What it does |
|------|-------------|
| `src/app/layout.tsx` | Root layout — add NavBar + Footer here |
| `src/app/page.tsx` | Dashboard (The Circle) |
| `src/app/trigger/page.tsx` | Trigger form |
| `src/app/open-matters/page.tsx` | Open Matters page |
| `src/app/karen/page.tsx` | Karen lore page (needs v2 update) |
| `src/app/join/page.tsx` | Onboarding flow |
| `src/app/escalation/[id]/page.tsx` | Live escalation view |
| `src/components/EscalationTower.tsx` | Central tower visualization |
| `src/components/KarenBossCard.tsx` | Karen's boss presence card |
| `src/components/OpenMattersTable.tsx` | Open Matters table |
| `src/components/ResearchAnimation.tsx` | OSINT research animation |
| `src/components/KarenSidebar.tsx` | Sidebar component |
| `src/components/OnboardingFlow.tsx` | Join flow steps |
| `src/lib/types.ts` | All TypeScript types |
| `src/lib/constants.ts` | Level labels, icons, colors |
| `src/hooks/useEscalation.ts` | SSE connection hook |
| `src/hooks/useCircle.ts` | Member data hook |
| `src/hooks/useKarenAudio.ts` | Voice playback queue |
| `src/hooks/useBackgroundMusic.ts` | Music + distortion |
