<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { characterStore } from '$lib/stores/character.svelte';
	import { localPath } from '$lib/config/links';
	import { isTauri } from '$lib/services/platform/platform';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { chatHintStore } from '$lib/stores/chat-hint.svelte';
	import { queueFiles, imageMimeFromPath } from './attach-files';
	import { chatDraftStore } from '$lib/stores/chat-draft.svelte';
	import { type PreparedImage } from '$lib/services/storage/keepsakes';
	import ChatInput from './ChatInput.svelte';
	import { pop, fadeFast } from '$lib/utils/motion';

	interface Props {
		onSend: (content: string, images?: PreparedImage[]) => void;
		disabled?: boolean;
		visionCapable?: boolean;
		providerLabel?: string;
		providerIsLocal?: boolean;
		/** Overlay window: image-showing is disabled (no native file dialog / drop). */
		overlay?: boolean;
		/** The chat window is open and owns the input; keep drops and toasts alive
		 *  but hide the visible bar. */
		barHidden?: boolean;
	}

	let {
		onSend,
		disabled = false,
		visionCapable = true,
		providerLabel = 'your AI provider',
		providerIsLocal = false,
		overlay = false,
		barHidden = false
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

	// Surface voice playback failures; without this a TTS misconfiguration
	// (like a stale voice id after switching providers) looks like she simply
	// chose not to speak.
	$effect(() => {
		if (ttsStore.lastError) chatHintStore.showHint(ttsStore.lastError);
	});

	$effect(() => {
		return () => chatHintStore.destroy();
	});

	// Drag-to-show: the whole window is a drop target. The active flag lives in
	// the draft store so whichever surface is visible shows the affordance.
	let dragDepth = 0;

	function dragHasFiles(e: DragEvent): boolean {
		return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
	}

	function handleDragEnter(e: DragEvent) {
		if (overlay || !dragHasFiles(e)) return;
		dragDepth++;
		chatDraftStore.setDropActive(true);
	}

	function handleDragOver(e: DragEvent) {
		if (dragHasFiles(e)) e.preventDefault();
	}

	function handleDragLeave(e: DragEvent) {
		if (!dragHasFiles(e)) return;
		dragDepth--;
		if (dragDepth <= 0) {
			dragDepth = 0;
			chatDraftStore.setDropActive(false);
		}
	}

	function handleDrop(e: DragEvent) {
		if (!dragHasFiles(e)) return;
		e.preventDefault();
		dragDepth = 0;
		chatDraftStore.setDropActive(false);
		if (!overlay) queueFiles(e.dataTransfer?.files ?? null, visionCapable);
	}

	// On desktop, Tauri's webview intercepts drag-and-drop so dataTransfer.files
	// is empty (native drag-drop stays on for VRM upload). Read dropped image
	// files via Tauri's own event + the fs plugin, mirroring VrmUploader.
	$effect(() => {
		if (!isTauri() || overlay) return;
		let cancelled = false;
		let unlisten: (() => void) | undefined;
		(async () => {
			const { getCurrentWindow } = await import('@tauri-apps/api/window');
			if (cancelled) return;
			unlisten = await getCurrentWindow().onDragDropEvent(async (event) => {
				if (event.payload.type === 'over') {
					chatDraftStore.setDropActive(true);
				} else if (event.payload.type === 'leave') {
					chatDraftStore.setDropActive(false);
					dragDepth = 0;
				} else if (event.payload.type === 'drop') {
					chatDraftStore.setDropActive(false);
					dragDepth = 0;
					const imagePaths = event.payload.paths.filter((p) => imageMimeFromPath(p));
					if (imagePaths.length === 0) return; // not images (VrmUploader etc. handle those)
					const { readFile } = await import('@tauri-apps/plugin-fs');
					const files: File[] = [];
					for (const path of imagePaths) {
						try {
							const contents = await readFile(path);
							const name = path.split(/[/\\]/).pop() || 'image';
							files.push(new File([contents], name, { type: imageMimeFromPath(path)! }));
						} catch {
							chatHintStore.showHint("Couldn't read that image. Try a different one.");
						}
					}
					if (files.length) await queueFiles(files, visionCapable);
				}
			});
		})();
		return () => {
			cancelled = true;
			unlisten?.();
		};
	});
</script>

{#if sttStore.error}
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
		<span>{sttStore.error}</span>
		<button type="button" class="dismiss-btn" aria-label="Dismiss">
			<Icon name="x" size={14} />
		</button>
	</div>
{/if}

{#if chatHintStore.hint}
	<div
		class="vision-hint"
		role="status"
		aria-live="polite"
		out:pop={{ base: 'translateX(-50%)', y: -10, duration: 200 }}
	>
		<Icon name="camera" size={16} />
		<span>{chatHintStore.hint}</span>
	</div>
{/if}

{#if chatHintStore.showPrivacy}
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
		<button type="button" class="privacy-ack" onclick={() => chatHintStore.ackPrivacy()}>Got it</button>
	</div>
{/if}

<svelte:window
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
/>

{#if !barHidden}
	<div
		class="bottom-chat-bar"
		class:dragging={chatDraftStore.dropActive}
		class:align-left={displayStore.chatBarAlignment === 'left'}
		class:align-right={displayStore.chatBarAlignment === 'right'}
	>
		{#if chatDraftStore.dropActive}
			<div class="drop-zone" out:fadeFast={{ duration: 120 }}>
				<Icon name="camera" size={22} />
				<span>Drop a photo to show her</span>
			</div>
		{/if}
		{#if showStats && !overlay}
			<div class="stats-tray" out:pop={{ y: 8, duration: 200 }}>
				<div class="tray-mood">
					<span class="mood-dot" style="color: {moodInfo.color}"><Icon name={moodInfo.icon} size={16} /></span>
					<span>{moodInfo.description}</span>
				</div>
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
				</button>
			{/if}
			<ChatInput {onSend} {disabled} {visionCapable} {overlay} />
		</div>
	</div>
{/if}

<style>
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

	/* Alignment: pin the bar toward an edge instead of centered */
	.bottom-chat-bar.align-left {
		left: 0;
		transform: none;
	}

	.bottom-chat-bar.align-right {
		left: auto;
		right: 0;
		transform: none;
	}

	/* Command row: mood satellite + input pill */
	.bar-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	/* Floating mood button (companion status) */
	/* Fixed size: expanding it would shove the input pill off center */
	.mood-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		height: 56px;
		width: 56px;
		padding: 0;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: var(--bg-secondary);
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

	.tray-mood {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.7rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-primary);
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
