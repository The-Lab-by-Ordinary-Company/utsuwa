# Utsuwa (器)

<p align="center">
  <img src="static/brand-assets/read-me-banner.png" alt="Utsuwa Banner" />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Utsuwa is an open-source alternative to Grok Companion.** This is a platform where you can have a virtual AI waifu that learns and grows with you, bundled with optional mechanics inspired by Japanese [dating sim](https://en.wikipedia.org/wiki/Dating_sim) games. Utsuwa is privacy-focused - your data lives entirely in your browser.

"Utsuwa" means "vessel" in Japanese - a container for AI to inhabit visually.

## Features

- **VRM Model Viewer**: Load and display VRM 3D avatar models with orbit controls
- **Model-Centric UI**: Full-screen 3D model with unobtrusive overlay controls
- **3D Speech Bubbles**: Chat responses appear as bubbles that track the model's head in 3D space
- **Chat Interface**: Bottom-centered input bar with streaming responses
- **Voice Input**: Speech-to-text using Web Speech API with real-time audio visualization
- **LLM Integration**: Support for 7 LLM providers including OpenAI, Anthropic, Google, and local options
- **Text-to-Speech**: Support for ElevenLabs and OpenAI TTS
- **Lip-sync**: Audio-driven mouth animation synced to TTS playback
- **Animations**: VRMA-based idle and talking animations with automatic blinking
- **Character Customization**: Customize your companion's name, personality, and system prompt
- **Companion System**: Multi-axis relationship tracking with mood, events, and semantic memory
- **Semantic Memory**: Local AI-powered memory search using Transformers.js - finds memories by meaning, not just keywords
- **Memory Graph**: Interactive visualization showing how memories connect semantically
- **Data Export/Import**: Download your data as a save file, restore anytime
- **Theming**: Light and dark mode support with system preference detection

### Local-First Storage

All your data is stored locally in your browser using IndexedDB:
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
- **Semantic Memory**: Facts are indexed with vector embeddings for meaning-based retrieval - "outdoor activities" finds memories about hiking. Runs entirely in-browser using Transformers.js, no API calls
- **Natural Progression**: Hybrid system combining app heuristics + LLM suggestions for believable relationship growth
- **Time-Aware**: Your companion notices when you've been away and reacts accordingly

See the [Companion System Architecture](https://utsuwa.ai/docs/technology/companion-system) for full details.

## Supported Providers

### LLM Providers (7)

| Category | Providers |
|----------|-----------|
| **Cloud** | OpenAI, Anthropic, Google Gemini, DeepSeek, xAI (Grok) |
| **Local** | Ollama, LM Studio |

### TTS Providers (2)

| Category | Providers |
|----------|-----------|
| **Cloud** | ElevenLabs, OpenAI TTS |

### STT (Speech-to-Text)

| Provider | Description |
|----------|-------------|
| **Web Speech API** | Browser-native speech recognition. No API key required. Works in Chrome, Edge, and Safari. |

Voice input is accessed via the microphone button in the chat bar. The audio visualizer provides real-time feedback while speaking.

## Getting Started

> [!NOTE]
> Utsuwa is in its very early development stages. If you're using the app, **save your data often**. Early versions may not have backwards-compatible save states and could require manual reformatting.

### Try it Online

No installation required! Use Utsuwa directly in your browser at **[utsuwa.ai](https://utsuwa.ai)**

### Self-Hosting

If you prefer to run Utsuwa locally or host your own instance:

#### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm
- A modern browser (Chrome, Firefox, Safari, Edge)

#### Installation

```bash
# Clone the repository
git clone https://github.com/dyascj/utsuwa.git
cd utsuwa

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

#### Configuration

1. Click the **Settings** (gear icon) in the sidebar
2. Navigate to **LLM Providers** to configure your chat provider:
   - Select a provider and enter your API key
   - Or use a local server like Ollama or LM Studio
3. Navigate to **TTS Providers** to configure text-to-speech (optional):
   - Select a TTS provider
   - Enter your API key
   - Configure voice settings

All API keys are stored locally in your browser and are never sent to any server except the respective API providers.

#### Loading a VRM Model

1. Go to **Settings > Avatar**
2. Click **"Load VRM"** to select a local `.vrm` file
3. Or enter a URL to load a VRM model from the web

#### Data Management

Your companion data is stored locally in your browser. To back up or transfer your data:

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
│   │   ├── services/       # LLM, TTS, storage services
│   │   ├── stores/         # Svelte 5 stores (state management)
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── content/
│   │   └── docs/           # Documentation site content
│   └── routes/
│       ├── (app)/          # Main application routes
│       ├── api/            # API routes
│       └── docs/           # Documentation site routes
├── static/
│   └── models/             # Place default VRM models here
└── package.json
```

## Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm preview   # Preview production build
pnpm lint      # Type-check and lint the project
```

## Roadmap

### Completed

- [x] VRM model loading and display with orbit controls
- [x] 3D speech bubbles tracking model head position
- [x] Multi-provider LLM support (7 providers)
- [x] Multi-provider TTS support (2 providers)
- [x] Audio-driven lip-sync
- [x] VRMA-based animations (idle, talking, blinking)
- [x] Companion system with multi-axis relationships
- [x] 8-stage relationship progression (Stranger → Soulmate)
- [x] Visual novel event system with choices
- [x] Semantic memory system with local embeddings (Transformers.js)
- [x] Time-based mood and relationship decay/recovery
- [x] Local-first IndexedDB storage with export/import
- [x] Theme system with light/dark modes
- [x] Voice input via Web Speech API

### In Progress / Planned

- [ ] **Companion Gender System** - Gender selection with male/female specific animations and behaviors
- [ ] **Multi-provider STT** - Support for additional speech-to-text providers beyond Web Speech API
- [ ] **Enhanced User Controls** - More granular control over companion behavior and responses
- [ ] **Custom Lighting Controls** - Adjust 3D scene lighting, environment, and atmosphere
- [ ] **LLM-Controlled Expressions** - Dynamic facial animations and emotions driven by LLM responses
- [ ] **Live2D Support** - Alternative to VRM for 2D animated avatars
- [ ] **Expanded Default Avatars** - More built-in 3D avatar options to choose from
- [ ] **Photo Mode** - Full-featured photo mode with character posing, lighting adjustments, and high-quality saves

### Future

- [ ] **Desktop Application** - Native app for Windows, macOS, and Linux with enhanced features

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
