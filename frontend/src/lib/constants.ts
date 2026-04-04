export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const LEVEL_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#22c55e",
  3: "#eab308",
  4: "#eab308",
  5: "#f97316",
  6: "#f97316",
  7: "#ef4444",
  8: "#ef4444",
  9: "#a855f7",
  10: "#ec4899",
};

export const LEVEL_LABELS: Record<number, string> = {
  1: "Email",
  2: "SMS",
  3: "WhatsApp + Voice",
  4: "OSINT Research",
  5: "Email CC",
  6: "Slack",
  7: "Discord @everyone",
  8: "Google Calendar",
  9: "Open Matters",
  10: "FedEx Letter",
};

export const CHANNEL_ICONS: Record<string, string> = {
  email: "📧",
  email_cc: "📧",
  sms: "📱",
  whatsapp: "💬",
  voice_call: "📞",
  research: "🔍",
  slack: "💼",
  calendar: "📅",
  discord: "🎮",
  github: "📋",
  fedex: "📦",
};

export const PERSONALITY_LABELS: Record<string, string> = {
  passive_aggressive: "Passive Aggressive",
  corporate: "Corporate",
  genuinely_concerned: "Genuinely Concerned",
  life_coach: "Life Coach",
};

export const SPEED_LABELS: Record<string, string> = {
  demo: "5s (Demo)",
  demo_10s: "10s (Demo + Audio)",
  quick: "10m (Quick)",
  standard: "1h (Standard)",
  patient: "1d (Patient)",
};

export const KAREN_QUOTES = [
  "Karen has sent 847 follow-ups. Karen has never been ignored twice.",
  "Karen believes in you. Karen also believes in FedEx.",
  "Response rate since Karen: 100%. Eventually.",
  "Karen has never lost a case. Karen has sent some regrettable FedEx letters.",
  "[Name] was last seen online 3 minutes ago. Karen noticed.",
  "Your silence has been noted. Your silence has been documented.",
];

export const SATISFACTION_LABELS: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "😴", label: "Awaiting Instructions" },
  1: { emoji: "😐", label: "Mildly Concerned" },
  2: { emoji: "🙂", label: "Politely Persistent" },
  3: { emoji: "🤨", label: "Increasingly Motivated" },
  4: { emoji: "🧐", label: "Conducting Research" },
  5: { emoji: "😤", label: "Professionally Invested" },
  6: { emoji: "😠", label: "Channeling Energy" },
  7: { emoji: "🔥", label: "Community Engaged" },
  8: { emoji: "📅", label: "Scheduling Accountability" },
  9: { emoji: "🦞", label: "Fully Committed" },
  10: { emoji: "☢️", label: "At Peace" },
};

export function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "#6b6b8a";
}

export function getLevelColorClass(level: number): string {
  if (level <= 2) return "text-level-green border-level-green";
  if (level <= 4) return "text-level-yellow border-level-yellow";
  if (level <= 6) return "text-level-orange border-level-orange";
  if (level <= 8) return "text-level-red border-level-red";
  if (level === 9) return "text-level-purple border-level-purple";
  return "text-level-nuclear border-level-nuclear glow-nuclear";
}

export function getLevelBgClass(level: number): string {
  if (level <= 2) return "bg-level-green/10 border-level-green/30";
  if (level <= 4) return "bg-level-yellow/10 border-level-yellow/30";
  if (level <= 6) return "bg-level-orange/10 border-level-orange/30";
  if (level <= 8) return "bg-level-red/10 border-level-red/30";
  if (level === 9) return "bg-level-purple/10 border-level-purple/30";
  return "bg-level-nuclear/10 border-level-nuclear/30";
}
