// Provider Registry - All LLM and TTS providers

export interface ProviderMetadata {
	id: string;
	name: string;
	description: string;
	category: 'llm' | 'tts';
	icon: string;
	iconColor?: string;
	requiresApiKey: boolean;
	defaultBaseUrl?: string;
	isLocal?: boolean;
	models?: Array<{ id: string; name: string }>;
	voices?: Array<{ id: string; name: string }>;
}

// ============================================
// LLM PROVIDERS (7 total)
// ============================================

export const LLM_PROVIDERS: ProviderMetadata[] = [
	// Cloud providers - models fetched dynamically from API after user enters key
	{
		id: 'openai',
		name: 'OpenAI',
		description: 'GPT-4, o1, and more',
		category: 'llm',
		icon: '🤖',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.openai.com/v1/'
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		description: 'Claude models',
		category: 'llm',
		icon: '🧠',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.anthropic.com/v1/'
	},
	{
		id: 'google',
		name: 'Google Gemini',
		description: 'Gemini models',
		category: 'llm',
		icon: '✨',
		iconColor: '#4285F4',
		requiresApiKey: true,
		defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/'
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		description: 'DeepSeek models',
		category: 'llm',
		icon: '🔍',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.deepseek.com/'
	},
	{
		id: 'xai',
		name: 'xAI (Grok)',
		description: 'Grok models',
		category: 'llm',
		icon: '𝕏',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.x.ai/v1/'
	},
	// Local LLM - keep example models as hints
	{
		id: 'ollama',
		name: 'Ollama',
		description: 'Run LLMs locally on your machine',
		category: 'llm',
		icon: '🦙',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:11434/v1/',
		models: [
			{ id: 'llama3.2', name: 'Llama 3.2' },
			{ id: 'llama3.1', name: 'Llama 3.1' },
			{ id: 'mistral', name: 'Mistral' },
			{ id: 'codellama', name: 'Code Llama' },
			{ id: 'phi3', name: 'Phi-3' }
		]
	},
	{
		id: 'lmstudio',
		name: 'LM Studio',
		description: 'Local LLM with GUI interface',
		category: 'llm',
		icon: '🖥️',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:1234/v1/',
		models: []
	},
];

// ============================================
// TTS PROVIDERS (2 total)
// ============================================

export const TTS_PROVIDERS: ProviderMetadata[] = [
	// Cloud TTS - models fetched dynamically from API after user enters key
	{
		id: 'elevenlabs',
		name: 'ElevenLabs',
		description: 'High-quality AI voices',
		category: 'tts',
		icon: '🎙️',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.elevenlabs.io/v1/',
		// models fetched from API
		voices: [
			{ id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
			{ id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
			{ id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
			{ id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi' },
			{ id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
			{ id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' }
		]
	},
	{
		id: 'openai-tts',
		name: 'OpenAI TTS',
		description: 'OpenAI text-to-speech voices',
		category: 'tts',
		icon: '🔊',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.openai.com/v1/',
		models: [
			{ id: 'tts-1', name: 'TTS-1 (Standard)' },
			{ id: 'tts-1-hd', name: 'TTS-1 HD (High Fidelity)' },
			{ id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS' }
		],
		voices: [
			{ id: 'alloy', name: 'Alloy' },
			{ id: 'ash', name: 'Ash' },
			{ id: 'coral', name: 'Coral' },
			{ id: 'echo', name: 'Echo' },
			{ id: 'fable', name: 'Fable' },
			{ id: 'onyx', name: 'Onyx' },
			{ id: 'nova', name: 'Nova' },
			{ id: 'sage', name: 'Sage' },
			{ id: 'shimmer', name: 'Shimmer' },
			{ id: 'ballad', name: 'Ballad' },
			{ id: 'verse', name: 'Verse' },
			{ id: 'marin', name: 'Marin' },
			{ id: 'cedar', name: 'Cedar' }
		]
	},
];

// Helper functions
export function getLLMProvider(id: string): ProviderMetadata | undefined {
	return LLM_PROVIDERS.find((p) => p.id === id);
}

export function getTTSProvider(id: string): ProviderMetadata | undefined {
	return TTS_PROVIDERS.find((p) => p.id === id);
}

export function getAllProviders(): ProviderMetadata[] {
	return [...LLM_PROVIDERS, ...TTS_PROVIDERS];
}

export type LLMProviderId = (typeof LLM_PROVIDERS)[number]['id'];
export type TTSProviderId = (typeof TTS_PROVIDERS)[number]['id'];
