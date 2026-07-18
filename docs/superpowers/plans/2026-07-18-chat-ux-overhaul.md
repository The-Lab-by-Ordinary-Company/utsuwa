# Chat UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dock the chat input into the chat window when open, restyle chat surfaces gray, add phase-aware shimmer thinking labels and word-by-word reply reveal, fix window resize, and expand Display settings with placement controls.

**Architecture:** Extract the input core from BottomChatBar into a shared ChatInput component backed by a chat-draft store so the draft survives surface switches. Two new UI primitives (ShimmerLabel, StreamingText) implemented from scratch. ChatSidebar becomes ChatWindow with custom edge-resize. Pipeline gains an optional setPhase hook. Display store gains textRevealSpeed, chatBarAlignment, and a window-reset token.

**Tech Stack:** Svelte 5 runes, TypeScript, node --test, Dexie-free (localStorage persistence only).

## Global Constraints

- Node 22: `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"`
- Relative imports in files under test need `.ts` extensions (node --test).
- No `any`, no `@ts-ignore` without justification.
- No AI attribution in commits. Conventional commit format. No em dashes or emojis anywhere.
- Stored ChatDisplayMode values stay `bubble | sidebar | both | off`; only labels change.
- `pnpm test` and `pnpm check` must be clean before the PR; live e2e (utsuwa-e2e) before claiming done.

---

### Task 1: Display store fields (textRevealSpeed, chatBarAlignment, reset token)

**Files:**
- Modify: `src/lib/stores/display-types.ts`
- Modify: `src/lib/stores/display-parser.ts`
- Test: `src/lib/stores/display-parser.test.ts`
- Modify: `src/lib/stores/display.svelte.ts`

**Interfaces:**
- Produces: `type TextRevealSpeed = 'off' | 'slow' | 'normal' | 'fast'`;
  `type ChatBarAlignment = 'left' | 'center' | 'right'`;
  `REVEAL_SPEED_MS: Record<TextRevealSpeed, number>` = off 0, slow 110, normal 60, fast 30;
  defaults `DEFAULT_TEXT_REVEAL_SPEED = 'normal'`, `DEFAULT_CHAT_BAR_ALIGNMENT = 'center'`;
  displayStore getters `textRevealSpeed`, `chatBarAlignment`, `chatWindowResetToken` and setters `setTextRevealSpeed(v)`, `setChatBarAlignment(v)`, `requestChatWindowReset()`.

- [ ] Step 1: Add failing parser tests to `display-parser.test.ts`: valid values round-trip, unknown strings and non-strings fall back to defaults, absent fields fall back to defaults.
- [ ] Step 2: `node --test src/lib/stores/display-parser.test.ts` fails on the new assertions.
- [ ] Step 3: Add the types, defaults, and `REVEAL_SPEED_MS` to display-types; sanitize both fields in `parseDisplaySettings` with allow-list checks mirroring the existing chatDisplayMode handling.
- [ ] Step 4: Tests pass.
- [ ] Step 5: Extend `display.svelte.ts`: state, persistence in `save()`, hydration, setters, and `chatWindowResetToken` (session-only counter, not persisted; `requestChatWindowReset()` increments it). `resetChatDisplay()` also resets the two new fields.
- [ ] Step 6: `pnpm test` green. Commit `feat(display): text reveal speed, bar alignment, window reset token`.

### Task 2: Phase label mapping + pipeline hook

**Files:**
- Create: `src/lib/services/chat/chat-phase.ts`
- Test: `src/lib/services/chat/chat-phase.test.ts`
- Modify: `src/lib/services/chat/companion-chat.ts`

**Interfaces:**
- Produces: `type ThinkingPhase = 'remembering' | 'seeing' | 'thinking'`;
  `phaseLabel(phase: ThinkingPhase): string` (Remembering... / Looking at your photo... / Thinking...);
  optional hook `setPhase?: (phase: ThinkingPhase) => void` on `CompanionChatHooks`.

- [ ] Step 1: Failing test for `phaseLabel` covering all three values.
- [ ] Step 2: Verify fail, implement, verify pass.
- [ ] Step 3: In `sendCompanionMessage`: `hooks.setPhase?.('remembering')` right after `setTyping(true)`; `hooks.setPhase?.(images.length > 0 ? 'seeing' : 'thinking')` immediately before the LLM request goes out.
- [ ] Step 4: `pnpm test` + `pnpm check` green. Commit `feat(chat): thinking phase hook with real pipeline stages`.

### Task 3: ShimmerLabel primitive

**Files:**
- Create: `src/lib/components/ui/ShimmerLabel.svelte`
- Modify: `src/lib/components/ui/index.ts` (export)

**Interfaces:**
- Produces: `<ShimmerLabel label={string} />`. Gradient sweep via
  `background: linear-gradient(90deg, var(--text-tertiary), var(--text-primary), var(--text-tertiary)); background-size: 200% 100%; -webkit-background-clip: text; color: transparent;` animating `background-position` 2s linear infinite. Under `prefers-reduced-motion`: static `var(--text-secondary)`, no animation. Label swaps crossfade with a 150ms key transition.

- [ ] Step 1: Implement component. Step 2: `pnpm check` green. Commit `feat(ui): shimmer label primitive`.

### Task 4: Reveal helper + StreamingText primitive

**Files:**
- Create: `src/lib/components/chat/reveal-markup.ts`
- Test: `src/lib/components/chat/reveal-markup.test.ts`
- Create: `src/lib/components/ui/StreamingText.svelte`

**Interfaces:**
- Produces: `wrapWordsInHtml(html: string): { html: string; wordCount: number }`
  walks text nodes only, wraps each whitespace-delimited word in
  `<span class="reveal-word" style="--word-index:N">`, preserves inline tags
  (strong, em, code) and whitespace exactly. `<StreamingText text speedMs onComplete />`
  for plain text (bubble): word spans fade in on an interval, blinking caret while
  revealing; `speedMs <= 0` or reduced motion renders instantly and fires onComplete.

- [ ] Step 1: Failing tests for `wrapWordsInHtml`: plain text, nested strong/em, code spans kept whole per word, whitespace preservation, empty string. Uses a minimal hand-rolled tag tokenizer (no DOM in node --test).
- [ ] Step 2: Verify fail, implement, verify pass.
- [ ] Step 3: Implement StreamingText with `$state` shown counter, `$effect` interval cleanup on unmount and text change.
- [ ] Step 4: Gates green. Commit `feat(ui): word-by-word reveal primitives`.

### Task 5: chat-draft store

**Files:**
- Create: `src/lib/stores/chat-draft.svelte.ts`

**Interfaces:**
- Produces: `chatDraftStore` with `draft: string` (get/set), `pending: { image: PreparedImage; url: string }[]`, `addPending(image, url)`, `removePending(id)` (revokes URL), `takeAll(): { text: string; images: PreparedImage[] }` (returns trimmed draft plus images, revokes URLs, clears state).

- [ ] Step 1: Implement (thin runes store; mirrors existing store style).
- [ ] Step 2: `pnpm check` green. Commit `feat(chat): shared draft store for input surfaces`.

### Task 6: ChatInput extraction + BottomChatBar refactor + gray restyle

**Files:**
- Create: `src/lib/components/chat/ChatInput.svelte`
- Modify: `src/lib/components/chat/BottomChatBar.svelte`

**Interfaces:**
- Produces: `<ChatInput onSend disabled visionCapable overlay docked onAttachBlocked />`;
  reads/writes chatDraftStore; owns textarea autosize, Enter-to-send, mic/STT states,
  pending chips, attach picker. `onAttachBlocked()` lets the host surface the vision hint.
- BottomChatBar new props: `barHidden: boolean` (window open), alignment from displayStore.

- [ ] Step 1: Move input core into ChatInput; keep behavior identical (drag-drop stays in BottomChatBar and feeds `chatDraftStore.addPending`).
- [ ] Step 2: BottomChatBar renders ChatInput; hides `.bar-row` and mood fab when `barHidden`; keeps drop zone and toasts mounted. Alignment: `left | center | right` maps to flex positioning of the fixed container.
- [ ] Step 3: Restyle: input surface and mood fab `--bg-secondary` + `1px solid var(--border-subtle)`; docked variant flat (no pill radius, no shadow).
- [ ] Step 4: Gates green. Manual smoke in dev server. Commit `refactor(chat): extract ChatInput with shared draft, gray restyle`.

### Task 7: ChatWindow (rename, custom resize, docked input, reveal, shimmer)

**Files:**
- Rename: `src/lib/components/chat/ChatSidebar.svelte` -> `ChatWindow.svelte`
- Modify: `src/routes/app/+page.svelte` (import)

**Interfaces:**
- Produces: `<ChatWindow open onClose isTyping phase onSend disabled visionCapable />`.

- [ ] Step 1: Rename component and update imports.
- [ ] Step 2: Replace `resize: both` with eight handle divs (n s e w ne nw se sw). Pointer-capture drag: on down store start rect + pointer; on move apply direction deltas with min 260x220 and viewport clamp; on up persist. Remove the ResizeObserver.
- [ ] Step 3: Re-clamp saved rect on every open and on window resize. Observe `displayStore.chatWindowResetToken`; on change clear `utsuwa-chat-panel` and re-derive default rect.
- [ ] Step 4: Header gains mood chip (moodInfo icon + color, title attribute description). Bottom row renders docked ChatInput above a `--border-subtle` top border.
- [ ] Step 5: Latest assistant message renders via `wrapWordsInHtml(renderMarkdown(content))` with staggered fade-in using `--word-index` and the reveal cadence from `displayStore.textRevealSpeed`; older messages static. Typing row shows `<ShimmerLabel label={phaseLabel(phase)} />`.
- [ ] Step 6: Gates green. Commit `feat(chat): chat window with docked input, custom resize, reveal`.

### Task 8: App page + SpeechBubble + overlay wiring

**Files:**
- Modify: `src/routes/app/+page.svelte`
- Modify: `src/lib/components/chat/SpeechBubble.svelte`
- Modify: `src/routes/overlay/+page.svelte`

- [ ] Step 1: App page: `phase` state fed by `setPhase` hook; window-open state hides the floating bar (`barHidden`); ChatWindow receives send wiring; Both mode = bubble + window (input in window).
- [ ] Step 2: SpeechBubble: typing indicator -> ShimmerLabel with phase label; message -> StreamingText with `REVEAL_SPEED_MS[displayStore.textRevealSpeed]`.
- [ ] Step 3: Overlay page: pass setPhase, same bubble upgrades; no window there.
- [ ] Step 4: Gates green. Commit `feat(chat): wire phase, reveal, and docking through app and overlay`.

### Task 9: Display settings page

**Files:**
- Modify: `src/routes/app/settings/display/+page.svelte`

- [ ] Step 1: Mode labels Immersive / Chat window / Both / Off with updated hint copy. Chat Window card: snap side + Reset window position button (`displayStore.requestChatWindowReset()`). Floating Bar card: alignment segments. Text Reveal card: speed segments.
- [ ] Step 2: Gates green. Commit `feat(settings): chat placement and reveal controls`.

### Task 10: Docs + gates + e2e + PR

- [ ] Step 1: README feature bullets; companion-system.md pipeline hooks section (setPhase).
- [ ] Step 2: `pnpm test` and `pnpm check` fully clean.
- [ ] Step 3: utsuwa-e2e live verification: all four modes; dock transition mid-draft (text + queued photo survive); resize all edges, close, reopen, resize; reset window position; settings persist across reload; overlay shimmer + reveal; reduced-motion check.
- [ ] Step 4: PR with evidence-based body. Do not merge without authorization.
