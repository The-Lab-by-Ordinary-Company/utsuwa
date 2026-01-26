<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { sttStore } from '$lib/stores/stt.svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';

	interface Props {
		onSend: (content: string) => void;
		disabled?: boolean;
	}

	let { onSend, disabled = false }: Props = $props();
	let inputValue = $state('');
	let textareaRef: HTMLTextAreaElement;

	const isListening = $derived(sttStore.isListening);
	const audioLevel = $derived(sttStore.audioLevel);
	const displayTranscript = $derived(sttStore.displayTranscript);
	const sttError = $derived(sttStore.error);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (inputValue.trim() && !disabled) {
			onSend(inputValue.trim());
			inputValue = '';
			if (textareaRef) {
				textareaRef.style.height = 'auto';
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (inputValue.trim() && !disabled) {
				onSend(inputValue.trim());
				inputValue = '';
				if (textareaRef) {
					textareaRef.style.height = 'auto';
				}
			}
		}
	}

	function handleInput() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = Math.min(textareaRef.scrollHeight, 120) + 'px';
		}
	}

	function handleMicClick() {
		if (!sttStore.isSupported()) {
			sttStore.showUnsupportedError();
			return;
		}
		if (isListening) {
			sttStore.stopListening();
		} else {
			sttStore.startListening((text) => {
				onSend(text);
			});
		}
	}

	function handleCancelRecording() {
		sttStore.cancel();
	}

	function handleSendClick() {
		if (isListening && displayTranscript.trim()) {
			// Send the current transcript and stop listening
			const text = displayTranscript.trim();
			sttStore.cancel();
			onSend(text);
		} else if (inputValue.trim() && !disabled) {
			onSend(inputValue.trim());
			inputValue = '';
			if (textareaRef) {
				textareaRef.style.height = 'auto';
			}
		}
	}
</script>

{#if sttError}
	<div class="stt-error" onclick={() => sttStore.clearError()}>
		<Icon name="alert" size={16} />
		<span>{sttError}</span>
		<button type="button" class="dismiss-btn" aria-label="Dismiss">
			<Icon name="x" size={14} />
		</button>
	</div>
{/if}

<div class="bottom-chat-bar">
	<form class="chat-form" onsubmit={handleSubmit}>
		<div class="input-wrapper" class:recording={isListening}>
			{#if isListening}
				<button
					type="button"
					class="mic-btn recording"
					onclick={handleCancelRecording}
					aria-label="Cancel recording"
					title="Cancel recording"
				>
					<Icon name="x" size={20} />
				</button>
				<AudioVisualizer {audioLevel} transcript={displayTranscript} />
			{:else}
				<button
					type="button"
					class="mic-btn"
					onclick={handleMicClick}
					aria-label="Voice input"
					title="Voice input"
				>
					<Icon name="mic" size={20} />
				</button>
				<textarea
					bind:this={textareaRef}
					bind:value={inputValue}
					onkeydown={handleKeydown}
					oninput={handleInput}
					placeholder="Type a message..."
					rows="1"
					{disabled}
				></textarea>
			{/if}
			<button
				type="button"
				class="send-btn"
				onclick={handleSendClick}
				disabled={disabled || (!inputValue.trim() && !displayTranscript.trim())}
				aria-label="Send message"
			>
				<Icon name="send" size={20} />
			</button>
		</div>
	</form>
</div>

<style>
	.bottom-chat-bar {
		position: fixed;
		bottom: 2.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 600px;
		padding: 0 1rem;
		z-index: 40;
	}

	.stt-error {
		position: fixed;
		top: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		width: fit-content;
		max-width: 600px;
		background: color-mix(in srgb, var(--ctp-red, #d20f39) 90%, var(--color-neutral-900));
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-radius: 0.75rem;
		color: white;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 50;
		animation: slideDownShake 0.5s ease-out;
	}

	@keyframes slideDownShake {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(-8px);
		}
		30% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
		45% {
			transform: translateX(calc(-50% + 6px)) translateY(0);
		}
		60% {
			transform: translateX(calc(-50% - 5px)) translateY(0);
		}
		75% {
			transform: translateX(calc(-50% + 3px)) translateY(0);
		}
		90% {
			transform: translateX(calc(-50% - 2px)) translateY(0);
		}
		100% {
			transform: translateX(-50%) translateY(0);
		}
	}

	.stt-error span {
		flex: 1;
		word-wrap: break-word;
	}

	.dismiss-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: white;
		opacity: 0.8;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dismiss-btn:hover {
		opacity: 1;
	}

	.chat-form {
		width: 100%;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--glass-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-border);
		border-radius: 1.75rem;
		padding: 0.5rem;
		min-height: 56px;
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 2px 8px rgba(0, 0, 0, 0.04);
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.input-wrapper:focus-within {
		border-color: var(--color-ring);
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.input-wrapper.recording {
		border-color: var(--accent);
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.12),
			0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
	}

	textarea {
		flex: 1;
		padding: 0.625rem 0.5rem;
		border: none;
		background: transparent;
		color: var(--color-neutral-900);
		font-size: 1rem;
		resize: none;
		outline: none;
		font-family: inherit;
		line-height: 1.5;
		max-height: 120px;
	}

	textarea::placeholder {
		color: var(--color-neutral-500);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.mic-btn,
	.send-btn {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.mic-btn {
		background: transparent;
		color: var(--color-neutral-500);
	}

	.mic-btn:hover:not(:disabled) {
		background: var(--color-neutral-200);
		color: var(--color-neutral-700);
	}

	.mic-btn.recording {
		background: var(--accent);
		color: var(--accent-foreground);
		animation: pulse-recording 1.5s ease-in-out infinite;
	}

	.mic-btn.recording:hover {
		background: var(--accent-hover);
	}

	
	@keyframes pulse-recording {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 40%, transparent);
		}
		50% {
			box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent) 0%, transparent);
		}
	}

	:global(.dark) .mic-btn:hover:not(:disabled):not(.recording) {
		background: var(--color-neutral-300);
		color: var(--color-neutral-700);
	}

	.send-btn {
		background: var(--accent);
		color: var(--accent-foreground);
	}

	.send-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.send-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.bottom-chat-bar {
			bottom: 1rem;
			max-width: none;
			padding: 0 0.75rem;
		}

		.stt-error {
			width: fit-content;
			max-width: calc(100vw - 1.5rem);
		}
	}
</style>
