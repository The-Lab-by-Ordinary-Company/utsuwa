<script lang="ts">
	import { vrmStore } from '$lib/stores/vrm.svelte';

	interface Props {
		message: string;
		isTyping?: boolean;
		onHide?: () => void;
	}

	let { message, isTyping = false, onHide }: Props = $props();

	// Get screen position from VRM store for 3D tracking
	const screenPos = $derived(vrmStore.headScreenPosition);

	// Calculate bubble position (offset to the right of head)
	// Typing indicator appears closer to model, message bubble has more offset
	const bubbleStyle = $derived(() => {
		if (!screenPos) {
			// Fallback to fixed position if no tracking available
			return isTyping ? 'top: 25%; right: 25%;' : 'top: 22%; right: 15%;';
		}

		if (isTyping) {
			// Typing indicator: closer to the head
			const x = Math.min(Math.max(screenPos.x - 2, 5), 75);
			const y = Math.min(Math.max(screenPos.y - 6, 5), 60);
			return `top: ${y}%; left: ${x}%;`;
		} else {
			// Message: current position with more offset
			const x = Math.min(Math.max(screenPos.x + 3, 5), 80);
			const y = Math.min(Math.max(screenPos.y - 8, 5), 65);
			return `top: ${y}%; left: ${x}%;`;
		}
	});

	let visible = $state(true);

	// Reset visibility when new message/typing starts
	$effect(() => {
		if (message || isTyping) {
			visible = true;
		}
	});

	function handleClick() {
		visible = false;
		onHide?.();
	}
</script>

{#if visible && (message || isTyping)}
	<div class="speech-bubble-container" role="status" aria-live="polite" style={bubbleStyle()}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="speech-bubble" onclick={handleClick}>
			<div class="speech-bubble-content">
				{#if isTyping}
					<div class="typing-indicator">
						<span></span>
						<span></span>
						<span></span>
					</div>
				{:else}
					<p class="message">{message}</p>
				{/if}
			</div>
			<div class="bubble-tail"></div>
		</div>
	</div>
{/if}

<style>
	.speech-bubble-container {
		position: fixed;
		z-index: 50;
		pointer-events: none;
		animation: fadeIn 0.25s ease-out;
		/* Position set dynamically via style attribute */
		transition: top 0.1s ease-out, left 0.1s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.speech-bubble {
		position: relative;
		max-width: 280px;
		min-width: 60px;
		max-height: 120px;
		overflow: hidden;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		pointer-events: auto;
		cursor: pointer;
		transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
	}

	.speech-bubble:hover {
		transform: scale(1.02) translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	.speech-bubble-content {
		max-height: 120px;
		overflow-y: auto;
		padding: 0.75rem 1rem;
	}

	/* Custom scrollbar */
	.speech-bubble-content::-webkit-scrollbar {
		width: 6px;
	}

	.speech-bubble-content::-webkit-scrollbar-track {
		background: transparent;
		margin: 4px 0;
	}

	.speech-bubble-content::-webkit-scrollbar-thumb {
		background: var(--scrollbar-thumb);
		border-radius: 3px;
	}

	.speech-bubble-content::-webkit-scrollbar-thumb:hover {
		background: var(--scrollbar-thumb-hover);
	}

	.bubble-tail {
		position: absolute;
		left: -8px;
		top: 50%;
		transform: translateY(-50%);
		width: 0;
		height: 0;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		border-right: 10px solid var(--bg-secondary);
	}

	.message {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		word-wrap: break-word;
		color: var(--text-primary);
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
		padding: 0.125rem 0;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: var(--accent);
		border-radius: 50%;
		animation: bounce 1.4s ease-in-out infinite;
	}

	.typing-indicator span:nth-child(1) {
		animation-delay: 0s;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%, 60%, 100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-4px);
		}
	}

	@media (max-width: 640px) {
		.speech-bubble {
			max-width: 220px;
		}
	}
</style>
