"""
Tests for LossDetector._handle_402_and_retry with mocked HTTP responses.

LossDetector's 402 retry flow (added to match ClassifierAgent's pattern):

  1. Initial Venice API call returns 402 (x402 balance insufficient)
  2. _handle_402_and_retry POSTs to {base_url}/x402/top-up
     - If 402: logs suggested top-up amount, continues
     - Otherwise: continues regardless
  3. Retries POST to {base_url}/chat/completions
     - If 200: returns parsed JSON
     - If non-200: returns error dict (LossDetector's style)

LossDetector differs from ClassifierAgent in error handling:
  - Returns error dicts on failure instead of raising exceptions
  - Uses try/except for JSON parse errors (returns error dict)
"""
from __future__ import annotations

import json
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import aiohttp
import pytest
import pytest_asyncio

from backend.agents.loss_detector import LossDetector

# ──────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────


def mock_response(status: int, json_data: dict | None = None, text: str = "") -> MagicMock:
    """MagicMock that behaves like an aiohttp.ClientResponse inside async with."""
    resp = MagicMock(spec=aiohttp.ClientResponse)
    resp.status = status
    resp.json = AsyncMock(return_value=json_data or {})
    resp.text = AsyncMock(return_value=text or str(json_data or {}))
    resp.__aenter__.return_value = resp
    resp.__aexit__.return_value = None
    return resp


def mock_venice_success(content: str) -> MagicMock:
    """Venice 200 response with JSON in choices[0].message.content."""
    return mock_response(
        status=200,
        json_data={"choices": [{"message": {"content": content}}]},
    )


VALID_ANALYSIS_JSON = json.dumps({
    "recommend_harvest": True,
    "confidence": 0.92,
    "harvest_amount": "2.5",
    "estimated_tax_savings": 850.0,
    "wash_sale_risk": "LOW",
    "reasoning": "ETH down 17% from cost basis in short-term window",
    "priority": 2,
})

PAYLOAD_EXAMPLE = {
    "model": "zai-org-glm-5-1",
    "messages": [
        {"role": "system", "content": "You are a tax optimization AI."},
        {"role": "user", "content": "Analyze this position for harvesting..."},
    ],
}


# ──────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def agent() -> AsyncGenerator[LossDetector, None]:
    a = LossDetector(config={"venice_api_key": "sk-test-fake"})
    try:
        yield a
    finally:
        await a.close()


@pytest_asyncio.fixture
def mock_session() -> MagicMock:
    session = MagicMock(spec=aiohttp.ClientSession)
    session.closed = False
    return session


# ──────────────────────────────────────────────────────
# Direct _handle_402_and_retry tests
# ──────────────────────────────────────────────────────


class TestHandle402RetryDirect:
    """Call _handle_402_and_retry() directly with mocked session."""

    @pytest.mark.asyncio
    async def test_retry_succeeds_after_402(self, agent: LossDetector, mock_session: MagicMock):
        """Top-up not needed → retry succeeds → returns parsed JSON."""
        mock_session.post.side_effect = [
            mock_response(status=200),                        # top-up
            mock_venice_success(VALID_ANALYSIS_JSON),         # retry
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is True
        assert result["confidence"] == 0.92
        assert result["estimated_tax_savings"] == 850.0
        assert mock_session.post.call_count == 2
        assert "x402/top-up" in mock_session.post.call_args_list[0][0][0]
        assert "chat/completions" in mock_session.post.call_args_list[1][0][0]

    @pytest.mark.asyncio
    async def test_topup_also_402_logs_suggestion(self, agent: LossDetector, mock_session: MagicMock):
        """Top-up also returns 402 — logs suggestion, retries."""
        mock_session.post.side_effect = [
            mock_response(status=402, json_data={"suggestedTopUpUsd": 10, "minimumTopUpUsd": 5}),
            mock_venice_success(VALID_ANALYSIS_JSON),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is True
        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_retry_fails_returns_error_dict(self, agent: LossDetector, mock_session: MagicMock):
        """Retry returns non-200 → returns error dict (no exception)."""
        mock_session.post.side_effect = [
            mock_response(status=200),
            mock_response(status=500, json_data={"error": "server_error"}, text="Server Error"),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is False
        assert "Venice API error after top-up: 500" in result.get("error", "")
        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_topup_non_402_still_retries(self, agent: LossDetector, mock_session: MagicMock):
        """Top-up returns 200 but with 'top-up not available' — still retries."""
        mock_session.post.side_effect = [
            mock_response(status=200, json_data={"success": False}),
            mock_venice_success(VALID_ANALYSIS_JSON),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is True
        assert mock_session.post.call_count == 2

    @pytest.mark.asyncio
    async def test_retry_invalid_json_returns_error_dict(self, agent: LossDetector, mock_session: MagicMock):
        """Retry 200 but bad JSON → returns error dict (no exception)."""
        mock_session.post.side_effect = [
            mock_response(status=200),
            mock_venice_success("NOT VALID JSON"),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is False
        assert "Parse error after retry" in result.get("error", "")

    @pytest.mark.asyncio
    async def test_retry_missing_choices_returns_error_dict(self, agent: LossDetector, mock_session: MagicMock):
        """Retry 200 but missing choices key → returns error dict (no exception)."""
        mock_session.post.side_effect = [
            mock_response(status=200),
            mock_response(status=200, json_data={"not": "expected"}),
        ]

        result = await agent._handle_402_and_retry(
            session=mock_session,
            base_url="https://api.venice.ai/api/v1",
            payload=PAYLOAD_EXAMPLE,
            headers={"Content-Type": "application/json"},
        )

        assert result["recommend_harvest"] is False
        assert "Parse error after retry" in result.get("error", "")


# ──────────────────────────────────────────────────────
# Integration tests — _call_venice_analysis dispatches
# ──────────────────────────────────────────────────────


class TestCallVeniceAnalysisTriggersRetry:
    """_call_venice_analysis() dispatches to _handle_402_and_retry on 402."""

    @pytest.mark.asyncio
    async def test_402_triggers_retry_path(self, agent: LossDetector):
        """Initial POST returns 402 → _call_venice_analysis delegates to retry."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_response(status=402, json_data={"error": "x402 balance insufficient"}),
            mock_response(status=200, json_data={"success": True}),
            mock_venice_success(VALID_ANALYSIS_JSON),
        ]
        agent._session = mock_sess

        result = await agent._call_venice_analysis("Analyze this position...")

        assert result["recommend_harvest"] is True
        assert mock_sess.post.call_count == 3

    @pytest.mark.asyncio
    async def test_initial_200_skips_retry(self, agent: LossDetector):
        """Initial POST returns 200 → no retry path."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_venice_success(VALID_ANALYSIS_JSON),
        ]
        agent._session = mock_sess

        result = await agent._call_venice_analysis("Analyze this position...")

        assert result["recommend_harvest"] is True
        assert mock_sess.post.call_count == 1

    @pytest.mark.asyncio
    async def test_initial_non_200_returns_error(self, agent: LossDetector):
        """Initial POST returns non-200, non-402 → returns error dict."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_response(status=429, text="Rate limited"),
        ]
        agent._session = mock_sess

        result = await agent._call_venice_analysis("Analyze this...")

        assert result["recommend_harvest"] is False
        assert "API error: 429" in result.get("error", "")
        assert mock_sess.post.call_count == 1

    @pytest.mark.asyncio
    async def test_retry_reuses_shared_session(self, agent: LossDetector):
        """All POSTs in the retry path use the same session object."""
        mock_sess = MagicMock(spec=aiohttp.ClientSession)
        mock_sess.closed = False
        mock_sess.post.side_effect = [
            mock_response(status=402),
            mock_response(status=200),
            mock_venice_success(VALID_ANALYSIS_JSON),
        ]
        agent._session = mock_sess

        await agent._call_venice_analysis("Test prompt")

        for call in mock_sess.post.call_args_list:
            assert call[0][0].startswith("https://api.venice.ai/api/v1/")
