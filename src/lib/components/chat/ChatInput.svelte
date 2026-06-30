<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { prepareImage, type PreparedImage } from '$lib/services/storage/keepsakes';

	interface Props {
		onSend: (content: string, images?: PreparedImage[]) => void;
		disabled?: boolean;
	}

	let { onSend, disabled = false }: Props = $props();
	let inputValue = $state('');
	let textareaRef: HTMLTextAreaElement;
	let fileInput: HTMLInputElement;
	// Images queued to show her, with a preview URL for the chip.
	let pending = $state<{ image: PreparedImage; url: string }[]>([]);

	const canSend = $derived(!disabled && (inputValue.trim().length > 0 || pending.length > 0));

	async function handleFiles(files: FileList | null) {
		if (!files) return;
		for (const file of Array.from(files)) {
			if (!file.type.startsWith('image/')) continue;
			const image = await prepareImage(file);
			pending = [...pending, { image, url: URL.createObjectURL(file) }];
		}
		if (fileInput) fileInput.value = '';
	}

	function removePending(id: string) {
		pending = pending.filter((p) => {
			if (p.image.id === id) URL.revokeObjectURL(p.url);
			return p.image.id !== id;
		});
	}

	function send() {
		if (!canSend) return;
		onSend(
			inputValue.trim(),
			pending.map((p) => p.image)
		);
		pending.forEach((p) => URL.revokeObjectURL(p.url));
		pending = [];
		inputValue = '';
		if (textareaRef) textareaRef.style.height = 'auto';
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		send();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function handleInput() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = Math.min(textareaRef.scrollHeight, 150) + 'px';
		}
	}
</script>

<form class="chat-input" onsubmit={handleSubmit}>
	{#if pending.length > 0}
		<div class="pending-row">
			{#each pending as p (p.image.id)}
				<div class="pending-chip">
					<img src={p.url} alt="To show her" />
					<button
						type="button"
						class="remove-chip"
						aria-label="Remove image"
						onclick={() => removePending(p.image.id)}
					>
						<Icon name="close" size={12} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
	<div class="input-wrapper">
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			class="file-input"
			onchange={(e) => handleFiles(e.currentTarget.files)}
		/>
		<button
			type="button"
			class="show-btn"
			{disabled}
			aria-label="Show her an image"
			onclick={() => fileInput?.click()}
		>
			<Icon name="camera" size={18} />
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
		<button type="submit" disabled={!canSend} aria-label="Send message">
			<Icon name="send" size={18} />
		</button>
	</div>
</form>

<style>
	.chat-input {
		padding: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.pending-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.pending-chip {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
	}

	.pending-chip img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-chip {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
	}

	.file-input {
		display: none;
	}

	.input-wrapper {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 1.5rem;
		padding: 0.375rem 0.5rem;
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

	.show-btn {
		background: transparent;
		color: var(--color-neutral-400);
	}

	.show-btn:hover:not(:disabled) {
		background: var(--color-neutral-200);
		color: var(--color-foreground);
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
