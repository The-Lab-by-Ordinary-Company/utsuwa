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
curl http://localhost:8881/health
# {"status":"ok"}
```

If the model download is slow or you hit rate limits, set a `HF_TOKEN` environment variable for HuggingFace before starting the container.

## Connect Utsuwa

1. Start the proxy.
2. Open Utsuwa and go to **Settings > Speech (TTS)**.
3. Enable **Speech** and select **OmniVoice**.
4. Set the base URL. The compose file publishes the proxy on loopback only, so use:
   - `http://localhost:8881/v1/`
   - `http://127.0.0.1:8881/v1/`
5. Choose a voice, language, and speed, then send a message.

The proxy sends permissive CORS headers, so a hosted site can reach it as long as the browser allows the request.

## Reaching the proxy from another machine

The proxy has no authentication and accepts requests from any origin, so the compose file binds it to `127.0.0.1` and nothing outside your machine can reach it.

If you want it available to other devices, change the port mapping in `tools/omnivoice/docker-compose.yaml`:

```yaml
ports:
  - "8881:8881" # reachable from anything that can route to this machine
```

Only do this on a network you trust. Anyone who can reach the port can use your GPU to synthesise audio. The same applies when running outside Docker with `--host 0.0.0.0`; the default there is `127.0.0.1`.

Once exposed, use `http://<your-machine-ip>:8881/v1/` as the base URL (for example `http://192.168.1.42:8881/v1/`). If you run Utsuwa in the development container, `localhost` inside the container is not the host machine, so you need this too.

## CPU-only mode

If you do not have an NVIDIA GPU or `nvidia-container-toolkit`, use the CPU compose file:

```bash
cd tools/omnivoice
docker compose -f docker-compose.cpu.yaml up -d
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

- Confirm you are using `localhost` or `127.0.0.1`. The proxy is bound to loopback by default, so a network IP will not reach it until you change the port mapping. See [Reaching the proxy from another machine](#reaching-the-proxy-from-another-machine).
- If you use the hosted web app, the browser may ask for permission to access local-network devices; allow it.
- If you run Utsuwa in the development Docker container, remember that `localhost` inside the container is not the host machine. You need the host IP, which means exposing the port as described above.

## See also

- [Local TTS Setup](/docs/guides/local-tts-setup) for Kokoro-FastAPI and openedai-speech.
- [OmniVoice repository](https://github.com/k2-fsa/OmniVoice)
