from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from services.audio_service import resolve_audio_path

router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/{path:path}")
async def serve_audio(path: str) -> FileResponse:
    """Serve audio files (quips, commentary, music)."""
    full_url = f"/api/audio/{path}"
    resolved = resolve_audio_path(full_url)
    if resolved is None:
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=str(resolved),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )
