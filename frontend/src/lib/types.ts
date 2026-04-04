export interface Contacts {
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  twitter: string;
  venmo: string;
  calendar: string;
  address: string;
}

export interface Member {
  id: string;
  name: string;
  role: "admin" | "member";
  avatar_emoji: string;
  contacts: Contacts;
}

export interface ChannelStatus {
  channel: string;
  available: boolean;
}

export type Personality =
  | "passive_aggressive"
  | "corporate"
  | "genuinely_concerned"
  | "life_coach";

export type GrievanceType = "financial" | "object" | "communication";

export type EscalationSpeed = "demo" | "demo_10s" | "quick" | "standard" | "patient";

export type EscalationStatusType =
  | "active"
  | "paused"
  | "response_detected"
  | "payment_detected"
  | "deescalating"
  | "resolved";

export interface Escalation {
  id: string;
  initiator: Member;
  target: Member;
  grievance_type: GrievanceType;
  grievance_detail: string;
  amount: number | null;
  personality: Personality;
  speed: EscalationSpeed;
  max_level: number;
  current_level: number;
  status: EscalationStatusType;
  messages_sent: number;
  channels_used: string[];
  started_at: string;
  resolved_at: string | null;
}

export interface TriggerRequest {
  initiator_id: string;
  target_id: string;
  grievance_type: GrievanceType;
  grievance_detail: string;
  amount?: number;
  venmo_handle?: string;
  date_of_incident?: string;
  personality: Personality;
  speed: EscalationSpeed;
  max_level: number;
}

// SSE Events
export type KarenEvent =
  | { type: "escalation_started"; escalation_id: string; initiator: string; target: string; [key: string]: unknown }
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
  | { type: "research_step"; step: number; detail: string; pause_ms?: number }
  | { type: "research_discovery"; target: string; employer: string; work_email: string; coworker_name: string; coworker_email: string }
  | { type: "fedex_rate"; rate: string; service: string; destination: string };
