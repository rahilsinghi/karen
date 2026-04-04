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
  { id: "email-scroll", name: "Email Scroll", icon: "✉", category: "Contact Weapons", tier: "Tier I", unlock: "Base ritual", availability: "8/8 charges", description: "Polite opener with escalating subtext and suspiciously good formatting.", status: "READY", level: 1, mechanics: "Dispatches the opening grievance and establishes written evidence." },
  { id: "sms-rune", name: "SMS Rune", icon: "⌁", category: "Contact Weapons", tier: "Tier I", unlock: "Phone contact known", availability: "5/5 charges", description: "Tiny rune. Huge pressure. Excellent for ruining lunch.", status: "READY", level: 2, mechanics: "Adds direct-message pressure when email goes ignored." },
  { id: "whatsapp-orb", name: "WhatsApp Orb", icon: "◌", category: "Contact Weapons", tier: "Tier II", unlock: "Target exposed online", availability: "3/3 charges", description: "A glowing orb of 'just following up here too'.", status: "READY", level: 3, mechanics: "Escalates into chat with read-receipt dread." },
  { id: "voice-horn", name: "Voice Horn", icon: "⚑", category: "Contact Weapons", tier: "Tier II", unlock: "Voice profile ready", availability: "2/4 charges", description: "When the inbox fails, the horn reaches the soul.", status: "CHARGING", level: 4, mechanics: "Triggers voice-call escalation with scripted conviction." },
  { id: "linkedin-briefcase", name: "LinkedIn Briefcase of Alignment", icon: "▤", category: "Social Pressure Relics", tier: "Tier III", unlock: "Corporate target", availability: "Ready", description: "Corporate empathy with a sharpened memo edge.", status: "READY", level: 5, mechanics: "Pushes escalation into professional reputation channels." },
  { id: "calendar-sigil", name: "Calendar Sigil", icon: "☷", category: "Social Pressure Relics", tier: "Tier III", unlock: "Scheduling surface found", availability: "Ready", description: "A meeting invite that refuses to die quietly.", status: "READY", level: 6, mechanics: "Summons accountability into the target’s visible calendar." },
  { id: "discord-totem", name: "Discord Alarm Totem", icon: "☳", category: "Public Shame Tools", tier: "Tier IV", unlock: "Community path mapped", availability: "1/1 active", description: "For when private channels have proven spiritually insufficient.", status: "READY", level: 7, mechanics: "Broadcasts urgency to shared communities or groups." },
  { id: "open-matters-ledger", name: "Open Matters Ledger", icon: "☰", category: "Public Shame Tools", tier: "Tier IV", unlock: "Open board published", availability: "Scribing", description: "The public ledger where ignored threads go to become legend.", status: "CHARGING", level: 8, mechanics: "Publishes a visible accountability entry for ongoing cases." },
  { id: "twitter-bird", name: "Twitter Bird of Consequences", icon: "🜂", category: "Public Shame Tools", tier: "Tier V", unlock: "Social ignition", availability: "Armed", description: "A chaos bird that feeds on being left on read.", status: "NUCLEAR", level: 9, mechanics: "Escalates grievances into public attention loops." },
  { id: "fedex-doom", name: "FedEx Doom Envelope", icon: "⬛", category: "Nuclear Tier", tier: "Tier X", unlock: "Level 10 reached", availability: "1 sealed packet", description: "Certified physical menace, folded with ceremony.", status: "NUCLEAR", level: 10, mechanics: "Generates and dispatches a formal final-stage letter." },
  { id: "witness-seal", name: "Witness Summon Seal", icon: "✢", category: "Ritual Utilities", tier: "Tier III", unlock: "Contacts in circle", availability: "4 witnesses", description: "Calls additional humans to observe the nonsense.", status: "READY", level: 6, mechanics: "Adds CCs and public witnesses to increase pressure." },
  { id: "manager-stamp", name: "Manager Escalation Stamp", icon: "▦", category: "Ritual Utilities", tier: "Tier IV", unlock: "Hierarchy mapped", availability: "Ready", description: "A thick stamp that smells faintly of compliance.", status: "READY", level: 7, mechanics: "Targets supervisory contacts and escalates chain-of-command." },
  { id: "refund-bomb", name: "Refund Bomb", icon: "✸", category: "Nuclear Tier", tier: "Tier IX", unlock: "Financial grievance", availability: "Primed", description: "The financial grievance package. Precise. Loud. Reimbursable.", status: "NUCLEAR", level: 9, mechanics: "Optimizes payment demand language and refund proofing." },
  { id: "yelp-quill", name: "Yelp Rant Quill", icon: "✎", category: "Public Shame Tools", tier: "Tier VII", unlock: "Review surface detected", availability: "Ready", description: "A cursed quill that writes one-star poetry.", status: "READY", level: 8, mechanics: "Drafts public review copy for customer-facing entities." },
  { id: "eternal-hold", name: "Eternal Hold Curse", icon: "∞", category: "Ritual Utilities", tier: "Tier VIII", unlock: "Phone maze entered", availability: "2 curses", description: "Turns waiting into doctrine and doctrine into evidence.", status: "LOCKED", level: 8, mechanics: "Tracks call loops and builds procedural outrage." },
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
    title: "Escalation Ladder",
    body:
      "Ten levels. Ten chambers. Each chamber is louder, brighter, and less avoidable than the one below. The final chamber is not for everyone. That is why it works.",
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
