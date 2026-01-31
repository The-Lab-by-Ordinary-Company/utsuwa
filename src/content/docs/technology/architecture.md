---
title: Architecture Overview
description: High-level architecture of Utsuwa's VRM viewer, chat system, and companion engine.
---

# Architecture Overview

Utsuwa is a client-side web application that combines 3D avatar rendering, LLM chat, text-to-speech, and a relationship simulation engine. Everything runs in the browser with no backend required.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      SvelteKit App                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│  │
│  │  │   Chat UI   │  │  3D Scene   │  │   Settings Panel    ││  │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘│  │
│  │         │                │                                 │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐                         │  │
│  │  │  xsAI SDK   │  │  Three.js   │                         │  │
│  │  │ (LLM calls) │  │  + Threlte  │                         │  │
│  │  └──────┬──────┘  └──────┬──────┘                         │  │
│  │         │                │                                 │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────────────────┐│  │
│  │  │  Companion  │  │  VRM Model  │  │   TTS Pipeline      ││  │
│  │  │   Engine    │  │  @pixiv/vrm │  │   + Lip-sync        ││  │
│  │  └──────┬──────┘  └─────────────┘  └──────────┬──────────┘│  │
│  │         │                                      │           │  │
│  │  ┌──────▼─────────────────────────────────────▼──────────┐│  │
│  │  │              Svelte 5 Runes Stores                     ││  │
│  │  │   (character.svelte.ts, vrm.svelte.ts, theme.svelte.ts)││  │
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
              │  OpenAI / Anthropic / etc.    │
              │  ElevenLabs / Web Speech API  │
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

Messages flow through the xsAI SDK to reach LLM providers.

**Key files:**
- `src/lib/components/chat/BottomChatBar.svelte` — User input interface
- `src/lib/components/chat/SpeechBubble.svelte` — Message display
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
│ (xsAI SDK)   │
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
- Provider implementations in `src/lib/services/tts/`

**Supported providers:**
- ElevenLabs (high quality, requires API key)
- OpenAI TTS (requires API key)

**Flow:**
1. LLM response text is sent to TTS provider
2. Audio is received as a stream or buffer
3. Web Audio API plays the audio
4. Audio analyzer extracts volume/frequency data
5. Expression controller maps audio to mouth shapes
6. Mouth blend shapes are applied to VRM model in real-time

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
Uses `@xenova/transformers` to run embedding models locally in the browser. Facts are embedded and can be retrieved by semantic similarity to the current conversation.

See [Companion System](/docs/technology/companion-system) for detailed memory documentation.

### State Management

Svelte 5 runes-based stores for reactive state.

**Key stores:**
- `src/lib/stores/character.svelte.ts` — Character/companion state
- `src/lib/stores/vrm.svelte.ts` — 3D model state, head tracking
- `src/lib/stores/theme.svelte.ts` — UI theme (light/dark)
- `src/lib/stores/settings.svelte.ts` — Provider configurations

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
- `characters` — Character state and relationship data
- `facts` — Memory facts with embeddings
- `turns` — Conversation history
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
│   ├── components/
│   │   ├── chat/          # Chat UI components
│   │   ├── docs/          # Documentation components
│   │   ├── ui/            # Shared UI primitives
│   │   └── vrm/           # 3D scene and model
│   ├── config/            # App configuration
│   ├── data/              # Static data (events, etc.)
│   ├── db/                # Database schema
│   ├── engine/            # Companion engine core
│   ├── services/          # Provider integrations
│   ├── stores/            # Svelte stores
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── routes/
│   ├── (app)/             # Main app routes
│   └── docs/              # Documentation site
└── content/
    └── docs/              # Markdown documentation
```

## Key Interactions

### Expression Updates

When the companion's mood changes:

1. Companion engine calculates new mood state
2. State is written to `character.svelte.ts` store
3. VRM component reacts to store change
4. Expression controller maps mood to VRM blend shapes
5. VRM model's face updates in real-time

### Event Triggering

When relationship thresholds are crossed:

1. State merger detects threshold crossing
2. Event system checks for eligible events
3. Matching event is marked as triggered
4. UI displays event content (if any)
5. Event ID is added to `completedEvents`

## Technologies

| Category | Technology |
|----------|------------|
| Framework | SvelteKit 2 |
| Language | TypeScript |
| 3D Rendering | Three.js + Threlte |
| VRM Support | @pixiv/three-vrm |
| LLM Integration | xsAI SDK |
| Styling | Tailwind CSS 4 |
| Database | IndexedDB (Dexie.js) |
| Embeddings | Transformers.js |
| Build Tool | Vite |
