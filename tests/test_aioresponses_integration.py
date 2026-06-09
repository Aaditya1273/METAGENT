"""
Integration tests for the full _call_venice_api → _handle_402_and_retry path
using aioresponses to intercept HTTP at the transport layer.

Unlike the existing unit tests (which inject MagicMock sessions directly),
these tests let the agent create a *real* aiohttp.ClientSession via
_get_session(), and aioresponses patches the connector to intercept
outgoing HTTP calls. This exercises:

  - Real aiohttp request serialisation / response deserialisation
  - The session creation path (_get_session → aiohttp.ClientSession())
  - Exact URL, header, and payload construction
  - The full error-handling pipeline end-to-end

Requires: pip install aioresponses
"""
from __future__ import annotations

import json
from typing import AsyncGenerator

import aiohttp
import pytest
import pytest_asyncio
from aioresponses import aioresponses

from backend.agents.classifier_agent import ClassifierAgent
from backend.agents.loss_detector import LossDetector

# ──────────────────────────────────────────────────────
# Shared test data
# ──────────────────────────────────────────────────────

VENICE_BASE = "https://api.venice.ai/api/v1"
CHAT_URL = f"{VENICE_BASE}/chat/completions"
TOPUP_URL = f"{VENICE_BASE}/x402/top-up"

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

VALID_ANALYSIS_JSON = json.dumps({
    "recommend_harvest": True,
    "confidence": 0.92,
    "harvest_amount": "2.5",
    "estimated_tax_savings": 850.0,
    "wash_sale_risk": "LOW",
    "reasoning": "ETH down 17% from cost basis in short-term window",
    "priority": 2,
})


def chat_response(content: str) -> dict:
    """Shape of a successful Venice chat/completions response."""
    return {"choices": [{"message": {"content": content}}]}


# ──────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def classifier() -> AsyncGenerator[ClassifierAgent, None]:
    a = ClassifierAgent(config={"venice_api_key": "sk-test-fake"})
    try:
        yield a
    finally:
        await a.close()


@pytest_asyncio.fixture
async def loss_detector() -> AsyncGenerator[LossDetector, None]:
    a = LossDetector(config={"venice_api_key": "sk-test-fake"})
    try:
        yield a
    finally:
        await a.close()


# ──────────────────────────────────────────────────────
# ClassifierAgent — full _call_venice_api → _handle_402_and_retry
# ──────────────────────────────────────────────────────


class TestClassifierAio:
    """ClassifierAgent _call_venice_api via real aiohttp + aioresponses."""

    @pytest.mark.asyncio
    async def test_classifier_402_then_retry_success(self, classifier: ClassifierAgent):
        """
        402 on initial call → top-up succeeds → retry succeeds.

        Verifies all 3 POSTs hit the expected URLs and the final
        parsed JSON matches.
        """
        with aioresponses() as m:
            # 1st call: Venice returns 402
            m.post(CHAT_URL, status=402, payload={"error": "x402 balance insufficient"})
            # 2nd call: x402/top-up returns 200
            m.post(TOPUP_URL, status=200, payload={"success": True})
            # 3rd call: retry succeeds with valid classification
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_CLASSIFICATION_JSON))

            result = await classifier._call_venice_api("Classify this transaction...")

        assert result["category"] == "SWAP"
        assert result["confidence"] == 0.95
        assert result["taxable"] is True

    @pytest.mark.asyncio
    async def test_classifier_no_402_returns_directly(self, classifier: ClassifierAgent):
        """200 on initial call → returns directly, no top-up or retry."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_CLASSIFICATION_JSON))

            result = await classifier._call_venice_api("Classify...")

        assert result["category"] == "SWAP"

    @pytest.mark.asyncio
    async def test_classifier_402_retry_fails_raises(self, classifier: ClassifierAgent):
        """Retry after top-up returns 500 → exception raised."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=200, payload={"success": True})
            m.post(CHAT_URL, status=500, payload={"error": "server error"})

            with pytest.raises(Exception, match="Venice API error after top-up: 500"):
                await classifier._call_venice_api("Classify...")

    @pytest.mark.asyncio
    async def test_classifier_402_topup_also_402(self, classifier: ClassifierAgent):
        """Top-up also returns 402 → logs suggestion → retry succeeds."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=402, payload={"suggestedTopUpUsd": 10, "minimumTopUpUsd": 5})
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_CLASSIFICATION_JSON))

            result = await classifier._call_venice_api("Classify...")

        assert result["category"] == "SWAP"

    @pytest.mark.asyncio
    async def test_classifier_initial_500_raises(self, classifier: ClassifierAgent):
        """Non-200, non-402 on initial call → exception raised directly."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=500, body="Internal Server Error")

            with pytest.raises(Exception, match="Venice API error 500"):
                await classifier._call_venice_api("Classify...")

    @pytest.mark.asyncio
    async def test_classifier_402_retry_bad_json_raises(self, classifier: ClassifierAgent):
        """Retry returns 200 but with invalid JSON content → JSONDecodeError."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=200, payload={"success": True})
            m.post(CHAT_URL, status=200, payload=chat_response("NOT JSON"))

            with pytest.raises(json.JSONDecodeError):
                await classifier._call_venice_api("Classify...")

    @pytest.mark.asyncio
    async def test_classifier_payload_contains_api_key(self, classifier: ClassifierAgent):
        """Verify the Authorization header is sent with the Bearer key."""
        with aioresponses() as m:
            async def check_headers(url, **kwargs):
                assert "Authorization" in kwargs.get("headers", {})
                assert kwargs["headers"]["Authorization"] == "Bearer sk-test-fake"
                return None  # None → use the registered response

            m.post(CHAT_URL, callback=check_headers, status=200,
                   payload=chat_response(VALID_CLASSIFICATION_JSON))
            result = await classifier._call_venice_api("Classify...")

        assert result["category"] == "SWAP"


# ──────────────────────────────────────────────────────
# LossDetector — full _call_venice_analysis → _handle_402_and_retry
# ──────────────────────────────────────────────────────


class TestLossDetectorAio:
    """LossDetector _call_venice_analysis via real aiohttp + aioresponses."""

    @pytest.mark.asyncio
    async def test_loss_402_then_retry_success(self, loss_detector: LossDetector):
        """
        402 on initial call → top-up succeeds → retry succeeds.

        LossDetector returns error dicts instead of raising exceptions,
        so the success path returns the parsed analysis JSON.
        """
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=200, payload={"success": True})
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_ANALYSIS_JSON))

            result = await loss_detector._call_venice_analysis("Analyze this position...")

        assert result["recommend_harvest"] is True
        assert result["confidence"] == 0.92
        assert result["estimated_tax_savings"] == 850.0

    @pytest.mark.asyncio
    async def test_loss_no_402_returns_directly(self, loss_detector: LossDetector):
        """200 on initial call → returns directly."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_ANALYSIS_JSON))

            result = await loss_detector._call_venice_analysis("Analyze...")

        assert result["recommend_harvest"] is True

    @pytest.mark.asyncio
    async def test_loss_402_retry_fails_returns_error_dict(self, loss_detector: LossDetector):
        """Retry returns 500 → returns error dict (no exception)."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=200, payload={"success": True})
            m.post(CHAT_URL, status=500, payload={"error": "server error"})

            result = await loss_detector._call_venice_analysis("Analyze...")

        assert result["recommend_harvest"] is False
        assert "Venice API error after top-up: 500" in result.get("error", "")

    @pytest.mark.asyncio
    async def test_loss_402_topup_also_402(self, loss_detector: LossDetector):
        """Top-up also 402 → logs → retry succeeds."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=402, payload={"suggestedTopUpUsd": 5, "minimumTopUpUsd": 1})
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_ANALYSIS_JSON))

            result = await loss_detector._call_venice_analysis("Analyze...")

        assert result["recommend_harvest"] is True

    @pytest.mark.asyncio
    async def test_loss_initial_500_returns_error_dict(self, loss_detector: LossDetector):
        """Non-200, non-402 on initial call → returns error dict."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=429, body="Rate limited")

            result = await loss_detector._call_venice_analysis("Analyze...")

        assert result["recommend_harvest"] is False
        assert "API error: 429" in result.get("error", "")

    @pytest.mark.asyncio
    async def test_loss_402_retry_bad_json_returns_error_dict(self, loss_detector: LossDetector):
        """Retry 200 but bad JSON → returns error dict (not an exception)."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=402, payload={"error": "insufficient"})
            m.post(TOPUP_URL, status=200, payload={"success": True})
            m.post(CHAT_URL, status=200, payload=chat_response("BAD JSON"))

            result = await loss_detector._call_venice_analysis("Analyze...")

        assert result["recommend_harvest"] is False
        assert "Parse error after retry" in result.get("error", "")

    @pytest.mark.asyncio
    async def test_loss_session_reused_across_calls(self, loss_detector: LossDetector):
        """Multiple calls to _call_venice_analysis reuse the same session object."""
        with aioresponses() as m:
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_ANALYSIS_JSON))
            m.post(CHAT_URL, status=200, payload=chat_response(VALID_ANALYSIS_JSON))

            s1 = loss_detector._session
            await loss_detector._call_venice_analysis("First call")
            session_after_first = loss_detector._session

            await loss_detector._call_venice_analysis("Second call")
            session_after_second = loss_detector._session

        assert s1 is None  # Session was None before first call
        assert session_after_first is not None
        assert session_after_second is session_after_first  # Same session reused
