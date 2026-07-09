<script lang="ts">
	import VrmScene from '$lib/components/vrm/VrmScene.svelte';
	import FloatingStatIndicators from '$lib/components/ui/FloatingStatIndicators.svelte';
	import { TopRightButtons, TopLeftButtons, InfoModal } from '$lib/components/ui';
	import BottomChatBar from '$lib/components/chat/BottomChatBar.svelte';
	import PhotoModeDock from '$lib/components/photomode/PhotoModeDock.svelte';
	import { photomodeStore } from '$lib/stores/photomode.svelte';
	import SpeechBubble from '$lib/components/chat/SpeechBubble.svelte';
	import ThinkingImages from '$lib/components/chat/ThinkingImages.svelte';
	import Photoboard from '$lib/components/chat/Photoboard.svelte';
	import { EventScene } from '$lib/components/events';
	import { OnboardingModal } from '$lib/components/onboarding';
	import MemoryGraphModal from '$lib/components/memory/MemoryGraphModal.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { debugEventsStore } from '$lib/stores/debugEvents.svelte';
	import { getLLMProvider, providerSupportsVision } from '$lib/services/providers/registry';
	import { isLocalLLMProvider } from '$lib/services/providers/local-endpoints';
	import { canShowImages } from '$lib/services/providers/vision';
	import { onDestroy } from 'svelte';
	import { sendCompanionMessage, type SendCompanionMessageOptions } from '$lib/services/chat/companion-chat';
	import { createReminderFiredHandler } from '$lib/services/chat/reminder-chat';
	import { reminderStore } from '$lib/stores/reminders.svelte';
	import { type PreparedImage } from '$lib/services/storage/keepsakes';
	import { isTauri } from '$lib/services/platform';
	import { browser } from '$app/environment';
	import type { StateUpdates } from '$lib/types/character';
	import type { EventDefinition } from '$lib/types/events';
	import { pop, fadeFast } from '$lib/utils/motion';

	// V2 companion system imports
	import {
		hydrateWorkingMemory,
		backfillEmbeddings,
		getEmbeddingBackfillStatus
	} from '$lib/engine/memory';
	import { initEmbeddingModel } from '$lib/services/embeddings';
	import { eventsApi } from '$lib/engine/events';
	import { completionMarkers } from '$lib/engine/event-completion';

	let canvasRef: HTMLCanvasElement | null = null;

	// Event scene state
	let activeEvent = $state<EventDefinition | null>(null);

	// Info modal state
	let showInfoModal = $state(false);
	let showBoard = $state(false);
	// Her impression from the latest turn, attached to a kept photo as its note.
	let lastNewMemory: string | undefined;

	// Memory graph modal state
	let showMemoryGraph = $state(false);

	// Onboarding state
	let showOnboarding = $state(false);
	let onboardingDismissed = $state(false);

	// Speech bubble state
	let latestResponse = $state('');
	let isTyping = $state(false);
	// Images she's currently being shown, floated above her head while she thinks
	let thinkingImages = $state<{ id: string; url: string }[]>([]);

	// Can the active LLM actually see images? Gates the "show" affordance.
	const visionCapable = $derived.by(() => {
		const cs = modulesStore.getModuleSettings('consciousness');
		const provider = cs.activeProvider as string;
		const model = cs.activeModel as string;
		if (!provider) return false;
		return canShowImages(providerSupportsVision(provider), isLocalLLMProvider(provider), model);
	});

	// Provider info for the one-time "where do photos go" disclosure.
	const imageProvider = $derived.by(() => {
		const provider = modulesStore.getModuleSettings('consciousness').activeProvider as string;
		return {
			label: getLLMProvider(provider)?.name ?? 'your AI provider',
			isLocal: provider ? isLocalLLMProvider(provider) : false
		};
	});

	// Hydrate working memory on start
	$effect(() => {
		(async () => {
			try {
				await hydrateWorkingMemory();
			} catch (e) {
				console.error('Failed to hydrate working memory:', e);
			}
		})();
	});

	// Initialize embedding model and backfill any facts without embeddings
	$effect(() => {
		initEmbeddingModel().then(async (ready) => {
			if (ready) {
				const status = await getEmbeddingBackfillStatus();
				if (status.withoutEmbeddings > 0) {
					await backfillEmbeddings();
				}
			}
		}).catch((e) => {
			console.error('Failed to initialize embedding model:', e);
		});
	});

	// Check for first-run (onboarding). ?onboarding=1 force-opens it for testing
	// without resetting the companion.
	$effect(() => {
		if (characterStore.isReady && !onboardingDismissed) {
			const forced = browser && new URLSearchParams(window.location.search).has('onboarding');
			const { lastInteraction, totalInteractions } = characterStore.state;
			showOnboarding = forced || (lastInteraction === null && totalInteractions === 0);
		}
	});

	// Check for debug events (from developer tools)
	$effect(() => {
		const debugEvent = debugEventsStore.consume();
		if (debugEvent) {
			activeEvent = debugEvent;
		}
	});

	// Start reminder polling and react to fired reminders by sending them back
	// through the companion pipeline. This lets the LLM decide the action
	// (speech, web search, etc.) instead of showing a passive toast.
	$effect(() => {
		const unsubscribeReminder = reminderStore.addReminderFiredListener(
			createReminderFiredHandler((content, options) => handleSend(content, [], options))
		);
		reminderStore.startPolling();
		return () => {
			reminderStore.stopPolling();
			unsubscribeReminder();
		};
	});

	// Shown-image previews are blob: URLs (shared between the chat history and the
	// thinking overlay). Free them all when leaving the app so a long session's
	// images don't linger in memory.
	onDestroy(() => {
		for (const m of chatStore.messages) {
			for (const img of m.images ?? []) URL.revokeObjectURL(img.url);
		}
		for (const img of thinkingImages) URL.revokeObjectURL(img.url);
	});


	// Send a message through the shared companion pipeline.
	async function handleSend(
		content: string,
		images: PreparedImage[] = [],
		options?: SendCompanionMessageOptions
	) {
		await sendCompanionMessage(content, images, {
			setTyping: (v) => (isTyping = v),
			setLatestResponse: (v) => (latestResponse = v),
			setActiveEvent: (e) => (activeEvent = e),
			onShownImages: (shown) => (thinkingImages = shown),
			onNewMemory: (m) => (lastNewMemory = m)
		}, options);
	}

	// Handle speech bubble hide
	function handleBubbleHide() {
		latestResponse = '';
	}

	// Handle event completion
	function handleEventComplete(choiceIndex?: number, stateChanges?: Partial<StateUpdates>) {
		if (!activeEvent) return;

		const event = $state.snapshot(activeEvent);

		if (stateChanges) {
			characterStore.applyUpdates(stateChanges as StateUpdates);
		} else if (event.stateChanges) {
			characterStore.applyUpdates(event.stateChanges);
		}

		// Apply the gating markers first and synchronously — the event id plus the
		// chosen outcome marker (e.g. confession_accepted) drive stage progression
		// and are persisted via the character store. Doing this before the DB write
		// means a failed write can't silently strand a hard-won stage unlock.
		for (const marker of completionMarkers(event, choiceIndex)) {
			characterStore.markEventCompleted(marker);
		}

		// Then record the durable history entry (also carries cooldown timestamps).
		eventsApi
			.recordCompletedEvent(
				event,
				choiceIndex,
				choiceIndex !== undefined ? `Choice ${choiceIndex + 1}` : undefined
			)
			.catch((e) => {
				console.error('Failed to record event completion:', e);
			});

		activeEvent = null;
	}

	function handleEventClose() {
		activeEvent = null;
	}
</script>

<div class="app-container">
	{#if !photomodeStore.active}
		<TopLeftButtons onOpenMemoryGraph={() => showMemoryGraph = true} onBoardClick={() => showBoard = true} />
		<TopRightButtons
			onInfoClick={() => showInfoModal = true}
			upcomingReminders={reminderStore.upcoming}
			onDeleteReminder={reminderStore.deleteReminder}
			recentFired={reminderStore.recentFired}
			onDismissRecentFired={reminderStore.dismissRecentFired}
		/>
	{/if}
	{#if showInfoModal}
		<InfoModal onClose={() => showInfoModal = false} />
	{/if}
	{#if showBoard}
		<Photoboard onClose={() => showBoard = false} />
	{/if}
	{#if showMemoryGraph}
		<MemoryGraphModal onClose={() => showMemoryGraph = false} />
	{/if}

	<main class="main-content">
		<!-- VRM Stage (Full Background) -->
		<div class="stage-container">
			{#if vrmStore.isLoading || !vrmStore.modelUrl}
				<div class="loading-dots" out:fadeFast={{ duration: 300 }}>
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
				</div>
			{/if}

			{#if vrmStore.error}
				<div
					class="error-toast"
					out:pop={{ base: 'translateX(-50%)' }}
					role="button"
					tabindex="0"
					onclick={() => vrmStore.setError(null)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vrmStore.setError(null); } }}
				>
					<span>{vrmStore.error}</span>
					<button type="button" class="toast-dismiss" aria-label="Dismiss">✕</button>
				</div>
			{/if}

			<!-- Photo-mode background preview: the GL canvas goes transparent and
			     this layer shows what the capture will composite behind her -->
			{#if photomodeStore.active && photomodeStore.background.type !== 'room'}
				{@const bg = photomodeStore.background}
				<div
					class="photo-bg-layer"
					style:background={bg.type === 'solid'
						? bg.value
						: bg.type === 'gradient'
							? `linear-gradient(180deg, ${bg.value})`
							: 'repeating-conic-gradient(#d4d4d4 0% 25%, #f5f5f5 0% 50%) 0 0 / 22px 22px'}
				></div>
			{/if}

			<!-- The avatar resolves into focus once the model is ready -->
			<div class="vrm-stage" class:is-loading={vrmStore.isLoading || !vrmStore.modelUrl}>
				<VrmScene />
			</div>
		</div>

		{#if !photomodeStore.active}
			<!-- Floating Stat Indicators -->
			<FloatingStatIndicators />

			<!-- Speech Bubble (shows latest response, click to dismiss) -->
			<SpeechBubble
				message={latestResponse}
				isTyping={isTyping}
				onHide={handleBubbleHide}
			/>

			<!-- The image she's being shown, floated above her head while she considers it -->
			<ThinkingImages images={thinkingImages} show={isTyping} />

			<!-- Bottom Chat Bar -->
			<BottomChatBar
				onSend={handleSend}
				disabled={chatStore.isLoading}
				{visionCapable}
				providerLabel={imageProvider.label}
				providerIsLocal={imageProvider.isLocal}
			/>
		{:else}
			<PhotoModeDock />
		{/if}

		<!-- Error toast for chat errors -->
		{#if chatStore.error}
			<div
				class="chat-error-toast"
				out:pop={{ base: 'translateX(-50%)' }}
				role="button"
				tabindex="0"
				onclick={() => chatStore.setError(null)}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chatStore.setError(null); } }}
			>
				<span>{chatStore.error}</span>
				<button type="button" class="toast-dismiss" aria-label="Dismiss">✕</button>
			</div>
		{/if}

		<!-- Event Scene Overlay (deferred while posing; renders on exit) -->
		{#if activeEvent?.scene && !photomodeStore.active}
			<EventScene
				scene={activeEvent?.scene}
				eventName={activeEvent?.name}
				eventType={activeEvent?.type}
				companionName={personaStore.activeCard.name}
				onComplete={handleEventComplete}
				onClose={handleEventClose}
			/>
		{/if}
	</main>

	<!-- Onboarding Modal (first-run) -->
	{#if showOnboarding}
		<OnboardingModal onComplete={() => {
			onboardingDismissed = true;
			showOnboarding = false;
		}} />
	{/if}
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		display: flex;
		position: relative;
		overflow: hidden;
	}

	.stage-container {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	/* Photo-mode background preview sits behind the transparent GL canvas */
	.photo-bg-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	/* The scene sits blurred and dimmed while the model loads, then resolves
	   into focus. Base state carries no filter so nothing lingers after. */
	.vrm-stage {
		position: relative;
		z-index: 1; /* above the photo background layer */
		height: 100%;
		transition:
			opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
			filter 0.9s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.vrm-stage.is-loading {
		opacity: 0;
		filter: blur(14px);
	}

	.loading-dots {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		z-index: 20;
	}

	.loading-dots .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-tertiary);
		animation: bounce 1.4s ease-in-out infinite;
	}

	.loading-dots .dot:nth-child(2) {
		animation-delay: 0.16s;
	}

	.loading-dots .dot:nth-child(3) {
		animation-delay: 0.32s;
	}

	@keyframes bounce {
		0%, 80%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.error-toast,
	.chat-error-toast {
		position: fixed;
		top: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: fit-content;
		max-width: 600px;
		padding: 0.75rem 1rem;
		background: var(--color-error);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		color: #fff;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 50;
		animation: errorSlideDownShake 0.5s ease-out;
		box-shadow: var(--shadow-lg);
	}

	.error-toast span,
	.chat-error-toast span {
		flex: 1;
		word-wrap: break-word;
	}

	.toast-dismiss {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		padding: 0.25rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: white;
		opacity: 0.9;
		font-size: 0.875rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.toast-dismiss:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}

	@keyframes errorSlideDownShake {
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

	.chat-error-toast {
		top: 5.5rem;
	}

	@media (max-width: 640px) {
		.error-toast,
		.chat-error-toast {
			width: fit-content;
			max-width: calc(100vw - 1.5rem);
		}
	}
</style>
