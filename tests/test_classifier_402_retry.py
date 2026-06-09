"""
Tests for ClassifierAgent._handle_402_and_retry with mocked HTTP responses.

The 402 retry flow is:
  1. Initial Venice API call returns 402 (x402 balance insufficient)
  2. _handle_402_and_retry POSTs to {base_url}/x402/top-up
     - If that returns 402 too: logs suggested top-up amount, continues
     - Otherwise: continues regardless
  3. Retries the original POST to {base_url}/chat/completions
     - If 200: parses JSON from choices[0].message.content
     - If non-200: raises Exception

Mocking approach:
  - Use MagicMock for the session (session.post() is a regular method,
    not async — it returns a context manager, not a coroutine)
  - Each mock response has __aenter__ configured to return itself
    so `async with resp_mock as resp` produces the expected object
"""
from __future__ import annotations

import json
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
import pytest_asyncio

from backend.agents.classifier_agent import ClassifierAgent

# ──────────────────────────────────────────────────────
# Helpers — build mock aiohttp responses
# ──────────────────────────────────────────────────────


def mock_response(status: int, json_data: dict | None = None, text: str = "") -> MagicMock:
    """
    Build a MagicMock that behaves like an aiohttp.ClientResponse
    inside a context manager:

        async with session.post(...) as resp:
            resp.status      # = status
            await resp.json()  # = json_data
            await resp.text()  # = text
    """
    resp = MagicMock(spec=aiohttp.ClientResponse)
    resp.status = status
    resp.json = AsyncMock(return_value=json_data or {})
    resp.text = AsyncMock(return_value=text or str(json_data or {}))
    # Make `async with resp_mock as x` return the mock itself
    resp.__aenter__.return_value = resp
    resp.__aexit__.return_value = None
    return resp


def mock_venice_success(content: str) -> MagicMock:
    """Venice API 200 response with JSON content in choices[0].message.content."""
    return mock_response(
        status=200,
        json_data={
            "choices": [{"message": {"content": content}}],
        },
    )


VALID_CLASSIFICATION_JSON = json.dumps({
    "category": "SWAP",
    "confidence": 0.95,
    "reasoning": "Token A for Token B exchange detected",
    "taxable": True,
    "basis_method": "HIFO",
    "cost_basis_asset": "ETH",
    "is_lp_event": False,
    "notes": "",
})

PAYLOAD_EXAMPLE = {
    "model": "zai-org-glm-5-1",
    "messages": [
        {"role": "system", "content": "You are a crypto tax classification AI."},
        {"role": "user", "content": "Classify this transaction..."},
    ],
}


# ──────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def agent() -> AsyncGenerator[ClassifierAgent, None]:
    """ClassifierAgent with an API key configured so Bearer auth is used."""
    a = ClassifierAgent(config={"venice_api_key": "sk-test-fake"})
    try:
        yield a
    finally:
        await a.close()


@pytest_asyncio.fixture
def mock_session() -> MagicMock:
    """A fully mocked aiohttp.ClientSession.

    Uses MagicMock (not AsyncMock) because session.post() is a regular
    method — it returns a context manager, not a coroutine.
    """
    session = MagicMock(spec=aiohttp.ClientSession)
    session.closed = False
    return session


# ──────────────────────────────────────────────────────
# Direct _handle_402_and_retry tests
# ──────────────────────────────────────────────────────


class TestHandle402RetryDirect:
    """Call _handle_402_and_retry() directly with a mocked session."""

    @pytest.mark.asyncio
    async def test_retry_succeeds_after_402(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Top-up not needed → retry succeeds → returns parsed JSON."""
        mock_session.post.side_effect = [
            mock_response(status=200),                       # top-up response
            mock_venice_success(VALID_CLASSIFICATION_JSON),   # retry response
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["category"] == "SWAP"
        assert result["confidence"] == 0.95
        assert result["taxable"] is True
        # Verify both POSTs were made
        assert mock_session.post.call_count == 2
        # First call should go to /x402/top-up
        assert "x402/top-up" in mock_session.post.call_args_list[0][0][0]
        # Second call should go to /chat/completions
        assert "chat/completions" in mock_session.post.call_args_list[1][0][0]

    @pytest.mark.asyncio
    async def test_topup_also_402_logs_suggestion(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Top-up endpoint also returns 402 — logs suggested amount, retries."""
        topup_body = {"suggestedTopUpUsd": 10, "minimumTopUpUsd": 5}

        mock_session.post.side_effect = [
            mock_response(status=402, json_data=topup_body),  # top-up requires payment
            mock_venice_success(VALID_CLASSIFICATION_JSON),   # retry succeeds
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["category"] == "SWAP"
        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_retry_fails_raises_exception(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Retry after top-up still returns non-200 — raises Exception."""
        mock_session.post.side_effect = [
            mock_response(status=200),       # top-up succeeds
            mock_response(
                status=500,
                text="Internal Server Error",
                json_data={"error": "server_error"},
            ),  # retry fails
        ]

        with pytest.raises(Exception, match="Venice API error after top-up: 500"):
            await agent._handle_402_and_retry(
                session=mock_session,
                base_url="https://api.venice.ai/api/v1",
                payload=PAYLOAD_EXAMPLE,
                headers={"Content-Type": "application/json"},
            )

        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_topup_non_402_still_retries(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Top-up returns 200 but with 'top-up not available' — still retries."""
        mock_session.post.side_effect = [
            mock_response(status=200, json_data={"success": False, "error": "Top-up not available"}),
            mock_venice_success(VALID_CLASSIFICATION_JSON),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["category"] == "SWAP"
        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_retry_success_with_invalid_json_raises(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Retry returns 200 but content is not valid JSON — raises JSONDecodeError."""
        mock_session.post.side_effect = [
            mock_response(status=200),                         # top-up
            mock_venice_success("This is not valid JSON"),     # retry — bad JSON
        ]

        with pytest.raises(json.JSONDecodeError):
            await agent._handle_402_and_retry(
                session=mock_session,
                base_url="https://api.venice.ai/api/v1",
                payload=PAYLOAD_EXAMPLE,
                headers={"Content-Type": "application/json"},
            )

    @pytest.mark.asyncio
    async def test_retry_missing_choices_key_raises(self, agent: ClassifierAgent, mock_session: MagicMock):
        """Retry returns 200 but response missing 'choices' key — raises KeyError."""
        mock_session.post.side_effect = [
            mock_response(status=200),
            mock_response(status=200, json_data={"not": "expected"}),  # missing choices
        ]

        with pytest.raises(KeyError):
            await agent._handle_402_and_retry(
                session=mock_session,
                base_url="https://api.venice.ai/api/v1",
                payload=PAYLOAD_EXAMPLE,
                headers={"Content-Type": "application/json"},
            )


# ──────────────────────────────────────────────────────
# Integration test — _call_venice_api triggers retry
# ──────────────────────────────────────────────────────


class TestCallVeniceApiTriggersRetry:
    """_call_venice_api() dispatches to _handle_402_and_retry when Venice returns 402."""

    @pytest.mark.asyncio
    async def test_402_triggers_retry_path(self, agent: ClassifierAgent):
        """When the initial POST returns 402, _call_venice_api delegates to retry."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            # First POST: initial Venice call → 402
            mock_response(status=402, json_data={"error": "x402 balance insufficient"}),
            # Second POST: top-up → 200
            mock_response(status=200, json_data={"success": True}),
            # Third POST: retry → 200 with valid classification
            mock_venice_success(VALID_CLASSIFICATION_JSON),
        ]

        # Inject the mocked session
        agent._session = mock_sess

        result = await agent._call_venice_api("Classify this transaction...")

        assert result["category"] == "SWAP"
        assert result["confidence"] == 0.95
        assert mock_sess.post.call_count == 3

    @pytest.mark.asyncio
    async def test_initial_200_skips_retry(self, agent: ClassifierAgent):
        """When the initial POST returns 200, _handle_402_and_retry is never called."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_venice_success(VALID_CLASSIFICATION_JSON),
        ]

        agent._session = mock_sess

        result = await agent._call_venice_api("Classify this transaction...")

        # Should return directly without any retry
        assert result["category"] == "SWAP"
        assert mock_sess.post.call_count == 1  # Only the initial call

    @pytest.mark.asyncio
    async def test_retry_reuses_shared_session(self, agent: ClassifierAgent):
        """Verify the retry path uses the agent's shared session, not a new one."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_response(status=402),
            mock_response(status=200),
            mock_venice_success(VALID_CLASSIFICATION_JSON),
        ]

        agent._session = mock_sess

        await agent._call_venice_api("Test prompt")

        # All 3 POSTs should use the same session object
        for call in mock_sess.post.call_args_list:
            assert call[0][0].startswith("https://api.venice.ai/api/v1/")
