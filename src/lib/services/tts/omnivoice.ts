import {
	getSharedAudioContext,
	type ITTSProvider,
	type TTSOptions,
	type TTSSpeakResult,
	type StreamOptions
} from './index.ts';
import { getTTSBaseUrl, getOmniVoiceConnectionHint } from '../providers/local-endpoints.ts';
import { providerErrorMessage } from './provider-utils.ts';

function getCurrentSiteOrigin(): string | undefined {
	return typeof window !== 'undefined' ? window.location.origin : undefined;
}

export class OmniVoiceTTS implements ITTSProvider {
	private apiKey: string;
	private voiceId: string;
	private model: string;
	private speed: number;
	private language: string;
	private baseUrl: string;

	readonly capabilities = {
		streaming: false,
		emotion: false,
		multilingual: true
	};

	constructor(options: TTSOptions) {
		this.apiKey = options.apiKey || '';
		this.voiceId = options.voiceId || 'alloy';
		this.model = options.model || 'omnivoice';
		this.speed = options.speed ?? 1;
		this.language = options.language || 'en';
		this.baseUrl = getTTSBaseUrl('omnivoice', options.baseUrl);
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
					language: options?.language ?? this.language,
					speed: options?.speed ?? this.speed,
					response_format: 'wav'
				}),
				signal: options?.signal
			});
		} catch (err) {
			throw new Error(getOmniVoiceConnectionHint(this.baseUrl, getCurrentSiteOrigin()));
		}

		if (!response.ok) {
			let body: unknown;
			try {
				body = await response.json();
			} catch {
				// non-JSON error body
			}
			throw new Error(providerErrorMessage('OmniVoice', response.status, body));
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
