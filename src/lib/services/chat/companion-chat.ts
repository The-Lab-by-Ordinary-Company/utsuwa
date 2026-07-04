// The one companion send/stream pipeline, shared by the main app and the
// desktop overlay. Both pages used to carry ~180 near-identical lines each,
// which had already drifted (the overlay forgot to filter empty messages). This
// centralizes prompt building, streaming (direct vs. server route), the
// post-turn processing, keepsakes, TTS, and the talking animation. Pages provide
// a small set of hooks to sync their own reactive state.
import { characterStore } from '$lib/stores/character.svelte';
import { chatStore } from '$lib/stores/chat.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { modulesStore } from '$lib/stores/modules.svelte';
import { ttsStore } from '$lib/stores/tts.svelte';
import { personaStore } from '$lib/stores/persona.svelte';
import { vrmStore } from '$lib/stores/vrm.svelte';
import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
import { streamChatDirect } from '$lib/services/chat/client-chat';
import { processCompanionTurn } from '$lib/services/chat/companion-turn';
import { retrieveRelevantContext } from '$lib/engine/memory';
import { buildSystemPrompt, type PromptContext } from '$lib/ai/prompt-builder';
import { keepImage, type PreparedImage } from '$lib/services/storage/keepsakes';
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
}

async function buildCompanionPrompt(userMessage: string, hasImages: boolean): Promise<string> {
	const context: PromptContext = {
		persona: personaStore.activeCard,
		state: characterStore.state,
		memories: await retrieveRelevantContext(userMessage),
		userMessage,
		systemTime: new Date(),
		hasImages
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
export async function sendCompanionMessage(
	content: string,
	images: PreparedImage[],
	hooks: CompanionChatHooks
): Promise<void> {
	if ((!content.trim() && images.length === 0) || chatStore.isLoading) return;

	if (!modulesStore.isModuleEnabled('consciousness')) {
		chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
		return;
	}

	const shown = images.map((img) => ({ id: img.id, url: URL.createObjectURL(img.blob) }));
	chatStore.addMessage('user', content, shown.length ? shown : undefined);
	hooks.onShownImages?.(shown);
	chatStore.setLoading(true);
	chatStore.setError(null);
	hooks.setTyping(true);
	hooks.setLatestResponse('');
	hooks.beforeStream?.();

	// Only touch relationship-time state once the character has loaded, or an
	// early message would mutate the default state that load then discards.
	if (characterStore.isReady) {
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

		const systemPrompt = await buildCompanionPrompt(content, images.length > 0);
		const providerConfig = settingsStore.getProviderConfig(provider);
		const apiKey = providerConfig.apiKey;
		const providerMeta = getLLMProvider(provider);
		if (providerMeta?.requiresApiKey && !apiKey) {
			throw new Error(`Please configure API key for ${providerMeta.name} in Settings > Providers`);
		}

		chatStore.addMessage('assistant', '');
		const selectedModel = model || providerMeta?.models?.[0]?.id || '';
		const baseURL = providerConfig.baseUrl || providerMeta?.defaultBaseUrl;
		const messages = buildMessages(images);
		const onDelta = (full: string) => chatStore.updateLastMessage(full);

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
						systemPrompt
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
					apiKey: apiKey || 'not-needed',
					baseURL,
					systemPrompt
				},
				onDelta
			);
		}

		hooks.setTyping(false);

		const turn = await processCompanionTurn({
			userMessage: content,
			companionResponse: fullContent,
			llm: {
				provider,
				model: selectedModel,
				apiKey: apiKey || undefined,
				baseURL,
				hasImages: images.length > 0
			},
			debug: import.meta.env.DEV
		});

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

		chatStore.updateLastMessage(turn.dialogue);
		hooks.setLatestResponse(turn.dialogue);

		if (turn.dialogue) {
			vrmStore.startTalking(turn.dialogue);

			const speechState = modulesStore.getModuleState('speech');
			const speechSettings = modulesStore.getModuleSettings('speech');
			if (speechState?.enabled) {
				const ttsProvider = speechSettings.activeProvider as TTSProvider;
				const ttsConfig = settingsStore.getProviderConfig(ttsProvider);
				const ttsMeta = getTTSProvider(ttsProvider);
				ttsStore.speak(turn.dialogue, {
					provider: ttsProvider,
					apiKey: ttsConfig.apiKey,
					voiceId: (speechSettings.activeVoiceId as string) || ttsConfig.voiceId,
					model: (speechSettings.activeModel as string) || ttsConfig.modelId,
					baseUrl: ttsConfig.baseUrl || ttsMeta?.defaultBaseUrl,
					speed: (speechSettings.speed as number) ?? 1
				});
			}
		}
	} catch (err) {
		chatStore.setError(err instanceof Error ? err.message : 'Unknown error');
		hooks.setTyping(false);
	} finally {
		chatStore.setLoading(false);
	}
}
