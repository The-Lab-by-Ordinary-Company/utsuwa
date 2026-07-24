---
title: OmniVoice Setup
description: Run the OmniVoice text-to-speech model locally for a fully offline, multi-language voice.
---

# OmniVoice Setup

[OmniVoice](https://github.com/k2-fsa/OmniVoice) is a local text-to-speech model that runs entirely on your own hardware. It supports a large number of languages, generates audio quickly on a modern GPU, and does not need a cloud API key. Utsuwa talks to OmniVoice through a small OpenAI-compatible proxy that ships in this repository.

## What you need

- **Docker** and Docker Compose (or a compatible container runtime) installed on your machine.
- Linux is recommended; the proxy is built and tested there.
- An NVIDIA GPU with CUDA 12 for fast inference, or a modern CPU for slower CPU inference.
- `nvidia-container-toolkit` if you want GPU acceleration inside the container.
- Internet access on first start to download the `k2-fsa/OmniVoice` model from HuggingFace.

OmniVoice can also be installed and run outside of Docker with Python 3.11 and its native dependencies. This guide focuses on the Docker path because it is the easiest way to get a reproducible environment.

## Start the proxy

The proxy code lives in `tools/omnivoice` and includes a ready-to-use Docker Compose file:

```bash
cd tools/omnivoice
docker compose up -d
```

The first start downloads the model from HuggingFace, which can take several minutes depending on your connection. Wait until the health endpoint returns `ok`:

```bash
curl http://localhost:8880/health
# {"status":"ok"}
```

If the model download is slow or you hit rate limits, set a `HF_TOKEN` environment variable for HuggingFace before starting the container.

## Connect Utsuwa

1. Start the proxy.
2. Open Utsuwa and go to **Settings > Speech (TTS)**.
3. Enable **Speech** and select **OmniVoice**.
4. Set the base URL. The proxy binds to every interface, so any of these work once the model is loaded:
   - `http://localhost:8880/v1/`
   - `http://127.0.0.1:8880/v1/`
   - `http://<your-machine-ip>:8880/v1/` (for example `http://192.168.1.42:8880/v1/`)

If `localhost` does not resolve from your browser or from inside the development container, use the IP address of your network interface instead. The proxy already sends permissive CORS headers, so a hosted site or another origin can reach it as long as the browser allows the request.
5. Choose a voice, language, and speed, then send a message.

## CPU-only mode

If you do not have an NVIDIA GPU or `nvidia-container-toolkit`, remove the `deploy.resources.reservations.devices` block in `tools/omnivoice/docker-compose.yaml` and start with `--device cpu`:

```bash
cd tools/omnivoice
docker compose run -d --rm --name omnivoice-proxy omnivoice-proxy \
  python omnivoice-proxy.py --host 0.0.0.0 --port 8880 --device cpu
```

CPU synthesis is slower, especially on first load, but it does not require a GPU.

## Run without Docker

You can also run the proxy directly with Python 3.11:

```bash
pip install -r tools/omnivoice/requirements.txt
python tools/omnivoice/omnivoice-proxy.py --device cpu
```

See the [OmniVoice repository](https://github.com/k2-fsa/OmniVoice) for the underlying model setup and non-Docker requirements.

## Test the proxy

Start the proxy, then run the integration test:

```bash
python tools/omnivoice/test-omnivoice.py
```

It checks `/health`, `/v1/models`, `/v1/voices`, and synthesises a short clip without playing audio.

## Troubleshooting

### Container restarts or `CONNECTION_REFUSED`

Check the logs:

```bash
docker logs omnivoice-proxy --tail 50
```

Common causes are a missing `Depends` import from `fastapi` (fixed in the shipped proxy), a port conflict, or the model still downloading. Wait for the health endpoint to return `ok` before testing from Utsuwa.

### `RuntimeError: CUDA out of memory`

Close other GPU applications, reduce `--max-concurrent` to `1`, or run with `--device cpu`.

### Proxy is healthy but Utsuwa cannot reach it

- Try the base URL with your machine's network IP instead of `localhost`.
- If you use the hosted web app, the browser may ask for permission to access local-network devices; allow it.
- If you run Utsuwa in the development Docker container, remember that `localhost` inside the container is not the host machine. Use the host IP or run the proxy on a network both can reach.

## See also

- [Local TTS Setup](/docs/guides/local-tts-setup) for Kokoro-FastAPI and openedai-speech.
- [OmniVoice repository](https://github.com/k2-fsa/OmniVoice)
