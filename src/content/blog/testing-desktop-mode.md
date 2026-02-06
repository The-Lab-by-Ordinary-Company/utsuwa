---
title: Testing Desktop Mode
description: First tests of the Tauri-based desktop app with transparent overlay mode and window management.
date: '2026-02-06'
image: /blog/blog-thumbnail.png
tag: DevLog
---

# Testing Desktop Mode

The desktop app has been the big focus lately. Utsuwa runs fine as a web app, but there are things you just can't do in a browser. Transparent overlays, always-on-top windows, global shortcuts. Tauri v2 makes all of this possible while keeping the bundle small and the web codebase shared.

## Tauri integration

The app detects its runtime environment by checking for `window.__TAURI_INTERNALS__`. When running in Tauri, it unlocks desktop-specific features: overlay mode, window management, and eventually local model support. When running in a browser, those features just aren't shown. Same codebase, different capabilities.

Getting Tauri v2 set up was mostly painless. The plugin system is solid. We're using `@tauri-apps/plugin-shell` for process management and the window API for controlling transparency and positioning. The main gotcha was the detection mechanism. Tauri v2 uses `__TAURI_INTERNALS__` instead of v1's `__TAURI__`, which took a minute to figure out.

## Overlay mode

This is the feature I'm most excited about. The avatar renders on a transparent window that sits on top of everything else. You can see your desktop through it, interact with other apps, and the companion is just... there. Think of it like a desktop pet, but one that actually talks to you.

Getting transparency right was tricky. The window background needs to be fully transparent, but the 3D scene still needs to render. We had to lock the camera controls in overlay mode too — without that, dragging the avatar would rotate the entire scene. Felt broken.

The status pill was another addition during testing. When the overlay is active, there's a small indicator showing the connection status and current mode. Small thing, but it makes the experience feel more polished.

## Window switching

One of the test scenarios was switching between the main app window and the overlay. The main window has all the settings, chat history, and configuration. The overlay is just the avatar. You need to be able to flip between them easily.

Right now this is handled through a launch button in the main UI that opens the overlay as a separate Tauri window. The state stays synced between windows since they share the same Svelte stores. It works, but there's room to make the transition smoother.

## What's left

Desktop mode is functional but still on the `feature/desktop` branch. There's more testing to do around edge cases. Multi-monitor setups, different OS window managers, performance with the overlay running for extended periods. The goal is to get it stable enough to merge and ship as a beta alongside the web version.

Local model support through Ollama is also on the desktop roadmap. Running everything locally (model, TTS, the whole stack) is the end goal for people who want full privacy.
