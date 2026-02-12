import type { LLMProvider } from '$lib/types';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ChatOptions {
	messages: ChatMessage[];
	provider: LLMProvider;
	model: string;
	apiKey?: string;
	baseURL?: string;
	systemPrompt: string;
}

// Provider base URLs (mirrors server route)
const PROVIDER_BASE_URLS: Partial<Record<LLMProvider, string>> = {
	openai: 'https://api.openai.com/v1/',
	anthropic: 'https://api.anthropic.com/v1/',
	google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
	deepseek: 'https://api.deepseek.com/',
	xai: 'https://api.x.ai/v1/',
	ollama: 'http://localhost:11434/v1/',
	lmstudio: 'http://localhost:1234/v1/'
};

const LOCAL_PROVIDERS: LLMProvider[] = ['ollama', 'lmstudio'];

/**
 * Stream chat completions directly from provider APIs.
 * Used in Tauri builds where SvelteKit server routes aren't available.
 */
export async function streamChatDirect(
	options: ChatOptions,
	onChunk: (text: string) => void,
	onError: (error: string) => void,
	onDone: () => void
): Promise<void> {
	const { messages, provider, model, apiKey, baseURL, systemPrompt } = options;

	const isLocal = LOCAL_PROVIDERS.includes(provider);
	if (!apiKey && !isLocal) {
		onError('API key required');
		return;
	}

	const providerBaseURL = baseURL || PROVIDER_BASE_URLS[provider];
	if (!providerBaseURL) {
		onError(`Unknown provider: ${provider}`);
		return;
	}

	const messagesWithSystem: ChatMessage[] = [
		{ role: 'system', content: systemPrompt },
		...messages
	];

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (provider === 'anthropic') {
		headers['x-api-key'] = apiKey || '';
		headers['anthropic-version'] = '2023-06-01';
		headers['anthropic-dangerous-direct-browser-access'] = 'true';
	} else if (apiKey) {
		headers['Authorization'] = `Bearer ${apiKey}`;
	}

	// Anthropic uses a different request format
	const body =
		provider === 'anthropic'
			? JSON.stringify({
					model,
					max_tokens: 4096,
					system: systemPrompt,
					messages: messages.filter((m) => m.role !== 'system'),
					stream: true
				})
			: JSON.stringify({
					model,
					messages: messagesWithSystem,
					stream: true
				});

	const url = provider === 'anthropic'
		? `${providerBaseURL.replace(/\/+$/, '')}/messages`
		: `${providerBaseURL.replace(/\/+$/, '')}/chat/completions`;

	try {
		const response = await fetch(url, { method: 'POST', headers, body });

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const msg =
				(errorData as { error?: { message?: string } })?.error?.message ||
				`Provider error (${response.status})`;
			onError(msg);
			return;
		}

		const reader = response.body?.getReader();
		if (!reader) {
			onError('No response body');
			return;
		}

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || trimmed === 'data: [DONE]') continue;
				if (!trimmed.startsWith('data: ')) continue;

				try {
					const json = JSON.parse(trimmed.slice(6));

					// OpenAI-compatible format
					if (json.choices?.[0]?.delta?.content) {
						onChunk(json.choices[0].delta.content);
					}
					// Anthropic format
					else if (json.type === 'content_block_delta' && json.delta?.text) {
						onChunk(json.delta.text);
					}
				} catch {
					// Skip malformed JSON lines
				}
			}
		}

		onDone();
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed to connect to provider';
		onError(msg);
	}
}
