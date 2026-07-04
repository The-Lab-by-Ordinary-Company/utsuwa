<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { characterStore } from '$lib/stores/character.svelte';
	import { localPath } from '$lib/config/links';
	import { browser } from '$app/environment';
	import { isTauri } from '$lib/services/platform/platform';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { prepareImage, UnsupportedImageError, type PreparedImage } from '$lib/services/storage/keepsakes';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import { pop, fadeFast } from '$lib/utils/motion';

	interface Props {
		onSend: (content: string, images?: PreparedImage[]) => void;
		disabled?: boolean;
		visionCapable?: boolean;
		providerLabel?: string;
		providerIsLocal?: boolean;
		/** Overlay window: image-showing is disabled (no native file dialog / drop). */
		overlay?: boolean;
	}

	let {
		onSend,
		disabled = false,
		visionCapable = true,
		providerLabel = 'your AI provider',
		providerIsLocal = false,
		overlay = false
	}: Props = $props();

	// Companion mood + stats, merged into the command bar.
	const moodInfo = $derived(characterStore.moodInfo);
	const charState = $derived(characterStore.state);
	const affectionPercent = $derived(characterStore.affectionPercent);
	const isCompanionMode = $derived(characterStore.appMode === 'companion');
	let showStats = $state(false);

	const datingStats = $derived([
		{ key: 'affection', label: 'Love', icon: 'heart', value: affectionPercent, color: 'var(--stat-affection)' },
		{ key: 'trust', label: 'Trust', icon: 'shield', value: charState.trust, color: 'var(--stat-trust)' },
		{ key: 'intimacy', label: 'Intimacy', icon: 'sparkles', value: charState.intimacy, color: 'var(--stat-intimacy)' },
		{ key: 'comfort', label: 'Comfort', icon: 'home', value: charState.comfort, color: 'var(--stat-comfort)' },
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: 'var(--stat-energy)' },
		{ key: 'respect', label: 'Respect', icon: 'award', value: charState.respect, color: 'var(--stat-respect)' }
	]);
	const companionStats = $derived([
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: 'var(--stat-energy)' },
		{ key: 'chats', label: 'Chats', icon: 'message-circle', value: Math.min(charState.totalInteractions, 100), color: 'var(--stat-trust)' }
	]);
	const stats = $derived(isCompanionMode ? companionStats : datingStats);

	// Brief toast for image issues (blind model, unsupported format).
	let hint = $state<string | null>(null);
	let hintTimer: ReturnType<typeof setTimeout> | null = null;

	function showHint(message: string) {
		hint = message;
		if (hintTimer) clearTimeout(hintTimer);
		hintTimer = setTimeout(() => (hint = null), 6000);
	}

	$effect(() => {
		return () => {
			if (hintTimer) clearTimeout(hintTimer);
		};
	});

	function promptVision() {
		showHint(
			"This model can't see images. Pick a vision model (GPT-4o, Claude, Gemini, or a local one like llava) in Settings."
		);
	}

	// One-time "where do photos go" disclosure, shown the first time an image is
	// attached and then remembered so it never nags again.
	const PRIVACY_ACK_KEY = 'utsuwa-image-privacy-ack';
	let showPrivacy = $state(false);

	function maybeShowPrivacyNotice() {
		if (!browser || localStorage.getItem(PRIVACY_ACK_KEY) === '1') return;
		showPrivacy = true;
	}
	function ackPrivacy() {
		if (browser) localStorage.setItem(PRIVACY_ACK_KEY, '1');
		showPrivacy = false;
	}

	function openPicker() {
		if (overlay) return;
		if (!visionCapable) {
			promptVision();
			return;
		}
		fileInput?.click();
	}

	let inputValue = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	// Images queued to show her, each with a preview URL for the chip.
	let pending = $state<{ image: PreparedImage; url: string }[]>([]);
	// Drag-to-show: the whole window is a drop target; the bar morphs into one.
	let dragActive = $state(false);
	let dragDepth = 0;

	function dragHasFiles(e: DragEvent): boolean {
		return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
	}

	function handleDragEnter(e: DragEvent) {
		if (overlay || !dragHasFiles(e)) return;
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

	async function handleFiles(files: FileList | File[] | null) {
		if (overlay || !files) return;
		if (!visionCapable) {
			promptVision();
			return;
		}
		for (const file of Array.from(files)) {
			if (!file.type.startsWith('image/')) continue;
			try {
				const image = await prepareImage(file);
				pending = [...pending, { image, url: URL.createObjectURL(file) }];
				maybeShowPrivacyNotice();
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

	// On desktop, Tauri's webview intercepts drag-and-drop so dataTransfer.files
	// is empty (native drag-drop stays on for VRM upload). Read dropped image
	// files via Tauri's own event + the fs plugin, mirroring VrmUploader.
	const IMAGE_MIME: Record<string, string> = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		webp: 'image/webp',
		heic: 'image/heic',
		heif: 'image/heif',
		bmp: 'image/bmp'
	};
	function imageMimeFromPath(path: string): string | null {
		return IMAGE_MIME[path.split('.').pop()?.toLowerCase() ?? ''] ?? null;
	}

	$effect(() => {
		if (!isTauri() || overlay) return;
		let cancelled = false;
		let unlisten: (() => void) | undefined;
		(async () => {
			const { getCurrentWindow } = await import('@tauri-apps/api/window');
			if (cancelled) return;
			unlisten = await getCurrentWindow().onDragDropEvent(async (event) => {
				if (event.payload.type === 'over') {
					dragActive = true;
				} else if (event.payload.type === 'leave') {
					dragActive = false;
					dragDepth = 0;
				} else if (event.payload.type === 'drop') {
					dragActive = false;
					dragDepth = 0;
					const imagePaths = event.payload.paths.filter((p) => imageMimeFromPath(p));
					if (imagePaths.length === 0) return; // not images (VrmUploader etc. handle those)
					if (!visionCapable) {
						promptVision();
						return;
					}
					const { readFile } = await import('@tauri-apps/plugin-fs');
					const files: File[] = [];
					for (const path of imagePaths) {
						try {
							const contents = await readFile(path);
							const name = path.split(/[/\\]/).pop() || 'image';
							files.push(new File([contents], name, { type: imageMimeFromPath(path)! }));
						} catch {
							showHint("Couldn't read that image. Try a different one.");
						}
					}
					if (files.length) await handleFiles(files);
				}
			});
		})();
		return () => {
			cancelled = true;
			unlisten?.();
		};
	});

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

</script>

{#if sttError}
	<div
		class="stt-error"
		out:pop={{ base: 'translateX(-50%)', y: -10, duration: 200 }}
		onclick={() => sttStore.clearError()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				sttStore.clearError();
			}
		}}
		role="button"
		tabindex="0"
	>
		<Icon name="alert" size={16} />
		<span>{sttError}</span>
		<button type="button" class="dismiss-btn" aria-label="Dismiss">
			<Icon name="x" size={14} />
		</button>
	</div>
{/if}

{#if hint}
	<div
		class="vision-hint"
		role="status"
		aria-live="polite"
		out:pop={{ base: 'translateX(-50%)', y: -10, duration: 200 }}
	>
		<Icon name="camera" size={16} />
		<span>{hint}</span>
	</div>
{/if}

{#if showPrivacy}
	<div
		class="privacy-notice"
		out:pop={{ base: 'translateX(-50%)', y: -10, duration: 200 }}
		role="dialog"
		aria-label="Photo privacy"
	>
		<Icon name="camera" size={16} />
		<span>
			{#if providerIsLocal}
				Photos you show her stay on your machine — they never leave this device.
			{:else}
				Photos you show her are sent to {providerLabel} so she can see them. They're also
				saved on this device; delete them anytime from the board.
			{/if}
		</span>
		<button type="button" class="privacy-ack" onclick={ackPrivacy}>Got it</button>
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
		<div class="drop-zone" out:fadeFast={{ duration: 120 }}>
			<Icon name="camera" size={22} />
			<span>Drop a photo to show her</span>
		</div>
	{/if}
	{#if showStats && !overlay}
		<div class="stats-tray" out:pop={{ base: 'translateX(-50%)', y: 8, duration: 200 }}>
			<div class="stat-list">
				{#each stats as stat}
					<div class="stat-row">
						<span class="s-icon" style="color: {stat.color}"><Icon name={stat.icon} size={15} /></span>
						<span class="s-label">{stat.label}</span>
						<span class="s-track"><span class="s-fill" style="width: {stat.value}%; background: {stat.color}"></span></span>
						<span class="s-val">{Math.round(stat.value)}</span>
					</div>
				{/each}
			</div>
			<div class="stat-foot">
				<span class="foot-stat"><Icon name="calendar" size={12} />{charState.daysKnown}d</span>
				<span class="foot-stat"><Icon name="message-circle" size={12} />{charState.totalInteractions}</span>
				{#if charState.currentStreak > 1}
					<span class="foot-stat streak"><Icon name="flame" size={12} />{charState.currentStreak}</span>
				{/if}
				<a href={localPath('app', '/settings/persona')} class="foot-link">Profile <Icon name="arrow-right" size={12} /></a>
			</div>
		</div>
	{/if}
	{#if pending.length > 0}
		<div class="pending-row" out:fadeFast={{ duration: 150 }}>
			{#each pending as p (p.image.id)}
				<div class="pending-chip" in:pop={{ duration: 200, y: 6, scale: 0.9 }} out:fadeFast={{ duration: 120 }}>
					<img src={p.url} alt="To show her" />
					<button type="button" class="remove-chip" aria-label="Remove image" onclick={() => removePending(p.image.id)}>
						<Icon name="x" size={12} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
	<div class="bar-row">
		{#if !overlay}
			<button
				type="button"
				class="mood-fab"
				class:active={showStats}
				onclick={() => (showStats = !showStats)}
				aria-label="Companion status"
				aria-expanded={showStats}
				title={moodInfo.description}
			>
				<span class="mood-dot" style="color: {moodInfo.color}"><Icon name={moodInfo.icon} size={20} /></span>
				{#if showStats}
					<span class="mood-fab-label" in:fadeFast={{ duration: 150 }}>{moodInfo.description}</span>
				{/if}
			</button>
		{/if}
		<form class="chat-form" onsubmit={handleSubmit}>
			{#if !overlay}
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					multiple
					style="display:none"
					onchange={(e) => handleFiles(e.currentTarget.files)}
				/>
			{/if}
			<div class="input-wrapper" class:recording={isListening} class:transcribing={isTranscribing} class:focused={hasContent}>
				{#if isTranscribing}
					<div class="transcribing-label">Transcribing...</div>
					<button
						type="button"
						class="mic-btn recording"
						disabled
						aria-label="Transcribing"
					>
						<Icon name="loader" size={20} />
					</button>
				{:else if isListening}
					<AudioVisualizer {audioLevel} transcript={displayTranscript} />
					<button
						type="button"
						class="mic-btn recording"
						onclick={() => sttStore.stopListening()}
						aria-label="Stop recording"
						title="Stop recording"
					>
						<Icon name="stop" size={16} />
					</button>
				{:else}
					{#if !overlay}
						<button
							type="button"
							class="mic-btn"
							class:vision-off={!visionCapable}
							onclick={openPicker}
							aria-label="Attach an image"
							title={visionCapable ? 'Attach an image' : 'This model cannot see images'}
						>
							<Icon name="paperclip" size={20} />
						</button>
					{/if}
					<textarea
						bind:this={textareaRef}
						bind:value={inputValue}
						onkeydown={handleKeydown}
						oninput={handleInput}
						placeholder="Type a message..."
						rows="1"
						{disabled}
					></textarea>
					<button
						type="button"
						class="mic-btn"
						onclick={handleMicClick}
						aria-label="Voice input"
						title="Voice input"
					>
						<Icon name="mic" size={20} />
					</button>
				{/if}
			</div>
		</form>
	</div>
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
		background: var(--accent);
		color: #fff;
		border-radius: var(--radius-lg);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.35;
		z-index: 50;
		box-shadow: var(--shadow-lg);
		animation: hintDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.vision-hint :global(svg) { flex-shrink: 0; }
	@keyframes hintDrop {
		from { transform: translate(-50%, -16px) scale(0.96); opacity: 0; }
		to { transform: translate(-50%, 0) scale(1); opacity: 1; }
	}
	/* One-time photo-privacy disclosure (dismissable, light informational card). */
	.privacy-notice {
		position: fixed;
		top: calc(1.25rem + env(safe-area-inset-top, 0));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 0.75rem 0.7rem 1rem;
		max-width: min(460px, 92vw);
		background: var(--bg-primary);
		color: var(--text-primary);
		border-radius: var(--radius-lg);
		font-size: 0.8rem;
		font-weight: 500;
		line-height: 1.35;
		z-index: 60;
		box-shadow: var(--shadow-lg);
		animation: hintDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.privacy-notice :global(svg) { flex-shrink: 0; opacity: 0.65; }
	@media (prefers-reduced-motion: reduce) {
		.vision-hint,
		.privacy-notice {
			animation: none;
		}
	}
	.privacy-ack {
		flex-shrink: 0;
		border: none;
		border-radius: var(--radius-full);
		padding: 0.35rem 0.85rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.privacy-ack:hover { background: var(--accent-hover); }
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
		border-radius: var(--radius-full);
		background: var(--accent-subtle);
		border: 2px dashed var(--accent);
		color: var(--accent);
		font-size: 0.95rem;
		font-weight: 600;
		box-shadow: var(--shadow-sm);
		z-index: 5;
		pointer-events: none;
		overflow: hidden;
		animation: dropPop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.drop-zone :global(svg) {
		animation: dropIcon 0.9s ease-in-out infinite;
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
		border-radius: var(--radius-md);
		border: 1px solid var(--border-light);
		box-shadow: var(--shadow-sm);
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
	}
	.pending-chip:hover img {
		border-color: var(--accent);
		box-shadow: var(--shadow-glow);
	}
	.remove-chip {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 19px;
		height: 19px;
		border: 2px solid var(--bg-primary);
		border-radius: var(--radius-full);
		background: var(--color-error);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		box-shadow: var(--shadow-sm);
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

	/* Command row: mood satellite + input pill */
	.bar-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	/* Floating mood button (companion status) */
	.mood-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		flex-shrink: 0;
		height: 56px;
		min-width: 56px;
		padding: 0 1rem;
		border: none;
		border-radius: var(--radius-full);
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
		box-shadow: var(--shadow-md);
		transition: background 0.15s ease, box-shadow 0.15s ease;
	}

	.mood-fab:hover,
	.mood-fab.active {
		box-shadow: var(--shadow-lg);
	}

	.mood-dot {
		display: flex;
		flex-shrink: 0;
	}

	.mood-fab-label {
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Stats tray (expands above the pill) */
	.stats-tray {
		margin-bottom: 0.5rem;
		padding: 0.9rem 1rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: trayIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes trayIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.stat-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem 1.25rem;
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.s-icon {
		display: flex;
		flex-shrink: 0;
	}

	.s-label {
		font-size: 0.78rem;
		color: var(--text-secondary);
		width: 4.5rem;
		flex-shrink: 0;
	}

	.s-track {
		flex: 1;
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.s-fill {
		display: block;
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.s-val {
		font-size: 0.72rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
		width: 1.75rem;
		text-align: right;
		flex-shrink: 0;
	}

	.stat-foot {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.85rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-subtle);
	}

	.foot-stat {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.foot-stat.streak {
		color: var(--color-warning);
	}

	.foot-link {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: auto;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--accent);
		text-decoration: none;
	}

	.foot-link:hover {
		color: var(--accent-hover);
	}

	@media (max-width: 640px) {
		.stat-list {
			grid-template-columns: 1fr;
		}
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
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		color: #fff;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 50;
		animation: slideDownShake 0.5s ease-out;
		box-shadow: var(--shadow-lg);
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
		border-radius: var(--radius-sm);
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
		flex: 1;
		min-width: 0;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-full);
		padding: 0.5rem;
		min-height: 56px;
		box-shadow: var(--shadow-md);
		transition: box-shadow 0.2s;
	}

	.input-wrapper:focus-within,
	.input-wrapper.focused {
		box-shadow: 0 0 0 3px var(--accent-muted), var(--shadow-glow);
	}

	.input-wrapper.recording {
		box-shadow: 0 0 0 3px var(--accent-muted), var(--shadow-glow);
	}

	.input-wrapper.transcribing {
		box-shadow: 0 0 0 3px var(--accent-muted), var(--shadow-md);
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

	.mic-btn {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
		flex-shrink: 0;
		position: relative;
	}

	.mic-btn {
		background: transparent;
		color: var(--text-tertiary);
	}

	.mic-btn:hover:not(:disabled) {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.mic-btn:active:not(:disabled) {
		transform: scale(0.94);
	}

	.mic-btn.recording {
		background: var(--accent);
		color: #fff;
		animation: recording-pulse 1.6s ease-in-out infinite;
	}

	.mic-btn.recording:hover {
		background: var(--accent-hover);
	}

	@keyframes recording-pulse {
		0%, 100% { box-shadow: 0 0 0 0 var(--accent-muted); }
		50% { box-shadow: 0 0 0 6px transparent; }
	}

	/* Mic sits where send used to; Enter sends the message. */

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
