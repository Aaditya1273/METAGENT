"""
Tests for VeniceClient's shared aiohttp session lifecycle.

VeniceClient is a @dataclass (not a BaseAgent subclass) with:

  - _session: Optional[aiohttp.ClientSession] = None   (field)
  - get_session()  ← creates/reuses the session
  - close()        ← closes the session (does NOT set _session = None)
  - _chat_completion()  ← public methods call get_session()
  - check_balance()     ← public methods call get_session()
  - top_up()            ← public methods call get_session()

Note: close() does not null out _session after closing, but get_session()
handles this correctly via the "or self._session.closed" guard.
"""
from __future__ import annotations

from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
import pytest_asyncio

from backend.integrations.venice import VeniceClient, VENICE_CHAT_URL, VENICE_X402_BALANCE_URL, VENICE_X402_TOPUP_URL


# ──────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[VeniceClient, None]:
    """A VeniceClient with no API key (Bearer or wallet)."""
    c = VeniceClient()
    try:
        yield c
    finally:
        await c.close()


@pytest_asyncio.fixture
async def client_with_key() -> AsyncGenerator[VeniceClient, None]:
    """A VeniceClient with a Bearer API key configured."""
    c = VeniceClient(api_key="sk-test-fake-key")
    try:
        yield c
    finally:
        await c.close()


# ──────────────────────────────────────────────────────
# Session Creation  (lazy initialisation)
# ──────────────────────────────────────────────────────


class TestSessionCreation:
    """Tests for get_session() lazy initialisation."""

    @pytest.mark.asyncio
    async def test_session_is_none_initial(self, client: VeniceClient):
        assert client._session is None

    @pytest.mark.asyncio
    async def test_get_session_creates_on_first_call(self, client: VeniceClient):
        session = await client.get_session()
        assert session is not None
        assert not session.closed
        assert isinstance(session, aiohttp.ClientSession)

    @pytest.mark.asyncio
    async def test_get_session_sets_internal_state(self, client: VeniceClient):
        session = await client.get_session()
        assert client._session is session


# ──────────────────────────────────────────────────────
# Session Reuse
# ──────────────────────────────────────────────────────


class TestSessionReuse:
    """Tests that get_session() reuses the existing session."""

    @pytest.mark.asyncio
    async def test_get_session_returns_same_object(self, client: VeniceClient):
        s1 = await client.get_session()
        s2 = await client.get_session()
        assert s1 is s2

    @pytest.mark.asyncio
    async def test_session_remains_open_after_multiple_gets(self, client: VeniceClient):
        await client.get_session()
        await client.get_session()
        s3 = await client.get_session()
        assert not s3.closed


# ──────────────────────────────────────────────────────
# Session Recreation
# ──────────────────────────────────────────────────────


class TestSessionRecreation:
    """Tests that get_session() handles closed sessions gracefully."""

    @pytest.mark.asyncio
    async def test_get_session_after_close_creates_new(self, client: VeniceClient):
        s1 = await client.get_session()
        await s1.close()
        s2 = await client.get_session()
        assert s2 is not s1
        assert not s2.closed

    @pytest.mark.asyncio
    async def test_get_session_replaces_closed_reference(self, client: VeniceClient):
        s1 = await client.get_session()
        await s1.close()
        s2 = await client.get_session()
        # get_session() sees _session.closed=True and replaces it
        assert client._session is s2
        assert client._session is not s1


# ──────────────────────────────────────────────────────
# Close lifecycle
# ──────────────────────────────────────────────────────


class TestClose:
    """Tests for the close() cleanup method.

    Note: VeniceClient.close() differs from the agent close() methods —
    it does NOT set _session = None after closing. The get_session()
    method handles this via its 'or self._session.closed' guard.
    """

    @pytest.mark.asyncio
    async def test_close_closes_session(self, client: VeniceClient):
        session = await client.get_session()
        await client.close()
        assert session.closed

    @pytest.mark.asyncio
    async def test_close_does_not_null_session(self, client: VeniceClient):
        """VeniceClient.close() intentionally leaves _session pointing
        to the (now-closed) session object — get_session() checks .closed."""
        session = await client.get_session()
        await client.close()
        # _session is still the old (closed) object — not None
        assert client._session is session
        assert client._session.closed

    @pytest.mark.asyncio
    async def test_get_session_after_close_still_works(self, client: VeniceClient):
        """After close(), get_session() should create a new session
        because it detects _session.closed."""
        s1 = await client.get_session()
        await client.close()
        s2 = await client.get_session()
        assert s2 is not s1
        assert not s2.closed
        # Internal reference now points to the new session
        assert client._session is s2

    @pytest.mark.asyncio
    async def test_close_idempotent(self, client: VeniceClient):
        """Calling close() multiple times should not raise."""
        await client.get_session()
        await client.close()
        await client.close()
        # After close(), _session is the old closed object
        assert client._session is not None
        assert client._session.closed

    @pytest.mark.asyncio
    async def test_close_when_session_is_none(self, client: VeniceClient):
        """close() should not raise when _session is None (never initialized)."""
        assert client._session is None
        await client.close()


# ──────────────────────────────────────────────────────
# Shared session across public methods
# ──────────────────────────────────────────────────────


class TestSharedSessionAcrossMethods:
    """Multiple public HTTP methods use the same session."""

    @pytest.mark.asyncio
    async def test_chat_completion_uses_and_reuses_session(self, client: VeniceClient):
        """_chat_completion triggers session creation and reuses it.

        With no auth credentials, VeniceClient now returns a fallback
        classification dict instead of raising an exception.
        """
        assert client._session is None

        result = await client._chat_completion(
            messages=[{"role": "user", "content": "test"}],
        )

        # Should get a fallback classification dict
        assert isinstance(result, dict)
        assert result.get("category") == "OTHER"
        assert "venice ai" in result.get("reasoning", "").lower()

        # get_session() is called before auth check, so session is created
        assert client._session is not None
        assert not client._session.closed

    @pytest.mark.asyncio
    async def test_check_balance_uses_session(self, client: VeniceClient):
        """check_balance with a wallet_key configured should create a session."""
        c = VeniceClient(wallet_key="test-wallet-key")
        try:
            assert c._session is None
            # Will make HTTP request (likely non-200), but session is created
            result = await c.check_balance()
            assert c._session is not None
        finally:
            await c.close()

    @pytest.mark.asyncio
    async def test_top_up_uses_session(self, client: VeniceClient):
        """top_up should create a session regardless of HTTP outcome."""
        assert client._session is None

        # top_up() may raise on connection error or return normally on a
        # non-402 response. Either way, get_session() is called before
        # the HTTP call, so the session is always created.
        try:
            await client.top_up(amount_usd=5.0)
        except Exception:
            pass

        assert client._session is not None


# ──────────────────────────────────────────────────────
# Full lifecycle
# ──────────────────────────────────────────────────────


class TestIntegration:
    """Complete lifecycle tests."""

    @pytest.mark.asyncio
    async def test_full_lifecycle(self, client: VeniceClient):
        """Create → use → close → create → close."""
        s1 = await client.get_session()
        assert not s1.closed

        await client.close()
        assert s1.closed

        s2 = await client.get_session()
        assert s2 is not s1
        assert not s2.closed
        assert client._session is s2

        await client.close()
        # After closing again, _session is the old closed object
        # (VeniceClient.close() doesn't null it)
        assert client._session is s2
        assert s2.closed

    @pytest.mark.asyncio
    async def test_concurrent_gets_return_same_session(self, client: VeniceClient):
        """Multiple concurrent get_session() calls return the same session."""
        import asyncio

        async def get():
            return await client.get_session()

        results = await asyncio.gather(*[get() for _ in range(10)])
        first = results[0]
        for s in results[1:]:
            assert s is first
        assert not first.closed

    @pytest.mark.asyncio
    async def test_session_shared_across_chat_and_balance(self, client_with_key: VeniceClient):
        """Verify _chat_completion and top_up share the same session object.

        With an API key configured, _chat_completion will attempt an HTTP
        request that returns 401 (test key). The code now catches this
        and returns a fallback dict instead of raising.
        """
        # Trigger session via _chat_completion (may fall back to rule-based)
        result = await client_with_key._chat_completion(
            messages=[{"role": "user", "content": "hello"}],
        )

        # Should return fallback since test key is fake
        assert isinstance(result, dict)

        s1 = client_with_key._session

        # Call top_up — it may crash on connection error
        try:
            await client_with_key.top_up(amount_usd=5.0)
        except Exception:
            pass

        s2 = client_with_key._session
        # Session identity should be consistent (both None or both the same)
        assert s2 is s1

    @pytest.mark.asyncio
    async def test_session_shared_across_public_apis(self, client: VeniceClient):
        """Check that _chat_completion and top_up share the same session.

        Since VeniceClient is stateless between calls (except for _session),
        calling top_up after _chat_completion should reuse the session.
        """
        # Trigger session via _chat_completion (returns fallback, no HTTP)
        result = await client._chat_completion(
            messages=[{"role": "user", "content": "hello"}],
        )

        # Should return fallback since no auth credentials
        assert isinstance(result, dict)

        s_before = client._session

        # top_up may crash on connection — catch it
        try:
            await client.top_up(amount_usd=5.0)
        except Exception:
            pass

        # No auth config means no HTTP calls, so _session stays None
        # This is correct — the fallback avoids unnecessary network requests

        s_after = client._session
        # Session object should be consistent (both None or both the same)
        assert s_after is s_before
