# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-07-04

### Added
- **Camera that fits itself**: the camera now frames each model by its actual proportions on load (head near the top of the screen, crop around the thigh), so tall and short models both land well without any adjustment.
- **Live camera settings**: zoom, height, and field-of-view sliders in a popover that adjusts the scene in real time, with a reset back to the fitted default. No more settings-page roundtrips. Settings persist, and your old camera-distance preference migrates automatically.
- **Settings cluster**: the top-right button expands into a tidy column holding the settings pages, camera controls, the theme toggle (now a single cycling button: system, light, dark), and AR.
- **AR mode (WebXR)**: on Android Chrome and headset browsers, place your companion on your real floor with camera passthrough: she auto-places via floor detection, one finger drags her around, two fingers pinch to resize, and the chat UI stays visible. On devices without WebXR (including iPhones), the AR button opens a guide instead.
- **Overlay resize and lock**: hover the desktop overlay for a soft frame, drag the top-left corner tab to resize the window (your size is remembered), and lock her position so clicks can't drag the window.
- **Overlay camera profile**: overlay mode keeps its own zoom/height/FOV settings, independent of the main app, adjustable from the new hover rail.

### Changed
- **Overlay speech is readable now**: replies appear in a docked dialog bubble above the bottom controls instead of chasing the head of a window that itself moves.
- The Display settings page was removed; its two controls (theme and camera) moved into the settings cluster.

### Fixed
- **Overlay hover framerate drop**: hovering the overlay ran an expensive model raycast on every mouse movement for a feature that was disabled; it's gone, and hover no longer stutters (this was most noticeable on Windows).

## [0.7.2] - 2026-07-04

### Changed
- **Viewer scene overhaul**: a clean, minimal stage for your companion — single white key light with tone mapping disabled so MToon models render with their authored colors, pure-white (light) / near-black (dark) backdrop with a soft studio floor, and free orbit controls with unrestricted pan and zoom.
- **New default avatars**: Tsuki, Yuki, and Momo (VRoid Project sample models) replace the previous bundled model. Each model's license is documented in `static/models/README.md`.

### Fixed
- **Model thumbnails no longer flip between T-pose renders and portraits**: previews now consistently use the model's embedded thumbnail, and generation no longer races storage restore on startup.
- **Readable error when an OpenAI-compatible base URL points at a website**: instead of a wall of raw HTML, chat now shows a short hint to double-check the base URL.

### Added
- **Privacy Policy and Terms of Use** pages on the website, linked from the footer.

## [0.7.1] - 2026-07-03

### Fixed
- **Onboarding now configures OpenAI-compatible endpoints**: selecting the OpenAI-Compatible provider during setup showed no fields to fill in. It now offers an optional API key, a base URL, and a model, and won't let you continue until a base URL and model are set.

### Added
- **Voice input during onboarding**: a new optional Voice Input (STT) step lets you set up a local Whisper server, Groq, or OpenAI while getting started, matching what the settings page already offered.

## [0.7.0] - 2026-07-03

### Added
- **Custom OpenAI-compatible LLM endpoint**: point Utsuwa at any OpenAI-compatible API (OpenRouter, Together, Mistral, Perplexity, a local vLLM, LiteLLM, and more) with a base URL, an optional API key, and a model of your choice.
- **Local speech-to-text**: run voice input entirely on your machine with any OpenAI-compatible Whisper server (Speaches, faster-whisper-server, whisper.cpp). Audio never leaves your device, and there's no API key or per-minute cost. Includes a new Local STT Setup guide.
- **OpenAI (Whisper) speech-to-text**: OpenAI's cloud Whisper is now a voice-input option alongside Groq, a local server, and the browser's Web Speech API.
- **Developer animation preview**: the animation dropdown in the developer panel now lists the bundled emote clips so you can trigger them directly.

### Fixed
- **Relationship progression no longer stalls at Romantic Interest**: accepting a milestone moment (such as the confession) now correctly advances the stage, so Dating, Committed, and Soulmate are reachable.
- **Conversations are remembered**: chat turns and sessions now persist to local storage, so your companion's history and memory survive reloads.
- **Time-away handling**: the once-per-absence mood and relationship decay no longer stacks up on load, so returning after a break feels natural rather than punishing.
- **Save import is now atomic** and de-duplicates on merge, so importing a backup can no longer half-apply or create duplicate facts, sessions, or events.
- **Cleaner replies and overlay parity**: fixed a case where truncated model output could leak raw JSON into dialogue, and the desktop overlay now uses the same response pipeline as the main app.
- Onboarding starts from a friendly default persona, no longer closes when you click inside it, and restores your saved relationship stage without downgrading it.
- A range of smaller fixes and dead-code cleanup from a full code audit (hotkey handling, TTS model and speed handling, response streaming, and several avatar and memory edge cases).

### Security
- **SSRF protection**: the hosted API blocks requests to private, loopback, and cloud-metadata addresses made through client-supplied provider URLs.
- Release workflow actions are pinned to commit SHAs.

### Changed
- Consolidated provider default base URLs and the companion-turn pipeline into single shared sources to reduce drift.
- Refreshed the README and documentation (STT options, provider list, roadmap, and acknowledgments) to match the current app.

## [0.4.0] - 2026-06-29

### Added
- **Local text-to-speech**: connect any OpenAI-compatible TTS server (Kokoro-FastAPI, openedai-speech) for a self-hosted companion voice with no API key. New "Local TTS" provider with voice, model, and base URL settings, plus a setup guide.

### Fixed
- Desktop app now reliably boots into the app on **macOS** (and all platforms). The previous launch raced on macOS WebKit; the window now opens directly into the app, with routing gated by a build-time flag so the landing page and docs are never reachable inside the desktop window.
- Info modal "Docs" link now points to the docs subdomain (docs.utsuwa.ai) and opens in the system browser on desktop.
- Info modal logo is now a clean mark (blue in light mode, white in dark) without the badge container.
- Desktop update notification now appears from the top of the window.
- OpenAI TTS now respects the selected model instead of always using `tts-1`.

## [0.3.1] - 2026-06-28

### Fixed
- Desktop app now opens directly into the app instead of the marketing landing page.
- Landing, docs, and blog links inside the desktop app open in the system browser rather than navigating the app window.

## [0.3.0] - 2026-06-28

### Added
- Cross-platform desktop builds for **macOS, Windows, and Linux**, produced automatically by CI on each tagged release
- In-app auto-updates for the desktop app: a quiet check on launch, an unobtrusive update banner with download progress, and a manual "Check for updates" in the About dialog
- Tauri desktop application with transparent overlay mode (macOS, Windows, and Linux)
- Transparent overlay mode with always-on-top window
- Draggable companion character positioning
- Floating chat icon with expandable input bar
- Window switching between main app and overlay mode
- Platform detection layer (`isTauri()` / `isWeb()`)
- Global hotkey infrastructure (Ctrl+Shift shortcuts)
- Groq STT provider (Whisper) for voice input on all platforms including desktop

### Technical
- `.github/workflows/release.yml` - cross-platform release pipeline (macOS universal, Windows, Linux) on `v*` tag push
- `src-tauri/` - Tauri v2 project with Rust backend, updater + process plugins, and signed updater artifacts
- `src/lib/stores/updater.svelte.ts` / `src/lib/components/updater/UpdateBanner.svelte` - update flow and banner UI
- `src/lib/services/platform/` - Platform abstraction layer
- `src/routes/overlay/` - Overlay mode route and components
- `src/lib/stores/overlay.svelte.ts` - Overlay state management
- `src/lib/services/stt/groq-stt.ts` - Groq STT service
- `src/lib/stores/stt.svelte.ts` - STT store with auto-selection (Groq if key configured, else Web Speech)

## [0.2.5] - 2026-05-29

### Fixed
- Fixed browser-based Ollama and LM Studio local model discovery by fetching installed local models from the user's device instead of relying on typed/default model names.
- Fixed Ollama `model not found` confusion by requiring users to select an installed model from the discovered model dropdown.
- Improved Ollama hosted-site CORS troubleshooting with origin-specific `OLLAMA_ORIGINS` guidance and a link to Ollama's official web origins FAQ.
- Fixed local development route rendering hangs caused by the Shiki highlighter bundle used in SvelteKit routes.

### Changed
- Updated local LLM onboarding and settings to use discovered local models for Ollama and LM Studio.
- Updated local LLM setup and troubleshooting documentation.
- Removed the stale local LLM blog article.

## [0.2.2] - 2026-01-31

### Added
- Dynamic model fetching from provider APIs with caching (LLM and TTS)
- Model dropdown with loading states and refresh button
- API endpoint for fetching models from LLM and TTS providers
- Debounced API calls to prevent rapid requests on blur
- Red border with shake animation on invalid API key

### Changed
- Reordered provider setup: Provider → API Key → Model (onboarding and settings)
- Cloud providers now fetch models from API only (no static fallbacks)
- Simplified to 7 LLM providers: OpenAI, Anthropic, Google, DeepSeek, xAI, Ollama, LM Studio
- Simplified to 2 TTS providers: ElevenLabs, OpenAI TTS
- Updated all documentation to reflect current provider list

### Removed
- Removed static model lists for cloud providers (models fetched from API)
- Removed untested LLM providers: Player2, vLLM, Mistral AI, and others
- Removed untested TTS providers
- Deleted stale docs/plans directory

### Fixed
- Anthropic model ID format corrected (was causing 404 errors)
- Chat API now handles provider errors gracefully (no more server crashes)
- Race condition when rapidly switching LLM providers
- Google API key now sent via header instead of URL query (security)
- Model fetch timeout (10s) prevents infinite loading spinner
- Cached models expire after 24 hours
- Loading state properly resets on provider change
- Anthropic model name formatting for versioned models
- Empty model lists no longer show as errors
- Docs search links now work correctly (removed .html suffix)
- Model cache invalidated when API key changes
- Provider configuration UI completion and cleanup
- Local providers properly marked as added when selected
- TypeScript errors resolved

## [0.2.1] - 2026-01-28

### Added
- Documentation hub at `/docs` with mdsvex-powered markdown rendering
- Pagefind search with Cmd/Ctrl+K keyboard shortcut
- Shiki syntax highlighting with dual theme support (light/dark)
- Copy-to-clipboard button on code blocks
- Breadcrumb and prev/next page navigation
- Troubleshooting guide
- Architecture overview documentation
- Contributing guide (in-app)
- Lint script to package.json

### Changed
- Standardized on pnpm as package manager
- Updated all documentation to use pnpm commands
- Minimum Node.js version updated to 22+
- Version chip now reads directly from package.json

## [0.2.0] - 2026-01-26

### Added
- Semantic memory search using local embeddings (Transformers.js)
- Facts are now matched by meaning, not just keywords
- Auto-backfill embeddings for existing facts on upgrade
- Version number now injected from package.json at build time

### Changed
- Memory retrieval uses semantic similarity with keyword fallback
- Database schema updated to v3 (adds embedding field to facts)
- InfoModal and export now use centralized version from package.json

## [0.1.0] - 2026-01-24

### Added
- Initial release
- VRM avatar viewer with orbit controls
- 3D speech bubbles tracking model head position
- Multi-provider LLM support (7 providers)
- Multi-provider TTS support (2 providers)
- Audio-driven lip-sync
- VRMA-based animations (idle, talking, blinking)
- Companion system with multi-axis relationships
- 8-stage relationship progression (Stranger to Soulmate)
- Visual novel event system with choices
- Memory system (facts, sessions, working memory)
- Time-based mood and relationship decay/recovery
- Local-first IndexedDB storage with export/import
- Theme system with light/dark modes
- Voice input via Web Speech API
