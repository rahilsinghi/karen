from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.schemas import (
    ChannelStatus,
    CircleResponse,
    Member,
    MemberCreate,
    MemberUpdate,
)

router = APIRouter(prefix="/api/members", tags=["members"])

# In-memory store — loaded from circle.json on startup via main.py
_members: dict[str, Member] = {}


def load_members(raw: dict) -> None:
    """Called once at startup to hydrate the in-memory store."""
    for m in raw.get("members", []):
        member = Member(**m)
        _members[member.id] = member


def get_member_by_id(member_id: str) -> Member:
    """Used by other services to look up a member."""
    if member_id not in _members:
        raise HTTPException(status_code=404, detail=f"Member '{member_id}' not found")
    return _members[member_id]


def get_all_members() -> list[Member]:
    return list(_members.values())


# ── CRUD endpoints ───────────────────────────────────────────────────────────


@router.get("", response_model=CircleResponse)
async def list_members() -> CircleResponse:
    return CircleResponse(members=list(_members.values()))


@router.get("/{member_id}", response_model=Member)
async def get_member(member_id: str) -> Member:
    return get_member_by_id(member_id)


@router.post("", response_model=Member, status_code=201)
async def create_member(body: MemberCreate) -> Member:
    member_id = body.name.lower().split()[0]

    # Avoid collisions
    base_id = member_id
    counter = 2
    while member_id in _members:
        member_id = f"{base_id}{counter}"
        counter += 1

    member = Member(id=member_id, **body.model_dump())
    _members[member.id] = member
    return member


@router.patch("/{member_id}", response_model=Member)
async def update_member(member_id: str, body: MemberUpdate) -> Member:
    existing = get_member_by_id(member_id)
    updates = body.model_dump(exclude_unset=True)
    updated = existing.model_copy(update=updates)
    _members[member_id] = updated
    return updated


@router.delete("/{member_id}", status_code=204)
async def delete_member(member_id: str) -> None:
    get_member_by_id(member_id)  # raises 404 if missing
    del _members[member_id]


@router.get("/{member_id}/channels", response_model=list[ChannelStatus])
async def get_member_channels(member_id: str) -> list[ChannelStatus]:
    """Show which Karen channels are available for this target."""
    from services.channel_service import get_available_channels

    member = get_member_by_id(member_id)
    available = get_available_channels(member)
    all_channels = ["email", "sms", "whatsapp", "linkedin", "twitter", "calendar", "discord", "github", "fedex"]
    return [
        ChannelStatus(channel=ch, available=(ch in available))
        for ch in all_channels
    ]
