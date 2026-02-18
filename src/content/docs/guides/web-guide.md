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

Click the microphone button in the chat bar to use speech-to-text. Two providers are available:

- **Web Speech API** — Built into your browser (Chrome, Edge, Safari). No API key required. This is the default in the browser.
- **Groq Whisper** — Higher quality transcription via Groq's Whisper API. Requires a Groq API key, which you can add in **Settings > Character** under the Voice Input (STT) section. When a Groq key is configured, it automatically becomes the active STT provider.

On the desktop app, Web Speech API is not available — you'll need to configure a Groq API key for voice input.

## Data Management

All data is stored locally on your device.

- **Export** — Go to Settings > Data > Export Save to download a JSON backup
- **Import** — Go to Settings > Data > Import Save to restore from a backup
- **Merge or Replace** — Choose whether to add imported data to existing data or replace it entirely

## Themes

Utsuwa supports light and dark modes with automatic system preference detection. Go to **Settings > Display** to change your appearance mode.
