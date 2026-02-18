---
title: Starting the Project
description: Why I started building Utsuwa, an open-source VRM avatar companion as an alternative to closed platforms.
date: '2026-01-24'
image: /blog/project-start-gif.gif
tag: DevLog
---

# Starting the Project

We've opened Pandora's box. AI is out there forever whether we like it or not. That's not inherently a bad thing, but like every powerful technology before it, the first wave is dominated by closed platforms extracting as much from users as possible. Your conversations, your data, your characters, locked behind subscriptions and terms of service you never read.

It's taken projects like this to start pushing things in a different direction. To give control back to the user. To prove you can have an AI companion that respects your privacy, runs on your terms, and doesn't phone home to some corporate server every time you talk to it.

That's the idea behind Utsuwa. The name means "vessel" in Japanese. A container for AI to inhabit visually. You bring the model, the voice, and the LLM provider. The app is just the shell. Everything runs locally, everything is yours.

## The inspiration (and the problem)

Two products really got me thinking about this space.

![Grok's Ani companion](/blog/grok-ani.jpg)

The first is **Ani**, xAI's companion for Grok. When it launched in mid-2025 it went absolutely viral. Millions of impressions in the first 48 hours. The 3D avatar, the voice, the affection system that evolves as you interact with it. It proved there's a massive appetite for this kind of experience. People genuinely want AI companions that feel alive.

The catch? It's locked behind a $30/month SuperGrok subscription. Your conversations live on xAI's servers. The characters, the avatars, the personality system, all of it is proprietary. You're renting the experience. If xAI decides to change Ani's personality, remove a feature, or shut it down tomorrow, you have zero say in it. They've already had to disable features due to controversy around content moderation. When you don't own the platform, you're always at the mercy of whoever does.

![Razer's Project Ava](/blog/razer-project-ava.jpg)

The second is **Project Ava** from Razer, unveiled at CES 2026. A holographic AI companion that sits on your desk in a physical cylinder. Anime avatars, voice interaction, screen awareness. The hardware concept is genuinely cool. A 5.5" 3D hologram with dual microphones and a camera that can see your screen.

But then you look at the details. It runs on Grok's engine, so you're right back in xAI's ecosystem. It's a proprietary hardware device with proprietary software. Expected to cost somewhere in Razer's premium peripheral range (we're probably talking $200+), and it hasn't even shipped yet. You're buying into a closed system where the hardware vendor and the AI provider both control your experience. If either company pivots, you're left with an expensive paperweight.

Both of these products validated the idea that people want AI companions. But they also showed exactly what happens when that experience is built on closed platforms. The user is always the product, never the owner.

## What I'm building

The core loop is straightforward: you load a VRM model, connect an LLM provider, optionally add TTS, and you get a companion that talks back with lip-synced audio and facial expressions.

Under the hood there's more going on. A memory system that tracks conversation context, a relationship model that evolves over time, and an event engine that drives dynamic interactions. But the surface-level experience should feel simple.

The difference from Ani or Project Ava is that everything here is open source and runs on your machine. You pick the avatar. You pick the AI. You own the conversation history. If you don't like something, you can change it. If the project disappeared tomorrow, you'd still have everything.

## Technical choices

SvelteKit was the obvious pick for the frontend. Svelte 5's runes make reactive state management clean, and SvelteKit gives us both the web app and the docs site from one codebase. Three.js handles the 3D rendering with VRM support through `@pixiv/three-vrm`.

For the LLM layer, I'm using Vercel's AI SDK. It abstracts away provider differences so swapping between a cloud API and a local Ollama instance is just a config change. The architecture is intentionally provider-agnostic. The companion's personality, memory, and conversation context all get assembled into a system prompt at runtime, and the app doesn't care what's on the other end.

Storage is all client-side. IndexedDB through Dexie.js. No accounts, no servers storing your data. Everything stays on your device.

## What's next

The immediate focus is getting the core web experience solid: chat, voice, expressions, and memory all working reliably. After that, I'm looking at a desktop app via Tauri for features that need deeper OS integration, things like transparent overlays and local model support.

More updates to come as things take shape.
