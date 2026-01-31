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

	// Track if there's content to send (for orb/send morphing)
	const hasContent = $derived(inputValue.trim().length > 0 || displayTranscript.trim().length > 0);

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
				class:has-content={hasContent}
				onclick={handleSendClick}
				disabled={disabled || !hasContent}
				aria-label={hasContent ? "Send message" : "Waiting for input"}
			>
				<span class="orb-container">
					<span class="orb orb-blue"></span>
					<span class="orb orb-purple"></span>
					<span class="orb orb-pink"></span>
				</span>
				<span class="send-icon">
					<Icon name="send" size={20} />
				</span>
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
		background: var(--color-error);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-radius: var(--radius-md);
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
		background: var(--bg-primary);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-full);
		padding: 0.5rem;
		min-height: 56px;
		box-shadow: var(--shadow-md);
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.input-wrapper:focus-within {
		border-color: #01B2FF;
		box-shadow: var(--shadow-md), 0 0 0 3px rgba(1, 178, 255, 0.15);
	}

	.input-wrapper.recording {
		border-color: #01B2FF;
		box-shadow: var(--shadow-md), 0 0 0 3px rgba(1, 178, 255, 0.15);
	}

	textarea {
		flex: 1;
		padding: 0.625rem 0.5rem;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 1rem;
		resize: none;
		outline: none;
		font-family: inherit;
		line-height: 1.5;
		max-height: 120px;
	}

	textarea::placeholder {
		color: var(--text-tertiary);
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
		color: var(--text-tertiary);
	}

	.mic-btn:hover:not(:disabled) {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.mic-btn.recording {
		background: #01B2FF;
		color: white;
		animation: pulse-recording 1.5s ease-in-out infinite;
	}

	.mic-btn.recording:hover {
		background: #00a0e6;
	}

	@keyframes pulse-recording {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(1, 178, 255, 0.4);
		}
		50% {
			box-shadow: 0 0 0 8px rgba(1, 178, 255, 0);
		}
	}

	.send-btn {
		position: relative;
		background: transparent;
		color: white;
	}

	/* Soft orb container - visible when no content */
	.orb-container {
		position: absolute;
		inset: 0;
		opacity: 1;
		transition: opacity 0.3s ease, transform 0.3s ease;
		pointer-events: none;
		clip-path: inset(-8px -8px -8px 0);
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(8px);
		opacity: 0.9;
		animation: orb-float 4s ease-in-out infinite;
	}

	.orb-blue {
		width: 24px;
		height: 24px;
		background: #01B2FF;
		top: 8px;
		left: 10px;
		animation-delay: 0s;
	}

	.orb-purple {
		width: 18px;
		height: 18px;
		background: #7c3aed;
		top: 12px;
		left: 14px;
		animation-delay: -1.3s;
	}

	.orb-pink {
		width: 14px;
		height: 14px;
		background: #ec4899;
		top: 14px;
		left: 10px;
		animation-delay: -2.6s;
	}

	@keyframes orb-float {
		0%, 100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(4px, -4px) scale(1.1);
		}
		66% {
			transform: translate(-2px, 2px) scale(0.9);
		}
	}

	/* Send icon - hidden when no content */
	.send-icon {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: scale(0.5) rotate(-45deg);
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	/* When has content: morph to send button */
	.send-btn.has-content {
		background: #01B2FF;
	}

	.send-btn.has-content .orb-container {
		opacity: 0;
		transform: scale(0);
	}

	.send-btn.has-content .send-icon {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}

	.send-btn.has-content:hover:not(:disabled) {
		background: #00a0e6;
	}

	.send-btn.has-content:active:not(:disabled) {
		transform: scale(0.95);
	}

	.send-btn:disabled:not(.has-content) {
		cursor: default;
	}

	.send-btn.has-content:disabled {
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
