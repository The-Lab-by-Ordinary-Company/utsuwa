---
title: Local LLM Setup
description: How to set up and connect local LLMs to Utsuwa using Ollama or LM Studio.
---

# Local LLM Setup

Running a local LLM means your conversations never leave your machine. No API keys, no usage costs, and full offline support.

## Ollama

[Ollama](https://ollama.ai) is a lightweight tool for running open-source LLMs locally. Available on macOS, Linux, and Windows.

### Installation

**macOS**

```bash
brew install ollama
```

**Linux**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows**

Download the installer from [ollama.ai](https://ollama.ai) and run it.

### Pulling a Model

Download a model before you can use it:

```bash
ollama pull llama3.2
```

Other options worth trying: `mistral`, `phi3`, `codellama`.

### Starting the Server

```bash
ollama serve
```

This starts the Ollama API on `http://localhost:11434`.

### Connecting to Utsuwa

1. Open **Settings** (gear icon)
2. Navigate to **LLM Providers**
3. Click **Add Ollama**
4. Click **Refresh Models** to see your downloaded models
5. Select a model and start chatting

## LM Studio

[LM Studio](https://lmstudio.ai) provides a GUI for downloading and running local models. Good option if you prefer not to use the terminal.

### Installation

Download from [lmstudio.ai](https://lmstudio.ai) and install it.

### Downloading Models

Open LM Studio and browse the built-in model catalog. Search for a model, click download, and wait for it to finish.

### Starting the Server

1. Go to the **Server** tab in LM Studio
2. Click **Start Server**

This starts an OpenAI-compatible API on `http://localhost:1234`.

### Connecting to Utsuwa

1. Open **Settings** (gear icon)
2. Navigate to **LLM Providers**
3. Click **Add LM Studio**
4. Click **Refresh Models** to see loaded models
5. Select a model and start chatting

## Recommended Models

| Model | Size | Best For | RAM Required |
|-------|------|----------|--------------|
| Llama 3.2 (3B) | ~2GB | General chat, fast responses | 8GB |
| Llama 3.1 (8B) | ~4.7GB | Better quality responses | 16GB |
| Mistral (7B) | ~4.1GB | Good balance of speed and quality | 16GB |
| Phi-3 (3.8B) | ~2.3GB | Lightweight, efficient | 8GB |

Start with **Llama 3.2 (3B)** if you're unsure. It runs well on most hardware and gives solid results for conversational use.

## Custom Base URL

If you're running the LLM server on a different machine or non-default port, enter the full URL in the provider settings. For example:

- Remote machine: `http://192.168.1.50:11434`
- Custom port: `http://localhost:8080`

## Troubleshooting

### "Failed to fetch models"

The LLM server isn't running. Start it:

- Ollama: `ollama serve`
- LM Studio: Go to the Server tab and click Start Server

### "Connection refused"

The port doesn't match. Default ports:

| Provider | Port |
|----------|------|
| Ollama | 11434 |
| LM Studio | 1234 |

Make sure the URL in Utsuwa matches the port your server is using.

### Slow responses

- Try a smaller model (3B parameters instead of 7B+)
- Check that GPU acceleration is enabled in your LLM tool's settings
- Close other memory-heavy applications

### CORS errors in browser

If you're running Utsuwa in a browser and getting CORS errors with Ollama, set the origins environment variable before starting the server:

```bash
OLLAMA_ORIGINS=* ollama serve
```

This isn't needed when using the desktop app.
