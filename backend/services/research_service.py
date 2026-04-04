from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("karen.research")

_CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "research_cache.json"
_cache: dict[str, dict] | None = None


@dataclass
class ResearchResult:
    target_name: str
    portfolio_url: str
    employer: str
    role: str
    domain: str
    work_email: str
    coworker_name: str
    coworker_email: str
    discovery_steps: list[str]


def _load_cache() -> dict[str, dict]:
    global _cache
    if _cache is None:
        if not _CACHE_PATH.exists():
            logger.warning("Research cache not found at %s", _CACHE_PATH)
            _cache = {}
        else:
            _cache = json.loads(_CACHE_PATH.read_text())
    return _cache


def get_research(target_id: str) -> ResearchResult | None:
    """Look up pre-cached research for a target member."""
    cache = _load_cache()
    entry = cache.get(target_id)
    if not entry:
        return None
    return ResearchResult(
        target_name=entry["target_name"],
        portfolio_url=entry["portfolio_url"],
        employer=entry["employer"],
        role=entry["role"],
        domain=entry["domain"],
        work_email=entry["work_email"],
        coworker_name=entry["coworker_name"],
        coworker_email=entry["coworker_email"],
        discovery_steps=entry["discovery_steps"],
    )


def get_research_steps(target_id: str) -> list[tuple[str, int]]:
    """Return (step_text, pause_ms_after) pairs for the research animation.

    Default pause is 400ms. Step 4 (domain/email inference) uses 800ms.
    """
    result = get_research(target_id)
    if not result:
        return []

    steps: list[tuple[str, int]] = []
    for i, step in enumerate(result.discovery_steps):
        pause = 800 if i == 3 else 400
        steps.append((step, pause))
    return steps
