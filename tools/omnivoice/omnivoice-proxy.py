#!/usr/bin/env python3
"""
omnivoice-proxy — Minimal OpenAI-compatible HTTP wrapper for k2-fsa/OmniVoice.

Start:
  pip install -r tools/omnivoice/requirements.txt
  python tools/omnivoice/omnivoice-proxy.py --port 8881

Endpoints:
  GET    /health                     — 200 when ready, 503 during startup
  GET    /v1/models                 — OpenAI-compatible model list
  GET    /v1/voices                 — Preset voice list and cloned voices
  POST   /v1/voices/initialize      — Pre-generate a persistent preset profile
  DELETE /v1/voices/profile/{key}   — Delete a persistent preset profile
  POST   /v1/voices/profile/reset   — Regenerate a persistent preset profile
  POST   /v1/voices/clone           — Voice cloning (multipart)
  DELETE /v1/voices/clone/<id>      — Delete a cloned voice
  POST   /v1/audio/speech           — TTS with input, voice, speed, language
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import io
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
import torch
import uvicorn
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from omnivoice import OmniVoice, VoiceClonePrompt

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
_voices_dir: Path | None = None

# Locks to prevent concurrent profile generation for the same key.
_profile_locks: dict[str, asyncio.Lock] = {}

# Path to the request audit log. Each line is JSON with timestamp, parameters
# and the input text as received by /v1/audio/speech. Off by default: the log
# contains full chat text. Opt in with OMNIVOICE_REQUEST_LOG=/path/to/file.
REQUEST_LOG_PATH = os.environ.get("OMNIVOICE_REQUEST_LOG", "")

# Text used to generate the initial reference audio for a preset profile.
# Long enough to produce ~6 seconds of speech for a stable speaker embedding.
_PROFILE_SEED_TEXTS: dict[str, str] = {
    "de": "Guten Tag, mein Name ist dein Sprachassistent. Ich freue mich sehr, dir heute beim Lernen zu helfen. Lass uns gemeinsam beginnen.",
    "en": "Hello, my name is your language assistant. I am very happy to help you learn today. Let us get started together and have a great session.",
    "es": "Hola, mi nombre es tu asistente de idiomas. Estoy muy contento de ayudarte a aprender hoy. Comencemos juntos esta sesión.",
    "fr": "Bonjour, je suis votre assistant linguistique. Je suis très heureux de vous aider à apprendre aujourd'hui. Commençons ensemble.",
    "it": "Buongiorno, sono il tuo assistente linguistico. Sono molto felice di aiutarti a imparare oggi. Iniziamo insieme questa sessione.",
    "pt": "Olá, sou o seu assistente de idiomas. Estou muito feliz em ajudá-lo a aprender hoje. Vamos começar juntos esta sessão.",
    "ja": "こんにちは、私はあなたの言語アシスタントです。今日あなたの学習をお手伝いできてとても嬉しいです。一緒に始めましょう。",
    "ko": "안녕하세요, 저는 여러분의 언어 도우미입니다. 오늘 여러분의 학습을 도와드리게 되어 매우 기쁩니다. 함께 시작합시다.",
    "zh": "你好，我是你的语言助手。今天能帮助你学习我非常高兴。让我们一起开始吧。",
    "ru": "Здравствуйте, я ваш языковой ассистент. Я очень рад помочь вам учиться сегодня. Давайте начнём вместе.",
    "nl": "Hallo, ik ben je taalassistent. Ik ben heel blij om je vandaag te helpen met leren. Laten we samen beginnen.",
    "pl": "Cześć, jestem twoim asystentem językowym. Bardzo się cieszę, że mogę ci dziś pomóc w nauce. Zacznijmy razem.",
    "tr": "Merhaba, ben senin dil asistanınım. Bugün öğrenmene yardımcı olmaktan çok mutluyum. Birlikte başlayalım.",
    "sv": "Hej, jag är din språkassistent. Jag är väldigt glad att hjälpa dig att lära dig idag. Låt oss börja tillsammans.",
    "ar": "مرحبا، أنا مساعدك اللغوي. أنا سعيد جدا بمساعدتك في التعلم اليوم. لنبدأ معا.",
}

_PROFILE_SEED_DEFAULT = "Hello, I am your language learning companion. I look forward to helping you practice and improve your skills today. Let us begin."


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


def log_speech_request(payload: dict[str, Any]) -> None:
    """Append a normalised JSON record of the speech request to the audit log."""
    path = REQUEST_LOG_PATH
    if not path:
        return
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "voice": payload.get("voice"),
        "instructions": payload.get("instructions"),
        "language": payload.get("language"),
        "speed": payload.get("speed"),
        "num_step": payload.get("num_step"),
        "position_temperature": payload.get("position_temperature"),
        "class_temperature": payload.get("class_temperature"),
        "input": payload.get("input"),
    }
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.warning("failed to write request log: %s", e)


def _get_voice_dir() -> Path:
    return _voices_dir or Path.home() / ".omnivoice-proxy" / "voices"


def _get_profiles_dir() -> Path:
    """Directory for auto-generated persistent preset profiles."""
    d = _get_voice_dir() / "profiles"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _profile_key(voice: str, instructions: str, language: str) -> str:
    """Build a stable filesystem-safe key for a preset profile.

    The key includes language because cross-lingual prompts produce accented
    speech. Each language gets its own native-sounding reference prompt.
    """
    norm_instr = ", ".join(sorted(p.strip() for p in instructions.lower().split(",")))
    raw = f"{voice}|{norm_instr}|{language.lower()}"
    short_hash = hashlib.sha256(raw.encode()).hexdigest()[:12]
    # voice and language come from the request body; allowlist them so the key
    # can never contain path separators. Uniqueness lives in the hash.
    safe_voice = re.sub(r"[^A-Za-z0-9_-]", "_", voice)[:20]
    safe_lang = re.sub(r"[^A-Za-z0-9_-]", "_", language or "auto")[:10]
    return f"{safe_voice}_{safe_lang}_{short_hash}"


def _profile_path(voice: str, instructions: str, language: str) -> Path:
    key = _profile_key(voice, instructions, language)
    return _get_profiles_dir() / f"{key}.pt"


def _sanitize_instructions(instructions: Any) -> str:
    """Normalize user-supplied design instructions for profile keys and TTS.

    Keeps printable characters, collapses whitespace, and limits length. This
    prevents odd characters from disturbing the profile-key hash or the
    downstream prompt.
    """
    if not isinstance(instructions, str):
        return ""
    cleaned = "".join(ch for ch in instructions if ch.isprintable())
    cleaned = " ".join(cleaned.split())
    return cleaned[:200]


async def _get_or_create_profile(
    voice: str, instructions: str, language: str
) -> VoiceClonePrompt | None:
    """Load an existing preset profile or create one on-demand.

    Returns the VoiceClonePrompt or None if generation fails.
    Generation is serialized per profile key to avoid duplicate work.
    """
    assert _model is not None
    loop = asyncio.get_running_loop()
    path = _profile_path(voice, instructions, language)

    # Fast path: profile already exists
    if path.exists():
        return await loop.run_in_executor(None, VoiceClonePrompt.load, str(path))

    # Serialize concurrent requests for the same profile
    key = _profile_key(voice, instructions, language)
    if key not in _profile_locks:
        _profile_locks[key] = asyncio.Lock()

    async with _profile_locks[key]:
        # Re-check after acquiring lock (another request may have created it)
        if path.exists():
            return await loop.run_in_executor(None, VoiceClonePrompt.load, str(path))

        logger.info("Generating persistent profile: voice=%r lang=%r instructions=%r", voice, language, instructions)

        seed_text = _PROFILE_SEED_TEXTS.get(language.lower()[:2], _PROFILE_SEED_DEFAULT)

        try:
            # Generate reference audio using the design instructions.
            # Use more diffusion steps for higher quality reference.
            ref_audio = await loop.run_in_executor(
                None,
                lambda: _model.generate(
                    seed_text,
                    instruct=instructions,
                    language=language or None,
                    num_step=32,
                ),
            )

            # Create a VoiceClonePrompt from the generated reference
            ref_wav = ref_audio[0]  # numpy array, 24kHz
            if ref_wav.shape[-1] < 24000:  # less than 1 second — unusable
                raise ValueError(f"Generated reference too short: {ref_wav.shape[-1]} samples")

            ref_tensor = torch.from_numpy(ref_wav).unsqueeze(0)  # (1, T)
            prompt = await loop.run_in_executor(
                None,
                lambda: _model.create_voice_clone_prompt(
                    ref_audio=(ref_tensor, 24000),
                    ref_text=seed_text,
                    preprocess_prompt=True,
                ),
            )

            # Save atomically (write to temp, then move into place).
            # shutil.move handles cross-filesystem installs where Path.rename
            # would raise an OSError.
            tmp_path = path.with_suffix(".tmp")
            await loop.run_in_executor(None, prompt.save, str(tmp_path))
            shutil.move(str(tmp_path), str(path))

            # Remove stale error marker if present
            err_path = path.with_suffix(".error")
            if err_path.exists():
                err_path.unlink()

            logger.info("Profile saved: %s", path.name)
            return prompt

        except Exception as e:
            logger.error("Failed to generate profile for %s: %s", key, e)
            # Write error marker so we don't retry every request
            try:
                path.with_suffix(".error").write_text(str(e), encoding="utf-8")
            except OSError:
                pass
            return None


def _list_clones() -> list[str]:
    d = _get_voice_dir()
    if not d.exists():
        return []
    # Only list direct .pt files (not profiles subdirectory)
    return sorted(p.stem for p in d.glob("*.pt"))


async def _generate(
    text: str,
    *,
    voice: str = "",
    instructions: str = "",
    language: str = "en",
    speed: float = 1.0,
    num_step: int | None = None,
    position_temperature: float | None = None,
    class_temperature: float | None = None,
) -> bytes:
    """Run OmniVoice TTS and return WAV bytes (24 kHz, float32)."""
    assert _model is not None
    assert _semaphore is not None

    loop = asyncio.get_running_loop()

    async with _semaphore:
        kw: dict[str, Any] = {"language": language or "en"}
        if speed != 1.0:
            kw["speed"] = speed
        if num_step is not None:
            kw["num_step"] = num_step
        if position_temperature is not None:
            kw["position_temperature"] = position_temperature
        if class_temperature is not None:
            kw["class_temperature"] = class_temperature

        if voice.startswith("clone:"):
            clone_id = voice.replace("clone:", "", 1)
            prompt_file = _get_voice_dir() / f"{clone_id}.pt"
            if not prompt_file.exists():
                raise HTTPException(status_code=404, detail=f"Clone '{clone_id}' not found")
            prompt = await loop.run_in_executor(None, VoiceClonePrompt.load, str(prompt_file))
            kw["voice_clone_prompt"] = prompt
        elif voice in _PRESET_MAP or instructions:
            # Resolve the effective design instructions
            effective_instructions = instructions or _PRESET_MAP.get(voice, "")
            effective_language = language or "en"

            # Try to use a persistent profile for voice consistency
            profile = await _get_or_create_profile(voice or "custom", effective_instructions, effective_language)
            if profile is not None:
                kw["voice_clone_prompt"] = profile
            else:
                # Fallback: use instruct directly (inconsistent but functional)
                kw["instruct"] = effective_instructions
                logger.warning("Using instruct fallback (no persistent profile) for voice=%r", voice)

        # Default to low temperatures for voice consistency when using profiles
        if "voice_clone_prompt" in kw:
            if "position_temperature" not in kw:
                kw["position_temperature"] = 1.0
            if "class_temperature" not in kw:
                kw["class_temperature"] = 0.2

        logger.info(
            "synthesize: text=%r voice=%r language=%r speed=%s num_step=%s pos_temp=%s class_temp=%s",
            text[:80],
            voice,
            language,
            speed,
            num_step,
            position_temperature,
            class_temperature,
        )
        # The diffusion model occasionally returns (near-)empty audio for very
        # short inputs (single words or short phrases). Retry a few times so
        # the word is actually spoken instead of being dropped silently.
        # Minimum of ~100 ms of audio at 24 kHz: shorter results are garbage.
        audio = None
        for attempt in range(3):
            result = await loop.run_in_executor(None, lambda: _model.generate(text, **kw))
            if len(result[0]) >= 2400:
                audio = result
                break
            logger.warning(
                "Near-empty synthesis result (attempt %d/3, %d samples) for text=%r",
                attempt + 1,
                len(result[0]),
                text[:80],
            )
        if audio is None:
            audio = result

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
    clones = _list_clones()
    return {
        "presets": PRESETS,
        "clones": [{"id": f"clone:{c}", "name": c} for c in clones],
    }


@app.post("/v1/voices/initialize", dependencies=[Depends(_verify_token)])
async def initialize_voice(request: Request):
    """Pre-generate a persistent voice profile for a preset + language.

    Call this from the settings UI when the user selects or changes a voice
    so the first chat message doesn't incur the profile generation delay.

    Body: {"voice": "alloy", "instructions": "...", "language": "de"}
    """
    body = await request.json()
    voice = body.get("voice", "")
    instructions = _sanitize_instructions(body.get("instructions", ""))
    language = body.get("language", "en")

    if not voice and not instructions:
        raise HTTPException(status_code=400, detail="'voice' or 'instructions' required")

    effective_instructions = instructions or _PRESET_MAP.get(voice, "")
    if not effective_instructions:
        raise HTTPException(status_code=400, detail=f"Unknown voice '{voice}' and no instructions provided")

    # Take the synthesis semaphore: profile generation is a full GPU job and
    # must not run concurrently with /v1/audio/speech.
    assert _semaphore is not None
    async with _semaphore:
        profile = await _get_or_create_profile(voice or "custom", effective_instructions, language)
    status = "ready" if profile is not None else "error"
    key = _profile_key(voice or "custom", effective_instructions, language)
    return {"status": status, "profile_key": key}


@app.delete("/v1/voices/profile/{profile_key}", dependencies=[Depends(_verify_token)])
async def delete_profile(profile_key: str):
    """Delete a persistent preset profile to force regeneration."""
    profiles_dir = _get_profiles_dir()
    path = profiles_dir / f"{profile_key}.pt"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{profile_key}' not found")
    path.unlink()
    # Also remove error marker if present
    err = path.with_suffix(".error")
    if err.exists():
        err.unlink()
    return {"deleted": profile_key}


@app.post("/v1/voices/profile/reset", dependencies=[Depends(_verify_token)])
async def reset_profile(request: Request):
    """Delete and immediately regenerate a persistent preset profile.

    Body: {"voice": "alloy", "instructions": "...", "language": "de"}
    Returns the same payload as /v1/voices/initialize.
    """
    body = await request.json()
    voice = body.get("voice", "")
    instructions = _sanitize_instructions(body.get("instructions", ""))
    language = body.get("language", "en")

    if not voice and not instructions:
        raise HTTPException(status_code=400, detail="'voice' or 'instructions' required")

    effective_instructions = instructions or _PRESET_MAP.get(voice, "")
    if not effective_instructions:
        raise HTTPException(status_code=400, detail=f"Unknown voice '{voice}' and no instructions provided")

    # Back up the existing profile so we can roll back if regeneration fails.
    key = _profile_key(voice or "custom", effective_instructions, language)
    profiles_dir = _get_profiles_dir()
    path = profiles_dir / f"{key}.pt"
    backup = path.with_suffix(".bak")
    had_existing = path.exists()
    if had_existing:
        shutil.copy2(str(path), str(backup))
        path.unlink()
    err = path.with_suffix(".error")
    had_error_marker = err.exists()
    if had_error_marker:
        err.unlink()

    # Regenerate under the synthesis semaphore (a full GPU job, same as
    # initialize). _get_or_create_profile reports failure by returning None
    # (it catches internally), so roll back on None, not on exception.
    assert _semaphore is not None
    async with _semaphore:
        profile = await _get_or_create_profile(voice or "custom", effective_instructions, language)
    if profile is None:
        # Restore the previous profile so the voice keeps working, and drop
        # the error marker the failed attempt just wrote.
        if had_existing and backup.exists():
            shutil.move(str(backup), str(path))
            err.unlink(missing_ok=True)
        return {"status": "error", "profile_key": key}

    if backup.exists():
        backup.unlink()
    return {"status": "ready", "profile_key": key}


@app.post("/v1/voices/clone", dependencies=[Depends(_verify_token)])
async def clone_voice(
    ref_audio: UploadFile = File(...),
    voice_id: str = Form(...),
    ref_text: str = Form(""),
):
    if not voice_id or not voice_id.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="voice_id must be alphanumeric (dashes/underscores allowed)")

    loop = asyncio.get_running_loop()
    _get_voice_dir().mkdir(parents=True, exist_ok=True)

    suffix = Path(ref_audio.filename or "audio.wav").suffix or ".wav"
    file_bytes = await ref_audio.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    # Normalize to a clean 24 kHz mono WAV that OmniVoice can ingest.
    # This also repairs files with broken headers or non-PCM content.
    normalized_path = tmp_path + ".normalized.wav"
    try:
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i", tmp_path,
                    "-ar", "24000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    normalized_path,
                ],
                capture_output=True,
                text=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            logger.error("ffmpeg normalization failed: %s", e.stderr)
            raise HTTPException(status_code=400, detail=f"Could not normalize audio: {e.stderr}") from None

        try:
            info = sf.info(normalized_path)
            if info.duration <= 0:
                raise HTTPException(status_code=400, detail="Normalized audio has zero duration")
        except Exception as e:
            logger.warning("Could not inspect clone audio: %s", e)

        prompt = await loop.run_in_executor(
            None,
            lambda: _model.create_voice_clone_prompt(
                ref_audio=normalized_path,
                ref_text=ref_text or None,
                preprocess_prompt=False,
            ),
        )
        out_path = _get_voice_dir() / f"{voice_id}.pt"
        await loop.run_in_executor(None, prompt.save, str(out_path))
    finally:
        for p in (tmp_path, normalized_path):
            try:
                os.unlink(p)
            except FileNotFoundError:
                pass

    return {"id": f"clone:{voice_id}"}


@app.delete("/v1/voices/clone/{clone_id}", dependencies=[Depends(_verify_token)])
async def delete_clone(clone_id: str):
    path = _get_voice_dir() / f"{clone_id}.pt"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Clone '{clone_id}' not found")
    path.unlink()
    return {"deleted": clone_id}


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
    num_step = body.get("num_step")
    position_temperature = body.get("position_temperature")
    class_temperature = body.get("class_temperature")

    log_speech_request(body)

    wav = await _generate(
        text,
        voice=voice,
        instructions=instructions,
        language=language,
        speed=speed,
        num_step=int(num_step) if num_step is not None else None,
        position_temperature=float(position_temperature) if position_temperature is not None else None,
        class_temperature=float(class_temperature) if class_temperature is not None else None,
    )
    return Response(content=wav, media_type="audio/wav")


def _parse_args():
    p = argparse.ArgumentParser(description="omnivoice-proxy")
    p.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    p.add_argument("--port", type=int, default=8881)
    p.add_argument("--device", default="cpu", choices=["cpu", "cuda", "auto"])
    p.add_argument("--model-id", default="k2-fsa/OmniVoice")
    p.add_argument("--max-concurrent", type=int, default=1, help="Max concurrent synthesis requests")
    p.add_argument("--voices-dir", default=None, help="Directory for cloned voice profiles and persistent preset profiles")
    p.add_argument(
        "--auth-token",
        default=os.environ.get("OMNIVOICE_AUTH_TOKEN") or None,
        help="Optional Bearer token required by all endpoints except /health (env: OMNIVOICE_AUTH_TOKEN)",
    )
    return p.parse_args()


def main():
    args = _parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    global _voices_dir
    if args.voices_dir:
        _voices_dir = Path(args.voices_dir)

    app.state.cfg = args
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
