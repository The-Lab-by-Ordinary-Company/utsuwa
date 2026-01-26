<script lang="ts">
	import { Icon } from '$lib/components/ui';

	interface Props {
		onSend: (content: string) => void;
		disabled?: boolean;
	}

	let { onSend, disabled = false }: Props = $props();
	let inputValue = $state('');
	let textareaRef: HTMLTextAreaElement;

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (inputValue.trim() && !disabled) {
			onSend(inputValue.trim());
			inputValue = '';
			// Reset textarea height
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
		// Auto-resize textarea
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = Math.min(textareaRef.scrollHeight, 150) + 'px';
		}
	}
</script>

<form class="chat-input" onsubmit={handleSubmit}>
	<div class="input-wrapper">
		<textarea
			bind:this={textareaRef}
			bind:value={inputValue}
			onkeydown={handleKeydown}
			oninput={handleInput}
			placeholder="Type a message..."
			rows="1"
			{disabled}
		></textarea>
		<button type="submit" disabled={disabled || !inputValue.trim()} aria-label="Send message">
			<Icon name="send" size={18} />
		</button>
	</div>
</form>

<style>
	.chat-input {
		padding: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.input-wrapper {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 1.5rem;
		padding: 0.375rem 0.5rem 0.375rem 1rem;
		transition: all 0.2s;
	}

	.input-wrapper:focus-within {
		border-color: var(--color-ring);
	}

	textarea {
		flex: 1;
		padding: 0.5rem 0;
		border: none;
		background: transparent;
		color: var(--color-neutral-900);
		font-size: 0.875rem;
		resize: none;
		outline: none;
		font-family: inherit;
		line-height: 1.5;
		max-height: 150px;
	}

	textarea::placeholder {
		color: var(--color-neutral-400);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button {
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 50%;
		background: var(--color-muted);
		color: var(--color-muted-foreground);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	button:hover:not(:disabled) {
		background: var(--color-neutral-200);
		color: var(--color-foreground);
	}

	button:active:not(:disabled) {
		transform: scale(0.95);
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
