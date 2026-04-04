import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from routers.audio import router as audio_router
from routers.escalation import router as escalation_router
from routers.members import load_members, router as members_router
from routers.webhook import router as webhook_router
from services.karen_service import get_active_escalations
from services.llm_provider import get_provider_name, set_provider

load_dotenv()

_default_origins = "http://localhost:3000,https://molly.rahilsinghi.com,https://karen-tau.vercel.app"
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app = FastAPI(title="Karen API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(members_router)
app.include_router(escalation_router)
app.include_router(webhook_router)
app.include_router(audio_router)

DATA_DIR = Path(__file__).parent / "data"


@app.on_event("startup")
async def startup() -> None:
    with open(DATA_DIR / "circle.json") as f:
        circle_data = json.load(f)
    load_members(circle_data)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "karen"}


@app.get("/api/config")
async def get_config() -> dict:
    return {
        "ai_provider": get_provider_name(),
        "has_active": len(get_active_escalations()) > 0,
    }


class ProviderSwitch(BaseModel):
    provider: str


@app.post("/api/config/provider")
async def switch_provider(body: ProviderSwitch) -> dict:
    if get_active_escalations():
        return {"error": "Cannot switch provider during active escalation"}
    set_provider(body.provider)
    return {"ai_provider": get_provider_name()}
