<script lang="ts">
	import { browser } from '$app/environment';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { Icon } from '$lib/components/ui';
	import { renderMarkdown } from './render-markdown';

	interface Props {
		open: boolean;
		onClose?: () => void;
		isTyping?: boolean;
	}

	let { open, onClose, isTyping = false }: Props = $props();

	let messagesEl: HTMLDivElement | null = $state(null);
	let panelEl: HTMLDivElement | null = $state(null);
	let scrollRaf: number | null = null;

	// --- Floating geometry -----------------------------------------------------
	// The panel floats: drag it by the header, resize it from the corner. Its
	// rect persists so it comes back where you left it. Until the user drags,
	// it anchors to the docked side from settings.
	const GEOMETRY_KEY = 'utsuwa-chat-panel';
	const DEFAULT_WIDTH = 320;
	const DEFAULT_HEIGHT_VH = 0.62;
	const MARGIN = 12;
	const TOP_OFFSET = 68; // below the top button row

	interface PanelRect {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	function defaultRect(): PanelRect {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const w = DEFAULT_WIDTH;
		const h = Math.round(vh * DEFAULT_HEIGHT_VH);
		const x = displayStore.sidebarPosition === 'left' ? MARGIN : vw - w - MARGIN;
		return { x, y: TOP_OFFSET, w, h };
	}

	function clampRect(r: PanelRect): PanelRect {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const w = Math.min(Math.max(r.w, 260), vw - MARGIN * 2);
		const h = Math.min(Math.max(r.h, 220), vh - MARGIN * 2);
		return {
			x: Math.min(Math.max(r.x, MARGIN - w + 80), vw - 80),
			y: Math.min(Math.max(r.y, 0), vh - 48),
			w,
			h
		};
	}

	let rect = $state<PanelRect | null>(null);

	$effect(() => {
		if (!browser || rect) return;
		try {
			const saved = localStorage.getItem(GEOMETRY_KEY);
			rect = saved ? clampRect(JSON.parse(saved)) : defaultRect();
		} catch {
			rect = defaultRect();
		}
	});

	function persistRect() {
		if (browser && rect) localStorage.setItem(GEOMETRY_KEY, JSON.stringify(rect));
	}

	// Dragging via the header
	let dragging: { pointerId: number; offsetX: number; offsetY: number } | null = null;

	function onHeaderDown(e: PointerEvent) {
		// Buttons in the header keep their own behavior
		if ((e.target as HTMLElement).closest('button') || !rect) return;
		dragging = { pointerId: e.pointerId, offsetX: e.clientX - rect.x, offsetY: e.clientY - rect.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onHeaderMove(e: PointerEvent) {
		if (!dragging || !rect) return;
		rect = clampRect({
			...rect,
			x: e.clientX - dragging.offsetX,
			y: e.clientY - dragging.offsetY
		});
	}

	function onHeaderUp() {
		if (!dragging) return;
		dragging = null;
		persistRect();
	}

	// Resize via the native CSS handle; observe and persist the result
	$effect(() => {
		const el = panelEl;
		if (!el) return;
		const observer = new ResizeObserver(() => {
			if (!rect) return;
			const w = el.offsetWidth;
			const h = el.offsetHeight;
			if (w !== rect.w || h !== rect.h) {
				rect = clampRect({ ...rect, w, h });
				persistRect();
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	// The dock buttons become "snap to edge" shortcuts for the floating panel
	function snapTo(side: 'left' | 'right') {
		displayStore.setSidebarPosition(side);
		if (!rect) return;
		const vw = window.innerWidth;
		rect = clampRect({ ...rect, x: side === 'left' ? MARGIN : vw - rect.w - MARGIN });
		persistRect();
	}

	// --- Messages ---------------------------------------------------------------

	// Auto-scroll whenever messages change or typing state changes.
	// requestAnimationFrame collapses rapid streaming chunks into one smooth scroll.
	$effect(() => {
		const _msgs = chatStore.messages.length;
		const _typing = isTyping;
		if (open && messagesEl) {
			if (scrollRaf) cancelAnimationFrame(scrollRaf);
			scrollRaf = requestAnimationFrame(() => {
				scrollRaf = null;
				messagesEl!.scrollTop = messagesEl!.scrollHeight;
			});
		}
		return () => {
			if (scrollRaf) {
				cancelAnimationFrame(scrollRaf);
				scrollRaf = null;
			}
		};
	});

	// The last assistant message id – used to highlight while typing
	const lastAssistantId = $derived(
		[...chatStore.messages].reverse().find((m) => m.role === 'assistant')?.id ?? null
	);

	// System messages are kept for LLM context but not shown in the visible history
	const visibleMessages = $derived(chatStore.messages.filter((m) => m.role !== 'system'));

	function handleClearHistory() {
		if (!browser) return;
		if (confirm('Delete all messages in this chat?')) {
			chatStore.clearMessages();
		}
	}
</script>

<div
	class="sidebar"
	class:open
	bind:this={panelEl}
	style:left={rect ? `${rect.x}px` : undefined}
	style:top={rect ? `${rect.y}px` : undefined}
	style:width={rect ? `${rect.w}px` : undefined}
	style:height={rect ? `${rect.h}px` : undefined}
>
	<div
		class="sidebar-header"
		onpointerdown={onHeaderDown}
		onpointermove={onHeaderMove}
		onpointerup={onHeaderUp}
		onpointercancel={onHeaderUp}
	>
		<button class="dock-btn" onclick={() => snapTo('left')} aria-label="Snap to left edge" title="Snap left">
			<Icon name="chevron-left" size={16} />
		</button>
		<span class="sidebar-title">Chat History</span>
		<button class="dock-btn" onclick={() => snapTo('right')} aria-label="Snap to right edge" title="Snap right">
			<Icon name="chevron-right" size={16} />
		</button>
		<button
			class="clear-btn"
			onclick={handleClearHistory}
			aria-label="Clear chat history"
			title="Clear chat history"
			disabled={visibleMessages.length === 0}
		>
			<Icon name="trash" size={14} />
		</button>
		<button
			class="close-btn"
			onclick={onClose}
			aria-label="Close chat history"
			title="Close chat history"
		>
			<Icon name="x" size={16} />
		</button>
	</div>

	<div class="messages" bind:this={messagesEl}>
		{#if visibleMessages.length === 0}
			<p class="empty-hint">No messages yet.</p>
		{:else}
			{#each visibleMessages as msg (msg.id)}
				{@const isLastAssistant = msg.id === lastAssistantId}
				<div class="message" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
					<div class="bubble" class:speaking={isLastAssistant && isTyping}>
						<p>{@html renderMarkdown(msg.content)}</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.sidebar {
		position: fixed;
		display: flex;
		flex-direction: column;
		background: color-mix(in srgb, var(--bg-primary), transparent 6%);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		z-index: 45;
		pointer-events: none;
		opacity: 0;
		transform: translateY(6px) scale(0.985);
		transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
		resize: both;
		overflow: hidden;
		min-width: 260px;
		min-height: 220px;
	}

	.sidebar.open {
		opacity: 1;
		transform: translateY(0) scale(1);
		pointer-events: auto;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.sidebar-header:active {
		cursor: grabbing;
	}

	.sidebar-title {
		flex: 1;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dock-btn,
	.clear-btn,
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.dock-btn:hover,
	.clear-btn:hover:not(:disabled),
	.close-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.clear-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.clear-btn:hover:disabled {
		background: transparent;
		color: var(--text-tertiary);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.message {
		display: flex;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 85%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-lg);
		font-size: 0.8125rem;
		line-height: 1.5;
		word-wrap: break-word;
	}

	.user .bubble {
		background: var(--accent);
		color: white;
		border-bottom-right-radius: var(--radius-sm);
	}

	.assistant .bubble {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-subtle);
		border-bottom-left-radius: var(--radius-sm);
	}

	.bubble p {
		margin: 0;
	}

	.bubble :global(strong) {
		font-weight: 600;
	}

	.bubble :global(em) {
		font-style: italic;
	}

	.bubble :global(code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--text-primary), transparent 92%);
	}

	.empty-hint {
		text-align: center;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		margin-top: 2rem;
	}

	.bubble.speaking {
		border-color: color-mix(in srgb, var(--accent), transparent 55%);
	}
</style>
