<script lang="ts">
	import VrmScene from '$lib/components/vrm/VrmScene.svelte';
	import BottomChatBar from '$lib/components/chat/BottomChatBar.svelte';
	import SpeechBubble from '$lib/components/chat/SpeechBubble.svelte';
	import FloatingChatIcon from '$lib/components/overlay/FloatingChatIcon.svelte';
	import FloatingMicButton from '$lib/components/overlay/FloatingMicButton.svelte';
	import HotkeyHandler from '$lib/components/overlay/HotkeyHandler.svelte';
	import CompanionStatus from '$lib/components/ui/CompanionStatus.svelte';
	import FloatingStatIndicators from '$lib/components/ui/FloatingStatIndicators.svelte';
	import { EventScene } from '$lib/components/events';
	import { Icon } from '$lib/components/ui';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { overlayStore } from '$lib/stores/overlay.svelte';
	import { isTauri, startDragging } from '$lib/services/platform';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import { streamChatDirect } from '$lib/services/chat/client-chat';
	import { allEvents } from '$lib/data/events';
	import { checkAllEvents, eventsApi } from '$lib/engine/events';
	import type { TTSProvider } from '$lib/types';
	import type { EventDefinition } from '$lib/types/events';
	import type { StateUpdates } from '$lib/types/character';

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
	import { initEmbeddingModel, subscribeToEmbeddingState } from '$lib/services/embeddings';
	import { debugEventsStore } from '$lib/stores/debugEvents.svelte';

	let latestResponse = $state('');
	let isTyping = $state(false);
	let isMemoryReady = $state(false);
	let activeEvent = $state<EventDefinition | null>(null);

	const chatExpanded = $derived(overlayStore.chatExpanded);

	// Hydrate working memory on start
	$effect(() => {
		isMemoryReady = false;
		(async () => {
			try {
				await hydrateWorkingMemory();
				isMemoryReady = true;
			} catch (e) {
				console.error('Failed to hydrate working memory:', e);
				isMemoryReady = true;
			}
		})();
	});

	// Initialize embedding model and backfill facts without embeddings
	$effect(() => {
		const unsub = subscribeToEmbeddingState(() => {});

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

	// Debug events (from developer tools)
	$effect(() => {
		const debugEvent = debugEventsStore.consume();
		if (debugEvent) {
			activeEvent = debugEvent;
		}
	});

	// Handle drag for Tauri window
	function handleDragStart(e: MouseEvent) {
		if (isTauri()) {
			startDragging();
		}
	}

	// Exit overlay and return to main window
	async function exitToMain() {
		if (!isTauri()) return;
		try {
			const { getCurrentWindow, getAllWindows } = await import('@tauri-apps/api/window');

			const windows = await getAllWindows();
			const mainWindow = windows.find(w => w.label === 'main');

			if (!mainWindow) {
				// Main window was closed — don't hide overlay or user loses the app
				console.error('Main window not found, cannot exit overlay');
				return;
			}

			await mainWindow.show();
			await mainWindow.setFocus();

			const overlay = getCurrentWindow();
			await overlay.hide();
		} catch (e) {
			console.error('Failed to exit overlay:', e);
		}
	}

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

		if (characterStore.appMode === 'dating_sim') {
			const completedEventIds = characterStore.state.completedEvents || [];
			const transition = checkAndApplyStageTransition(characterStore.state, completedEventIds);
			if (transition.transitioned && transition.toStage) {
				characterStore.setRelationshipStage(transition.toStage);
			}
		}

		addTurnToWorkingMemory({ role: 'user', content: userMessage, createdAt: new Date() });
		addTurnToWorkingMemory({ role: 'assistant', content: dialogue, createdAt: new Date() });

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

		// Check for events (dating sim mode only)
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

	async function handleSend(content: string) {
		if (!content.trim() || chatStore.isLoading) return;

		if (!modulesStore.isModuleEnabled('consciousness')) {
			chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
			return;
		}

		chatStore.addMessage('user', content);
		chatStore.setLoading(true);
		chatStore.setError(null);
		isTyping = true;
		latestResponse = '';

		// Collapse chat after sending
		overlayStore.setChatExpanded(false);

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
				// Tauri: call provider APIs directly (no server routes in static builds)
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
				// Web: use SvelteKit server route
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

			if (cleanedResponse) {
				vrmStore.startTalking(cleanedResponse);
			}

			// TTS
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

	function handleBubbleHide() {
		latestResponse = '';
	}

	function handleCharacterClick() {
		overlayStore.activate();
	}

	function handleEventComplete(choiceIndex?: number, stateChanges?: Partial<StateUpdates>) {
		if (!activeEvent) return;
		const event = $state.snapshot(activeEvent);
		if (stateChanges) {
			characterStore.applyUpdates(stateChanges as StateUpdates);
		} else if (event.stateChanges) {
			characterStore.applyUpdates(event.stateChanges);
		}
		eventsApi.recordCompletedEvent(
			event, choiceIndex,
			choiceIndex !== undefined ? `Choice ${choiceIndex + 1}` : undefined
		).then(() => characterStore.markEventCompleted(event.id))
		.catch((e) => console.error('Failed to record event:', e));
		activeEvent = null;
	}

	function handleEventClose() {
		activeEvent = null;
	}
</script>

<div class="overlay-container">
	<!-- VRM Scene (fills the overlay) - locked to prevent rotation when dragging -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="scene-container" onmousedown={handleDragStart}>
		<VrmScene overlay={true} locked={true} />
	</div>

	<!-- Exit button (return to main app) -->
	<button class="exit-btn" onclick={exitToMain} aria-label="Exit to main app" title="Exit to main app">
		<Icon name="x" size={16} />
	</button>

	<!-- Speech Bubble -->
	<SpeechBubble
		message={latestResponse}
		isTyping={isTyping}
		onHide={handleBubbleHide}
	/>

	<!-- Floating stat change indicators -->
	<FloatingStatIndicators />

	<!-- Bottom controls (status + mic + chat icon) -->
	<div class="chat-controls">
		<CompanionStatus overlay={true} />
		{#if !chatExpanded}
			<FloatingMicButton onTranscript={handleSend} />
		{/if}
		<FloatingChatIcon />
	</div>

	<!-- Expandable Chat Bar -->
	{#if chatExpanded}
		<div class="chat-bar-container">
			<BottomChatBar onSend={handleSend} disabled={chatStore.isLoading} />
		</div>
	{/if}

	<!-- Error toasts -->
	{#if chatStore.error}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="error-toast" onclick={() => chatStore.setError(null)}>
			<span>{chatStore.error}</span>
		</div>
	{/if}
	{#if sttStore.error}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="error-toast" onclick={() => sttStore.clearError()}>
			<span>{sttStore.error}</span>
		</div>
	{/if}

	<!-- Event Scene Overlay -->
	{#if activeEvent?.scene}
		<EventScene
			scene={activeEvent.scene}
			eventName={activeEvent.name}
			eventType={activeEvent.type}
			companionName={personaStore.activeCard.name}
			overlay={true}
			onComplete={handleEventComplete}
			onClose={handleEventClose}
		/>
	{/if}

	<!-- Global hotkey handler (Tauri only) -->
	<HotkeyHandler onSendMessage={handleSend} />
</div>

<style>
	.overlay-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: transparent;
	}

	.scene-container {
		position: absolute;
		inset: 0;
		cursor: grab;
	}

	.scene-container:active {
		cursor: grabbing;
	}

	.exit-btn {
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease, transform 0.15s ease;
	}

	.overlay-container:hover .exit-btn {
		opacity: 0.6;
		pointer-events: auto;
	}

	.exit-btn:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.chat-controls {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
	}

	.chat-bar-container {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		padding: 0 1rem;
		z-index: 35;
		animation: slideUp 0.2s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.error-toast {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.5rem 0.875rem;
		background: linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: white;
		font-size: 0.75rem;
		max-width: calc(100% - 2rem);
		text-align: center;
		cursor: pointer;
		z-index: 50;
		animation: slideUpShake 0.5s ease-out;
		box-shadow:
			0 4px 20px rgba(238, 90, 90, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	@keyframes slideUpShake {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(8px);
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
</style>
