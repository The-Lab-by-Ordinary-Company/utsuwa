---
title: Starting the Project
description: Why I started building Utsuwa, an open-source VRM avatar companion as an alternative to closed platforms.
date: '2026-01-24'
image: /blog/blog-thumbnail.png
tag: DevLog
---

# Starting the Project

We've opened Pandora's box. AI is out there forever whether we like it or not. That's not inherently a bad thing, but like every powerful technology before it, the first wave is dominated by closed platforms extracting as much from users as possible. Your conversations, your data, your characters, locked behind subscriptions and terms of service you never read.

It's taken projects like this to start pushing things in a different direction. To give control back to the user. To prove you can have an AI companion that respects your privacy, runs on your terms, and doesn't phone home to some corporate server every time you talk to it.

That's the idea behind Utsuwa. The name means "vessel" in Japanese. A container for AI to inhabit visually. You bring the model, the voice, and the LLM provider. The app is just the shell. Everything runs locally, everything is yours.

## What I'm building

The core loop is straightforward: you load a VRM model, connect an LLM provider, optionally add TTS, and you get a companion that talks back with lip-synced audio and facial expressions.

Under the hood there's more going on. A memory system that tracks conversation context, a relationship model that evolves over time, and an event engine that drives dynamic interactions. But the surface-level experience should feel simple.

## "But you still need an API key?"

Yeah, for now. The reality is that running a capable language model locally still requires hardware most people don't have. So the app supports cloud providers like OpenAI, Anthropic, and Google out of the box because that's what makes it actually usable today.

The key difference is that Utsuwa never sits in the middle. Your API key, your direct connection to the provider. There's no Utsuwa account, no relay server, no analytics. The app doesn't even have a backend. It's a static client that talks directly to whatever provider you point it at. We're not the ones collecting your data. We literally can't.

The long-term goal is local-first. Ollama support is already in, and once the desktop app is solid, running everything on-device (model, TTS, the whole stack) is the endgame. Cloud providers are a bridge, not the destination.

## Technical choices

SvelteKit was the obvious pick for the frontend. Svelte 5's runes make reactive state management clean, and SvelteKit gives us both the web app and the docs site from one codebase. Three.js handles the 3D rendering with VRM support through `@pixiv/three-vrm`.

For the LLM layer, I'm using Vercel's AI SDK. It abstracts away provider differences so swapping between a cloud API and a local Ollama instance is just a config change. The architecture is intentionally provider-agnostic. The companion's personality, memory, and conversation context all get assembled into a system prompt at runtime, and the app doesn't care what's on the other end.

Storage is all client-side. IndexedDB through Dexie.js. No accounts, no servers storing your data. Everything stays on your device.

## What's next

The immediate focus is getting the core web experience solid: chat, voice, expressions, and memory all working reliably. After that, I'm looking at a desktop app via Tauri for features that need deeper OS integration, things like transparent overlays and local model support.

More updates to come as things take shape.
