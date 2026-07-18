# Chat UX Overhaul

Date: 2026-07-18
Status: approved
Scope: PR 1 of 2 (PR 2 is camera-driven jiggle physics, separate spec)

## Goal

Make the chat experience feel deliberate and polished: the input docks into the
chat window when it is open, the chat surfaces use the design system's gray
tokens, thinking states narrate the real pipeline phases with a shimmer label,
replies reveal word by word, the window resizes reliably, and Display settings
give real placement control.

## Decisions (locked with CJ)

1. Input docks into the chat window whenever the window is open, in every mode
   that shows the window (Chat window, Both). The floating bar returns when the
   window closes.
2. Mode labels become Immersive / Chat window / Both / Off. Stored values
   (`bubble`, `sidebar`, `both`, `off`) are unchanged; no migration.
3. Thinking indicator is a phase-aware shimmer label driven by real pipeline
   stages. No fake chain of thought.
4. Reply text reveals word by word at a fixed cadence, independent of TTS.
   Speed setting: off / slow / normal / fast. Reduced motion means instant.
5. Display settings gain: window snap side (existing), reset window position,
   floating bar alignment (left / center / right), text reveal speed.
6. Input architecture: extract a shared ChatInput component; typed draft and
   queued photos live in a store so they survive surface switches.
7. Visual primitives are implemented from scratch against Mizu UI's documented
   behavior (license unverifiable, so no source is copied).

## Components

### New primitives (`src/lib/components/ui/`)

- `ShimmerLabel.svelte`: text with an animated gradient sweep
  (background-clip: text, background-position keyframes). Props: `label`.
  Falls back to static secondary-color text under `prefers-reduced-motion`.
- `StreamingText.svelte`: reveals `text` word by word. Words wrap in spans that
  fade in; an interval advances the shown count every `speedMs`. Props:
  `text`, `speedMs`, `onComplete`. `speedMs <= 0` or reduced motion renders
  instantly. Also exports a helper used by the chat window to walk rendered
  markdown HTML and wrap text-node words in reveal spans so inline markup
  (strong, em, code) survives.

### Input extraction

- `ChatInput.svelte` (new, from BottomChatBar): textarea with autosize,
  Enter-to-send, attach button plus hidden file input, mic / STT states
  (listening, transcribing, visualizer), pending photo chips. Prop `docked`
  switches pill styling (floating) to flat row styling (docked).
- `chat-draft.svelte.ts` (new store): `draft` text and `pending` photo queue
  (PreparedImage + object URL). Both surfaces bind to it; object URLs are
  revoked on send/remove exactly as today.
- `BottomChatBar.svelte` keeps: mood fab, stats tray, drop-zone overlay,
  toasts (STT error, vision hint, privacy notice), Tauri drag-drop wiring, and
  now renders `ChatInput` in floating style. It stays mounted while the chat
  window is open (drops and toasts must keep working) but hides its visible
  bar row and mood fab; dropped photos land in the shared draft store and
  appear as chips in the window's docked input.

### Chat window

- `ChatSidebar.svelte` renamed to `ChatWindow.svelte`.
- Custom resize: pointer-captured handles on all four edges and corners
  replacing native `resize: both`. Min 260x220, clamped to viewport. Rect
  persists under the existing `utsuwa-chat-panel` key; re-clamped on every
  open and on window resize (fixes the reopen-resize bug).
- Header: mood chip (replaces the floating mood fab while docked), title,
  snap left / right, clear, close. Drag-to-move unchanged.
- Bottom row: docked `ChatInput` above a subtle top border.
- Latest assistant message renders through the markdown-aware reveal helper;
  older messages render statically.

### Pipeline phase hook

- `companion-chat.ts` hooks gain `setPhase(phase)` with values
  `remembering | seeing | thinking`. Fired at the real stages: memory
  retrieval start (remembering), then at LLM request start either seeing
  (when the turn includes images) or thinking. Seeing wins over thinking for
  image turns. `setTyping(false)` clears the phase.
- Phase-to-label mapping is a pure function with tests:
  remembering -> "Remembering...", seeing -> "Looking at your photo...",
  thinking -> "Thinking...".
- SpeechBubble and ChatWindow show `ShimmerLabel` with the mapped label where
  the bouncing dots were. The existing typing-indicator delay and wait tone
  gate visibility unchanged. The desktop overlay gets the same through the
  shared components.

### Display store and settings

- New persisted fields with defaults: `chatBarAlignment: 'center'`
  (`left | center | right`), `textRevealSpeed: 'normal'`
  (`off | slow | normal | fast`; cadence map off=0, slow=110ms, normal=60ms,
  fast=30ms per word).
- `parseDisplaySettings` sanitizes both (unknown values fall back to
  defaults); tests first, TDD.
- Reset window position: displayStore gains a `chatWindowResetToken` counter;
  the settings button increments it, ChatWindow observes it, clears the saved
  rect, and re-derives the default rect.
- Settings page layout per the approved mock: Chat Display segments with new
  labels and hint copy, Chat Window card (snap side + reset button), Floating
  Bar card (alignment), Text Reveal card (speed), existing Typing Indicator
  card unchanged.

### Gray restyle

- Input surface (floating pill and docked row) moves from `--bg-primary` to
  `--bg-secondary` with a `--border-subtle` border, both themes. Mood fab
  matches. Contrast spot-checked in light and dark.

## Error handling

- Phase hook is optional in the hooks interface; overlay or future callers
  that do not pass it lose nothing.
- StreamingText clears its interval on unmount and on text change; a new
  message mid-reveal restarts cleanly.
- Malformed persisted rects or display settings fall back to defaults (already
  the pattern; extended to new fields).

## Testing

- TDD (pure logic): display-parser new fields, phase label mapping, word
  splitting / markdown text-node walking for the reveal helper.
- `pnpm test` and `pnpm check` clean.
- Live e2e (utsuwa-e2e): every mode renders correctly; dock transition
  mid-draft preserves text and queued photo; resize from all edges, close,
  reopen, resize again; reset window position rescues an off-screen window;
  new settings persist across reload; overlay shimmer and reveal; reduced
  motion sanity check.

## Docs

- README feature list; `src/content/docs/technology/companion-system.md`
  pipeline hooks section.
