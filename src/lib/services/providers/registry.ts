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
// LLM PROVIDERS (23 total)
// ============================================

export const LLM_PROVIDERS: ProviderMetadata[] = [
	// Cloud Commercial (10)
	{
		id: 'openai',
		name: 'OpenAI',
		description: 'GPT-4.1, o3, and more',
		category: 'llm',
		icon: '🤖',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.openai.com/v1/',
		models: [
			{ id: 'gpt-4.1', name: 'GPT-4.1' },
			{ id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
			{ id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
			{ id: 'o3', name: 'o3' },
			{ id: 'o3-mini', name: 'o3 Mini' },
			{ id: 'gpt-4o', name: 'GPT-4o (Legacy)' }
		]
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		description: 'Claude 4.5 Opus, Sonnet, and Haiku',
		category: 'llm',
		icon: '🧠',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.anthropic.com/v1/',
		models: [
			{ id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
			{ id: 'claude-sonnet-4-5-20251101', name: 'Claude Sonnet 4.5' },
			{ id: 'claude-haiku-4-5-20251101', name: 'Claude Haiku 4.5' },
			{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
			{ id: 'claude-opus-4-20250514', name: 'Claude Opus 4' }
		]
	},
	{
		id: 'google',
		name: 'Google Gemini',
		description: 'Gemini 3 Pro and 2.5 Flash',
		category: 'llm',
		icon: '✨',
		iconColor: '#4285F4',
		requiresApiKey: true,
		defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
		models: [
			{ id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
			{ id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
			{ id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Deprecated)' }
		]
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		description: 'DeepSeek Chat and Coder models',
		category: 'llm',
		icon: '🔍',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.deepseek.com/',
		models: [
			{ id: 'deepseek-chat', name: 'DeepSeek Chat' },
			{ id: 'deepseek-coder', name: 'DeepSeek Coder' },
			{ id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
		]
	},
	{
		id: 'mistral',
		name: 'Mistral AI',
		description: 'Mistral Large, Medium, and Small',
		category: 'llm',
		icon: '🌀',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.mistral.ai/v1/',
		models: [
			{ id: 'mistral-large-latest', name: 'Mistral Large' },
			{ id: 'mistral-medium-latest', name: 'Mistral Medium' },
			{ id: 'mistral-small-latest', name: 'Mistral Small' },
			{ id: 'codestral-latest', name: 'Codestral' }
		]
	},
	{
		id: 'xai',
		name: 'xAI (Grok)',
		description: 'Grok 4, Grok 3, and more',
		category: 'llm',
		icon: '𝕏',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.x.ai/v1/',
		models: [
			{ id: 'grok-4', name: 'Grok 4' },
			{ id: 'grok-3', name: 'Grok 3' },
			{ id: 'grok-3-mini', name: 'Grok 3 Mini' },
			{ id: 'grok-2-vision-1212', name: 'Grok 2 Vision' }
		]
	},
	{
		id: 'groq',
		name: 'Groq',
		description: 'Ultra-fast inference with LPU',
		category: 'llm',
		icon: '⚡',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.groq.com/openai/v1/',
		models: [
			{ id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' },
			{ id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
			{ id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
			{ id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' }
		]
	},
	{
		id: 'perplexity',
		name: 'Perplexity AI',
		description: 'Search-augmented AI models',
		category: 'llm',
		icon: '🔎',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.perplexity.ai/',
		models: [
			{ id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large Online' },
			{ id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small Online' },
			{ id: 'llama-3.1-sonar-large-128k-chat', name: 'Sonar Large Chat' }
		]
	},
	{
		id: 'moonshot',
		name: 'Moonshot AI',
		description: 'Kimi models with long context',
		category: 'llm',
		icon: '🌙',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.moonshot.cn/v1/',
		models: [
			{ id: 'moonshot-v1-128k', name: 'Moonshot 128K' },
			{ id: 'moonshot-v1-32k', name: 'Moonshot 32K' },
			{ id: 'moonshot-v1-8k', name: 'Moonshot 8K' }
		]
	},
	{
		id: 'together',
		name: 'Together AI',
		description: 'Open-source models at scale',
		category: 'llm',
		icon: '🤝',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.together.xyz/v1/',
		models: [
			{ id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo' },
			{ id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B' },
			{ id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B' },
			{ id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B' }
		]
	},

	// Cloud Additional (5)
	{
		id: 'cerebras',
		name: 'Cerebras AI',
		description: 'Ultra-fast inference',
		category: 'llm',
		icon: '🧮',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.cerebras.ai/v1/',
		models: [
			{ id: 'llama3.1-70b', name: 'Llama 3.1 70B' },
			{ id: 'llama3.1-8b', name: 'Llama 3.1 8B' }
		]
	},
	{
		id: 'fireworks',
		name: 'Fireworks AI',
		description: 'Fast and affordable inference',
		category: 'llm',
		icon: '🎆',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.fireworks.ai/inference/v1/',
		models: [
			{ id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B' },
			{ id: 'accounts/fireworks/models/mixtral-8x22b-instruct', name: 'Mixtral 8x22B' }
		]
	},
	{
		id: 'novita',
		name: 'Novita AI',
		description: 'AI model API platform',
		category: 'llm',
		icon: '🌟',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.novita.ai/v3/openai/',
		models: [
			{ id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
			{ id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' }
		]
	},
	{
		id: '302ai',
		name: '302.AI',
		description: 'AI aggregation platform',
		category: 'llm',
		icon: '3️⃣',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.302.ai/v1/',
		models: [
			{ id: 'gpt-4o', name: 'GPT-4o' },
			{ id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
		]
	},
	{
		id: 'comet',
		name: 'Comet API',
		description: 'Multi-model API platform',
		category: 'llm',
		icon: '☄️',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.cometapi.com/v1/',
		models: []
	},

	// Aggregators (2)
	{
		id: 'openrouter',
		name: 'OpenRouter',
		description: 'Access 100+ models through one API',
		category: 'llm',
		icon: '🔀',
		requiresApiKey: true,
		defaultBaseUrl: 'https://openrouter.ai/api/v1/',
		models: [
			{ id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
			{ id: 'openai/gpt-4o', name: 'GPT-4o' },
			{ id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
			{ id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' }
		]
	},
	{
		id: 'openai-compatible',
		name: 'OpenAI Compatible',
		description: 'Any OpenAI-compatible API endpoint',
		category: 'llm',
		icon: '🔌',
		requiresApiKey: false,
		models: []
	},

	// Local LLM (4)
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
	{
		id: 'vllm',
		name: 'vLLM',
		description: 'High-throughput LLM serving',
		category: 'llm',
		icon: '🚀',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:8000/v1/',
		models: [
			{ id: 'llama-2-7b', name: 'Llama 2 7B' },
			{ id: 'llama-2-13b', name: 'Llama 2 13B' },
			{ id: 'llama-2-70b', name: 'Llama 2 70B' }
		]
	},
	{
		id: 'player2',
		name: 'Player2',
		description: 'Game engine LLM integration',
		category: 'llm',
		icon: '🎮',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:4315/v1/',
		models: []
	},

	// Enterprise (2)
	{
		id: 'azure',
		name: 'Azure AI Foundry',
		description: 'Microsoft Azure OpenAI Service',
		category: 'llm',
		icon: '☁️',
		iconColor: '#0078D4',
		requiresApiKey: true,
		models: [
			{ id: 'gpt-4o', name: 'GPT-4o' },
			{ id: 'gpt-4', name: 'GPT-4' }
		]
	},
	{
		id: 'cloudflare',
		name: 'Cloudflare Workers AI',
		description: 'Run AI on Cloudflare edge',
		category: 'llm',
		icon: '🔶',
		iconColor: '#F38020',
		requiresApiKey: true,
		models: [
			{ id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
			{ id: '@cf/mistral/mistral-7b-instruct-v0.1', name: 'Mistral 7B' }
		]
	}
];

// ============================================
// TTS PROVIDERS (6 total)
// ============================================

export const TTS_PROVIDERS: ProviderMetadata[] = [
	// Cloud TTS
	{
		id: 'elevenlabs',
		name: 'ElevenLabs',
		description: 'High-quality AI voices',
		category: 'tts',
		icon: '🎙️',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.elevenlabs.io/v1/',
		models: [
			{ id: 'eleven_multilingual_v2', name: 'Multilingual v2 (29 languages)' },
			{ id: 'eleven_flash_v2_5', name: 'Flash v2.5 (Ultra-low latency)' },
			{ id: 'eleven_turbo_v2_5', name: 'Turbo v2.5 (Low latency)' },
			{ id: 'eleven_turbo_v2', name: 'Turbo v2 (English only)' },
			{ id: 'eleven_flash_v2', name: 'Flash v2 (English only)' }
		],
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
	// Local/Free TTS
	{
		id: 'web-speech',
		name: 'Web Speech API',
		description: 'Free browser-native TTS (no API key)',
		category: 'tts',
		icon: '🌐',
		requiresApiKey: false,
		isLocal: true,
		voices: [] // Populated dynamically from browser
	},
	{
		id: 'index-tts',
		name: 'Index-TTS',
		description: 'Local TTS by Bilibili',
		category: 'tts',
		icon: '📑',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:11996/tts/',
		voices: []
	},
	// Generic
	{
		id: 'openai-compatible-tts',
		name: 'OpenAI Compatible TTS',
		description: 'Any OpenAI-compatible TTS endpoint',
		category: 'tts',
		icon: '🔌',
		requiresApiKey: false,
		voices: []
	},
	{
		id: 'player2-tts',
		name: 'Player2 TTS',
		description: 'Game engine TTS integration',
		category: 'tts',
		icon: '🎮',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:4315/v1/',
		voices: []
	}
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
