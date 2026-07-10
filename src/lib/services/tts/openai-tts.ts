import {
	getSharedAudioContext,
	type ITTSProvider,
	type TTSOptions,
	type TTSSpeakResult,
	type StreamOptions
} from './index.ts';
import {
	getTTSBaseUrl,
	getLocalTTSConnectionHint,
	isLocalTTSProvider
} from '../providers/local-endpoints.ts';
import { providerErrorMessage } from './provider-utils.ts';

function ensureTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : url + '/';
}

function getCurrentSiteOrigin(): string | undefined {
	return typeof window !== 'undefined' ? window.location.origin : undefined;
}

// Shared by OpenAI's hosted TTS and any OpenAI-compatible local server
// (Kokoro-FastAPI, openedai-speech). The provider id decides URL normalization,
// whether an API key is required, and the failure message.
export class OpenAITTS implements ITTSProvider {
	private apiKey: string;
	private voiceId: string;
	private model: string;
	private speed: number;
	private baseUrl: string;
	private isLocal: boolean;

	readonly capabilities = {
		streaming: false,
		emotion: false,
		multilingual: false
	};

	constructor(options: TTSOptions) {
		this.apiKey = options.apiKey || '';
		this.voiceId = options.voiceId || 'alloy';
		this.model = options.model || 'tts-1';
		this.speed = options.speed ?? 1;
		this.isLocal = isLocalTTSProvider(options.provider);
		this.baseUrl = this.isLocal
			? getTTSBaseUrl(options.provider, options.baseUrl)
			: ensureTrailingSlash(options.baseUrl || 'https://api.openai.com/v1/');
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

		let response: Response;
		try {
			response = await fetch(`${this.baseUrl}audio/speech`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					model: this.model,
					input: text,
					voice: this.voiceId,
					speed: options?.speed ?? this.speed,
					response_format: 'mp3'
				}),
				signal: options?.signal
			});
		} catch (err) {
			// A thrown fetch is usually a refused connection or a CORS block, which
			// is the exact failure mode that broke local LLMs before they were fixed.
			if (this.isLocal) {
				throw new Error(getLocalTTSConnectionHint(this.baseUrl, getCurrentSiteOrigin()));
			}
			throw err;
		}

		if (!response.ok) {
			if (this.isLocal) {
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
			throw new Error(providerErrorMessage('OpenAI TTS', response.status, body));
		}

		const arrayBuffer = await response.arrayBuffer();
		const audioContext = this.getAudioContext();

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
