import type { RequestHandler } from './$types';
import type { LLMProvider } from '$lib/types';

interface ModelInfo {
	id: string;
	name: string;
}

interface FetchModelsResponse {
	models: ModelInfo[];
	error?: string;
}

// Provider API endpoints for fetching models
const PROVIDER_MODELS_ENDPOINTS: Record<string, { url: string; method: string }> = {
	openai: { url: '/models', method: 'GET' },
	anthropic: { url: '/models', method: 'GET' },
	ollama: { url: '/api/tags', method: 'GET' },
	lmstudio: { url: '/models', method: 'GET' },
	deepseek: { url: '/models', method: 'GET' },
	xai: { url: '/models', method: 'GET' },
	google: { url: '/models', method: 'GET' }
};

// Default base URLs per provider (LLM and TTS)
const DEFAULT_BASE_URLS: Record<string, string> = {
	// LLM providers
	openai: 'https://api.openai.com/v1',
	anthropic: 'https://api.anthropic.com/v1',
	ollama: 'http://localhost:11434',
	lmstudio: 'http://localhost:1234/v1',
	deepseek: 'https://api.deepseek.com',
	xai: 'https://api.x.ai/v1',
	google: 'https://generativelanguage.googleapis.com/v1beta',
	// TTS providers
	elevenlabs: 'https://api.elevenlabs.io/v1',
	'openai-tts': 'https://api.openai.com/v1'
};

// Model filter patterns - only keep chat-compatible models
const MODEL_FILTERS: Record<string, RegExp> = {
	openai: /^(gpt-|o1-|o3-|chatgpt-4o-)/,
	anthropic: /^claude-/,
	deepseek: /^deepseek-(chat|reasoner)/,
	xai: /^grok-/,
	google: /^models\/gemini-/
};

function filterModels(providerId: string, models: ModelInfo[]): ModelInfo[] {
	const filter = MODEL_FILTERS[providerId];
	if (!filter) return models; // No filter = keep all (Ollama, LM Studio)
	return models.filter((m) => filter.test(m.id));
}

function normalizeModelName(id: string, providerId: string): string {
	let name = id;

	// Remove 'models/' prefix from Google
	if (providerId === 'google' && name.startsWith('models/')) {
		name = name.replace('models/', '');
	}

	// Strip date suffixes from Anthropic models (e.g., -20251101)
	if (providerId === 'anthropic') {
		name = name.replace(/-\d{8}$/, '');
		// Convert version like "opus-4-5" to "opus-4.5" (match version after model tier)
		name = name.replace(/(opus|sonnet|haiku)-(\d+)-(\d+)$/, '$1-$2.$3');
	}

	// Capitalize and format common patterns
	name = name
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.replace(/Gpt/g, 'GPT')
		.replace(/O1/g, 'o1')
		.replace(/O3/g, 'o3');

	return name;
}

async function fetchOpenAIModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return data.data.map((m: { id: string }) => ({
		id: m.id,
		name: normalizeModelName(m.id, 'openai')
	}));
}

async function fetchAnthropicModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		}
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return data.data.map((m: { id: string }) => ({
		id: m.id,
		name: normalizeModelName(m.id, 'anthropic')
	}));
}

async function fetchOllamaModels(baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/api/tags`);
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return (data.models || []).map((m: { name: string }) => ({
		id: m.name,
		name: m.name
	}));
}

async function fetchLMStudioModels(baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`);
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return data.data.map((m: { id: string }) => ({
		id: m.id,
		name: m.id
	}));
}

async function fetchDeepSeekModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return data.data.map((m: { id: string }) => ({
		id: m.id,
		name: normalizeModelName(m.id, 'deepseek')
	}));
}

async function fetchXAIModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return data.data.map((m: { id: string }) => ({
		id: m.id,
		name: normalizeModelName(m.id, 'xai')
	}));
}

async function fetchGoogleModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { 'x-goog-api-key': apiKey }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	return (data.models || []).map((m: { name: string; displayName?: string }) => ({
		id: m.name.replace('models/', ''),
		name: m.displayName || normalizeModelName(m.name, 'google')
	}));
}

// TTS Provider fetch functions

async function fetchElevenLabsModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { 'xi-api-key': apiKey }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const models = await response.json();
	// Filter to TTS-capable models only
	return models
		.filter((m: { can_do_text_to_speech?: boolean }) => m.can_do_text_to_speech)
		.map((m: { model_id: string; name: string }) => ({
			id: m.model_id,
			name: m.name
		}));
}

async function fetchOpenAITTSModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
	const response = await fetch(`${baseUrl}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` }
	});
	if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
	const data = await response.json();
	// Filter to TTS models only (contain "tts" in name)
	return data.data
		.filter((m: { id: string }) => m.id.includes('tts'))
		.map((m: { id: string }) => ({
			id: m.id,
			name: normalizeModelName(m.id, 'openai-tts')
		}));
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { providerId, apiKey, baseUrl } = await request.json();

		if (!providerId) {
			return Response.json({ models: [], error: 'Provider ID required' } as FetchModelsResponse, {
				status: 400
			});
		}

		const effectiveBaseUrl =
			baseUrl || DEFAULT_BASE_URLS[providerId as LLMProvider] || '';

		// Remove trailing slash for consistency
		const cleanBaseUrl = effectiveBaseUrl.replace(/\/+$/, '');

		let models: ModelInfo[] = [];

		switch (providerId) {
			case 'openai':
				if (!apiKey) throw new Error('API key required for OpenAI');
				models = await fetchOpenAIModels(apiKey, cleanBaseUrl);
				break;
			case 'anthropic':
				if (!apiKey) throw new Error('API key required for Anthropic');
				models = await fetchAnthropicModels(apiKey, cleanBaseUrl);
				break;
			case 'ollama':
				models = await fetchOllamaModels(cleanBaseUrl);
				break;
			case 'lmstudio':
				models = await fetchLMStudioModels(cleanBaseUrl);
				break;
			case 'deepseek':
				if (!apiKey) throw new Error('API key required for DeepSeek');
				models = await fetchDeepSeekModels(apiKey, cleanBaseUrl);
				break;
			case 'xai':
				if (!apiKey) throw new Error('API key required for xAI');
				models = await fetchXAIModels(apiKey, cleanBaseUrl);
				break;
			case 'google':
				if (!apiKey) throw new Error('API key required for Google');
				models = await fetchGoogleModels(apiKey, cleanBaseUrl);
				break;
			// TTS providers
			case 'elevenlabs':
				if (!apiKey) throw new Error('API key required for ElevenLabs');
				models = await fetchElevenLabsModels(apiKey, cleanBaseUrl);
				break;
			case 'openai-tts':
				if (!apiKey) throw new Error('API key required for OpenAI TTS');
				models = await fetchOpenAITTSModels(apiKey, cleanBaseUrl);
				break;
			default:
				return Response.json(
					{ models: [], error: `Unknown provider: ${providerId}` } as FetchModelsResponse,
					{ status: 400 }
				);
		}

		// Filter to chat-compatible models
		const filteredModels = filterModels(providerId, models);

		return Response.json({ models: filteredModels } as FetchModelsResponse);
	} catch (error) {
		console.error('Error fetching models:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return Response.json({ models: [], error: message } as FetchModelsResponse, { status: 500 });
	}
};
