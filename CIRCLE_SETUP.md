# KAREN — Circle Member Setup Guide

How to add each person to Karen's reach across all channels.
Run through this for: **Bharath, Chinmay, Sariya, Aishwarya**.

---

## What You Need From Each Person

Send them this message:

> Hey! I'm demoing Karen (my hackathon project) — she's a follow-up bot that escalates across channels. You're in "The Circle." I need a few things from you:
>
> 1. Your phone number (for SMS + WhatsApp)
> 2. Your LinkedIn profile URL
> 3. Your Venmo handle
> 4. Your mailing address (Karen may send a letter... it's part of the bit)
> 5. Join this WhatsApp sandbox: send "join [code]" to [sandbox number] ← I'll send you this
> 6. Join this Discord server: [invite link]
>
> Your accounts are never accessed. Karen sends from HER accounts on your behalf.

---

## Per-Person Checklist

### Step 1: Update circle.json

Edit `backend/data/circle.json` with their real info:

```json
{
  "id": "bharath",
  "name": "Bharath Mahesh Gera",
  "contacts": {
    "email": "bharathmaheshgera@stern.nyu.edu",
    "phone": "+1XXXXXXXXXX",
    "whatsapp": "+1XXXXXXXXXX",
    "linkedin": "linkedin.com/in/bharath-mahesh-gera",
    "twitter": "@their_handle",
    "venmo": "@TheirVenmo",
    "calendar": "their@email.com",
    "address": "123 Street, City, State ZIP"
  }
}
```

Any field left as `FILL_BEFORE_DEMO` = Karen skips that channel for them.

After editing, recreate the backend: `docker compose down backend && docker compose up -d backend`

---

### Step 2: Verify their phone on Twilio (required for SMS)

Twilio trial accounts can only send to **verified numbers**.

1. Go to twilio.com/console → Phone Numbers → Verified Caller IDs
2. Click **Add a new Caller ID**
3. Enter their phone number with country code (e.g. +16461234567)
4. Twilio sends them a verification code via call or SMS
5. They give you the code → enter it → verified

**Do this for each person who should receive SMS.**

| Person | Phone | Verified? |
|--------|-------|-----------|
| Rahil | +16467296148 | YES |
| Bharath | | |
| Chinmay | | |
| Sariya | | |
| Aishwarya | | |

---

### Step 3: WhatsApp sandbox join (required for WhatsApp)

Twilio WhatsApp sandbox requires each recipient to opt in.

1. You (Rahil) set up the sandbox first: Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Note the sandbox join code (e.g. `join pretty-fox`)
3. Send each person: "Send `join pretty-fox` to +1 415 523 8886 on WhatsApp"
4. They send it → they're in the sandbox → Karen can WhatsApp them

| Person | Joined sandbox? |
|--------|----------------|
| Rahil | |
| Bharath | |
| Chinmay | |
| Sariya | |
| Aishwarya | |

---

### Step 4: Discord server join (required for Level 7)

The audience AND circle members should be in the Discord server.

1. Go to Discord → Karen EvilClaw server → Invite People
2. Create invite link (set to never expire)
3. Send link to all circle members
4. For the demo audience: generate a QR code from the invite link (use any QR generator)

| Person | In server? |
|--------|-----------|
| Rahil | YES |
| Bharath | |
| Chinmay | |
| Sariya | |
| Aishwarya | |

---

### Step 5: Google Calendar sharing (required for Level 6)

The GCP service account needs permission to create events on the target's calendar.

1. Get the service account email from GCP (e.g. `karen-calendar@asknyc-xxxx.iam.gserviceaccount.com`)
2. Ask each person to: Go to Google Calendar → Settings → their calendar → Share with specific people → Add the service account email → Set permission to "Make changes to events"

Alternatively, if they use the same Google Workspace / personal Gmail:
- They can share their calendar with `karen-calendar@...` directly

| Person | Calendar email | Shared? |
|--------|---------------|---------|
| Bharath | bharathmaheshgera@stern.nyu.edu | |
| Chinmay | cs7810@nyu.edu | |
| Sariya | sariyakh25@gmail.com | |
| Aishwarya | | |

---

### Step 6: No action needed for these channels

These channels don't require anything from the circle member:

- **Email** — Karen sends from her own Gmail. No setup needed from target.
- **LinkedIn** — Karen sends from her own account. Just need their profile URL in circle.json.
- **Twitter** — Karen tweets from @KarenFollowsUp. Just need their handle in circle.json (for @mentions).
- **GitHub / Open Matters** — No target action needed. Karen commits to her own repo.
- **FedEx** — Just need their mailing address in circle.json.

---

## Quick Reference: What Unlocks What

| Channel | What Karen needs | What the person needs to do |
|---------|-----------------|---------------------------|
| Email | Their email in circle.json | Nothing |
| SMS | Their phone in circle.json | Be verified on Twilio |
| WhatsApp | Their phone in circle.json | Join Twilio sandbox |
| LinkedIn | Their LinkedIn URL in circle.json | Nothing |
| Calendar | Their calendar email in circle.json | Share calendar with service account |
| Discord | Server exists | Join the Discord server |
| GitHub | N/A | Nothing |
| Twitter | Their handle in circle.json (optional) | Nothing |
| FedEx | Their address in circle.json | Nothing |

---

## Demo Day Final Check

Before the demo, verify each target has maximum channel coverage:

```
curl -s http://localhost:8000/api/members/bharath/channels | python3 -m json.tool
```

This returns the list of available channels for that person. The more channels, the more Karen can do.

**Goal: 6+ channels per person for the demo target (Bharath).**
