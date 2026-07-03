// Provider Registry - All LLM and TTS providers
import { DEFAULT_CHAT_BASE_URLS } from './provider-defaults.ts';

export interface ProviderMetadata {
	id: string;
	name: string;
	description: string;
	category: 'llm' | 'tts' | 'stt';
	icon: string;
	iconColor?: string;
	requiresApiKey: boolean;
	defaultBaseUrl?: string;
	isLocal?: boolean;
	// Whether this provider's models are broadly vision-capable. Coarse, cloud
	// only. Local providers (Ollama/LM Studio) leave this unset and rely on a
	// per-model heuristic, since vision depends on the installed model.
	supportsVision?: boolean;
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
		supportsVision: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.openai
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		description: 'Claude models',
		category: 'llm',
		icon: '🧠',
		requiresApiKey: true,
		supportsVision: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.anthropic
	},
	{
		id: 'google',
		name: 'Google Gemini',
		description: 'Gemini models',
		category: 'llm',
		icon: '✨',
		iconColor: '#4285F4',
		requiresApiKey: true,
		supportsVision: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.google
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		description: 'DeepSeek models',
		category: 'llm',
		icon: '🔍',
		requiresApiKey: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.deepseek
	},
	{
		id: 'xai',
		name: 'xAI (Grok)',
		description: 'Grok models',
		category: 'llm',
		icon: '𝕏',
		requiresApiKey: true,
		supportsVision: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.xai
	},
	// Local LLMs discover installed models from the user's running local server.
	{
		id: 'ollama',
		name: 'Ollama',
		description: 'Run LLMs locally on your machine',
		category: 'llm',
		icon: '🦙',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.ollama,
		models: []
	},
	{
		id: 'lmstudio',
		name: 'LM Studio',
		description: 'Local LLM with GUI interface',
		category: 'llm',
		icon: '🖥️',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: DEFAULT_CHAT_BASE_URLS.lmstudio,
		models: []
	},
];

// ============================================
// TTS PROVIDERS (3 total)
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
	// Local TTS - OpenAI-compatible server running on the user's machine
	// (Kokoro-FastAPI, openedai-speech, etc). Voices/model are server-specific,
	// so these are sensible Kokoro defaults plus a free-text override in the UI.
	{
		id: 'local-tts',
		name: 'Local TTS',
		description: 'Run a voice model locally (Kokoro, openedai-speech)',
		category: 'tts',
		icon: '🏠',
		requiresApiKey: false,
		isLocal: true,
		defaultBaseUrl: 'http://localhost:8880/v1/',
		models: [
			{ id: 'kokoro', name: 'Kokoro' },
			{ id: 'tts-1', name: 'tts-1 (compatibility alias)' }
		],
		voices: [
			{ id: 'af_bella', name: 'Bella (US, female)' },
			{ id: 'af_sky', name: 'Sky (US, female)' },
			{ id: 'af_sarah', name: 'Sarah (US, female)' },
			{ id: 'am_adam', name: 'Adam (US, male)' },
			{ id: 'am_michael', name: 'Michael (US, male)' },
			{ id: 'bf_emma', name: 'Emma (UK, female)' },
			{ id: 'bm_george', name: 'George (UK, male)' }
		]
	},
];

// ============================================
// STT PROVIDERS
// ============================================

export const STT_PROVIDERS: ProviderMetadata[] = [
	{
		id: 'groq-stt',
		name: 'Groq',
		description: 'Fast speech-to-text via Whisper',
		category: 'stt',
		icon: '🎤',
		requiresApiKey: true,
		defaultBaseUrl: 'https://api.groq.com/openai/v1/'
	}
];

// Helper functions
export function getLLMProvider(id: string): ProviderMetadata | undefined {
	return LLM_PROVIDERS.find((p) => p.id === id);
}

export function getTTSProvider(id: string): ProviderMetadata | undefined {
	return TTS_PROVIDERS.find((p) => p.id === id);
}

/** Whether an LLM provider's models are broadly vision-capable (cloud providers). */
export function providerSupportsVision(id: string): boolean {
	return getLLMProvider(id)?.supportsVision === true;
}
