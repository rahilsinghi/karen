from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ── Members ──────────────────────────────────────────────────────────────────


class Contacts(BaseModel):
    email: str = "FILL_BEFORE_DEMO"
    phone: str = "FILL_BEFORE_DEMO"
    whatsapp: str = "FILL_BEFORE_DEMO"
    linkedin: str = "FILL_BEFORE_DEMO"
    twitter: str = "FILL_BEFORE_DEMO"
    venmo: str = "FILL_BEFORE_DEMO"
    calendar: str = "FILL_BEFORE_DEMO"
    address: str = "FILL_BEFORE_DEMO"


class Member(BaseModel):
    id: str
    name: str
    role: Literal["admin", "member"]
    avatar_emoji: str
    contacts: Contacts


class MemberCreate(BaseModel):
    name: str
    role: Literal["admin", "member"] = "member"
    avatar_emoji: str = "👤"
    contacts: Contacts = Field(default_factory=Contacts)


class MemberUpdate(BaseModel):
    name: str | None = None
    role: Literal["admin", "member"] | None = None
    avatar_emoji: str | None = None
    contacts: Contacts | None = None


class CircleResponse(BaseModel):
    members: list[Member]


# ── Channels ─────────────────────────────────────────────────────────────────


class Channel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE_CALL = "voice_call"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    CALENDAR = "calendar"
    DISCORD = "discord"
    GITHUB = "github"
    FEDEX = "fedex"


class ChannelStatus(BaseModel):
    channel: Channel
    available: bool


# ── Personalities ────────────────────────────────────────────────────────────


class Personality(str, Enum):
    PASSIVE_AGGRESSIVE = "passive_aggressive"
    CORPORATE = "corporate"
    GENUINELY_CONCERNED = "genuinely_concerned"
    LIFE_COACH = "life_coach"


# ── Grievances ───────────────────────────────────────────────────────────────


class GrievanceType(str, Enum):
    FINANCIAL = "financial"
    OBJECT = "object"
    COMMUNICATION = "communication"


class EscalationSpeed(str, Enum):
    DEMO = "demo"          # 5s
    DEMO_10S = "demo_10s"  # 10s (with audio)
    QUICK = "quick"        # 10m
    STANDARD = "standard"  # 1h
    PATIENT = "patient"    # 1d


class TriggerRequest(BaseModel):
    initiator_id: str
    target_id: str
    grievance_type: GrievanceType
    grievance_detail: str
    amount: float | None = None
    venmo_handle: str | None = None
    date_of_incident: str | None = None
    personality: Personality = Personality.PASSIVE_AGGRESSIVE
    speed: EscalationSpeed = EscalationSpeed.DEMO
    max_level: int = Field(default=10, ge=1, le=10)


# ── Escalation State ────────────────────────────────────────────────────────


class EscalationStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    RESPONSE_DETECTED = "response_detected"
    PAYMENT_DETECTED = "payment_detected"
    DEESCALATING = "deescalating"
    RESOLVED = "resolved"


class Escalation(BaseModel):
    id: str
    initiator: Member
    target: Member
    grievance_type: GrievanceType
    grievance_detail: str
    amount: float | None = None
    personality: Personality
    speed: EscalationSpeed
    max_level: int
    current_level: int = 0
    status: EscalationStatus = EscalationStatus.ACTIVE
    messages_sent: int = 0
    channels_used: list[str] = Field(default_factory=list)
    channel_metadata: dict[str, str] = Field(default_factory=dict)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None
    event_history: list[dict] = Field(default_factory=list, exclude=True)


# ── SSE Events ───────────────────────────────────────────────────────────────


class LevelStartEvent(BaseModel):
    type: Literal["level_start"] = "level_start"
    level: int
    channel: str
    message_preview: str


class LevelCompleteEvent(BaseModel):
    type: Literal["level_complete"] = "level_complete"
    level: int
    channel: str
    karen_note: str


class LevelSkippedEvent(BaseModel):
    type: Literal["level_skipped"] = "level_skipped"
    level: int
    reason: str


class CommentaryEvent(BaseModel):
    type: Literal["commentary"] = "commentary"
    text: str
    timestamp: str


class ResponseDetectedEvent(BaseModel):
    type: Literal["response_detected"] = "response_detected"
    from_: str = Field(alias="from")
    preview: str


class PaymentDetectedEvent(BaseModel):
    type: Literal["payment_detected"] = "payment_detected"
    amount: float
    from_: str = Field(alias="from")


class DeescalationStepEvent(BaseModel):
    type: Literal["deescalation_step"] = "deescalation_step"
    action: str
    status: Literal["ok", "failed"]
    karen_note: str | None = None


class CompleteEvent(BaseModel):
    type: Literal["complete"] = "complete"
    karen_closing: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str


class AudioEvent(BaseModel):
    type: Literal["audio"] = "audio"
    audio_type: Literal["quip", "commentary"]
    audio_url: str
    text: str = ""


KarenEvent = (
    LevelStartEvent
    | LevelCompleteEvent
    | LevelSkippedEvent
    | CommentaryEvent
    | ResponseDetectedEvent
    | PaymentDetectedEvent
    | DeescalationStepEvent
    | CompleteEvent
    | ErrorEvent
    | AudioEvent
)
