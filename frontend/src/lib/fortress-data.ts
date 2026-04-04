import type { Escalation, KarenEvent, Personality } from "@/lib/types";
import { KAREN_QUOTES, LEVEL_COLORS } from "@/lib/constants";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type DossierRow = {
  id: string;
  icon: string;
  name: string;
  entity: string;
  phase: string;
  malice: string;
  ritual: string;
};

export type ArsenalArtifact = {
  id: string;
  name: string;
  icon: string;
  category: string;
  tier: string;
  unlock: string;
  availability: string;
  description: string;
  status: "READY" | "LOCKED" | "CHARGING" | "NUCLEAR";
  level: number;
  mechanics: string;
};

export const fortressNav: NavItem[] = [
  { href: "/", label: "Target Logs", icon: "▣" },
  { href: "/arsenal", label: "Arsenal", icon: "⚒" },
  { href: "/trigger", label: "Settings", icon: "✦" },
  { href: "/open-matters", label: "Open Matters", icon: "☍" },
  { href: "/karen", label: "Karen Lore", icon: "☠" },
];

export const sampleDossiers: DossierRow[] = [
  { id: "mgr-bob", icon: "◉", name: "Mgr. Bob (McDonald's)", entity: "Cold Fries // Dip Denial", phase: "TARGETED", malice: "42/100", ritual: "SCROLL PRIMED" },
  { id: "cust-serv-42", icon: "◈", name: "Customer Service #42", entity: "Infinite Loop // Hold Music", phase: "IGNORING", malice: "58/100", ritual: "SIGIL DRAWN" },
  { id: "cashier-sally", icon: "◆", name: "Cashier Sally (Target)", entity: "Coupon Rejection // Attitude", phase: "ESCALATING", malice: "73/100", ritual: "RUNE LOOP" },
  { id: "the-neighbor", icon: "⬢", name: "The Neighbor (Noise)", entity: "Lawn Mower // 7AM Sunday", phase: "WITNESS SUMMONED", malice: "86/100", ritual: "CLAN ALERT" },
  { id: "manager-chad", icon: "⬣", name: "Manager Chad (Costco)", entity: "Membership Revoked // Logic", phase: "CONSEQUENCES ACTIVE", malice: "97/100", ritual: "NUCLEAR PREP" },
];

export const ritualButtons = {
  primary: { label: "RELEASE KAREN", subtitle: "INITIATE ESCALATION" },
  majors: [
    { label: "EXECUTE ESCALATION", subtitle: "CHAIN THE CHANNELS" },
    { label: "NUCLEAR FEDEX", subtitle: "DELIVER THE DOOM" },
    { label: "MANAGER SUMMON", subtitle: "CALL THE WITNESS" },
  ],
  minors: ["YELP_BOMB", "BBB_FILE", "WITNESS_CLAN", "ETERNAL_HOLD", "CC_DOMINANCE", "SMS_HARASS"],
};

export const artifactCategories = [
  "ALL",
  "Contact Weapons",
  "Social Pressure Relics",
  "Public Shame Tools",
  "Nuclear Tier",
  "Ritual Utilities",
];

export const arsenalArtifacts: ArsenalArtifact[] = [
  { id: "email-warmup", name: "Email Warmup", icon: "📧", category: "Contact Weapons", tier: "Tier I", unlock: "Base ritual", availability: "Ready", description: "\"Just checking in 🙂\"", status: "READY", level: 1, mechanics: "Polite opener with escalating subtext and suspiciously good formatting." },
  { id: "sms-probe", name: "SMS Probe", icon: "📱", category: "Contact Weapons", tier: "Tier I", unlock: "Phone known", availability: "Ready", description: "\"Karen has your number now\"", status: "READY", level: 2, mechanics: "Direct-message pressure when email goes ignored." },
  { id: "voice-call", name: "WhatsApp + Voice", icon: "📞", category: "Contact Weapons", tier: "Tier II", unlock: "Target exposed", availability: "Ready", description: "\"Karen calls. Karen always calls.\"", status: "READY", level: 3, mechanics: "Double-channel intrusion with read-receipt dread." },
  { id: "osint-research", name: "OSINT Research", icon: "🔍", category: "Intel Gathering", tier: "Tier II", unlock: "Deeper scan", availability: "Ready", description: "\"Karen knows where you work\"", status: "READY", level: 4, mechanics: "Deep intelligence gathering on professional and social circles." },
  { id: "email-cc", name: "Email CC", icon: "👁️", category: "Social Pressure", tier: "Tier III", unlock: "Contacts mapped", availability: "Ready", description: "\"Looping in your coworker for visibility\"", status: "READY", level: 5, mechanics: "Expands the thread to include supervisors or peers." },
  { id: "slack-escalation", name: "Slack Escalation", icon: "💼", category: "Social Pressure", tier: "Tier III", unlock: "Workspace found", availability: "Ready", description: "\"Posted to #karen-escalations\"", status: "READY", level: 6, mechanics: "Pushes the grievance into professional internal channels." },
  { id: "discord-everyone", name: "Discord @everyone", icon: "🚨", category: "Public Shame", tier: "Tier IV", unlock: "Community path", availability: "Ready", description: "\"The server has been notified\"", status: "READY", level: 7, mechanics: "Broadcasts urgency to the target's primary social groups." },
  { id: "google-calendar", name: "Google Calendar", icon: "📅", category: "Public Shame", tier: "Tier IV", unlock: "Meeting slot found", availability: "Ready", description: "\"The meeting has been scheduled.\"", status: "READY", level: 8, mechanics: "Mandatory accountability session placed on the target's schedule." },
  { id: "github-open-matters", name: "GitHub Open Matters", icon: "📖", category: "Public Record", tier: "Tier V", unlock: "Public record", availability: "Ready", description: "\"Your debt is now public record\"", status: "READY", level: 9, mechanics: "Publishes the grievance to the immutable Open Matters ledger." },
  { id: "fedex-formal", name: "FedEx Formal Letter", icon: "☢️", category: "Nuclear Tier", tier: "Tier X", unlock: "Level 10 reached", availability: "1 sealed packet", description: "\"Karen means business.\"", status: "NUCLEAR", level: 10, mechanics: "Dispatches a certified physical letter via courier." },
];

export const personalityScripts: Record<Personality, string> = {
  passive_aggressive:
    "Hello again. Since silence appears to be your chosen workflow, I thought I would kindly occupy another inch of your attention.",
  corporate:
    "Following up to realign on the unresolved matter below and close the accountability gap before this becomes structurally embarrassing.",
  genuinely_concerned:
    "Just checking in with care and mounting dread. I would love to resolve this before everyone involved begins to look cursed.",
  life_coach:
    "I believe this grievance is an opportunity for growth, closure, and immediate corrective action before the universe assigns homework.",
};

export const channelUnlocks = [
  "Scroll of Reminder",
  "Signal Rune",
  "Whisper Orb",
  "Skull Phone",
  "Corporate Sigil",
  "Summoning Circle",
  "Siren Beacon",
  "Public Ledger",
  "Chaos Bird",
  "Doom Envelope",
];

export const loreSections = [
  {
    title: "Origin of the Claw",
    body:
      "Karen began as a joke about follow-up culture and evolved into a fortress doctrine: every ignored message becomes architecture, every delay becomes a corridor, and every corridor eventually leads to the crab-core.",
  },
  {
    title: "Protocol: Grip",
    body:
      "Grip is the opening contact cycle. It is courteous, documented, and already mildly haunting. The system establishes facts, timestamps, and the first small feeling of doom.",
  },
  {
    title: "Protocol: Squeeze",
    body:
      "Squeeze activates once politeness has been mistaken for weakness. Channels multiply, witnesses arrive, and the grievance grows ceremonial teeth.",
  },
  {
    title: "Escalation Arsenal v2",
    body:
      "L1: EMAIL WARMUP — \"Just checking in 🙂\" (📧, green)\nL2: SMS PROBE — \"Karen has your number now\" (📱, green)\nL3: WHATSAPP + VOICE CALL — \"Karen calls. Karen always calls.\" (📞, yellow)\nL4: OSINT RESEARCH — \"Karen knows where you work\" (🔍, yellow)\nL5: EMAIL CC — \"Looping in your coworker for visibility\" (👁️, orange)\nL6: SLACK ESCALATION — \"Posted to #karen-escalations\" (💼, orange)\nL7: DISCORD @EVERYONE — \"The server has been notified\" (🚨, red)\nL8: GOOGLE CALENDAR — \"The meeting has been scheduled. Attendance is mandatory.\" (📅, red)\nL9: GITHUB OPEN MATTERS — \"Your debt is now public record\" (📖, purple)\nL10: FEDEX FORMAL LETTER — \"A physical letter is en route. Karen means business.\" (☢️, nuclear pink)",
  },
  {
    title: "Karen Personalities",
    body:
      "The fortress speaks in four sanctioned styles: Passive Aggressive, Corporate, Genuinely Concerned, and Life Coach. Each produces distinct emotional damage with the same operational intent.",
  },
  {
    title: "The OpenClaw God",
    body:
      "The crab-core is the power source, archivist, and moral disaster at the center of the wall. It does not hate. It simply remembers every ignored thread forever.",
  },
];

export function buildCommentaryFeed(events: KarenEvent[], escalation?: Escalation | null) {
  const feed = events
    .map((event) => {
      switch (event.type) {
        case "commentary":
          return event.text;
        case "level_start":
          return `LEVEL ${event.level} OPENED // ${event.channel.toUpperCase()} artifact deployed.`;
        case "level_complete":
          return `LEVEL ${event.level} COMPLETE // ${event.karen_note}`;
        case "response_detected":
          return `COUNTERSIGNAL DETECTED FROM ${event.from.toUpperCase()}.`;
        case "payment_detected":
          return `PAYMENT DETECTED // ${event.from.toUpperCase()} yielded ${event.amount}.`;
        case "deescalation_step":
          return `DE-ESCALATION RITE // ${event.action.toUpperCase()} ${event.status.toUpperCase()}.`;
        case "complete":
          return event.karen_closing;
        case "error":
          return `ERROR SIGIL // ${event.message}`;
        default:
          return null;
      }
    })
    .filter(Boolean) as string[];

  if (feed.length > 0) return feed;
  if (escalation) {
    return [
      `Target ${escalation.target.name.toUpperCase()} placed inside chamber lattice.`,
      `Personality vector ${escalation.personality.replaceAll("_", " ").toUpperCase()} engaged.`,
      "OpenClaw core is waiting for the next silence event.",
    ];
  }
  return KAREN_QUOTES;
}

export function levelTone(level: number) {
  if (level <= 2) return "VERDANT WARNING";
  if (level <= 4) return "GOLDEN PRESSURE";
  if (level <= 6) return "AMBER HOSTILITY";
  if (level <= 8) return "RED ALERT";
  if (level === 9) return "PURPLE CORRUPTION";
  return "PINK CATACLYSM";
}

export function levelColor(level: number) {
  return LEVEL_COLORS[level] ?? "#c084fc";
}
