# OmniVoice Proxy

Minimal OpenAI-compatible FastAPI proxy for the local [OmniVoice](https://github.com/k2-fsa/OmniVoice) TTS model.

## What you get

- A local text-to-speech engine.
- OpenAI-compatible `/v1/audio/speech`, `/v1/models`, `/v1/voices` and `/health` endpoints.
- Preset voices and optional voice-design instructions.
- No cloud API key required.

## Requirements

- Linux is recommended.
- NVIDIA GPU with CUDA 12 for fast inference, or a modern CPU for slower CPU inference.
- Docker and Docker Compose (or a compatible container runtime).
- `nvidia-container-toolkit` for GPU acceleration inside the container.
- Internet access on first start to download the `k2-fsa/OmniVoice` model from HuggingFace.

## Start the proxy

The easiest way is the preconfigured Docker Compose service in `tools/omnivoice/docker-compose.yaml`:

```bash
cd tools/omnivoice
docker compose up -d
```

Wait until the health endpoint returns `ok`:

```bash
curl http://localhost:8880/health
# {"status":"ok"}
```

### CPU-only mode

If you do not have an NVIDIA GPU or `nvidia-container-toolkit`, remove the `deploy.resources.reservations.devices` block in `tools/omnivoice/docker-compose.yaml` and pass `--device cpu`:

```bash
cd tools/omnivoice
docker compose run -d --rm --name omnivoice-proxy omnivoice-proxy \
  python omnivoice-proxy.py --host 0.0.0.0 --port 8880 --device cpu
```

### Direct Python start

```bash
pip install -r tools/omnivoice/requirements.txt
python tools/omnivoice/omnivoice-proxy.py --device cpu
```

## Test the proxy

Start the proxy, then run the integration test:

```bash
python tools/omnivoice/test-omnivoice.py
```

It checks `/health`, `/v1/models`, `/v1/voices`, and synthesises a short clip without playing audio.

## Connect Utsuwa

1. Start the proxy.
2. Open Utsuwa and go to **Settings > Speech (TTS)**.
3. Enable **Speech** and select **OmniVoice**.
4. Leave the base URL as `http://localhost:8880/v1/` (or adjust host/port if needed).
5. Choose a voice, language, and speed.

The desktop app talks to `localhost` directly. If you use the hosted web app, the browser may ask for permission to access local-network devices; allow it. The proxy already sends permissive CORS headers.

## Command-line options

```
python tools/omnivoice/omnivoice-proxy.py --help
  --host          Bind host (default: 127.0.0.1)
  --port          Bind port (default: 8880)
  --device        cpu | cuda | auto (default: cpu)
  --model-id      HuggingFace model id (default: k2-fsa/OmniVoice)
  --max-concurrent Max parallel synthesis requests (default: 1)
  --auth-token    Optional Bearer token required by all endpoints except /health
```

Keep `--max-concurrent 1` for a single-GPU setup.

## Troubleshooting

### `RuntimeError: CUDA out of memory`

Close other GPU applications, or run with `--device cpu`.

### Proxy starts but Utsuwa cannot reach it

- Check `curl http://localhost:8880/health` returns `{"status":"ok"}` from the same machine.
- If Utsuwa runs in the browser on a different machine, the hosted site cannot reach `http://` servers on another host due to mixed-content rules. Use the desktop app, or run Utsuwa and the proxy on the same machine.
- On the hosted site reaching `localhost`, allow the browser's local-network permission prompt.

## See also

- [OmniVoice repository](https://github.com/k2-fsa/OmniVoice)
