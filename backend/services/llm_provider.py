"""LLM provider abstraction for Karen's personality service.

Toggle between Anthropic API and local Ollama via AI_PROVIDER env var.
"""
from __future__ import annotations

import asyncio
import os
from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """All providers implement generate(system, prompt) -> str."""

    @abstractmethod
    async def generate(self, system: str, prompt: str, max_tokens: int = 1024) -> str: ...


class AnthropicProvider(LLMProvider):
    """Calls Anthropic's API (Claude Haiku 4.5 by default)."""

    def __init__(self) -> None:
        import anthropic

        self._client = anthropic.AsyncAnthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
        )
        self._model = os.environ.get("AI_MODEL", "claude-haiku-4-5-20251001")

    async def generate(self, system: str, prompt: str, max_tokens: int = 1024) -> str:
        import anthropic

        for attempt in range(3):
            try:
                response = await self._client.messages.create(
                    model=self._model,
                    max_tokens=max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.content[0].text
            except anthropic.RateLimitError:
                if attempt < 2:
                    await asyncio.sleep(2 ** (attempt + 1))
                    continue
                raise
        raise RuntimeError("Unreachable")


class OllamaProvider(LLMProvider):
    """Calls a local Ollama instance via OpenAI-compatible API."""

    def __init__(self) -> None:
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(
            api_key="ollama",  # Ollama doesn't require a real key
            base_url=os.environ.get("LOCAL_LLM_URL", "http://ollama:11434/v1"),
        )
        self._model = os.environ.get("LOCAL_MODEL", "qwen2.5:7b")

    async def generate(self, system: str, prompt: str, max_tokens: int = 1024) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or ""


_provider: LLMProvider | None = None


def get_provider() -> LLMProvider:
    """Return the configured LLM provider (singleton)."""
    global _provider
    if _provider is None:
        provider_type = os.environ.get("AI_PROVIDER", "anthropic")
        if provider_type == "anthropic":
            _provider = AnthropicProvider()
        elif provider_type == "local":
            _provider = OllamaProvider()
        else:
            raise ValueError(f"Unknown AI_PROVIDER: {provider_type!r}. Use 'anthropic' or 'local'.")
    return _provider
