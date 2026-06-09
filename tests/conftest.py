"""
Pytest conftest — monkey-patches for compatibility.

aioresponses 0.7.x is incompatible with aiohttp >= 3.14 on Python 3.14
because ClientResponse.__init__() now requires a keyword-only *stream_writer*
argument with an ``.output_size`` attribute that aioresponses doesn't pass.

We monkey-patch ClientResponse.__init__ to inject a lightweight mock
stream_writer when the caller (e.g. aioresponses) omits it.
"""
from __future__ import annotations

import functools

try:
    from aiohttp.client_reqrep import ClientResponse

    class _MockStreamWriter:
        """Minimal mock that satisfies aiohttp >= 3.14 expectations."""
        output_size: int = 0

        def __getattr__(self, name: str):
            # Swallow any other attribute access aiohttp might attempt.
            return 0 if name == "output_size" else None

    _orig_init = ClientResponse.__init__

    @functools.wraps(_orig_init)
    def _patched_init(
        self,
        method: str,
        url: "yarl.URL",
        *,
        writer=None,
        continue100=None,
        timer=None,
        request_info=None,
        traces=None,
        loop=None,
        session=None,
        stream_writer=None,
        **kwargs,
    ):
        if stream_writer is None:
            stream_writer = _MockStreamWriter()
        return _orig_init(
            self,
            method,
            url,
            writer=writer,
            continue100=continue100,
            timer=timer,
            request_info=request_info,
            traces=traces,
            loop=loop,
            session=session,
            stream_writer=stream_writer,
            **kwargs,
        )

    ClientResponse.__init__ = _patched_init
except (ImportError, AttributeError):
    pass  # aiohttp not installed — skip patch
