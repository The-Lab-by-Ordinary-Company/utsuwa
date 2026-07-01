<script lang="ts">
	import type { Message } from '$lib/stores/chat.svelte';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();

	const isUser = $derived(message.role === 'user');
</script>

<div class="message-bubble" class:user={isUser} class:assistant={!isUser}>
	<div class="message-content">
		{#if message.images?.length}
			<div class="shown-images">
				{#each message.images as img (img.id)}
					<img src={img.url} alt="Shared with her" class="shown-image" />
				{/each}
			</div>
		{/if}
		{#if message.content || !isUser}
			<div class="bubble">
				{message.content || '...'}
			</div>
		{/if}
	</div>
</div>

<style>
	.message-bubble {
		display: flex;
		max-width: 90%;
	}

	.message-bubble.user {
		justify-content: flex-end;
		align-self: flex-end;
	}

	.message-bubble.assistant {
		justify-content: flex-start;
		align-self: flex-start;
	}

	.message-content {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 0;
	}

	.user .message-content {
		align-items: flex-end;
	}

	.assistant .message-content {
		align-items: flex-start;
	}

	.shown-images {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.user .shown-images {
		justify-content: flex-end;
	}

	.shown-image {
		max-width: 180px;
		max-height: 220px;
		object-fit: cover;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-light);
		box-shadow: var(--shadow-sm);
	}

	.bubble {
		padding: 0.625rem 0.875rem;
		border-radius: var(--radius-lg);
		white-space: pre-wrap;
		word-wrap: break-word;
		line-height: 1.5;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	.user .bubble {
		background: var(--accent);
		color: #fff;
		border-bottom-right-radius: var(--radius-xs);
	}

	.assistant .bubble {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-bottom-left-radius: var(--radius-xs);
	}
</style>
