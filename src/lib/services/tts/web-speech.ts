import { getSharedAudioContext, type ITTSProvider, type TTSOptions, type TTSSpeakResult } from './index';

export class WebSpeechTTS implements ITTSProvider {
	private voiceId: string;
	private speed: number;
	private pitch: number;
	private volume: number;

	constructor(options: TTSOptions) {
		this.voiceId = options.voiceId || '';
		this.speed = options.speed ?? 1;
		this.pitch = options.pitch ?? 1;
		this.volume = (options.volume ?? 100) / 100;
	}

	getAudioContext(): AudioContext {
		return getSharedAudioContext();
	}

	async speak(text: string): Promise<TTSSpeakResult> {
		return new Promise((resolve, reject) => {
			if (!('speechSynthesis' in window)) {
				reject(new Error('Web Speech API not supported'));
				return;
			}

			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = this.speed;
			utterance.pitch = this.pitch;
			utterance.volume = this.volume;

			// Set voice if specified
			if (this.voiceId) {
				const voices = speechSynthesis.getVoices();
				const voice = voices.find((v) => v.name === this.voiceId || v.voiceURI === this.voiceId);
				if (voice) {
					utterance.voice = voice;
				}
			}

			// Create audio context and analyser for lip-sync compatibility
			const audioContext = this.getAudioContext();
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;

			// Web Speech doesn't give us an AudioBufferSourceNode, so we create a dummy one
			// and use an oscillator to simulate audio activity during speech
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.frequency.value = 0;
			gainNode.gain.value = 0;

			oscillator.connect(gainNode);
			gainNode.connect(analyser);

			// Create a fake source node wrapper
			const dummyBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
			const source = audioContext.createBufferSource();
			source.buffer = dummyBuffer;
			source.connect(analyser);

			utterance.onstart = async () => {
				if (audioContext.state === 'suspended') {
					await audioContext.resume();
				}
				oscillator.start();

				// Pulse the gain to simulate speech activity for lip-sync
				const pulseGain = () => {
					if (speechSynthesis.speaking) {
						gainNode.gain.value = Math.random() * 0.5;
						setTimeout(pulseGain, 50);
					} else {
						gainNode.gain.value = 0;
					}
				};
				pulseGain();
			};

			utterance.onend = () => {
				oscillator.stop();
				source.dispatchEvent(new Event('ended'));
			};

			utterance.onerror = (event) => {
				reject(new Error(`Web Speech error: ${event.error}`));
			};

			// Start speech
			speechSynthesis.speak(utterance);

			// Return immediately with the fake source/analyser
			// The onend event will trigger the source's ended event
			resolve({ source, analyser });
		});
	}

	// Get available voices
	static getVoices(): SpeechSynthesisVoice[] {
		if (!('speechSynthesis' in window)) {
			return [];
		}
		return speechSynthesis.getVoices();
	}
}
