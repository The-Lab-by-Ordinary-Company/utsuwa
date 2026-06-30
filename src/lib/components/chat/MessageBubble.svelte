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
		border-radius: 0.875rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			0 3px 12px rgba(0, 0, 0, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.bubble {
		padding: 0.625rem 0.875rem;
		border-radius: 1rem;
		white-space: pre-wrap;
		word-wrap: break-word;
		line-height: 1.5;
		font-size: 0.875rem;
	}

	.user .bubble {
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 60%, #0099dd 100%);
		color: white;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		border-bottom-right-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow:
			0 3px 10px rgba(1, 178, 255, 0.3),
			0 1px 3px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.assistant .bubble {
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		color: var(--text-primary);
		border-bottom-left-radius: 0.25rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.06),
			0 1px 2px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .assistant .bubble {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 1px 2px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}
</style>
