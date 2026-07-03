---
title: Web Guide
description: How to set up and use Utsuwa on the web.
---

# Web Guide

This guide walks you through using Utsuwa, whether on the hosted version at [utsuwa.ai](https://utsuwa.ai) or a self-hosted instance.

## Self-Hosting Setup

### Prerequisites

- Node.js 22 or higher
- pnpm
- A modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
git clone https://github.com/The-Lab-by-Ordinary-Company/utsuwa.git
cd utsuwa
pnpm install
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Initial Configuration

### 1. Configure an LLM Provider

Your companion needs an LLM to generate responses.

1. Open **Settings** (gear icon in the sidebar)
2. Navigate to the **Character** tab
3. Enable the LLM toggle, then select a provider from the dropdown and enter your API key
4. Alternatively, use a local server like Ollama or LM Studio (no API key needed)

All API keys are stored locally on your device and never sent anywhere except the respective provider's API.

### 2. Load a VRM Model

Utsuwa comes with a default avatar, but you can load your own:

1. Go to **Settings > Character**
2. Click **Load VRM** to select a local `.vrm` file
3. Or enter a URL to load a VRM model from the web

### 3. Configure Text-to-Speech (Optional)

To have your companion speak responses aloud:

1. Go to **Settings > Character**
2. Enable the TTS toggle, then select a provider (ElevenLabs or OpenAI TTS)
3. Enter your API key and configure voice settings

## Using the Chat

Type a message in the bottom chat bar and press Enter. Your companion's response will appear as a 3D speech bubble tracking the avatar's head.

If TTS is enabled, the avatar will speak the response with lip-synced animation.

## Voice Input

Click the microphone button in the chat bar to use speech-to-text. Three options are available:

- **Local Whisper server** — Self-hosted, OpenAI-compatible transcription (Speaches, faster-whisper-server, whisper.cpp) via the `/v1/audio/transcriptions` endpoint. Audio never leaves your machine. Configure it in **Settings > Character** under Voice Input (STT) with a base URL (default `http://localhost:8000/v1/`) and a model name.
- **Groq or OpenAI Whisper** — Higher-quality cloud transcription via Groq's or OpenAI's Whisper API. Requires the respective API key, added in the same Voice Input (STT) section.
- **Web Speech API** — Built into your browser (Chrome, Edge, Safari). No API key required. The default in the browser when nothing else is configured.

Selection is automatic by priority: a configured local server wins, then Groq, then Web Speech. On the desktop app the Web Speech API is unavailable, so configure either a local Whisper server or a Groq key for voice input.

See [Local STT Setup](/docs/guides/local-stt-setup) for running a local Whisper server.

## Data Management

All data is stored locally on your device.

- **Export** — Go to Settings > Data > Export Save to download a JSON backup
- **Import** — Go to Settings > Data > Import Save to restore from a backup
- **Merge or Replace** — Choose whether to add imported data to existing data or replace it entirely

## Themes

Utsuwa supports light and dark modes with automatic system preference detection. Go to **Settings > Display** to change your appearance mode.
