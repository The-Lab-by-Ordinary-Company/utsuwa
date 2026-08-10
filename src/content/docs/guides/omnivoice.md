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
4. Set the base URL. The compose file publishes the proxy on all interfaces by default, so use:
   - `http://localhost:8881/v1/` from the same machine
   - `http://<host-ip>:8881/v1/` from another device or from the Utsuwa dev container
5. Choose a voice, language, and speed, then send a message.

The proxy sends permissive CORS headers, so a hosted site can reach it as long as the browser allows the request.

## Configure your voice

After selecting OmniVoice in **Settings > Speech (TTS)**:

- **Language**: Primary language for synthesis. OmniVoice supports many languages; pick the one your companion speaks most of the time.
- **Preset Voice**: One of the built-in OmniVoice voices (for example `alloy`, `onyx`, or `nova`). Each preset has a fixed gender/age/pitch/accent profile that Utsuwa turns into an instructions string for the model.
- **Mode**: Switch between **Synthetic** (built-in/preset voices) and **Cloned** (your own cloned voices).
- **Regenerate**: Only available for synthetic voices. Deletes the cached persistent profile for the current preset and creates a fresh one with the same instructions. Use this to clear a corrupted profile or to get a slightly different speaker color from the same preset. Because cloned voices do not use cached profiles, the button is disabled in cloned mode.
- **Test**: Plays a short test phrase in the selected language so you can verify the voice before chatting.

### Advanced settings

The primary voice card carries its own synthesis parameters:

- **Speed**: Playback speed of the generated audio.
- **Num Step**: Diffusion steps. Higher values can improve quality at the cost of slower generation.
- **Position Temperature** / **Class Temperature**: Sampling temperatures for the audio tokenizer. Leave them at the defaults unless you want to experiment with pronunciation variation.

The **Alternative Voice** card has the same four parameters with an **Alt** prefix; unset values fall back to the primary voice's settings.

Because OmniVoice is a diffusion model, the exact speaker color can vary slightly between sentences even for the same preset. Persistent preset profiles keep the variation small; cloned voices tend to sound more stable than synthetic presets.

### Alternative language & voice

Enable **Alternative Voice** to give foreign-language words their own voice. This is built for language training: when the companion explains a foreign word, the word itself is spoken in its own language and dialect, while the surrounding explanation stays in the primary voice.

- **Enable toggle**: Turns the switch on. Without it, everything is spoken with the primary voice (foreign words still get the correct dialect, but no voice change).
- **Language**: The foreign language (for example `es`). The primary language is excluded here; the two must differ.
- **Preset Voice / Mode**: Same choices as the primary voice — synthetic presets or one of your cloned voices.
- **Alt Speed / Alt Num Step / Alt Position & Class Temperature**: Optional synthesis parameters for the alternative voice. Each falls back to the primary voice's value when unset.
- **Test Alt Voice**: Plays a short test phrase in the alternative language so you can verify the voice before chatting.
- **Profile pre-warming**: When you enable the alternative voice, Utsuwa pre-generates the persistent profile for that language in the background, so the first foreign word in a chat is not delayed by on-demand profile generation.

The switch is per word: with tool-capable models Utsuwa hands the LLM native speech tools (otherwise it uses `speak({...})` syntax), and every language change becomes its own segment — a reply like "Das spanische Wort für Auto ist **el coche**." plays the German part with the primary voice and "el coche" with the alternative voice.

### Streaming & expressive speech

OmniVoice replies start speaking while the model is still writing: complete sentences are synthesised as soon as they arrive, and long text is split at sentence boundaries. Lip-sync follows the real audio.

For expressive speech the model can insert non-verbal markers into the spoken text — e.g. `[laughter]`, `[sigh]`, `[question-oh]`, `[surprise-wa]`. These are rendered as audio (in both voices) and automatically removed from the visible chat bubble.

Known limitations: very short foreign words are spoken as individual segments, so there can be tiny pauses between them; `pause()`/`gesture()` markers inside a streaming reply are not executed (they are only honoured in non-streaming playback). To keep isolated words stable, the companion is instructed to speak them with their article or a short phrase (for example "el oído" rather than "oído") — the model applies this when it emits the speak segments.

### Cloned voices

Use **Clone New Voice** to upload a 3–10 second audio sample and the matching reference text. The proxy creates a voice clone that you can then select from the **Cloned Voices** list. Delete a clone with the **Delete** button next to the selected voice.

## Reaching the proxy from another machine

The proxy has no authentication by default and now accepts voice uploads and deletions, so the compose file binds it to loopback. To reach it from the Utsuwa development container or another device, change the port mapping in `tools/omnivoice/docker-compose.yaml`:

```yaml
ports:
  - "8881:8881" # all interfaces
```

Only expose the proxy to your LAN on a network you trust, and set `OMNIVOICE_AUTH_TOKEN` when you do; enter the same token as the API key in Utsuwa's OmniVoice settings. Anyone who can reach an unauthenticated port can use your GPU, upload reference audio, and delete cloned voices. The same applies when running outside Docker with `--host 0.0.0.0`; the default there is `127.0.0.1`.

Once exposed, use `http://<your-machine-ip>:8881/v1/` as the base URL (for example `http://192.168.1.42:8881/v1/`).

### Updating the proxy after code changes

When the proxy source changes (for example after a `git pull`), rebuild and restart the container so the new code is copied into the image:

```bash
cd tools/omnivoice
docker compose down
docker compose up -d --build
```

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
