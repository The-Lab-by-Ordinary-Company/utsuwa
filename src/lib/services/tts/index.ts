import type { TTSProvider } from '$lib/types';

// Common TTS options interface
export interface TTSOptions {
	provider: TTSProvider;
	apiKey?: string;
	voiceId?: string;
	baseUrl?: string;
	speed?: number;
	pitch?: number;
	volume?: number;
}

// Result from TTS speak method
export interface TTSSpeakResult {
	source: AudioBufferSourceNode;
	analyser: AnalyserNode;
}

// Base TTS provider interface
export interface ITTSProvider {
	speak(text: string): Promise<TTSSpeakResult>;
	getAudioContext(): AudioContext;
}

// Shared audio context for all providers
let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
	if (!sharedAudioContext) {
		sharedAudioContext = new AudioContext();
	}
	return sharedAudioContext;
}

// Provider base URLs
export const TTS_BASE_URLS: Partial<Record<TTSProvider, string>> = {
	elevenlabs: 'https://api.elevenlabs.io/v1/',
	'openai-tts': 'https://api.openai.com/v1/'
};

// Default voices per provider
export const DEFAULT_VOICES: Partial<Record<TTSProvider, string>> = {
	elevenlabs: 'EXAVITQu4vr4xnSDxMaL', // Bella
	'openai-tts': 'alloy'
};

// Import individual providers
import { ElevenLabsTTS } from './elevenlabs';
import { OpenAITTS } from './openai-tts';

// Provider factory
let currentProvider: ITTSProvider | null = null;
let currentOptions: TTSOptions | null = null;

export function getTTSProvider(options: TTSOptions): ITTSProvider {
	// Check if we can reuse the current provider
	if (
		currentProvider &&
		currentOptions &&
		currentOptions.provider === options.provider &&
		currentOptions.apiKey === options.apiKey &&
		currentOptions.voiceId === options.voiceId &&
		currentOptions.baseUrl === options.baseUrl
	) {
		return currentProvider;
	}

	// Create new provider based on type
	switch (options.provider) {
		case 'elevenlabs':
			currentProvider = new ElevenLabsTTS(options);
			break;

		case 'openai-tts':
			currentProvider = new OpenAITTS(options);
			break;

		default:
			// Fallback to OpenAI TTS for unsupported providers
			console.warn(`TTS provider ${options.provider} not implemented, falling back to OpenAI TTS`);
			currentProvider = new OpenAITTS(options);
	}

	currentOptions = { ...options };
	return currentProvider;
}
