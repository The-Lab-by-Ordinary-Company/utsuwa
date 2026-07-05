import { getSharedAudioContext, type ITTSProvider, type TTSOptions, type TTSSpeakResult } from './index';
import { providerErrorMessage } from './provider-utils';

function ensureTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : url + '/';
}

export class ElevenLabsTTS implements ITTSProvider {
	private apiKey: string;
	private voiceId: string;
	private model: string;
	private speed: number;
	private baseUrl: string;

	constructor(options: TTSOptions) {
		this.apiKey = options.apiKey || '';
		this.voiceId = options.voiceId || 'EXAVITQu4vr4xnSDxMaL';
		this.model = options.model || 'eleven_turbo_v2_5';
		this.speed = options.speed ?? 1;
		this.baseUrl = ensureTrailingSlash(options.baseUrl || 'https://api.elevenlabs.io/v1/');
	}

	getAudioContext(): AudioContext {
		return getSharedAudioContext();
	}

	async speak(text: string): Promise<TTSSpeakResult> {
		const response = await fetch(
			`${this.baseUrl}text-to-speech/${this.voiceId}/stream`,
			{
				method: 'POST',
				headers: {
					'xi-api-key': this.apiKey,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					model_id: this.model,
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75
					}
				})
			}
		);

		if (!response.ok) {
			// Keep the API's own explanation (voice_not_found, quota_exceeded, ...)
			// so the failure is self-diagnosing instead of a bare status code.
			let body: unknown;
			try {
				body = await response.json();
			} catch {
				// non-JSON error body
			}
			throw new Error(providerErrorMessage('ElevenLabs', response.status, body));
		}

		const arrayBuffer = await response.arrayBuffer();
		const audioContext = this.getAudioContext();

		// Resume audio context if suspended
		if (audioContext.state === 'suspended') {
			await audioContext.resume();
		}

		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

		// Create source node
		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.playbackRate.value = this.speed;

		// Create analyser for lip-sync
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;

		// Connect nodes
		source.connect(analyser);
		analyser.connect(audioContext.destination);

		// Start playback
		source.start(0);

		return { source, analyser };
	}
}
