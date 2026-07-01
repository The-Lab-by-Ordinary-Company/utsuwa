<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { prepareImage, UnsupportedImageError, type PreparedImage } from '$lib/services/storage/keepsakes';
	import AudioVisualizer from './AudioVisualizer.svelte';

	interface Props {
		onSend: (content: string, images?: PreparedImage[]) => void;
		disabled?: boolean;
		visionCapable?: boolean;
	}

	let { onSend, disabled = false, visionCapable = true }: Props = $props();
	// Brief toast for image issues (blind model, unsupported format).
	let hint = $state<string | null>(null);
	let hintTimer: ReturnType<typeof setTimeout> | null = null;

	function showHint(message: string) {
		hint = message;
		if (hintTimer) clearTimeout(hintTimer);
		hintTimer = setTimeout(() => (hint = null), 6000);
	}

	function promptVision() {
		showHint(
			"This model can't see images. Pick a vision model (GPT-4o, Claude, Gemini, or a local one like llava) in Settings."
		);
	}

	function openPicker() {
		if (!visionCapable) {
			promptVision();
			return;
		}
		fileInput?.click();
	}

	let inputValue = $state('');
	let textareaRef: HTMLTextAreaElement;
	let fileInput: HTMLInputElement;
	// Images queued to show her, each with a preview URL for the chip.
	let pending = $state<{ image: PreparedImage; url: string }[]>([]);
	// Drag-to-show: the whole window is a drop target; the bar morphs into one.
	let dragActive = $state(false);
	let dragDepth = 0;

	function dragHasFiles(e: DragEvent): boolean {
		return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
	}

	function handleDragEnter(e: DragEvent) {
		if (!dragHasFiles(e)) return;
		dragDepth++;
		dragActive = true;
	}

	function handleDragOver(e: DragEvent) {
		if (dragHasFiles(e)) e.preventDefault();
	}

	function handleDragLeave(e: DragEvent) {
		if (!dragHasFiles(e)) return;
		dragDepth--;
		if (dragDepth <= 0) {
			dragDepth = 0;
			dragActive = false;
		}
	}

	function handleDrop(e: DragEvent) {
		if (!dragHasFiles(e)) return;
		e.preventDefault();
		dragDepth = 0;
		dragActive = false;
		handleFiles(e.dataTransfer?.files ?? null);
	}

	const isListening = $derived(sttStore.isListening);
	const isTranscribing = $derived(sttStore.isTranscribing);
	const audioLevel = $derived(sttStore.audioLevel);
	const displayTranscript = $derived(sttStore.displayTranscript);
	const sttError = $derived(sttStore.error);

	// Track if there's content to send
	const hasContent = $derived(
		inputValue.trim().length > 0 || displayTranscript.trim().length > 0 || pending.length > 0
	);

	async function handleFiles(files: FileList | null) {
		if (!files) return;
		if (!visionCapable) {
			promptVision();
			return;
		}
		for (const file of Array.from(files)) {
			if (!file.type.startsWith('image/')) continue;
			try {
				const image = await prepareImage(file);
				pending = [...pending, { image, url: URL.createObjectURL(file) }];
			} catch (e) {
				showHint(
					e instanceof UnsupportedImageError
						? "That image format isn't supported. Try a JPEG, PNG, GIF or WebP (iPhone HEIC photos won't work)."
						: "Couldn't read that image. Try a different one."
				);
			}
		}
		if (fileInput) fileInput.value = '';
	}

	function removePending(id: string) {
		pending = pending.filter((p) => {
			if (p.image.id === id) URL.revokeObjectURL(p.url);
			return p.image.id !== id;
		});
	}

	// Single send path: text plus any queued images.
	function doSend(text: string) {
		if (disabled) return;
		const images = pending.map((p) => p.image);
		if (!text && images.length === 0) return;
		onSend(text, images);
		pending.forEach((p) => URL.revokeObjectURL(p.url));
		pending = [];
		inputValue = '';
		if (textareaRef) textareaRef.style.height = 'auto';
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		doSend(inputValue.trim());
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			doSend(inputValue.trim());
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
			const text = displayTranscript.trim();
			sttStore.cancel();
			onSend(text);
		} else {
			doSend(inputValue.trim());
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

{#if hint}
	<div class="vision-hint">
		<Icon name="camera" size={16} />
		<span>{hint}</span>
	</div>
{/if}

<svelte:window
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
/>

<div class="bottom-chat-bar" class:dragging={dragActive}>
	{#if dragActive}
		<div class="drop-zone">
			<Icon name="camera" size={22} />
			<span>Drop a photo to show her</span>
		</div>
	{/if}
	{#if pending.length > 0}
		<div class="pending-row">
			{#each pending as p (p.image.id)}
				<div class="pending-chip">
					<img src={p.url} alt="To show her" />
					<button type="button" class="remove-chip" aria-label="Remove image" onclick={() => removePending(p.image.id)}>
						<Icon name="x" size={12} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
	<form class="chat-form" onsubmit={handleSubmit}>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			style="display:none"
			onchange={(e) => handleFiles(e.currentTarget.files)}
		/>
		<div class="input-wrapper" class:recording={isListening} class:transcribing={isTranscribing} class:focused={hasContent}>
			{#if isTranscribing}
				<button
					type="button"
					class="mic-btn recording"
					disabled
					aria-label="Transcribing"
				>
					<Icon name="loader" size={20} />
				</button>
				<div class="transcribing-label">Transcribing...</div>
			{:else if isListening}
				<button
					type="button"
					class="mic-btn recording"
					onclick={() => sttStore.stopListening()}
					aria-label="Stop recording"
					title="Stop recording"
				>
					<Icon name="stop" size={16} />
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
				<button
					type="button"
					class="mic-btn"
					class:vision-off={!visionCapable}
					onclick={openPicker}
					aria-label="Show her an image"
					title={visionCapable ? 'Show her an image' : 'This model cannot see images'}
				>
					<Icon name="camera" size={20} />
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
				disabled={disabled || isTranscribing || !hasContent}
				aria-label={hasContent ? "Send message" : "Waiting for input"}
			>
				<span class="send-icon">
					<Icon name="send" size={20} />
				</span>
				<span class="btn-shine"></span>
			</button>
		</div>
	</form>
</div>

<style>
	.mic-btn.vision-off { opacity: 0.45; }
	.vision-hint {
		position: fixed;
		top: calc(1.25rem + env(safe-area-inset-top, 0));
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		max-width: min(420px, 90vw);
		background: linear-gradient(180deg, #5fd6ff 0%, #01B2FF 100%);
		color: white;
		border-radius: 16px;
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.35;
		z-index: 50;
		box-shadow:
			0 8px 24px rgba(1, 178, 255, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
		animation: hintDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.vision-hint :global(svg) { flex-shrink: 0; }
	@keyframes hintDrop {
		from { transform: translate(-50%, -16px) scale(0.96); opacity: 0; }
		to { transform: translate(-50%, 0) scale(1); opacity: 1; }
	}
	.drop-zone {
		position: absolute;
		left: 1rem;
		right: 1rem;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		min-height: 52px;
		border-radius: 1.5rem;
		background: linear-gradient(180deg, #5fd6ff 0%, #01B2FF 55%, #0094d6 100%);
		border: 1px solid rgba(255, 255, 255, 0.4);
		color: white;
		font-size: 0.95rem;
		font-weight: 700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
		box-shadow:
			0 10px 26px rgba(1, 178, 255, 0.5),
			0 2px 6px rgba(0, 0, 0, 0.15),
			inset 0 2px 0 rgba(255, 255, 255, 0.55),
			inset 0 -3px 6px rgba(0, 0, 0, 0.12);
		z-index: 5;
		pointer-events: none;
		overflow: hidden;
		animation: dropPop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	/* glossy shine across the top, like the app's buttons */
	.drop-zone::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 52%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.06) 100%);
		border-radius: 1.5rem 1.5rem 50% 50%;
		pointer-events: none;
	}
	.drop-zone :global(svg) {
		animation: dropIcon 0.9s ease-in-out infinite;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}
	@keyframes dropPop {
		0% { transform: scale(0.8); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}
	@keyframes dropIcon {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-4px) rotate(-6deg); }
	}
	.pending-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0 0.5rem; }
	.pending-chip {
		position: relative;
		width: 56px;
		height: 56px;
		cursor: pointer;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.pending-chip:hover {
		transform: scale(1.12) translateY(-3px) rotate(-3deg);
		z-index: 2;
	}
	.pending-chip img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.875rem;
		border: 2px solid rgba(255, 255, 255, 0.9);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
	}
	.pending-chip:hover img {
		border-color: #01B2FF;
		box-shadow:
			0 10px 22px rgba(1, 178, 255, 0.45),
			0 4px 8px rgba(0, 0, 0, 0.18);
	}
	.remove-chip {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 19px;
		height: 19px;
		border: 2px solid white;
		border-radius: 50%;
		background: #ff5a5a;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
		opacity: 0;
		transform: scale(0.4);
		transition: opacity 0.16s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.pending-chip:hover .remove-chip {
		opacity: 1;
		transform: scale(1);
	}
	.remove-chip:hover {
		transform: scale(1.2);
	}
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
		background: linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 16px;
		color: white;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 50;
		animation: slideDownShake 0.5s ease-out;
		box-shadow:
			0 4px 20px rgba(238, 90, 90, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
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
		background: rgba(255, 255, 255, 0.2);
		border: none;
		padding: 0.25rem;
		border-radius: 6px;
		cursor: pointer;
		color: white;
		opacity: 0.9;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.dismiss-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}

	.chat-form {
		width: 100%;
	}

	/* PS2/Y2K style glossy input wrapper */
	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.98) 0%,
			rgba(250, 250, 252, 0.95) 50%,
			rgba(245, 245, 248, 0.98) 100%
		);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 2px solid rgba(255, 255, 255, 0.8);
		border-radius: 28px;
		padding: 0.5rem;
		min-height: 56px;
		/* Layered shadows for depth */
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.06),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 8px 32px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.03);
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.dark) .input-wrapper {
		background: linear-gradient(
			180deg,
			rgba(45, 45, 50, 0.98) 0%,
			rgba(38, 38, 42, 0.95) 50%,
			rgba(32, 32, 36, 0.98) 100%
		);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 8px 32px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
	}

	.input-wrapper:focus-within,
	.input-wrapper.focused {
		border-color: rgba(1, 178, 255, 0.5);
		box-shadow:
			0 0 0 1px rgba(1, 178, 255, 0.2),
			0 0 0 4px rgba(1, 178, 255, 0.1),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 0 30px rgba(1, 178, 255, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 1);
	}

	:global(.dark) .input-wrapper:focus-within,
	:global(.dark) .input-wrapper.focused {
		border-color: rgba(1, 178, 255, 0.4);
		box-shadow:
			0 0 0 1px rgba(1, 178, 255, 0.3),
			0 0 0 4px rgba(1, 178, 255, 0.15),
			0 4px 20px rgba(0, 0, 0, 0.3),
			0 0 40px rgba(1, 178, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.input-wrapper.recording {
		border-color: rgba(1, 178, 255, 0.6);
		box-shadow:
			0 0 0 1px rgba(1, 178, 255, 0.3),
			0 0 0 4px rgba(1, 178, 255, 0.15),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 0 30px rgba(1, 178, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 1);
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow:
				0 0 0 1px rgba(1, 178, 255, 0.3),
				0 0 0 4px rgba(1, 178, 255, 0.15),
				0 4px 20px rgba(0, 0, 0, 0.08),
				0 0 30px rgba(1, 178, 255, 0.2),
				inset 0 1px 0 rgba(255, 255, 255, 1);
		}
		50% {
			box-shadow:
				0 0 0 1px rgba(1, 178, 255, 0.4),
				0 0 0 6px rgba(1, 178, 255, 0.1),
				0 4px 20px rgba(0, 0, 0, 0.08),
				0 0 40px rgba(1, 178, 255, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 1);
		}
	}

	.input-wrapper.transcribing {
		border-color: rgba(1, 178, 255, 0.4);
	}

	.transcribing-label {
		flex: 1;
		padding: 0.625rem 0.5rem;
		font-size: 0.9rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.mic-btn.recording:disabled {
		opacity: 0.7;
		cursor: wait;
		animation: none;
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

	/* Glossy Y2K buttons */
	.mic-btn,
	.send-btn {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}

	.mic-btn {
		background: linear-gradient(
			180deg,
			#ffffff 0%,
			#f0f0f2 50%,
			#e8e8ea 100%
		);
		color: var(--text-tertiary);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .mic-btn {
		background: linear-gradient(
			180deg,
			#3a3a3e 0%,
			#2e2e32 50%,
			#262628 100%
		);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
	}

	.mic-btn:hover:not(:disabled) {
		color: var(--text-primary);
		transform: translateY(-2px);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .mic-btn:hover:not(:disabled) {
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.12);
	}

	.mic-btn:active:not(:disabled) {
		transform: translateY(0) scale(0.96);
	}

	.mic-btn.recording {
		background: linear-gradient(
			180deg,
			#66d9ff 0%,
			#4dd0ff 30%,
			#01B2FF 70%,
			#0099dd 100%
		);
		color: white;
		border-color: rgba(0, 0, 0, 0.1);
		animation: recording-pulse 1.5s ease-in-out infinite;
		box-shadow:
			0 4px 16px rgba(1, 178, 255, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.mic-btn.recording:hover {
		background: linear-gradient(
			180deg,
			#80e0ff 0%,
			#66d9ff 30%,
			#1ebfff 70%,
			#00a6e6 100%
		);
	}

	@keyframes recording-pulse {
		0%, 100% {
			box-shadow:
				0 4px 16px rgba(1, 178, 255, 0.5),
				0 0 0 0 rgba(1, 178, 255, 0.4),
				inset 0 1px 0 rgba(255, 255, 255, 0.4);
		}
		50% {
			box-shadow:
				0 4px 16px rgba(1, 178, 255, 0.5),
				0 0 0 8px rgba(1, 178, 255, 0),
				inset 0 1px 0 rgba(255, 255, 255, 0.4);
		}
	}

	/* Send button - starts subtle, becomes vibrant when has content */
	.send-btn {
		background: linear-gradient(
			180deg,
			#e8e8ea 0%,
			#dcdcde 50%,
			#d0d0d2 100%
		);
		color: var(--text-tertiary);
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .send-btn {
		background: linear-gradient(
			180deg,
			#2a2a2e 0%,
			#242428 50%,
			#1e1e22 100%
		);
		border-color: rgba(255, 255, 255, 0.06);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.send-icon {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.btn-shine {
		position: absolute;
		top: 0;
		left: 0;
		right: 50%;
		height: 50%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.4) 0%,
			rgba(255, 255, 255, 0) 100%
		);
		border-radius: 50% 50% 0 0;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	/* Active send button with content */
	.send-btn.has-content {
		background: linear-gradient(
			180deg,
			#66d9ff 0%,
			#4dd0ff 25%,
			#01B2FF 60%,
			#0099dd 100%
		);
		color: white;
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 16px rgba(1, 178, 255, 0.45),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.send-btn.has-content .btn-shine {
		opacity: 1;
	}

	.send-btn.has-content:hover:not(:disabled) {
		background: linear-gradient(
			180deg,
			#80e0ff 0%,
			#66d9ff 25%,
			#1ebfff 60%,
			#00a6e6 100%
		);
		transform: translateY(-2px);
		box-shadow:
			0 6px 24px rgba(1, 178, 255, 0.55),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1);
	}

	.send-btn.has-content:active:not(:disabled) {
		transform: translateY(0) scale(0.96);
		background: linear-gradient(
			180deg,
			#01B2FF 0%,
			#0099dd 50%,
			#0088cc 100%
		);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.send-btn:disabled:not(.has-content) {
		cursor: default;
	}

	.send-btn.has-content:disabled {
		opacity: 0.5;
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
