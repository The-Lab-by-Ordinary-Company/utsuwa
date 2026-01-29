import { getSharedAudioContext, type ITTSProvider, type TTSOptions, type TTSSpeakResult } from './index';

function ensureTrailingSlash(url: string): string {
	return url.endsWith('/') ? url : url + '/';
}

export class OpenAICompatibleTTS implements ITTSProvider {
	private apiKey: string;
	private voiceId: string;
	private model: string;
	private speed: number;
	private baseUrl: string;

	constructor(options: TTSOptions) {
		this.apiKey = options.apiKey || '';
		this.voiceId = options.voiceId || 'alloy';
		this.model = 'tts-1';
		this.speed = options.speed ?? 1;
		this.baseUrl = options.baseUrl ? ensureTrailingSlash(options.baseUrl) : '';
	}

	getAudioContext(): AudioContext {
		return getSharedAudioContext();
	}

	async speak(text: string): Promise<TTSSpeakResult> {
		if (!this.baseUrl) {
			throw new Error('Base URL required for OpenAI-compatible TTS');
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		const response = await fetch(`${this.baseUrl}audio/speech`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: this.model,
				input: text,
				voice: this.voiceId,
				speed: this.speed,
				response_format: 'mp3'
			})
		});

		if (!response.ok) {
			throw new Error(`TTS API error: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const audioContext = this.getAudioContext();

		if (audioContext.state === 'suspended') {
			await audioContext.resume();
		}

		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.playbackRate.value = this.speed;

		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;

		source.connect(analyser);
		analyser.connect(audioContext.destination);

		source.start(0);

		return { source, analyser };
	}
}
