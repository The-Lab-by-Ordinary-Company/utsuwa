---
title: Local TTS Setup
description: Give your companion a voice that runs entirely on your machine using Kokoro-FastAPI or openedai-speech.
---

# Local TTS Setup

If you already run local LLMs with Ollama or LM Studio, you can give your companion a local voice too. The audio is generated on your machine, so nothing leaves the device and there are no API keys or per-character costs.

Utsuwa talks to any TTS server that exposes the OpenAI `/v1/audio/speech` endpoint. The two we recommend are **Kokoro-FastAPI** and **openedai-speech**. Lip-sync works automatically because Utsuwa animates the mouth from the audio itself, no extra data needed.

## Kokoro-FastAPI (recommended)

[Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) wraps the Kokoro voice model and serves the OpenAI speech API directly. It is fast on CPU and sounds great for its size.

### Installation

The quickest path is Docker:

```bash
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

If you have an NVIDIA GPU, use the `kokoro-fastapi-gpu` image instead. See the project README for non-Docker installs.

This serves the API at `http://localhost:8880/v1`.

### Connecting to Utsuwa

1. Open **Settings** (gear icon)
2. Navigate to the **Character** tab
3. Enable the **Speech (TTS)** toggle, then select **Local TTS** from the provider dropdown
4. Leave the base URL as `http://localhost:8880/v1/` unless you changed the port
5. Pick a **voice** (start typing in the voice field to see suggestions like `af_bella`)
6. Leave **Model** blank to use the default, or set it to `kokoro`
7. Send a message and your companion speaks

### Voices

Kokoro voice names encode region and gender, for example `af_bella` (American female) or `bm_george` (British male). Utsuwa seeds a few common ones in the voice field, and you can type any voice your server supports.

## openedai-speech

[openedai-speech](https://github.com/matatonic/openedai-speech) is another OpenAI-compatible server that can run Piper and other engines. Set up its server, then point Utsuwa's Local TTS base URL at it (default `http://localhost:8000/v1/`). Use the voice names that server exposes.

## Custom Base URL

Running the server on a different machine or port? Enter the full URL in the Local TTS base URL field. Utsuwa normalizes it to end in `/v1/`, so `http://localhost:8880`, `http://localhost:8880/v1`, and `http://localhost:8880/v1/` all work. Examples:

- Remote machine: `http://192.168.1.50:8880/v1/`
- Custom port: `http://localhost:9000/v1/`

## Troubleshooting

### No sound and no error

Make sure the **Speech (TTS)** module is enabled and a voice is set. If the voice field is empty, type a valid voice for your server (e.g. `af_bella` for Kokoro).

### "Could not reach a local TTS server"

The server isn't running or isn't reachable at the base URL. Confirm it's up:

```bash
curl http://localhost:8880/v1/audio/voices
```

If that returns data but Utsuwa still can't reach it from a browser, it's almost certainly a CORS block. The server has to allow the page's origin. Kokoro-FastAPI allows all origins by default; if you front it with a proxy or use a server that locks CORS down, allow the Utsuwa origin (for the hosted site, `https://www.utsuwa.ai`). This is the same class of issue as the Ollama origins setup, and like that one, **it does not apply to the desktop app**.

### "Local TTS server returned 400/404"

The model or voice isn't valid for that server. Leave the model blank (Utsuwa sends `tts-1`, which most servers accept), and double-check the voice name against your server's voice list.

### Choppy or delayed speech

Local TTS generates the full clip before playback. On slower hardware, try a CPU-optimized build or a GPU image, and keep responses shorter.
