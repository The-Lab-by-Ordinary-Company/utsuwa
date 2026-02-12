<script lang="ts">
	import VrmScene from '$lib/components/vrm/VrmScene.svelte';
	import CompanionStatus from '$lib/components/ui/CompanionStatus.svelte';
	import FloatingStatIndicators from '$lib/components/ui/FloatingStatIndicators.svelte';
	import { TopRightButtons, TopLeftButtons, InfoModal } from '$lib/components/ui';
	import BottomChatBar from '$lib/components/chat/BottomChatBar.svelte';
	import SpeechBubble from '$lib/components/chat/SpeechBubble.svelte';
	import { EventScene } from '$lib/components/events';
	import { OnboardingModal } from '$lib/components/onboarding';
	import MemoryGraphModal from '$lib/components/memory/MemoryGraphModal.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { debugEventsStore } from '$lib/stores/debugEvents.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import { streamChatDirect } from '$lib/services/chat/client-chat';
	import { isTauri } from '$lib/services/platform';
	import type { TTSProvider } from '$lib/types';
	import type { StateUpdates } from '$lib/types/character';
	import type { EventDefinition } from '$lib/types/events';
	import { onMount } from 'svelte';

	// V2 companion system imports
	import { buildSystemPrompt, type PromptContext } from '$lib/ai/prompt-builder';
	import { parseResponse, validateStateUpdates, extractPotentialFacts } from '$lib/ai/response-parser';
	import { calculateBaselineUpdates, analyzeMessage } from '$lib/engine/heuristics';
	import { mergeUpdates, checkAndApplyStageTransition } from '$lib/engine/state-updates';
	import {
		retrieveRelevantContext,
		addTurnToWorkingMemory,
		hydrateWorkingMemory,
		memoryApi,
		determineFactCategory,
		calculateFactImportance,
		backfillEmbeddings,
		getEmbeddingBackfillStatus
	} from '$lib/engine/memory';
	import { initEmbeddingModel, subscribeToEmbeddingState, type EmbeddingState } from '$lib/services/embeddings';
	import { checkAllEvents, eventsApi } from '$lib/engine/events';
	import { allEvents } from '$lib/data/events';

	let canvasRef: HTMLCanvasElement | null = null;

	// Event scene state
	let activeEvent = $state<EventDefinition | null>(null);

	// Info modal state
	let showInfoModal = $state(false);

	// Memory graph modal state
	let showMemoryGraph = $state(false);

	// Onboarding state
	let showOnboarding = $state(false);
	let onboardingDismissed = $state(false);

	// Speech bubble state
	let latestResponse = $state('');
	let isTyping = $state(false);

	// Track memory hydration
	let isMemoryReady = $state(false);

	// Track embedding model state
	let embeddingState = $state<EmbeddingState>({ isLoading: false, isReady: false, error: null });

	// Hydrate working memory on start
	$effect(() => {
		isMemoryReady = false;
		(async () => {
			try {
				await hydrateWorkingMemory();
				isMemoryReady = true;
			} catch (e) {
				console.error('Failed to hydrate working memory:', e);
				isMemoryReady = true; // Don't block the app
			}
		})();
	});

	// Initialize embedding model and backfill any facts without embeddings
	$effect(() => {
		const unsub = subscribeToEmbeddingState((state) => {
			embeddingState = state;
		});

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

		return unsub;
	});

	// Check for first-run (onboarding)
	$effect(() => {
		if (characterStore.isReady && !onboardingDismissed) {
			const { lastInteraction, totalInteractions } = characterStore.state;
			showOnboarding = lastInteraction === null && totalInteractions === 0;
		}
	});

	// Check for debug events (from developer tools)
	$effect(() => {
		const debugEvent = debugEventsStore.consume();
		if (debugEvent) {
			activeEvent = debugEvent;
		}
	});

	// Process companion response with v2 system
	async function processCompanionResponse(userMessage: string, companionResponse: string): Promise<string> {
		const state = characterStore.state;

		const baselineUpdates = calculateBaselineUpdates(userMessage, state);

		const parsed = parseResponse(companionResponse);
		const dialogue = parsed.dialogue;
		const llmUpdates = parsed.stateUpdates;

		let validatedLLMUpdates = null;
		if (llmUpdates) {
			const validation = validateStateUpdates(llmUpdates);
			validatedLLMUpdates = validation.sanitized;
		}

		const finalUpdates = mergeUpdates(baselineUpdates, validatedLLMUpdates || {});
		characterStore.applyUpdates(finalUpdates);

		// Save LLM memory observation
		if (finalUpdates.newMemory) {
			try {
				await memoryApi.createFact({
					content: finalUpdates.newMemory,
					category: determineFactCategory(finalUpdates.newMemory),
					importance: calculateFactImportance(finalUpdates.newMemory)
				});
			} catch (e) {
				console.debug('[Memory] Failed to save LLM observation:', e);
			}
		}

		// Check stage transitions (only in Dating Sim Mode)
		if (characterStore.appMode === 'dating_sim') {
			const completedEventIds = characterStore.state.completedEvents || [];
			const transition = checkAndApplyStageTransition(characterStore.state, completedEventIds);
			if (transition.transitioned && transition.toStage) {
				characterStore.setRelationshipStage(transition.toStage);
			}
		}

		// Save to working memory
		addTurnToWorkingMemory({ role: 'user', content: userMessage, createdAt: new Date() });
		addTurnToWorkingMemory({ role: 'assistant', content: dialogue, createdAt: new Date() });

		// Extract facts
		const potentialFacts = extractPotentialFacts(dialogue, userMessage);
		for (const factContent of potentialFacts.slice(0, 2)) {
			try {
				const userAnalysis = analyzeMessage(userMessage);
				await memoryApi.createFact({
					content: factContent,
					category: determineFactCategory(factContent),
					importance: calculateFactImportance(factContent, userAnalysis.sentiment)
				});
			} catch (e) {
				console.debug('Failed to save fact:', e);
			}
		}

		// Check for events (only in Dating Sim Mode)
		if (characterStore.appMode === 'dating_sim') {
			try {
				const completedEvents = await eventsApi.getCompletedEvents();
				const triggeredEvents = checkAllEvents(allEvents, characterStore.state, completedEvents, userMessage);
				if (triggeredEvents.length > 0) {
					activeEvent = triggeredEvents[0];
				}
			} catch (e) {
				console.debug('Event check failed:', e);
			}
		}

		return dialogue;
	}

	// Build system prompt
	async function buildCompanionSystemPrompt(userMessage: string): Promise<string> {
		const state = characterStore.state;
		const persona = personaStore.activeCard;

		const memories = await retrieveRelevantContext(userMessage);

		const context: PromptContext = {
			persona,
			state,
			memories,
			userMessage,
			systemTime: new Date()
		};

		return buildSystemPrompt(context);
	}

	// Handle send message
	async function handleSend(content: string) {
		if (!content.trim() || chatStore.isLoading) return;

		// Check if chat is enabled
		if (!modulesStore.isModuleEnabled('consciousness')) {
			chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
			return;
		}

		chatStore.addMessage('user', content);
		chatStore.setLoading(true);
		chatStore.setError(null);
		isTyping = true;
		latestResponse = '';

		characterStore.updateStreak();
		characterStore.updateDaysKnown();

		try {
			const consciousnessSettings = modulesStore.getModuleSettings('consciousness');
			const provider = consciousnessSettings.activeProvider as string;
			const model = consciousnessSettings.activeModel as string;

			if (!provider) {
				throw new Error('Please configure a provider in Settings > Modules > Consciousness');
			}

			const systemPrompt = await buildCompanionSystemPrompt(content);
			const providerConfig = settingsStore.getProviderConfig(provider);
			const apiKey = providerConfig.apiKey;
			const providerMeta = getLLMProvider(provider);

			if (providerMeta?.requiresApiKey && !apiKey) {
				throw new Error(`Please configure API key for ${providerMeta.name} in Settings > Providers`);
			}

			chatStore.addMessage('assistant', '');
			let fullContent = '';
			const selectedModel = model || providerMeta?.models?.[0]?.id || '';

			if (isTauri()) {
				await new Promise<void>((resolve, reject) => {
					streamChatDirect(
						{
							messages: chatStore.messages.slice(0, -1).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
							provider: provider as import('$lib/types').LLMProvider,
							model: selectedModel,
							apiKey: apiKey || undefined,
							baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
							systemPrompt
						},
						(text) => { fullContent += text; chatStore.updateLastMessage(fullContent); },
						(error) => reject(new Error(error)),
						() => resolve()
					);
				});
			} else {
				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						messages: chatStore.messages.map((m) => ({ role: m.role, content: m.content })),
						provider,
						model: selectedModel,
						apiKey: apiKey || 'not-needed',
						baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
						systemPrompt
					})
				});

				if (!response.ok) throw new Error('Failed to get response');

				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				if (!reader) throw new Error('No response body');

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					for (const line of chunk.split('\n')) {
						if (line.startsWith('0:')) {
							const text = JSON.parse(line.slice(2));
							fullContent += text;
							chatStore.updateLastMessage(fullContent);
						} else if (line.startsWith('e:')) {
							const { error } = JSON.parse(line.slice(2));
							throw new Error(error);
						}
					}
				}
			}

			isTyping = false;
			const cleanedResponse = await processCompanionResponse(content, fullContent);
			chatStore.updateLastMessage(cleanedResponse);
			latestResponse = cleanedResponse;

			// Trigger talking animation based on response length
			if (cleanedResponse) {
				vrmStore.startTalking(cleanedResponse);
			}

			// TTS - speak if module is enabled
			const speechState = modulesStore.getModuleState('speech');
			const speechSettings = modulesStore.getModuleSettings('speech');
			if (speechState?.enabled && cleanedResponse) {
				const ttsProvider = speechSettings.activeProvider as TTSProvider;
				const ttsConfig = settingsStore.getProviderConfig(ttsProvider);
				const ttsMeta = getTTSProvider(ttsProvider);

				ttsStore.speak(cleanedResponse, {
					provider: ttsProvider,
					apiKey: ttsConfig.apiKey,
					voiceId: speechSettings.activeVoiceId as string || ttsConfig.voiceId,
					baseUrl: ttsConfig.baseUrl || ttsMeta?.defaultBaseUrl,
					speed: speechSettings.speed as number ?? 1
				});
			}
		} catch (err) {
			chatStore.setError(err instanceof Error ? err.message : 'Unknown error');
			isTyping = false;
		} finally {
			chatStore.setLoading(false);
		}
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

		eventsApi.recordCompletedEvent(
			event,
			choiceIndex,
			choiceIndex !== undefined ? `Choice ${choiceIndex + 1}` : undefined
		).then(() => {
			characterStore.markEventCompleted(event.id);
		}).catch((e) => {
			console.error('Failed to record event completion:', e);
		});

		activeEvent = null;
	}

	function handleEventClose() {
		activeEvent = null;
	}
</script>

<div class="app-container">
	<TopLeftButtons onOpenMemoryGraph={() => showMemoryGraph = true} />
	<TopRightButtons onInfoClick={() => showInfoModal = true} />
	{#if showInfoModal}
		<InfoModal onClose={() => showInfoModal = false} />
	{/if}
	{#if showMemoryGraph}
		<MemoryGraphModal onClose={() => showMemoryGraph = false} />
	{/if}

	<main class="main-content">
		<!-- VRM Stage (Full Background) -->
		<div class="stage-container">
			{#if vrmStore.isLoading || !vrmStore.modelUrl}
				<div class="loading-dots">
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
				</div>
			{/if}

			{#if vrmStore.error}
				<div class="error-toast" onclick={() => vrmStore.setError(null)}>
					<span>{vrmStore.error}</span>
					<button type="button" class="toast-dismiss" aria-label="Dismiss">✕</button>
				</div>
			{/if}

			<VrmScene />
		</div>

		<!-- Companion Status (Top Left) - includes settings icons now -->
		<CompanionStatus />

		<!-- Floating Stat Indicators -->
		<FloatingStatIndicators />

		<!-- Speech Bubble (shows latest response, click to dismiss) -->
		<SpeechBubble
			message={latestResponse}
			isTyping={isTyping}
			onHide={handleBubbleHide}
		/>

		<!-- Bottom Chat Bar -->
		<BottomChatBar onSend={handleSend} disabled={chatStore.isLoading} />

		<!-- Error toast for chat errors -->
		{#if chatStore.error}
			<div class="chat-error-toast" onclick={() => chatStore.setError(null)}>
				<span>{chatStore.error}</span>
				<button type="button" class="toast-dismiss" aria-label="Dismiss">✕</button>
			</div>
		{/if}

		<!-- Event Scene Overlay -->
		{#if activeEvent?.scene}
			<EventScene
				scene={activeEvent.scene}
				eventName={activeEvent.name}
				eventType={activeEvent.type}
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
		background: linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		color: white;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 50;
		animation: errorSlideDownShake 0.5s ease-out;
		box-shadow:
			0 4px 20px rgba(238, 90, 90, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
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
		border-radius: 6px;
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
