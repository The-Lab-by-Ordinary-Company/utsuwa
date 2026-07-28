# OmniVoice Proxy

This directory contains a minimal OpenAI-compatible FastAPI proxy for the local [OmniVoice](https://github.com/k2-fsa/OmniVoice) text-to-speech model.

For installation instructions, connection details, and troubleshooting, see the [OmniVoice setup guide](../../src/content/docs/guides/omnivoice.md).

## Files

- `omnivoice-proxy.py` — FastAPI server that exposes `/v1/audio/speech`, `/v1/models`, `/v1/voices`, and `/health`.
- `Dockerfile` / `docker-compose.yaml` — Container setup for running the proxy with Docker (NVIDIA GPU).
- `docker-compose.cpu.yaml` — CPU-only variant for machines without a GPU or `nvidia-container-toolkit`.
- `requirements.txt` — Python dependencies for running the proxy outside of Docker.
- `test-omnivoice.py` — Integration test that checks the endpoints and synthesises a short clip.
