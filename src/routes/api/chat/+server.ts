import { streamText } from '@xsai/stream-text';
import type { RequestHandler } from './$types';
import type { LLMProvider } from '$lib/types';

// Provider base URLs
const PROVIDER_BASE_URLS: Partial<Record<LLMProvider, string>> = {
	// Cloud
	openai: 'https://api.openai.com/v1/',
	anthropic: 'https://api.anthropic.com/v1/',
	google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
	deepseek: 'https://api.deepseek.com/',
	xai: 'https://api.x.ai/v1/',
	// Local
	ollama: 'http://localhost:11434/v1/',
	lmstudio: 'http://localhost:1234/v1/',
};

// Providers that don't require API keys
const LOCAL_PROVIDERS: LLMProvider[] = ['ollama', 'lmstudio'];

export const POST: RequestHandler = async ({ request }) => {
	const { messages, provider, model, apiKey, baseURL, systemPrompt } = await request.json();

	const typedProvider = provider as LLMProvider;

	// Local providers don't require API keys
	const isLocalProvider = LOCAL_PROVIDERS.includes(typedProvider);
	if (!apiKey && !isLocalProvider) {
		return new Response(JSON.stringify({ error: 'API key required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Model is required - no more static fallbacks
	if (!model) {
		return new Response(JSON.stringify({ error: 'Model is required. Please select a model from the list.' }), {
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

		const result = streamText({
			apiKey: apiKey || 'not-needed', // Local providers don't need API keys but xsai requires a value
			baseURL: providerBaseURL,
			model,
			messages: messagesWithSystem,
			headers
		});

		// Attach error handlers to prevent unhandled promise rejections from crashing the server
		// These catch errors from background promises that would otherwise crash Node
		const silentCatch = (err: Error) => {
			console.error('Provider API error:', err.message);
		};
		result.messages?.catch?.(silentCatch);
		result.steps?.catch?.(silentCatch);
		result.totalUsage?.catch?.(silentCatch);

		const { textStream } = result;

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
