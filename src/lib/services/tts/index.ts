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
	'openai-tts': 'https://api.openai.com/v1/',
	'azure-speech': undefined, // Constructed from region
	deepgram: 'https://api.deepgram.com/v1/',
	'alibaba-cosyvoice': undefined, // Regional
	volcengine: undefined, // Regional
	'comet-tts': 'https://api.cometapi.com/v1/',
	'web-speech': undefined, // Browser native
	'index-tts': 'http://localhost:11996/',
	'browser-local': undefined, // Browser native
	'app-local': undefined, // Desktop only
	'openai-compatible-tts': undefined, // Custom
	'player2-tts': 'http://localhost:4315/'
};

// Providers that don't require API keys
export const LOCAL_TTS_PROVIDERS: TTSProvider[] = [
	'web-speech',
	'index-tts',
	'browser-local',
	'app-local',
	'player2-tts'
];

// Default voices per provider
export const DEFAULT_VOICES: Partial<Record<TTSProvider, string>> = {
	elevenlabs: 'EXAVITQu4vr4xnSDxMaL', // Sarah
	'openai-tts': 'alloy',
	deepgram: 'aura-asteria-en',
	'comet-tts': 'alloy'
};

// Import individual providers
import { ElevenLabsTTS } from './elevenlabs';
import { OpenAITTS } from './openai-tts';
import { WebSpeechTTS } from './web-speech';
import { OpenAICompatibleTTS } from './openai-compatible-tts';

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

		case 'web-speech':
			currentProvider = new WebSpeechTTS(options);
			break;

		case 'openai-compatible-tts':
		case 'comet-tts':
			currentProvider = new OpenAICompatibleTTS(options);
			break;

		case 'index-tts':
		case 'player2-tts':
			// These use OpenAI-compatible API
			currentProvider = new OpenAICompatibleTTS({
				...options,
				baseUrl: options.baseUrl || TTS_BASE_URLS[options.provider]
			});
			break;

		default:
			// Fallback to Web Speech API for unsupported providers
			console.warn(`TTS provider ${options.provider} not implemented, falling back to Web Speech`);
			currentProvider = new WebSpeechTTS(options);
	}

	currentOptions = { ...options };
	return currentProvider;
}
