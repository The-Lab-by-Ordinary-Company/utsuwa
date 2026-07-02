> [!WARNING]
> Utsuwa and The Lab by Ordinary Company have not minted, launched, endorsed, or authorized any cryptocurrency, token, coin, NFT, or blockchain project. We never will. If you see crypto associated with Utsuwa or The Lab, it is a scam. This repository is the only authentic Utsuwa project repository.

<p align="center">
  <img alt="Utsuwa, an open-source AI companion you can see and talk to" src="static/brand-assets/banner-light.avif" width="100%">
</p>

<p align="center">
  <a href="https://utsuwa.ai">Website</a>
  ·
  <a href="https://app.utsuwa.ai">Try it in your browser</a>
  ·
  <a href="https://docs.utsuwa.ai">Docs</a>
  ·
  <a href="https://utsuwa.ai/blog">Blog</a>
  ·
  <a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases">Releases</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases"><img src="https://img.shields.io/github/v/release/The-Lab-by-Ordinary-Company/utsuwa?label=Release&color=00b2ff" alt="Latest release"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22+-green.svg" alt="Node.js 22+"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome"></a>
</p>

<p align="center">
  <a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases/latest">
    <img alt="Download for macOS" src="static/brand-assets/download-buttons/macos-light.avif" width="31%">
  </a>
  <a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases/latest">
    <img alt="Download for Windows" src="static/brand-assets/download-buttons/windows-light.avif" width="31%">
  </a>
  <a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases/latest">
    <img alt="Download for Linux" src="static/brand-assets/download-buttons/linux-light.avif" width="31%">
  </a>
</p>

<p align="center">
  <sub>Beta builds are unsigned, so your OS will warn on first launch (<a href="#download-the-desktop-app">install notes</a>). Prefer zero install? <a href="https://app.utsuwa.ai">Run it in your browser</a>.</sub>
</p>

---

**Utsuwa is an open-source AI companion with 3D VRM avatars.** A platform where you can have a virtual companion that learns and grows with you, bundled with optional mechanics inspired by Japanese [dating sim](https://en.wikipedia.org/wiki/Dating_sim) games. Utsuwa is privacy-focused: your data is stored locally and never leaves your device.

"Utsuwa" means "vessel" in Japanese. A container for AI to inhabit visually.

<p align="center">
  <img alt="The Utsuwa app: a 3D VRM companion with chat, mood, and voice" src="static/marketing/companion-light.webp" width="100%">
</p>

## Features

- **VRM Model Viewer**: Load and display VRM 3D avatar models with orbit controls
- **Model-Centric UI**: Full-screen 3D model with unobtrusive overlay controls
- **3D Speech Bubbles**: Chat responses appear as bubbles that track the model's head in 3D space
- **Chat Interface**: Bottom-centered input bar with streaming responses
- **Voice Input**: Speech-to-text via Groq (Whisper) or Web Speech API with real-time audio visualization
- **Show Her Photos**: Show your companion an image via the camera button or drag-and-drop. Vision-capable models (GPT-4o, Claude, Gemini, or local ones like LLaVA) actually see it and can remember the moment, and kept photos live on a scrapbook-style board. Images stay on your device and only ever reach vision-capable models
- **LLM Integration**: Support for 7 LLM providers including OpenAI, Anthropic, Google, xAI, DeepSeek, Ollama, and LM Studio
- **Local Model Discovery**: Ollama and LM Studio discover installed local models directly from your device
- **Text-to-Speech**: Support for ElevenLabs and OpenAI TTS, plus local voices via any OpenAI-compatible server (Kokoro-FastAPI, openedai-speech)
- **Lip-sync**: Audio-driven mouth animation synced to TTS playback
- **Animations**: VRMA-based idle and talking animations with automatic blinking
- **Character Customization**: Customize your companion's name, personality, and system prompt
- **Companion System**: Multi-axis relationship tracking with mood, events, and semantic memory
- **Semantic Memory**: Local AI-powered memory search using Transformers.js - finds memories by meaning, not just keywords
- **Memory Graph**: Interactive visualization showing how memories connect semantically
- **Data Export/Import**: Download your data as a save file, restore anytime
- **Theming**: Light and dark mode support with system preference detection
- **Desktop App** *(beta)*: Native desktop app for macOS, Windows, and Linux with transparent overlay mode, so your companion floats on your desktop

### Local-First Storage

All your data is stored locally on your device using IndexedDB:
- No database setup required
- Works offline after initial load
- Export/import save files to back up or transfer your data
- Settings > Data to manage your save files

### Companion System

Build a meaningful relationship with your AI companion through a dating sim-inspired progression system:

- **Multi-axis Relationships**: Track affection, trust, intimacy, comfort, and respect separately
- **8 Relationship Stages**: Progress from Stranger → Acquaintance → Friend → Close Friend → Romantic Interest → Dating → Committed → Soulmate
- **Dynamic Mood**: Real-time emotions with causality tracking (she remembers *why* she feels a certain way)
- **Visual Novel Events**: Milestone moments, romantic scenes, and choices that matter - with custom dialogue and branching responses
- **Semantic Memory**: Facts are indexed with vector embeddings for meaning-based retrieval - "outdoor activities" finds memories about hiking. Runs locally using Transformers.js, no API calls
- **Natural Progression**: Hybrid system combining app heuristics + LLM suggestions for believable relationship growth
- **Time-Aware**: Your companion notices when you've been away and reacts accordingly

See the [Companion System Architecture](https://docs.utsuwa.ai/technology/companion-system) for full details.

### Desktop Application (Beta)

A native desktop app built with Tauri that includes all web features plus:

- **Overlay Mode**: Your companion floats on your desktop with a transparent background
- **Always-on-Top**: The overlay stays visible over all other windows
- **Draggable Positioning**: Click and drag the character to reposition anywhere on screen
- **Floating Chat**: Expandable chat input that appears when you click the chat icon
- **Window Switching**: Seamlessly switch between the full app and overlay mode
- **Global Hotkeys**: Push-to-talk, toggle overlay, and focus chat with keyboard shortcuts

The desktop app uses the same codebase as the web version, and your save files are compatible between both.

## Supported Providers

### LLM Providers (7)

| Category | Providers |
|----------|-----------|
| **Cloud** | OpenAI, Anthropic, Google Gemini, DeepSeek, xAI (Grok) |
| **Local** | Ollama, LM Studio |

### TTS Providers (3)

| Category | Providers |
|----------|-----------|
| **Cloud** | ElevenLabs, OpenAI TTS |
| **Local** | Local TTS (Kokoro-FastAPI, openedai-speech, any OpenAI-compatible server) |

### STT Providers (2)

| Category | Providers |
|----------|-----------|
| **Cloud** | Groq (Whisper) |
| **Browser** | Web Speech API (no API key required) |

Voice input is accessed via the microphone button in the chat bar. Groq STT uses Whisper for accurate transcription on any platform (including desktop). Web Speech API works without an API key in Chrome, Edge, and Safari. If a Groq API key is configured, it takes priority automatically.

## Getting Started

> [!NOTE]
> Utsuwa is in its very early development stages. If you're using the app, **save your data often**. Early versions may not have backwards-compatible save states and could require manual reformatting.

### Try it Online

Use Utsuwa directly at **[app.utsuwa.ai](https://app.utsuwa.ai)**. No installation required.

### Download the Desktop App

Native desktop builds (with transparent overlay mode) are available for all three platforms on the [GitHub Releases](https://github.com/The-Lab-by-Ordinary-Company/utsuwa/releases) page:

| Platform | Download |
|----------|----------|
| **macOS** | `.dmg` (universal: Apple Silicon + Intel) |
| **Windows** | `.exe` installer |
| **Linux** | `.AppImage`, `.deb`, or `.rpm` |

> [!NOTE]
> The desktop app is in beta and currently **unsigned**, so your OS will warn you the first time you open it.
> - **macOS:** right-click the app → **Open** → **Open** (or run `xattr -dr com.apple.quarantine /Applications/Utsuwa.app`).
> - **Windows:** on the SmartScreen prompt, click **More info** → **Run anyway**.

### Self-Hosting

If you prefer to run Utsuwa locally or host your own instance:

#### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm
- A modern browser (Chrome, Firefox, Safari, Edge) for the web version

#### Installation

```bash
# Clone the repository
git clone https://github.com/The-Lab-by-Ordinary-Company/utsuwa.git
cd utsuwa

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

#### Running the Desktop App (Beta)

To run the desktop app from source, you'll need the [Rust toolchain](https://rustup.rs/) in addition to the web prerequisites:

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Run the desktop app
pnpm tauri dev
```

#### Configuration

1. Click the **Settings** (gear icon) in the sidebar
2. Navigate to **Settings > Character** to configure your chat provider:
   - Enable Chat (LLM)
   - Select a cloud provider and enter your API key
   - Or select a local server like Ollama or LM Studio and choose an installed model from the discovered model dropdown
3. Configure text-to-speech in the same settings area (optional):
   - Select a TTS provider
   - Enter your API key
   - Configure voice settings

All API keys are stored locally on your device and are never sent to any server except the respective API providers.

#### Loading a VRM Model

1. Go to **Settings > Character** and find the **Avatar** gallery
2. Pick one of the bundled models, or click **Add Custom** to upload your own `.vrm` file

#### Data Management

Your companion data is stored locally on your device. To back up or transfer your data:

1. Go to **Settings > Data**
2. Click **Export Save** to download a JSON file with all your data
3. To restore, click **Import Save** and select your save file
4. Choose **Replace** (wipe and restore) or **Merge** (add to existing)

## Project Structure

```
utsuwa/
├── src/
│   ├── lib/
│   │   ├── ai/             # LLM response parsing and prompt building
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Svelte components
│   │   ├── config/         # App and docs configuration
│   │   ├── data/           # Event definitions and static data
│   │   ├── db/             # IndexedDB database (Dexie)
│   │   ├── engine/         # Companion engine (state, memory, events)
│   │   ├── services/       # LLM, TTS, STT, storage services
│   │   ├── stores/         # Svelte 5 stores (state management)
│   │   ├── styles/         # Shared CSS (prose, etc.)
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── content/
│   │   ├── blog/           # Blog post markdown content
│   │   └── docs/           # Documentation site markdown content
│   └── routes/
│       ├── app/            # Main application routes
│       ├── api/            # API routes
│       ├── blog/           # Blog routes
│       ├── docs/           # Documentation site routes
│       └── overlay/        # Desktop overlay route
├── src-tauri/               # Tauri desktop app (Rust)
├── static/
│   └── models/             # Place default VRM models here
└── package.json
```

## Scripts

```bash
pnpm dev          # Start web development server
pnpm build        # Build web app for production
pnpm preview      # Preview production build
pnpm lint         # Type-check the project (svelte-check)
pnpm check        # Same as lint (alias)
pnpm check:watch  # Type-check in watch mode
pnpm tauri dev    # Run the desktop app in development mode
pnpm tauri build  # Build desktop app installer
```

## Roadmap

### Completed

- [x] VRM model loading and display with orbit controls
- [x] 3D speech bubbles tracking model head position
- [x] Multi-provider LLM support (7 providers)
- [x] Multi-provider TTS support (3 providers)
- [x] Audio-driven lip-sync
- [x] VRMA-based animations (idle, talking, blinking)
- [x] Companion system with multi-axis relationships
- [x] 8-stage relationship progression (Stranger → Soulmate)
- [x] Visual novel event system with choices
- [x] Semantic memory system with local embeddings (Transformers.js)
- [x] Time-based mood and relationship decay/recovery
- [x] Local-first IndexedDB storage with export/import
- [x] Theme system with light/dark modes
- [x] Voice input via Groq STT (Whisper) and Web Speech API
- [x] Desktop application with transparent overlay mode (macOS, Windows, and Linux)
- [x] Cross-platform desktop builds via CI (macOS, Windows, Linux)
- [x] In-app auto-updates for the desktop app

### In Progress / Planned

- [ ] **File, Image, and Video Uploads** - Add support for attaching files, images, and videos for multimodal LLM workflows and providers that can use richer context or web-aware tools
- [ ] **OpenAI-Compatible Models** - Add a configurable option for OpenAI-compatible model endpoints beyond the currently listed providers
- [ ] **Multi-provider STT** - Support for additional speech-to-text providers beyond Groq and Web Speech API
- [ ] **Live2D Support** - Alternative to VRM for 2D animated avatars

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## Security

For information about security considerations and how to report vulnerabilities, please see our [Security Policy](SECURITY.md).

## Acknowledgments

Utsuwa is built on the shoulders of these excellent projects:

### Inspiration

- **[Airi](https://github.com/moeru-ai/airi)** - The original inspiration for this project. A beautiful AI companion with VRM avatar support.
- **[Amica](https://github.com/semperai/amica)** - Open-source AI companion with VRM support and emotional expressions.
- **[Riko Project](https://github.com/rayenfeng/riko_project)** by [JustRyan](https://www.youtube.com/@JustRayen) - AI waifu project showcasing VRM avatar interactions.

### Core Technologies

- **[@pixiv/three-vrm](https://github.com/pixiv/three-vrm)** - VRM model loading and rendering for Three.js
- **[xsAI](https://github.com/moeru-ai/xsai)** - Unified LLM and TTS provider integration
- **[Three.js](https://github.com/mrdoob/three.js)** - 3D graphics engine
- **[Threlte](https://github.com/threlte/threlte)** - Svelte components for Three.js
- **[SvelteKit](https://github.com/sveltejs/kit)** - Web application framework
- **[Tauri](https://github.com/tauri-apps/tauri)** - Desktop application framework
- **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** - Utility-first CSS framework
- **[Transformers.js](https://github.com/xenova/transformers.js)** - In-browser ML for semantic memory embeddings

### UI & Data

- **[bits-ui](https://github.com/huntabyte/bits-ui)** - Headless UI components for Svelte
- **[Dexie.js](https://github.com/dexie/Dexie.js)** - IndexedDB wrapper for local storage
- **[force-graph](https://github.com/vasturiano/force-graph)** - Force-directed graph visualization for memory graph
- **[simple-icons](https://github.com/simple-icons/simple-icons)** - SVG icons for provider logos

### 3D Effects

- **[n8ao](https://github.com/N8python/n8ao)** - Ambient occlusion for Three.js
- **[postprocessing](https://github.com/pmndrs/postprocessing)** - Post-processing effects

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Star History

<a href="https://www.star-history.com/?repos=The-Lab-by-Ordinary-Company%2Futsuwa&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=The-Lab-by-Ordinary-Company/utsuwa&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=The-Lab-by-Ordinary-Company/utsuwa&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=The-Lab-by-Ordinary-Company/utsuwa&type=date&legend=top-left" />
 </picture>
</a>
