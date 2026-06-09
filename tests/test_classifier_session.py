"""
Tests for ClassifierAgent's shared aiohttp session lifecycle.

Verifies that the session is:
- Created lazily on first use
- Reused across subsequent calls
- Re-created if the old session was closed externally
- Properly cleaned up by close()
- close() is safe to call multiple times (idempotent)
"""
from __future__ import annotations

from typing import AsyncGenerator

import aiohttp
import pytest
import pytest_asyncio

from backend.agents.classifier_agent import ClassifierAgent


@pytest_asyncio.fixture
async def agent() -> AsyncGenerator[ClassifierAgent, None]:
    """Create a ClassifierAgent with empty config and clean up after."""
    a = ClassifierAgent(config={})
    try:
        yield a
    finally:
        await a.close()


class TestSessionCreation:
    """Tests for _get_session() lazy initialization."""

    @pytest.mark.asyncio
    async def test_session_is_none_initial(self, agent: ClassifierAgent):
        """Session should be None before any call to _get_session()."""
        assert agent._session is None

    @pytest.mark.asyncio
    async def test_get_session_creates_on_first_call(self, agent: ClassifierAgent):
        """_get_session() should create a session when called for the first time."""
        session = await agent._get_session()
        assert session is not None
        assert not session.closed
        assert isinstance(session, aiohttp.ClientSession)

    @pytest.mark.asyncio
    async def test_get_session_sets_internal_state(self, agent: ClassifierAgent):
        """After first _get_session(), agent._session should be set."""
        session = await agent._get_session()
        assert agent._session is session


class TestSessionReuse:
    """Tests that _get_session() reuses the existing session."""

    @pytest.mark.asyncio
    async def test_get_session_returns_same_object(self, agent: ClassifierAgent):
        """Multiple calls to _get_session() should return the same session object."""
        session1 = await agent._get_session()
        session2 = await agent._get_session()
        assert session1 is session2

    @pytest.mark.asyncio
    async def test_session_remains_open_after_multiple_gets(self, agent: ClassifierAgent):
        """Session should remain open after being retrieved multiple times."""
        await agent._get_session()
        await agent._get_session()
        session3 = await agent._get_session()
        assert not session3.closed


class TestSessionRecreation:
    """Tests that _get_session() handles closed sessions gracefully."""

    @pytest.mark.asyncio
    async def test_get_session_after_close_creates_new(self, agent: ClassifierAgent):
        """Calling _get_session() after closing the old session should create a new one."""
        session1 = await agent._get_session()
        await session1.close()
        session2 = await agent._get_session()
        assert session2 is not session1
        assert not session2.closed

    @pytest.mark.asyncio
    async def test_get_session_replaces_closed_reference(self, agent: ClassifierAgent):
        """After _get_session() creates a new session, agent._session should point to the new one."""
        session1 = await agent._get_session()
        await session1.close()
        session2 = await agent._get_session()
        assert agent._session is session2
        assert agent._session is not session1


class TestClose:
    """Tests for the close() cleanup method."""

    @pytest.mark.asyncio
    async def test_close_closes_session(self, agent: ClassifierAgent):
        """close() should close the underlying aiohttp session."""
        session = await agent._get_session()
        await agent.close()
        assert session.closed

    @pytest.mark.asyncio
    async def test_close_sets_session_to_none(self, agent: ClassifierAgent):
        """close() should set _session to None after closing."""
        await agent._get_session()
        await agent.close()
        assert agent._session is None

    @pytest.mark.asyncio
    async def test_close_idempotent(self, agent: ClassifierAgent):
        """Calling close() multiple times should not raise."""
        await agent._get_session()
        await agent.close()  # First close
        await agent.close()  # Second close — should be safe
        assert agent._session is None

    @pytest.mark.asyncio
    async def test_close_when_session_is_none(self, agent: ClassifierAgent):
        """close() should not raise when _session is None (never initialized)."""
        assert agent._session is None
        await agent.close()  # Should not raise

    @pytest.mark.asyncio
    async def test_close_then_get_new_session(self, agent: ClassifierAgent):
        """After close(), _get_session() should create a fresh session."""
        session1 = await agent._get_session()
        await agent.close()
        session2 = await agent._get_session()
        assert session2 is not session1
        assert not session2.closed
        assert agent._session is session2


class TestIntegration:
    """Integration-level tests for the session lifecycle."""

    @pytest.mark.asyncio
    async def test_full_lifecycle(self, agent: ClassifierAgent):
        """Test the complete session lifecycle: create → use → close → create → close."""
        # Phase 1: Create and verify
        s1 = await agent._get_session()
        assert not s1.closed

        # Phase 2: Close and verify
        await agent.close()
        assert s1.closed
        assert agent._session is None

        # Phase 3: Re-create and verify it's a new session
        s2 = await agent._get_session()
        assert s2 is not s1
        assert not s2.closed

        # Phase 4: Final close
        await agent.close()
        assert s2.closed
        assert agent._session is None

    @pytest.mark.asyncio
    async def test_process_empty_list_does_not_call_venice(self, agent: ClassifierAgent):
        """process([]) should succeed without creating a session (no Venice call needed)."""
        result = await agent.process([])
        assert result.success
        assert result.data is not None
        assert result.data.get("transactions") == []
        # Session stays None because _classify_single is never called on empty input
        assert agent._session is None


class TestSessionIdentity:
    """Tests that _get_session() is identity-stable under concurrent access."""

    @pytest.mark.asyncio
    async def test_concurrent_gets_return_same_session(self, agent: ClassifierAgent):
        """
        Multiple concurrent _get_session() calls should return the same session.
        
        Note: asyncio.gather runs sequentially at the check-and-assign boundary 
        of _get_session() since there's no await point between the 
        None/closed check and the ClientSession() constructor. This test 
        verifies the identity invariant, not thread-level parallelism.
        """
        import asyncio

        async def get_session():
            return await agent._get_session()

        results = await asyncio.gather(*[get_session() for _ in range(10)])
        first = results[0]
        for s in results[1:]:
            assert s is first
        assert not first.closed
