# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
