---
title: Desktop Guide
description: How to install and use the Utsuwa desktop application with overlay mode.
---

# Desktop Guide

Utsuwa Desktop is an application that brings your AI companion to your desktop with a transparent overlay mode. Your companion can float over other applications, always visible while you work.

Available for **Windows**, **macOS**, and **Linux**.

## Installation

### Download

Head to the [GitHub Releases](https://github.com/dyascj/utsuwa/releases) page and grab the latest version for your platform:

| Platform | File |
|----------|------|
| Windows | `.msi` or `.exe` installer |
| macOS | `.dmg` disk image |
| Linux | `.AppImage` or `.deb` package |

Download the file, run the installer, and you're good to go.

### Building from Source

If you prefer to build it yourself:

#### Prerequisites

- Node.js 22+
- [Rust toolchain](https://rustup.rs/) (for Tauri)
- pnpm

```bash
# Clone the repo
git clone https://github.com/dyascj/utsuwa.git
cd utsuwa

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Or build a release binary
pnpm tauri build
```

The dev command launches both a development server and the desktop window. The build command produces an installer for your current platform in `src-tauri/target/release/bundle/`.

## Features

### Main Window

The main window provides the full Utsuwa experience — same as the web version with all features:

- VRM avatar with animations
- Chat interface
- Settings and configuration
- Memory and relationship systems

A blue **monitor icon** in the top-right corner launches overlay mode.

### Overlay Mode

Overlay mode detaches your companion into a transparent, always-on-top window:

- **Transparent Background**: Only the character is visible; everything else is see-through
- **Always on Top**: The companion stays visible over all other windows
- **Draggable**: Click and drag anywhere on the character to reposition
- **Floating Chat**: Click the chat icon at the bottom to expand a chat input
- **Speech Bubbles**: Responses appear as speech bubbles near the character
- **Status Indicator**: The mood/relationship status pill appears above the chat icon

#### Controls

| Action | How |
|--------|-----|
| Move character | Click and drag on the character |
| Open chat | Click the chat icon at the bottom |
| Send message | Type and press Enter |
| Close chat | Send a message (auto-collapses) |
| Exit overlay | Click the X button in the top-right corner |

### Switching Between Modes

- **Main → Overlay**: Click the blue monitor icon in the top-right
- **Overlay → Main**: Click the X button in the overlay's top-right corner

Both windows share the same data — your conversation, memories, and relationship state persist across modes.

## Known Limitations

Some features are still being worked on:

| Feature | Status |
|---------|--------|
| Windows support | ✅ Available |
| macOS support | ✅ Available |
| Linux support | ✅ Available |
| Click-through transparency | ❌ Disabled (blocks UI) |
| Global hotkeys | 🔧 Infrastructure ready |
| Position persistence | ⏳ Planned |
| System tray | ⏳ Planned |

## Troubleshooting

### App won't start

If you built from source, make sure Rust is installed:

```bash
rustc --version
```

If not installed, run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

If you downloaded a release binary and it won't launch, try downloading it again or check the [GitHub Issues](https://github.com/dyascj/utsuwa/issues) page.

### Overlay background not transparent

This can happen if the renderer isn't properly configured. Try:

1. Exit and relaunch the app
2. Make sure you're on the latest version from [Releases](https://github.com/dyascj/utsuwa/releases)

### Character facing wrong direction

The camera is locked in overlay mode. If the character appears rotated, exit overlay and re-enter.

### Can't interact with overlay UI

The X button and chat icon should always be clickable. If they're not responding, the window may have lost focus — click anywhere on the overlay first.

## Technical Details

The desktop app uses:

- **Tauri v2** — Rust-based framework for desktop apps
- **Same SvelteKit codebase** — No fork, shared components
- **Platform detection** — `isTauri()` checks for Tauri environment
- **Multi-window** — Main window + overlay window managed separately

For architecture details, see [Architecture Overview](/docs/technology/architecture).
