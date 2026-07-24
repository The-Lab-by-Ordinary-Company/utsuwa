#!/usr/bin/env python3
"""
omnivoice-proxy — Minimal OpenAI-compatible HTTP wrapper for k2-fsa/OmniVoice.

Start:
  pip install -r tools/omnivoice/requirements.txt
  python tools/omnivoice/omnivoice-proxy.py --port 8880

Endpoints:
  GET  /health              — 200 when ready, 503 during startup
  GET  /v1/models           — OpenAI-compatible model list
  GET  /v1/voices           — Preset voice list
  POST /v1/audio/speech     — TTS with input, voice, speed, language
"""

from __future__ import annotations

import argparse
import asyncio
import io
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
import soundfile as sf
import torch
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from omnivoice import OmniVoice

logger = logging.getLogger("omnivoice-proxy")

PRESETS: list[dict[str, str]] = [
    {"id": "alloy", "description": "female, young adult, moderate pitch, american accent"},
    {"id": "ash", "description": "male, young adult, low pitch, american accent"},
    {"id": "ballad", "description": "male, middle-aged, low pitch, british accent"},
    {"id": "cedar", "description": "male, middle-aged, low pitch, american accent"},
    {"id": "coral", "description": "female, young adult, high pitch, australian accent"},
    {"id": "echo", "description": "male, middle-aged, moderate pitch, canadian accent"},
    {"id": "fable", "description": "female, middle-aged, moderate pitch, british accent"},
    {"id": "marin", "description": "female, middle-aged, moderate pitch, canadian accent"},
    {"id": "nova", "description": "female, young adult, high pitch, american accent"},
    {"id": "onyx", "description": "male, middle-aged, very low pitch, british accent"},
    {"id": "sage", "description": "female, elderly, low pitch, british accent"},
    {"id": "shimmer", "description": "female, young adult, very high pitch, american accent"},
    {"id": "verse", "description": "male, young adult, moderate pitch, british accent"},
]

_PRESET_MAP: dict[str, str] = {p["id"]: p["description"] for p in PRESETS}

_model: OmniVoice | None = None
_semaphore: asyncio.Semaphore | None = None
_app_started = False


def _verify_token(authorization: str | None = Header(None)) -> None:
    """Require a Bearer token when the proxy is configured with --auth-token."""
    cfg = app.state.cfg
    token = getattr(cfg, "auth_token", None) or os.environ.get("OMNIVOICE_AUTH_TOKEN")
    if not token:
        return
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, provided = authorization.partition(" ")
    if scheme.lower() != "bearer" or provided != token:
        raise HTTPException(status_code=403, detail="Invalid authorization token")


async def _generate(
    text: str,
    *,
    voice: str = "",
    instructions: str = "",
    language: str = "en",
    speed: float = 1.0,
) -> bytes:
    """Run OmniVoice TTS and return WAV bytes (24 kHz, float32)."""
    assert _model is not None
    assert _semaphore is not None

    async with _semaphore:
        kw: dict[str, Any] = {"language": language or "en"}
        if speed != 1.0:
            kw["speed"] = speed

        effective_instructions = instructions or _PRESET_MAP.get(voice, "")
        if effective_instructions:
            kw["instruct"] = effective_instructions

        logger.info("synthesize: text=%r voice=%r language=%r speed=%s", text[:80], voice, language, speed)
        audio = await asyncio.get_running_loop().run_in_executor(
            None, lambda: _model.generate(text, **kw)
        )

    buf = io.BytesIO()
    sf.write(buf, audio[0], 24000, format="WAV", subtype="FLOAT")
    return buf.getvalue()


@asynccontextmanager
async def _lifespan(app: FastAPI):
    global _app_started, _model, _semaphore
    cfg = app.state.cfg
    logger.info("Loading OmniVoice model (%s) on %s ...", cfg.model_id, cfg.device)
    _model = OmniVoice.from_pretrained(
        cfg.model_id,
        device_map=cfg.device,
        dtype=torch.float16,
        load_asr=False,
    )
    _semaphore = asyncio.Semaphore(cfg.max_concurrent)
    _app_started = True
    logger.info("Ready.")
    yield
    _app_started = False
    _model = None
    _semaphore = None


app = FastAPI(title="omnivoice-proxy", lifespan=_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    status = 500
    detail = str(exc)
    if isinstance(exc, HTTPException):
        status = exc.status_code
        detail = exc.detail
    return JSONResponse(
        status_code=status,
        content={"error": detail},
        headers={"Access-Control-Allow-Origin": "*"},
    )


@app.get("/health")
async def health():
    if _app_started:
        return {"status": "ok"}
    raise HTTPException(status_code=503, detail="Model is loading")


@app.get("/v1/models", dependencies=[Depends(_verify_token)])
async def list_models():
    return {"object": "list", "data": [{"id": "omnivoice", "object": "model"}]}


@app.get("/v1/voices", dependencies=[Depends(_verify_token)])
async def list_voices():
    return {"presets": PRESETS}


@app.post("/v1/audio/speech", dependencies=[Depends(_verify_token)])
async def speech(request: Request):
    body = await request.json()
    text = body.get("input", "")
    if not text:
        raise HTTPException(status_code=400, detail="'input' is required")

    voice = body.get("voice", "")
    instructions = body.get("instructions", "")
    language = body.get("language", "en")
    speed = float(body.get("speed", 1.0))

    wav = await _generate(
        text,
        voice=voice,
        instructions=instructions,
        language=language,
        speed=speed,
    )
    return Response(content=wav, media_type="audio/wav")


def _parse_args():
    p = argparse.ArgumentParser(description="omnivoice-proxy")
    p.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    p.add_argument("--port", type=int, default=8880)
    p.add_argument("--device", default="cpu", choices=["cpu", "cuda", "auto"])
    p.add_argument("--model-id", default="k2-fsa/OmniVoice")
    p.add_argument("--max-concurrent", type=int, default=1, help="Max concurrent synthesis requests")
    p.add_argument(
        "--auth-token",
        default=os.environ.get("OMNIVOICE_AUTH_TOKEN") or None,
        help="Optional Bearer token required by all endpoints except /health (env: OMNIVOICE_AUTH_TOKEN)",
    )
    return p.parse_args()


def main():
    args = _parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    app.state.cfg = args
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
