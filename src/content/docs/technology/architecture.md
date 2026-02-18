---
title: Architecture Overview
description: High-level architecture of Utsuwa's VRM viewer, chat system, and companion engine.
---

# Architecture Overview

Utsuwa is a client-side application that combines 3D avatar rendering, LLM chat, text-to-speech, and a relationship simulation engine. Everything runs locally on the user's device — in a browser or the desktop app — with no backend required.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Client (Browser or Desktop)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      SvelteKit App                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│  │
│  │  │   Chat UI   │  │  3D Scene   │  │   Settings Panel    ││  │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘│  │
│  │         │                │                                 │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐                         │  │
│  │  │  LLM Client │  │  Three.js   │                         │  │
│  │  │ xsAI/fetch  │  │  + Threlte  │                         │  │
│  │  └──────┬──────┘  └──────┬──────┘                         │  │
│  │         │                │                                 │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────────────────┐│  │
│  │  │  Companion  │  │  VRM Model  │  │   TTS Pipeline      ││  │
│  │  │   Engine    │  │  @pixiv/vrm │  │   + Lip-sync        ││  │
│  │  └──────┬──────┘  └─────────────┘  └──────────┬──────────┘│  │
│  │         │                                      │           │  │
│  │  ┌──────▼─────────────────────────────────────▼──────────┐│  │
│  │  │              Svelte 5 Runes Stores                     ││  │
│  │  │  (character.svelte.ts, vrm.svelte.ts, settings.svelte.ts)│  │
│  │  └──────────────────────────┬────────────────────────────┘│  │
│  │                             │                              │  │
│  │  ┌──────────────────────────▼────────────────────────────┐│  │
│  │  │              IndexedDB (Dexie.js)                      ││  │
│  │  │      Character state, facts, turns, events            ││  │
│  │  └───────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       External APIs           │
              │  LLM: OpenAI / Anthropic / etc│
              │  TTS: ElevenLabs / OpenAI TTS │
              │  STT: Web Speech / Groq       │
              └───────────────────────────────┘
```

## Core Components

### VRM Rendering

The 3D avatar system uses Three.js with Threlte (a Svelte wrapper) for integration.

**Key files:**
- `src/lib/components/vrm/Scene.svelte` — Main 3D scene with camera, lighting, and post-processing
- `src/lib/components/vrm/VrmModel.svelte` — VRM model loading, animation, and expression control
- `src/lib/stores/vrm.svelte.ts` — VRM state including head tracking for UI positioning

**Libraries:**
- `@pixiv/three-vrm` — VRM model loading and runtime
- `@pixiv/three-vrm-animation` — VRMA animation support
- `@threlte/core` — Svelte-Three.js integration
- `n8ao` and `postprocessing` — Visual effects

**How it works:**
1. User uploads a `.vrm` file or URL
2. VRM loader parses the model and creates a Three.js scene object
3. Threlte manages the render loop and integrates with Svelte's reactivity
4. Expressions and animations are applied via the VRM humanoid and expression APIs

### Chat System

Messages flow through two paths depending on the platform:
- **Web:** SvelteKit server route using the xsAI SDK (`src/routes/api/chat/+server.ts`)
- **Desktop (Tauri):** Direct fetch to provider APIs (`src/lib/services/chat/client-chat.ts`)

**Key files:**
- `src/lib/components/chat/BottomChatBar.svelte` — User input interface
- `src/lib/components/chat/SpeechBubble.svelte` — Message display
- `src/lib/ai/prompt-builder.ts` — System prompt construction
- `src/lib/ai/response-parser.ts` — Extract dialogue and state updates from LLM output
- `src/lib/engine/` — Core companion engine logic

**Flow:**
```
User Input
    │
    ▼
┌──────────────┐
│ Heuristics   │ ── Calculate baseline state changes
│ Engine       │    (energy decay, streak updates)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Memory       │ ── Retrieve relevant facts and recent turns
│ Retrieval    │    using semantic search (embeddings)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Prompt       │ ── Combine system prompt + character state
│ Builder      │    + memory context + instructions
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ LLM Provider │ ── Stream response from OpenAI/Anthropic/etc.
│(xsAI or fetch)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Response     │ ── Extract text + JSON state suggestions
│ Parser       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ State        │ ── Merge heuristic + LLM deltas
│ Merger       │    and persist to IndexedDB
└──────────────┘
```

### TTS Pipeline

Text-to-speech converts LLM responses to audio with lip-sync.

**Key files:**
- `src/lib/services/lipsync/analyzer.ts` — Lip-sync audio analysis
- `src/lib/services/tts/elevenlabs.ts` — ElevenLabs provider
- `src/lib/services/tts/openai-tts.ts` — OpenAI TTS provider
- `src/lib/services/tts/index.ts` — Provider factory and shared audio context

**Supported providers:**
- ElevenLabs (high quality, requires API key)
- OpenAI TTS (requires API key)

**Flow:**
1. LLM response text is sent to TTS provider
2. Audio is received as a buffer
3. Web Audio API plays the audio
4. Audio analyzer extracts volume/frequency data
5. VRM model maps audio data to mouth blend shapes in real-time

### Memory System

Three-tier memory architecture for context and recall.

**Key files:**
- `src/lib/engine/memory.ts` — Memory management
- `src/lib/types/memory.ts` — Memory type definitions
- `src/lib/db/index.ts` — Database schema

**Tiers:**
1. **Working Memory** — In-memory buffer of recent conversation turns
2. **Facts** — IndexedDB-stored facts with vector embeddings for semantic search
3. **Sessions** — Conversation summaries for long-term context

**Semantic search:**
Uses `@xenova/transformers` to run the `all-MiniLM-L6-v2` embedding model locally on the user's device. Facts are embedded as 384-dimensional vectors and can be retrieved by cosine similarity to the current conversation.

See [Companion System](/docs/technology/companion-system) and [Memory Graph](/docs/technology/memory-graph) for detailed memory documentation.

### State Management

Svelte 5 runes-based stores for reactive state.

**Key stores:**
- `src/lib/stores/character.svelte.ts` — Character/companion state
- `src/lib/stores/vrm.svelte.ts` — 3D model state, head tracking
- `src/lib/stores/settings.svelte.ts` — Provider configurations (LLM, TTS, STT)
- `src/lib/stores/persona.svelte.ts` — Persona card management
- `src/lib/stores/chat.svelte.ts` — Chat session state
- `src/lib/stores/tts.svelte.ts` — Text-to-speech state
- `src/lib/stores/stt.svelte.ts` — Speech-to-text state
- `src/lib/stores/display.svelte.ts` — Camera distance and display settings
- `src/lib/stores/overlay.svelte.ts` — Desktop overlay mode state

**Pattern:**
```typescript
// Svelte 5 runes pattern
let count = $state(0);
const doubled = $derived(count * 2);

$effect(() => {
  console.log('Count changed:', count);
});
```

### Storage Layer

All data persists client-side via IndexedDB using Dexie.js.

**Database tables:**
- `characterStates` — Character state and relationship data
- `facts` — Memory facts with embeddings
- `sessions` — Conversation session summaries
- `conversationTurns` — Conversation history
- `completedEvents` — Milestone events that have fired

**Key file:** `src/lib/db/index.ts`

**Benefits:**
- No server required
- Data stays on user's device
- Works offline after initial load
- Large storage capacity (typically 50MB+)

## Project Structure

```
src/
├── lib/
│   ├── ai/               # LLM prompt building and response parsing
│   ├── components/
│   │   ├── chat/          # Chat UI (BottomChatBar, SpeechBubble)
│   │   ├── docs/          # Documentation site components
│   │   ├── events/        # Event scene and choice UI
│   │   ├── icons/         # Icon components
│   │   ├── layout/        # App layout components
│   │   ├── memory/        # Memory graph visualization
│   │   ├── onboarding/    # First-run setup
│   │   ├── overlay/       # Desktop overlay UI
│   │   ├── settings/      # Settings page components
│   │   ├── ui/            # Shared UI primitives
│   │   └── vrm/           # 3D scene and model
│   ├── config/            # App and docs configuration
│   ├── data/              # Static data (event definitions)
│   ├── db/                # Database schema and export/import
│   ├── engine/            # Companion engine (heuristics, stages, state, events, memory)
│   ├── services/
│   │   ├── chat/          # Chat client
│   │   ├── lipsync/       # Audio analysis for lip-sync
│   │   ├── modules/       # Module system
│   │   ├── platform/      # Tauri/web platform abstraction
│   │   ├── providers/     # LLM provider registry and model fetching
│   │   ├── storage/       # IndexedDB storage layer
│   │   ├── stt/           # Speech-to-text providers
│   │   └── tts/           # Text-to-speech providers
│   ├── stores/            # Svelte 5 runes stores
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── routes/
│   ├── app/               # Main app and settings routes
│   ├── blog/              # Blog pages
│   ├── docs/              # Documentation site
│   └── overlay/           # Desktop overlay route
└── content/
    ├── blog/              # Blog post markdown content
    └── docs/              # Documentation site markdown
```

## Key Interactions

### Expression Updates

When the companion's mood changes:

1. Companion engine calculates new mood state
2. State is written to `character.svelte.ts` store
3. `VrmModel.svelte` component reacts to store change
4. Mood is mapped to VRM blend shapes (expressions)
5. VRM model's face updates in real-time

### Event Triggering

When relationship thresholds are crossed:

1. State merger detects threshold crossing
2. Event system checks for eligible events
3. Matching event is marked as triggered
4. UI displays event content (if any)
5. Event ID is added to `completedEvents`

## Desktop Application (Tauri)

The desktop app wraps the same SvelteKit application using Tauri v2.

### Platform Layer

A platform abstraction layer allows code to behave differently on web vs desktop:

**Key files:**
- `src/lib/services/platform/platform.ts` — `isTauri()` / `isWeb()` detection
- `src/lib/services/platform/window.ts` — Window management (position, drag, click-through)
- `src/lib/services/platform/hotkeys.ts` — Global shortcut registration

**Detection pattern:**
```typescript
import { isTauri } from '$lib/services/platform';

if (isTauri()) {
  // Desktop-only code
  await startDragging();
}
```

### Multi-Window Architecture

The desktop app uses two windows:

| Window | Purpose |
|--------|---------|
| `main` | Full application with all features |
| `overlay` | Transparent, always-on-top companion view |

**Switching logic:**
- Main → Overlay: Invoke `show_overlay` command, hide main window
- Overlay → Main: Show main window, hide overlay

### Overlay Rendering

For transparent backgrounds in overlay mode:
1. Tauri window configured with `transparent: true`, `decorations: false`
2. HTML/body backgrounds set to transparent via CSS
3. Three.js renderer uses `alpha: true` and `setClearColor(0x000000, 0)`
4. Scene background set to `null` (no skybox)

**Key file:** `src/routes/overlay/+page.svelte`

## Technologies

| Category | Technology |
|----------|------------|
| Framework | SvelteKit 2 |
| Language | TypeScript |
| 3D Rendering | Three.js + Threlte |
| VRM Support | @pixiv/three-vrm |
| LLM Integration | xsAI SDK (web) / direct fetch (desktop) |
| Desktop | Tauri v2 |
| Styling | Tailwind CSS 4 |
| Database | IndexedDB (Dexie.js) |
| Embeddings | Transformers.js |
| Build Tool | Vite |
