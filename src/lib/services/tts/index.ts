import type { TTSProvider } from '$lib/types';

// Common TTS options interface
export interface TTSOptions {
	provider: TTSProvider;
	apiKey?: string;
	voiceId?: string;
	model?: string;
	baseUrl?: string;
	speed?: number;
	volume?: number;
	/** Primary language for multilingual TTS. */
	language?: string;
	/** Natural-language description of the synthetic voice (OmniVoice). */
	instructions?: string;
	/** OmniVoice synthesis quality steps. */
	numStep?: number;
	/** OmniVoice position temperature. */
	positionTemperature?: number;
	/** OmniVoice class temperature. */
	classTemperature?: number;
	/** Voice design attributes persisted for the UI. */
	gender?: string;
	age?: string;
	pitch?: string;
	accent?: string;
	/** Alternative language that triggers the alternative voice. */
	altLanguage?: string;
	/** Voice ID used when the alternative language is active. */
	altVoiceId?: string;
}

// Result from TTS speak method
export interface TTSSpeakResult {
	source: AudioBufferSourceNode;
	analyser: AnalyserNode;
}

// Per-request options that can override session-level TTS options for a single
// segment (e.g. alternative language/voice or emotion-specific tuning).
export interface StreamOptions {
	voiceId?: string;
	language?: string;
	emotion?: string;
	exaggeration?: number;
	cfgWeight?: number;
	temperature?: number;
	speed?: number;
	pitch?: number;
	volume?: number;
	signal?: AbortSignal;
}

// Chunk yielded by streaming TTS providers. `done` marks the end of the stream.
export interface AudioChunk {
	data: ArrayBuffer;
	done: boolean;
}

// Capability flags advertised by a TTS provider.
export interface TTSCapabilities {
	streaming?: boolean;
	emotion?: boolean;
	multilingual?: boolean;
	// Maximum number of concurrent synthesis requests; Infinity if unspecified.
	maxConcurrentSynthesis?: number;
	// True if this provider ignores the speed parameter server-side and the
	// orchestrator must apply it via AudioBufferSourceNode.playbackRate.
	clientSideSpeed?: boolean;
}

// Base TTS provider interface
export interface ITTSProvider {
	speak(text: string): Promise<TTSSpeakResult>;
	/** Fetch a full AudioBuffer for non-streaming pipelining. */
	fetchAudioBuffer?(text: string, options?: StreamOptions): Promise<AudioBuffer>;
	/** Optional true streaming: yields audio chunks as they arrive. */
	speakStreaming?(text: string, options?: StreamOptions): AsyncGenerator<AudioChunk>;
	getAudioContext(): AudioContext;
	/** Capability flags used by the orchestrator to choose the right path. */
	capabilities?: TTSCapabilities;
}

// Shared audio context for all providers
let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
	if (!sharedAudioContext) {
		sharedAudioContext = new AudioContext();
	}
	return sharedAudioContext;
}

// Import individual providers
import { ElevenLabsTTS } from './elevenlabs.ts';
import { OpenAITTS } from './openai-tts.ts';

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
		currentOptions.model === options.model &&
		currentOptions.baseUrl === options.baseUrl &&
		currentOptions.speed === options.speed &&
		currentOptions.language === options.language &&
		currentOptions.instructions === options.instructions &&
		currentOptions.numStep === options.numStep &&
		currentOptions.positionTemperature === options.positionTemperature &&
		currentOptions.classTemperature === options.classTemperature &&
		currentOptions.gender === options.gender &&
		currentOptions.age === options.age &&
		currentOptions.accent === options.accent
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

		// Local TTS and the OmniVoice proxy are OpenAI-compatible, so they reuse
		// the OpenAI client with a localhost base URL. The provider id drives URL,
		// key, request format, and error handling.
		case 'local-tts':
		case 'omnivoice':
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
