<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import { Icon } from '$lib/components/ui';
	import MessageBubble from './MessageBubble.svelte';

	let container: HTMLDivElement;

	// Auto-scroll to bottom when messages change
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		chatStore.messages;
		if (container) {
			setTimeout(() => {
				container.scrollTop = container.scrollHeight;
			}, 10);
		}
	});
</script>

<div class="message-list" bind:this={container}>
	{#if chatStore.messages.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Icon name="message-square" size={48} strokeWidth={1.5} />
			</div>
			<p>Start a conversation</p>
			<span>Type a message to chat with Utsuwa</span>
		</div>
	{:else}
		{#each chatStore.messages as message (message.id)}
			<MessageBubble {message} />
		{/each}
	{/if}

	{#if chatStore.isLoading && chatStore.messages[chatStore.messages.length - 1]?.content === ''}
		<div class="typing-indicator">
			<span></span>
			<span></span>
			<span></span>
		</div>
	{/if}
</div>

<style>
	.message-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--color-neutral-400);
		text-align: center;
		padding: 2rem;
	}

	.empty-icon {
		opacity: 0.5;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-weight: 500;
		color: var(--color-neutral-500);
	}

	.empty-state span {
		font-size: 0.75rem;
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
		padding: 0.75rem 1rem;
		background: var(--color-neutral-100);
		border-radius: 1rem;
		border-bottom-left-radius: 0.25rem;
		width: fit-content;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: var(--color-neutral-400);
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.typing-indicator span:nth-child(1) {
		animation-delay: -0.32s;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
</style>
