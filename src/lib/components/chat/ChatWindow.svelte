<script lang="ts">
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import { Icon } from '$lib/components/ui';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import type { TTSProvider } from '$lib/types';
	import type { EventDefinition } from '$lib/types/events';

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
		determinFactCategory,
		calculateFactImportance
	} from '$lib/engine/memory';
	import { checkAllEvents, eventsApi } from '$lib/engine/events';
	import { allEvents } from '$lib/data/events';

	// Event props for scene triggering
	interface Props {
		onEventTriggered?: (event: EventDefinition) => void;
	}

	let { onEventTriggered }: Props = $props();

	// Track memory hydration state
	let isMemoryReady = $state(false);

	// Hydrate working memory from IndexedDB on mount
	$effect(() => {
		isMemoryReady = false;
		(async () => {
			await hydrateWorkingMemory();
			isMemoryReady = true;
		})();
	});

	// Process companion response with v2 system
	async function processCompanionResponse(userMessage: string, companionResponse: string): Promise<string> {
		const state = characterStore.state;

		// 1. Calculate baseline updates from user message
		const baselineUpdates = calculateBaselineUpdates(userMessage, state);

		// 2. Parse companion response for LLM-suggested updates
		const parsed = parseResponse(companionResponse);
		const dialogue = parsed.dialogue;
		const llmUpdates = parsed.stateUpdates;
		if (parsed.parseError) {
			console.debug('LLM JSON parse error (using heuristics only):', parsed.parseError);
		}

		// 3. Validate and sanitize LLM updates if present
		let validatedLLMUpdates = null;
		if (llmUpdates) {
			const validation = validateStateUpdates(llmUpdates);
			if (validation.warnings.length > 0) {
				console.debug('LLM state update warnings:', validation.warnings);
			}
			validatedLLMUpdates = validation.sanitized;
		}

		// 4. Merge baseline + LLM updates (LLM takes precedence for mood)
		const finalUpdates = mergeUpdates(baselineUpdates, validatedLLMUpdates || {});

		// Debug: log state updates
		// console.log('=== STATE UPDATES ===');
		// console.log('Baseline from heuristics:', baselineUpdates);
		// console.log('Final updates applied:', finalUpdates);
		// console.log('Before:', {
		// 	affection: characterStore.state.affection,
		// 	trust: characterStore.state.trust,
		// 	intimacy: characterStore.state.intimacy,
		// 	comfort: characterStore.state.comfort,
		// 	energy: characterStore.state.energy
		// });

		// 5. Apply updates to character state
		characterStore.applyUpdates(finalUpdates);

		// 5b. Save LLM-generated memory observation if present
		if (finalUpdates.newMemory) {
			try {
				await memoryApi.createFact({
					content: finalUpdates.newMemory,
					category: determinFactCategory(finalUpdates.newMemory),
					importance: calculateFactImportance(finalUpdates.newMemory)
				});
				// console.log('[Memory] Saved LLM observation:', finalUpdates.newMemory);
			} catch (e) {
				console.debug('[Memory] Failed to save LLM observation:', e);
			}
		}

		// console.log('After:', {
		// 	affection: characterStore.state.affection,
		// 	trust: characterStore.state.trust,
		// 	intimacy: characterStore.state.intimacy,
		// 	comfort: characterStore.state.comfort,
		// 	energy: characterStore.state.energy
		// });
		// console.log('======================');

		// 6. Check for stage transitions (only in Dating Sim Mode)
		if (characterStore.appMode === 'dating_sim') {
			const completedEventIds = characterStore.state.completedEvents || [];
			const transition = checkAndApplyStageTransition(characterStore.state, completedEventIds);
			if (transition.transitioned && transition.toStage) {
				characterStore.setRelationshipStage(transition.toStage);
				// console.log(`Stage transition: ${transition.fromStage} -> ${transition.toStage}`);
			}
		}

		// 7. Save conversation turns to working memory
		addTurnToWorkingMemory({ role: 'user', content: userMessage, createdAt: new Date() });
		addTurnToWorkingMemory({ role: 'assistant', content: dialogue, createdAt: new Date() });

		// 8. Extract and save potential facts
		const potentialFacts = extractPotentialFacts(dialogue, userMessage);
		// console.log('[Memory] Extracted facts from conversation:', potentialFacts);
		for (const factContent of potentialFacts.slice(0, 2)) {
			try {
				const userAnalysis = analyzeMessage(userMessage);
				await memoryApi.createFact({
					content: factContent,
					category: determinFactCategory(factContent),
					importance: calculateFactImportance(factContent, userAnalysis.sentiment)
				});
			} catch (e) {
				console.debug('Failed to save fact:', e);
			}
		}

		// 9. Check for triggered events (only in Dating Sim Mode)
		if (characterStore.appMode === 'dating_sim') {
			try {
				const completedEvents = await eventsApi.getCompletedEvents();
				const triggeredEvents = checkAllEvents(
					allEvents,
					characterStore.state,
					completedEvents,
					userMessage
				);

				// Trigger the highest priority event
				if (triggeredEvents.length > 0 && onEventTriggered) {
					const topEvent = triggeredEvents[0];
					onEventTriggered(topEvent);
				}
			} catch (e) {
				console.debug('Event check failed:', e);
			}
		}

		// Return the cleaned dialogue
		return dialogue;
	}

	// Build the system prompt with v2 companion context
	async function buildCompanionSystemPrompt(userMessage: string): Promise<string> {
		const state = characterStore.state;
		const persona = personaStore.activeCard;

		// Debug: log character state
		// console.log('=== CHARACTER STATE ===');
		// console.log({
		// 	personaName: persona.name,
		// 	mood: state.mood,
		// 	energy: state.energy,
		// 	relationshipStage: state.relationshipStage,
		// 	affection: state.affection,
		// 	trust: state.trust,
		// 	intimacy: state.intimacy,
		// 	comfort: state.comfort
		// });

		// Retrieve relevant context from memory
		const memories = await retrieveRelevantContext(userMessage);

		const context: PromptContext = {
			persona,
			state,
			memories,
			userMessage,
			systemTime: new Date()
		};

		const systemPrompt = buildSystemPrompt(context);

		// Debug: log the full system prompt
		// console.log('=== SYSTEM PROMPT ===');
		// console.log(systemPrompt);
		// console.log('================================');

		return systemPrompt;
	}

	async function handleSend(content: string) {
		if (!content.trim() || chatStore.isLoading) return;

		// Check if chat is enabled
		if (!modulesStore.isModuleEnabled('consciousness')) {
			chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
			return;
		}

		// Add user message
		chatStore.addMessage('user', content);
		chatStore.setLoading(true);
		chatStore.setError(null);

		// Update streak on first message of the day
		characterStore.updateStreak();
		characterStore.updateDaysKnown();

		try {
			// Get LLM settings from consciousness module
			const consciousnessSettings = modulesStore.getModuleSettings('consciousness');
			const provider = consciousnessSettings.activeProvider as string;
			const model = consciousnessSettings.activeModel as string;

			if (!provider) {
				throw new Error('Please configure a provider in Settings > Modules > Consciousness');
			}

			// Build system prompt with v2 companion context
			const systemPrompt = await buildCompanionSystemPrompt(content);

			// Get API key from settings store (single source of truth for credentials)
			const providerConfig = settingsStore.getProviderConfig(provider);
			const apiKey = providerConfig.apiKey;
			const providerMeta = getLLMProvider(provider);

			// Check if provider requires API key
			if (providerMeta?.requiresApiKey && !apiKey) {
				throw new Error(`Please configure API key for ${providerMeta.name} in Settings > Providers`);
			}

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: chatStore.messages.map((m) => ({
						role: m.role,
						content: m.content
					})),
					provider,
					model: model || providerMeta?.models?.[0]?.id,
					apiKey: apiKey || 'not-needed',
					baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
					systemPrompt
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get response');
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			// Add placeholder for assistant message
			chatStore.addMessage('assistant', '');
			let fullContent = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('0:')) {
						// xsai format: text delta
						const text = JSON.parse(line.slice(2));
						fullContent += text;
						chatStore.updateLastMessage(fullContent);
					} else if (line.startsWith('e:')) {
						// Error event from server
						const { error } = JSON.parse(line.slice(2));
						throw new Error(error);
					}
				}
			}

			// Process response with v2 companion system
			const cleanedResponse = await processCompanionResponse(content, fullContent);

			// Update message with cleaned dialogue
			chatStore.updateLastMessage(cleanedResponse);

			// Trigger talking animation based on response length
			if (cleanedResponse) {
				vrmStore.startTalking(cleanedResponse);
			}

			// Trigger TTS if speech module is enabled (use cleaned response)
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
			console.error('Chat error:', err);
		} finally {
			chatStore.setLoading(false);
		}
	}

	function handleClear() {
		chatStore.clearMessages();
	}
</script>

<div class="chat-window">
	<header class="chat-header">
		<h2>{personaStore.activeCard.name}</h2>
		<div class="header-actions">
			{#if chatStore.messages.length > 0}
				<button class="btn btn-ghost icon-btn" onclick={handleClear} title="Clear messages">
					<Icon name="trash" size={16} />
				</button>
			{/if}
		</div>
	</header>

	<MessageList />

	{#if chatStore.error}
		<div class="error-message">
			{chatStore.error}
		</div>
	{/if}

	<ChatInput onSend={handleSend} disabled={chatStore.isLoading} />
</div>

<style>
	.chat-window {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 1rem;
		overflow: hidden;
	}

	.chat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.chat-header h2 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-neutral-700);
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-btn {
		padding: 0.375rem;
	}

	.error-message {
		margin: 0 1rem;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		border-radius: 0.5rem;
		color: var(--color-error);
		font-size: 0.75rem;
	}
</style>
