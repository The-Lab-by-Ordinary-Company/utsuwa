import {
	getSharedAudioContext,
	type ITTSProvider,
	type TTSOptions,
	type TTSSpeakResult,
	type StreamOptions,
	type TTSCapabilities
} from './index.ts';
import {
	getTTSBaseUrl,
	getLocalTTSConnectionHint,
	getOmniVoiceConnectionHint,
	isLocalTTSProvider
} from '../providers/local-endpoints.ts';
import { providerErrorMessage } from './provider-utils.ts';

function ensureTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : url + '/';
}

function getCurrentSiteOrigin(): string | undefined {
	return typeof window !== 'undefined' ? window.location.origin : undefined;
}

/**
 * Build the request body for an OpenAI-compatible /audio/speech endpoint.
 * Exported so the body-construction logic can be unit-tested without an
 * AudioContext or a real fetch.
 *
 * Session-level defaults (language, instructions, ...) come from the provider
 * config; per-segment `streamOptions` overrides them (e.g. the alternative
 * language voice).
 */
export function buildOpenAITTSRequestBody(
	providerId: string,
	model: string,
	voiceId: string,
	speed: number,
	text: string,
	sessionOptions: {
		language?: string;
		instructions?: string;
		numStep?: number;
		positionTemperature?: number;
		classTemperature?: number;
	},
	streamOptions?: StreamOptions
): Record<string, unknown> {
	const isOmnivoice = providerId === 'omnivoice';
	// Per-segment voice overrides (e.g. alternative language voice) take precedence
	// over the provider's default/primary voice.
	const effectiveVoiceId = streamOptions?.voiceId ?? voiceId;
	const body: Record<string, unknown> = {
		model,
		input: text,
		voice: effectiveVoiceId,
		speed: streamOptions?.speed ?? speed,
		response_format: isOmnivoice ? 'wav' : 'mp3'
	};

	if (isOmnivoice) {
		const language = streamOptions?.language ?? sessionOptions.language;
		if (language) body.language = language;

		const instructions = streamOptions?.instructions ?? sessionOptions.instructions;
		if (instructions && !effectiveVoiceId.startsWith('clone:')) {
			body.instructions = instructions;
		}
		// OmniVoice accepts num_step in the range 4-64. 0 is invalid and would
		// trigger a server error, so we drop out-of-range values instead.
		const numStep = streamOptions?.numStep ?? sessionOptions.numStep;
		if (numStep != null && numStep >= 4 && numStep <= 64) {
			body.num_step = numStep;
		}
		const positionTemperature = streamOptions?.positionTemperature ?? sessionOptions.positionTemperature;
		if (positionTemperature != null) {
			body.position_temperature = positionTemperature;
		}
		const classTemperature = streamOptions?.classTemperature ?? sessionOptions.classTemperature;
		if (classTemperature != null) {
			body.class_temperature = classTemperature;
		}
	}
	return body;
}

// Shared by OpenAI's hosted TTS and any OpenAI-compatible local server
// (Kokoro-FastAPI, openedai-speech, the OmniVoice proxy). The provider id
// decides URL normalization, whether an API key is required, the request
// format, and the failure message.
export class OpenAITTS implements ITTSProvider {
	private apiKey: string;
	private voiceId: string;
	private model: string;
	private speed: number;
	private language: string;
	private instructions: string;
	private numStep: number;
	private positionTemperature: number;
	private classTemperature: number;
	private baseUrl: string;
	private isLocal: boolean;
	private isOmniVoice: boolean;
	private isPlainLocal: boolean;
	private providerId: string;

	readonly capabilities: TTSCapabilities;

	constructor(options: TTSOptions) {
		this.providerId = options.provider;
		this.isOmniVoice = options.provider === 'omnivoice';
		this.apiKey = options.apiKey || '';
		this.voiceId = options.voiceId || 'alloy';
		this.model = options.model || (this.isOmniVoice ? 'omnivoice' : 'tts-1');
		this.speed = options.speed ?? 1;
		this.language = options.language || 'en';
		this.instructions = options.instructions || '';
		this.numStep = options.numStep ?? 32;
		this.positionTemperature = options.positionTemperature ?? 1;
		this.classTemperature = options.classTemperature ?? 0.2;
		this.isLocal = isLocalTTSProvider(options.provider);
		// omnivoice is a member of LOCAL_TTS_PROVIDERS, so isLocal alone sweeps it
		// in. URL normalization does want that; the hints and error text do not.
		this.isPlainLocal = this.isLocal && !this.isOmniVoice;
		this.baseUrl = this.isLocal
			? getTTSBaseUrl(options.provider, options.baseUrl)
			: ensureTrailingSlash(options.baseUrl || 'https://api.openai.com/v1/');

		// Only OmniVoice takes a language hint per request.
		this.capabilities = {
			streaming: false,
			emotion: false,
			multilingual: this.isOmniVoice
		};
	}

	getAudioContext(): AudioContext {
		return getSharedAudioContext();
	}

	async speak(text: string): Promise<TTSSpeakResult> {
		const audioBuffer = await this.fetchAudioBuffer(text);
		return this.playAudioBuffer(audioBuffer);
	}

	async fetchAudioBuffer(text: string, options?: StreamOptions): Promise<AudioBuffer> {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		// Local servers don't need a key; only send auth when we actually have one.
		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`;
		}

		const body = buildOpenAITTSRequestBody(
			this.providerId,
			this.model,
			this.voiceId,
			this.speed,
			text,
			{
				language: this.language,
				instructions: this.instructions,
				numStep: this.numStep,
				positionTemperature: this.positionTemperature,
				classTemperature: this.classTemperature
			},
			options
		);

		let response: Response;
		try {
			response = await fetch(`${this.baseUrl}audio/speech`, {
				method: 'POST',
				headers,
				body: JSON.stringify(body),
				signal: options?.signal
			});
		} catch (err) {
			// A thrown fetch is usually a refused connection or a CORS block, which
			// is the exact failure mode that broke local LLMs before they were fixed.
			if (this.isOmniVoice) {
				throw new Error(getOmniVoiceConnectionHint(this.baseUrl, getCurrentSiteOrigin()));
			}
			if (this.isPlainLocal) {
				throw new Error(getLocalTTSConnectionHint(this.baseUrl, getCurrentSiteOrigin()));
			}
			throw err;
		}

		if (!response.ok) {
			// OmniVoice returns structured JSON errors, so it uses the shared
			// provider message rather than the generic local-server hint.
			if (this.isPlainLocal) {
				throw new Error(
					`Local TTS server returned ${response.status} at ${this.baseUrl}. Check the model and voice are valid for this server.`
				);
			}
			let body: unknown;
			try {
				body = await response.json();
			} catch {
				// non-JSON error body
			}
			throw new Error(
				providerErrorMessage(this.isOmniVoice ? 'OmniVoice' : 'OpenAI TTS', response.status, body)
			);
		}

		const arrayBuffer = await response.arrayBuffer();
		const audioContext = this.getAudioContext();

		// OmniVoice sometimes returns a near-empty WAV for very short inputs
		// (e.g. a two-letter word): header plus a few samples. decodeAudioData
		// can reject such buffers, which would surface as a spurious "unable to
		// decode audio" error. Treat them as silence instead — the orchestrator
		// skips near-empty buffers.
		if (arrayBuffer.byteLength < 128) {
			return audioContext.createBuffer(1, 1, 24000);
		}

		if (audioContext.state === 'suspended') {
			await audioContext.resume();
		}

		return audioContext.decodeAudioData(arrayBuffer);
	}

	private playAudioBuffer(audioBuffer: AudioBuffer): TTSSpeakResult {
		const audioContext = this.getAudioContext();

		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;

		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;

		source.connect(analyser);
		analyser.connect(audioContext.destination);

		source.start(0);

		return { source, analyser };
	}
}
