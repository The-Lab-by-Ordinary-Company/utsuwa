<script lang="ts">
	import { browser } from '$app/environment';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { Icon } from '$lib/components/ui';
	import { tick } from 'svelte';

	interface Props {
		open: boolean;
		onClose?: () => void;
		isTyping?: boolean;
	}

	let { open, onClose, isTyping = false }: Props = $props();

	let messagesEl: HTMLDivElement | null = $state(null);
	let scrollRaf: number | null = null;

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

	function togglePosition() {
		displayStore.setSidebarPosition(displayStore.sidebarPosition === 'right' ? 'left' : 'right');
	}

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
	class:left={displayStore.sidebarPosition === 'left'}
	class:right={displayStore.sidebarPosition === 'right'}
>
	<div class="sidebar-header">
		{#if displayStore.sidebarPosition === 'right'}
			<button class="dock-btn" onclick={togglePosition} aria-label="Dock sidebar to left" title="Dock left">
				<Icon name="chevron-left" size={16} />
			</button>
		{/if}
		<span class="sidebar-title">Chat History</span>
		{#if displayStore.sidebarPosition === 'left'}
			<button class="dock-btn" onclick={togglePosition} aria-label="Dock sidebar to right" title="Dock right">
				<Icon name="chevron-right" size={16} />
			</button>
		{/if}
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
						<p>{msg.content}</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.sidebar {
		position: fixed;
		top: 0;
		bottom: 0;
		width: 320px;
		max-width: 85vw;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(245, 245, 245, 0.92) 100%);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		z-index: 45;
		pointer-events: none;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.dark) .sidebar {
		background: linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
	}

	.sidebar.right {
		right: 0;
		transform: translateX(100%);
		border-left: 1px solid var(--border-light);
	}

	.sidebar.left {
		left: 0;
		transform: translateX(-100%);
		border-right: 1px solid var(--border-light);
	}

	.sidebar.open {
		transform: translateX(0);
		pointer-events: auto;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-light);
		flex-shrink: 0;
	}

	.sidebar-title {
		flex: 1;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dock-btn,
	.clear-btn,
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.dock-btn:hover,
	.clear-btn:hover:not(:disabled),
	.close-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.clear-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.clear-btn:hover:disabled {
		background: transparent;
		color: var(--text-secondary);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		border-radius: 14px;
		font-size: 0.8125rem;
		line-height: 1.5;
		word-wrap: break-word;
	}

	.user .bubble {
		background: linear-gradient(180deg, var(--accent) 0%, var(--accent-hover) 100%);
		color: var(--color-accent-foreground);
		border-bottom-right-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 178, 255, 0.3);
	}

	.assistant .bubble {
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		color: var(--text-primary);
		border: 1px solid var(--border-subtle);
		border-bottom-left-radius: 4px;
		box-shadow: var(--shadow-sm);
	}

	.bubble p {
		margin: 0;
	}

	.empty-hint {
		text-align: center;
		font-size: 0.8125rem;
		color: var(--text-secondary, #999);
		margin-top: 2rem;
	}

	.bubble.speaking {
		border-color: rgba(0, 178, 255, 0.35);
		box-shadow: 0 2px 8px rgba(0, 178, 255, 0.15);
	}
</style>
