// The one companion send/stream pipeline, shared by the main app and the
// desktop overlay. Both pages used to carry ~180 near-identical lines each,
// which had already drifted (the overlay forgot to filter empty messages). This
// centralizes prompt building, streaming (direct vs. server route), the
// post-turn processing, keepsakes, TTS, and the talking animation. Pages provide
// a small set of hooks to sync their own reactive state.
import { characterStore } from '$lib/stores/character.svelte';
import type { ThinkingPhase } from './chat-phase';
import { chatStore } from '$lib/stores/chat.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { modulesStore } from '$lib/stores/modules.svelte';
import { ttsStore } from '$lib/stores/tts.svelte';
import { personaStore } from '$lib/stores/persona.svelte';
import { vrmStore } from '$lib/stores/vrm.svelte';
import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
import { type TTSOptions } from '$lib/services/tts';
import { cleanSpeechMarkers, hasIncompleteTrailingMarkup } from '$lib/services/tts/chat-text';
import { streamChatDirect } from '$lib/services/chat/client-chat';

import { processCompanionTurn } from '$lib/services/chat/companion-turn';
import { retrieveRelevantContext } from '$lib/engine/memory';
import { buildSystemPrompt, truncateChatHistory, type PromptContext } from '$lib/ai/prompt-builder';
import { keepImage, type PreparedImage } from '$lib/services/storage/keepsakes';
import { extractReminderTags, tryExtractReminderFromUserMessage } from '$lib/utils/reminders';
import { reminderStore } from '$lib/stores/reminders.svelte';
import { getWorkingMemory, ensureSession } from '$lib/engine/memory';
import { toOpenAIContent, type ContentPart } from '$lib/services/chat/content';
import { isTauri } from '$lib/services/platform';
import type { LLMProvider, TTSProvider } from '$lib/types';
import type { EventDefinition } from '$lib/types/events';

export interface CompanionChatHooks {
	/** Toggle the typing indicator. */
	setTyping: (typing: boolean) => void;
	/** The latest cleaned reply, for the speech bubble. */
	setLatestResponse: (response: string) => void;
	/** A visual-novel event the reply triggered. */
	setActiveEvent: (event: EventDefinition) => void;
	/** Blob-URL previews of images shown this turn (main app scrapbook). */
	onShownImages?: (shown: { id: string; url: string }[]) => void;
	/** The new memory the model recorded, if any. */
	onNewMemory?: (memory: string | undefined) => void;
	/** Runs just before streaming starts (e.g. the overlay collapses its chat). */
	beforeStream?: () => void;
	/** What she is doing right now (remembering, seeing, thinking). */
	setPhase?: (phase: ThinkingPhase) => void;
}

/**
 * Returns true when `text` ends with an incomplete speak/pause/gesture call or
 * an incomplete legacy language tag. Used by the streaming delta cleaner to
 * decide whether it can flush the current chunk or needs to wait for more data.
 */
async function buildCompanionPrompt(
	userMessage: string,
	hasImages: boolean,
	contextSize?: number,
	systemEvent?: string
): Promise<string> {
	const workingMemory = getWorkingMemory();
	const speechSettings = modulesStore.getModuleSettings('speech');
	const context: PromptContext = {
		persona: personaStore.activeCard,
		state: characterStore.state,
		memories: await retrieveRelevantContext(userMessage, contextSize),
		userMessage,
		systemTime: new Date(),
		hasImages,
		contextSize,
		pendingReminders: reminderStore.upcoming.map((r) => ({ triggerAt: r.triggerAt, content: r.content })),
		sessionStartedAt: workingMemory.sessionStartedAt,
		systemEvent,
		ttsProvider: speechSettings.activeProvider as string | undefined,
		ttsLanguage: (speechSettings.activeLanguage as string) || undefined,
		ttsAltLanguage: (speechSettings.altLanguage as string) || undefined,
		ttsAltEnabled: (speechSettings.enableAltLanguage as boolean) ?? false
	};
	return buildSystemPrompt(context);
}

// Assemble the message history for the provider. The current turn carries the
// image bytes; prior turns stay text. Empty messages are dropped (the assistant
// placeholder, and any stray blank turn) so we never send an empty message.
function buildMessages(images: PreparedImage[]) {
	const history = chatStore.messages.slice(0, -1).filter((m) => m.content || m.images?.length);
	return history.map((m, idx) => {
		const isCurrentTurn = idx === history.length - 1 && images.length > 0;
		if (!isCurrentTurn) {
			return { role: m.role as 'user' | 'assistant', content: m.content };
		}
		const parts: ContentPart[] = [];
		if (m.content) parts.push({ type: 'text', text: m.content });
		for (const img of images) {
			parts.push({ type: 'image', mimeType: img.mimeType, data: img.base64 });
		}
		return { role: m.role as 'user' | 'assistant', content: parts };
	});
}

// Consume the server route's 0:/e: SSE framing, buffering partial lines. The
// reader lock is always released, even on an e: error line (which used to leak).
async function streamServerRoute(
	body: unknown,
	onDelta: (fullContent: string) => void
): Promise<string> {
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const errBody = await response.json().catch(() => null);
		throw new Error(errBody?.error || 'Failed to get response');
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error('No response body');

	const decoder = new TextDecoder();
	let fullContent = '';
	const processLine = (line: string) => {
		if (line.startsWith('0:')) {
			fullContent += JSON.parse(line.slice(2));
			onDelta(fullContent);
		} else if (line.startsWith('e:')) {
			throw new Error(JSON.parse(line.slice(2)).error);
		}
	};

	try {
		let buffer = '';
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';
			for (const line of lines) processLine(line);
		}
		buffer += decoder.decode();
		if (buffer) processLine(buffer);
	} finally {
		reader.releaseLock();
	}

	return fullContent;
}

/**
 * Send a user message and run the full companion turn. Handles both transports
 * (direct provider call on desktop/local, server route on web/cloud), post-turn
 * state, keepsakes, TTS, and the talking animation. Errors surface via
 * chatStore.setError; the returned promise always resolves.
 */
export interface SendCompanionMessageOptions {
	/** When true, the message is delivered as a system event instead of a user turn. */
	systemEvent?: boolean;
}

export async function sendCompanionMessage(
	content: string,
	images: PreparedImage[],
	hooks: CompanionChatHooks,
	options: SendCompanionMessageOptions = {}
): Promise<void> {
	const { systemEvent = false } = options;
	if ((!content.trim() && images.length === 0) || chatStore.isLoading) return;

	if (!modulesStore.isModuleEnabled('consciousness')) {
		chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
		return;
	}

	const shown = images.map((img) => ({ id: img.id, url: URL.createObjectURL(img.blob) }));

	if (!systemEvent) {
		chatStore.addMessage('user', content, shown.length ? shown : undefined);
		hooks.onShownImages?.(shown);
	}

	// Client fallback: if the user phrases a reminder naturally and the LLM
	// fails to emit a [reminder:...] tag, schedule it after the turn.
	const directReminder = systemEvent ? null : tryExtractReminderFromUserMessage(content);

	chatStore.setLoading(true);
	chatStore.setError(null);
	hooks.setTyping(true);
	hooks.setLatestResponse('');
	hooks.setPhase?.('remembering');
	hooks.beforeStream?.();

	// Tracks whether an OmniVoice streaming TTS session was started for this
	// turn. Declared here so the error path can cancel it.
	let streamingTTS = false;

	// Only touch relationship-time state once the character has loaded, or an
	// early message would mutate the default state that load then discards.
	// System events (e.g. fired reminders) must not count as interaction.
	if (!systemEvent && characterStore.isReady) {
		characterStore.updateStreak();
		characterStore.updateDaysKnown();
	}

	try {
		const consciousnessSettings = modulesStore.getModuleSettings('consciousness');
		const provider = consciousnessSettings.activeProvider as string;
		const model = consciousnessSettings.activeModel as string;
		if (!provider) {
			throw new Error('Please configure a provider in Settings > Modules > Consciousness');
		}

		const contextSize = (consciousnessSettings.contextSize as number | undefined) || undefined;
		const providerConfig = settingsStore.getProviderConfig(provider);
		const apiKey = providerConfig.apiKey;
		const providerMeta = getLLMProvider(provider);
		if (providerMeta?.requiresApiKey && !apiKey) {
			throw new Error(`Please configure API key for ${providerMeta.name} in Settings > Providers`);
		}

		const systemPrompt = await buildCompanionPrompt(
			content,
			images.length > 0,
			contextSize,
			systemEvent ? content : undefined
		);

		// Prompt building (memory retrieval) is done; the model call starts now
		hooks.setPhase?.(images.length > 0 ? 'seeing' : 'thinking');

		chatStore.addMessage('assistant', '');
		const selectedModel = model || providerMeta?.models?.[0]?.id || '';
		const baseURL = providerConfig.baseUrl || providerMeta?.defaultBaseUrl;
		let messages = buildMessages(images);

		// Snapshot speech settings at turn start so mid-stream changes cannot
		// corrupt an ongoing TTS session, then start OmniVoice streaming before
		// the LLM call so the first sentence can be synthesised while the model
		// is still generating the rest of the reply.
		const displaySpeechSettings = modulesStore.getModuleSettings('speech');
		const displayTtsProvider = displaySpeechSettings.activeProvider as TTSProvider;
		const speechState = modulesStore.getModuleState('speech');

		const ttsConfig = settingsStore.getProviderConfig(displayTtsProvider);
		const ttsMeta = getTTSProvider(displayTtsProvider);
		const baseTtsOptions: TTSOptions = {
			provider: displayTtsProvider,
			apiKey: ttsConfig.apiKey,
			voiceId: (displaySpeechSettings.activeVoiceId as string) || undefined,
			model: (displaySpeechSettings.activeModel as string) || ttsConfig.modelId,
			baseUrl: ttsConfig.baseUrl || ttsMeta?.defaultBaseUrl,
			speed: (displaySpeechSettings.speed as number) ?? 1,
			// Leave unset when the user hasn't picked one; the orchestrator
			// infers the primary language from the first segment instead.
			language: (displaySpeechSettings.activeLanguage as string) || undefined,
			altLanguage: (displaySpeechSettings.altLanguage as string) || undefined,
			altVoiceId: (displaySpeechSettings.altVoiceId as string) || undefined,
			enableAltLanguage: (displaySpeechSettings.enableAltLanguage as boolean) ?? false,
			altSpeed: (displaySpeechSettings.altSpeed as number) ?? undefined
		};

		const ttsOptions: TTSOptions =
			displayTtsProvider === 'omnivoice'
				? {
						...baseTtsOptions,
						instructions: (displaySpeechSettings.instructions as string) || undefined,
						altInstructions: (displaySpeechSettings.altInstructions as string) || undefined,
						numStep: (displaySpeechSettings.numStep as number) ?? undefined,
						altNumStep: (displaySpeechSettings.altNumStep as number) ?? undefined,
						positionTemperature: (displaySpeechSettings.positionTemperature as number) ?? undefined,
						classTemperature: (displaySpeechSettings.classTemperature as number) ?? undefined,
						altPositionTemperature:
							(displaySpeechSettings.altPositionTemperature as number) ?? undefined,
						altClassTemperature:
							(displaySpeechSettings.altClassTemperature as number) ?? undefined
				  }
				: baseTtsOptions;

		streamingTTS =
			speechState?.enabled && displayTtsProvider === 'omnivoice'
				? ttsStore.beginStreaming(ttsOptions)
				: false;
		let streamedLength = 0;
		let displayedSoFar = '';
		let pendingRaw = '';

		const onDelta = (full: string) => {
			if (displayTtsProvider !== 'omnivoice') {
				chatStore.updateLastMessage(full);
				streamedLength = full.length;
				return;
			}

			const delta = full.slice(streamedLength);
			pendingRaw += delta;

			// Only flush when no incomplete speak/pause/gesture call or language
			// tag is dangling at the end. This keeps the incremental cleanup O(1)
			// per chunk instead of re-parsing the full accumulated text every time.
			if (!hasIncompleteTrailingMarkup(pendingRaw)) {
				displayedSoFar += cleanSpeechMarkers(pendingRaw);
				pendingRaw = '';
			}

			chatStore.updateLastMessage(displayedSoFar);

			if (streamingTTS && full.length > streamedLength) {
				ttsStore.feedStreaming(full.slice(streamedLength));
			}
			streamedLength = full.length;
		};

		// Truncate message history to the configured context window. This applies
		// to every provider so users can size prompts to their model's limit.
		// Image turns use a non-string content shape; token estimation for them is
		// handled by substituting a placeholder inside the helper.
		if (contextSize && contextSize > 0 && messages.length > 0) {
			messages = truncateChatHistory(messages, systemPrompt, contextSize);
		}

		// Advanced parameters are only supported for OpenAI-compatible endpoints.
		const advancedParams = providerMeta?.custom
			? {
					temperature: (consciousnessSettings.temperature as number) ?? 0.7,
					topP: (consciousnessSettings.topP as number) ?? 1.0,
					maxTokens: (consciousnessSettings.maxTokens as number) || undefined,
					presencePenalty: (consciousnessSettings.presencePenalty as number) ?? 0,
					frequencyPenalty: (consciousnessSettings.frequencyPenalty as number) ?? 0
				}
			: {};

		let fullContent = '';
		if (isTauri() || providerMeta?.isLocal) {
			// Desktop and local providers call the provider API directly.
			await new Promise<void>((resolve, reject) => {
				streamChatDirect(
					{
						messages,
						provider: provider as LLMProvider,
						model: selectedModel,
						apiKey: apiKey || undefined,
						baseURL,
						systemPrompt,
						...advancedParams
					},
					(text) => {
						fullContent += text;
						onDelta(fullContent);
					},
					(error) => reject(new Error(error)),
					() => resolve()
				);
			});
		} else {
			// Cloud providers on web go through the SvelteKit server route.
			fullContent = await streamServerRoute(
				{
					messages: messages.map((m) => ({ role: m.role, content: toOpenAIContent(m.content) })),
					provider,
					model: selectedModel,
					apiKey: apiKey || (providerMeta?.custom ? undefined : 'not-needed'),
					baseURL,
					systemPrompt,
					...advancedParams
				},
				onDelta
			);
		}

		hooks.setTyping(false);

		if (streamingTTS) {
			// Intentionally fire-and-forget: endStreaming flushes the buffer and
			// waits for the orchestrator to finish, but memory/event/image
			// processing (processCompanionTurn) must not be blocked.
			void ttsStore.endStreaming();
		}

		// For OmniVoice the raw response contains speak({...}) / gesture({...})
		// pseudo-tool-calls (or a JSON state block when native tools are used).
		// Strip them before memory/fact extraction so the data layer only sees
		// clean dialogue.
		const cleanedCompanionResponse =
			displayTtsProvider === 'omnivoice' ? cleanSpeechMarkers(fullContent) : fullContent;

		const turn = await processCompanionTurn({
			userMessage: content,
			companionResponse: cleanedCompanionResponse,
			llm: {
				provider,
				model: selectedModel,
				apiKey: apiKey || undefined,
				baseURL,
				hasImages: images.length > 0
			},
			systemEvent,
			debug: import.meta.env.DEV
		});

		// Schedule a direct fallback only when the LLM did not emit any reminder
		// tag itself. This prevents duplicate reminders when the model correctly
		// schedules one via [reminder:...].
		if (directReminder) {
			const { reminders: llmReminders } = extractReminderTags(fullContent);
			if (llmReminders.length === 0) {
				// ensureSession creates a session on demand, so a reminder phrased right
				// after a reload still gets scheduled without resuming stale sessions.
				const sessionId = await ensureSession();
				if (sessionId) {
					try {
						await reminderStore.addReminder(
							directReminder.content,
							directReminder.triggerAt,
							sessionId
						);
					} catch (e) {
						console.error('[Reminder] Direct scheduling failed:', e);
					}
				}
			}
		}

		hooks.onNewMemory?.(turn.newMemory);
		if (turn.triggeredEvent) hooks.setActiveEvent(turn.triggeredEvent);

		// She's seen the images and responded; keep them as local keepsakes.
		if (images.length > 0) {
			await Promise.all(
				images.map((img) =>
					keepImage(img.id, img.blob, { mimeType: img.mimeType, note: turn.newMemory })
				)
			);
		}

		// turn.dialogue is already clean for OmniVoice because companionResponse
		// was stripped of speak()/gesture() syntax before processCompanionTurn.
		const displayDialogue = turn.dialogue;

		chatStore.updateLastMessage(displayDialogue);
		hooks.setLatestResponse(displayDialogue);

		if (turn.dialogue) {
			// During OmniVoice streaming the avatar is driven by ttsStore.isSpeaking
			// and the real audio analyser, so a text-length estimate would desync.
			// Only fall back to the estimated talking timer for non-streaming paths.
			if (!streamingTTS) {
				vrmStore.startTalking(displayDialogue);
			}

if (speechState?.enabled && !streamingTTS) {
				ttsStore.speak(turn.dialogue, ttsOptions);
			}
		}
	} catch (err) {
		if (streamingTTS) ttsStore.cancelStreaming();
		chatStore.setError(err instanceof Error ? err.message : 'Unknown error');
		hooks.setTyping(false);
	} finally {
		chatStore.setLoading(false);
	}
}
