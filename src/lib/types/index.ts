// Module types
export * from './module';

// Chat types
export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

// LLM Provider IDs
export type LLMProvider =
	// Cloud
	| 'openai'
	| 'anthropic'
	| 'google'
	| 'deepseek'
	| 'xai'
	// Local
	| 'ollama'
	| 'lmstudio'
	| 'vllm'
	| 'player2';

export interface LLMConfig {
	provider: LLMProvider;
	model: string;
	apiKey?: string;
	baseUrl?: string;
}

// TTS Provider IDs
export type TTSProvider =
	// Cloud
	| 'elevenlabs'
	| 'openai-tts'
	// Local
	| 'player2-tts';

export interface TTSConfig {
	provider: TTSProvider;
	apiKey?: string;
	voiceId?: string;
	baseUrl?: string;
	// Voice settings
	speed?: number;
	pitch?: number;
	volume?: number;
}

// Provider configuration (stored in settings)
export interface ProviderConfig {
	apiKey?: string;
	baseUrl?: string;
	modelId?: string;
	voiceId?: string;
	speed?: number;
	pitch?: number;
	volume?: number;
}

// VRM types
export interface VRMLoadProgress {
	loaded: number;
	total: number;
	percent: number;
}
