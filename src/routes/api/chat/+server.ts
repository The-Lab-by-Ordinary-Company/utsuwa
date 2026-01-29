import { streamText } from '@xsai/stream-text';
import type { RequestHandler } from './$types';
import type { LLMProvider } from '$lib/types';

// Provider base URLs
const PROVIDER_BASE_URLS: Record<LLMProvider, string | undefined> = {
	// Cloud Commercial
	openai: 'https://api.openai.com/v1/',
	anthropic: 'https://api.anthropic.com/v1/',
	google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
	deepseek: 'https://api.deepseek.com/',
	mistral: 'https://api.mistral.ai/v1/',
	xai: 'https://api.x.ai/v1/',
	groq: 'https://api.groq.com/openai/v1/',
	perplexity: 'https://api.perplexity.ai/',
	moonshot: 'https://api.moonshot.cn/v1/',
	together: 'https://api.together.xyz/v1/',
	// Cloud Additional
	cerebras: 'https://api.cerebras.ai/v1/',
	fireworks: 'https://api.fireworks.ai/inference/v1/',
	novita: 'https://api.novita.ai/v3/openai/',
	'302ai': 'https://api.302.ai/v1/',
	comet: 'https://api.cometapi.com/v1/',
	// Aggregators
	openrouter: 'https://openrouter.ai/api/v1/',
	'openai-compatible': undefined, // Requires custom baseURL
	// Local
	ollama: 'http://localhost:11434/v1/',
	lmstudio: 'http://localhost:1234/v1/',
	vllm: 'http://localhost:8000/v1/',
	player2: 'http://localhost:4315/v1/',
	// Enterprise
	azure: undefined, // Constructed from resource name
	cloudflare: undefined // Constructed from account ID
};

// Providers that don't require API keys
const LOCAL_PROVIDERS: LLMProvider[] = ['ollama', 'lmstudio', 'vllm', 'player2'];

// Default models per provider
const DEFAULT_MODELS: Partial<Record<LLMProvider, string>> = {
	openai: 'gpt-4.1',
	anthropic: 'claude-sonnet-4-5-20251101',
	google: 'gemini-3-pro-preview',
	deepseek: 'deepseek-chat',
	mistral: 'mistral-large-latest',
	xai: 'grok-3',
	groq: 'meta-llama/llama-4-maverick-17b-128e-instruct',
	perplexity: 'sonar',
	moonshot: 'moonshot-v1-32k',
	together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
	cerebras: 'llama-3.3-70b',
	fireworks: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
	novita: 'meta-llama/llama-3.1-70b-instruct',
	'302ai': 'gpt-4.1',
	comet: 'gpt-4.1',
	openrouter: 'anthropic/claude-sonnet-4.5',
	ollama: 'llama3.2',
	lmstudio: 'local-model',
	player2: 'gemma2'
};

export const POST: RequestHandler = async ({ request }) => {
	const { messages, provider, model, apiKey, baseURL, resourceName, accountId, systemPrompt } =
		await request.json();

	const typedProvider = provider as LLMProvider;

	// Local providers don't require API keys
	const isLocalProvider = LOCAL_PROVIDERS.includes(typedProvider);
	if (!apiKey && !isLocalProvider) {
		return new Response(JSON.stringify({ error: 'API key required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		// Configure based on provider
		let providerBaseURL = baseURL;
		const headers: Record<string, string> = {};

		// Handle special provider configurations
		if (typedProvider === 'anthropic') {
			providerBaseURL = providerBaseURL || PROVIDER_BASE_URLS.anthropic;
			headers['anthropic-dangerous-direct-browser-access'] = 'true';
		} else if (typedProvider === 'azure' && resourceName) {
			// Azure requires special URL construction
			providerBaseURL =
				providerBaseURL || `https://${resourceName}.openai.azure.com/openai/deployments/`;
			headers['api-key'] = apiKey;
		} else if (typedProvider === 'cloudflare' && accountId) {
			// Cloudflare Workers AI
			providerBaseURL =
				providerBaseURL ||
				`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/`;
		} else if (typedProvider === 'openrouter') {
			providerBaseURL = providerBaseURL || PROVIDER_BASE_URLS.openrouter;
			headers['HTTP-Referer'] = 'https://utsuwa.app';
			headers['X-Title'] = 'Utsuwa';
		} else {
			// Use default base URL for provider
			providerBaseURL = providerBaseURL || PROVIDER_BASE_URLS[typedProvider];
		}

		// Add system message (use provided systemPrompt or default)
		const defaultSystemPrompt =
			'You are a friendly AI assistant displayed as a VRM avatar named Utsuwa. Keep responses conversational and relatively concise.';
		const messagesWithSystem = [
			{
				role: 'system' as const,
				content: systemPrompt || defaultSystemPrompt
			},
			...messages
		];

		const { textStream } = streamText({
			apiKey: apiKey || 'not-needed', // Local providers don't need API keys but xsai requires a value
			baseURL: providerBaseURL,
			model: model || DEFAULT_MODELS[typedProvider] || 'gpt-4o',
			messages: messagesWithSystem,
			headers
		});

		// Create a readable stream for SSE
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				const reader = textStream.getReader();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						// Format as SSE with our custom format
						const data = `0:${JSON.stringify(value)}\n`;
						controller.enqueue(encoder.encode(data));
					}
					controller.close();
				} catch (error) {
					// Send error as SSE event instead of crashing
					console.error('Stream error:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const errorData = `e:${JSON.stringify({ error: errorMessage })}\n`;
					controller.enqueue(encoder.encode(errorData));
					controller.close();
				} finally {
					reader.releaseLock();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Chat API error:', error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
