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
	// Cloud Commercial
	| 'openai'
	| 'anthropic'
	| 'google'
	| 'deepseek'
	| 'mistral'
	| 'xai'
	| 'groq'
	| 'perplexity'
	| 'moonshot'
	| 'together'
	// Cloud Additional
	| 'cerebras'
	| 'fireworks'
	| 'novita'
	| '302ai'
	| 'comet'
	// Aggregators
	| 'openrouter'
	| 'openai-compatible'
	// Local
	| 'ollama'
	| 'lmstudio'
	| 'vllm'
	| 'player2'
	// Enterprise
	| 'azure'
	| 'cloudflare';

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
	| 'azure-speech'
	| 'deepgram'
	| 'alibaba-cosyvoice'
	| 'volcengine'
	| 'comet-tts'
	// Local/Free
	| 'web-speech'
	| 'index-tts'
	| 'browser-local'
	| 'app-local'
	// Generic
	| 'openai-compatible-tts'
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
	// Azure-specific
	resourceName?: string;
	apiVersion?: string;
	region?: string;
	// Cloudflare-specific
	accountId?: string;
	// Additional settings
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
