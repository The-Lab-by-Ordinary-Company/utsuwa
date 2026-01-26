<script lang="ts">
	import type { Message } from '$lib/stores/chat.svelte';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();

	const isUser = $derived(message.role === 'user');
</script>

<div class="message-bubble" class:user={isUser} class:assistant={!isUser}>
	<div class="bubble">
		{message.content || '...'}
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

	.bubble {
		padding: 0.625rem 0.875rem;
		border-radius: 1rem;
		white-space: pre-wrap;
		word-wrap: break-word;
		line-height: 1.5;
		font-size: 0.875rem;
	}

	.user .bubble {
		background: var(--color-muted);
		color: var(--color-neutral-800);
		border-bottom-right-radius: 0.25rem;
		border: 1px solid var(--color-border);
	}

	.assistant .bubble {
		background: var(--color-neutral-100);
		color: var(--color-neutral-800);
		border-bottom-left-radius: 0.25rem;
		border: 2px solid var(--color-neutral-200);
	}
</style>
