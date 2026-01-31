import { getTTSProvider, type TTSOptions } from '$lib/services/tts';

function createTTSStore() {
	let isSpeaking = $state(false);
	let currentAnalyser = $state<AnalyserNode | null>(null);
	let currentSource = $state<AudioBufferSourceNode | null>(null);
	let queue = $state<string[]>([]);

	async function speak(text: string, options: TTSOptions) {
		// All TTS providers require API keys
		if (!options.apiKey) {
			console.warn('TTS not configured - missing API key');
			return;
		}

		// Add to queue
		queue = [...queue, text];

		// If already speaking, the queue will be processed
		if (isSpeaking) return;

		await processQueue(options);
	}

	async function processQueue(options: TTSOptions) {
		if (queue.length === 0) {
			isSpeaking = false;
			currentAnalyser = null;
			return;
		}

		isSpeaking = true;
		const text = queue[0];
		queue = queue.slice(1);

		try {
			const tts = getTTSProvider(options);
			const { source, analyser } = await tts.speak(text);

			currentSource = source;
			currentAnalyser = analyser;

			// Wait for playback to complete
			await new Promise<void>((resolve) => {
				source.onended = () => resolve();
			});
		} catch (error) {
			console.error('TTS error:', error);
		}

		// Process next in queue
		await processQueue(options);
	}

	function stop() {
		if (currentSource) {
			try {
				currentSource.stop();
			} catch {
				// Already stopped
			}
		}
		queue = [];
		isSpeaking = false;
		currentAnalyser = null;
		currentSource = null;
	}

	function getAnalyserData(): Uint8Array | null {
		if (!currentAnalyser) return null;

		const dataArray = new Uint8Array(currentAnalyser.frequencyBinCount);
		currentAnalyser.getByteFrequencyData(dataArray);
		return dataArray;
	}

	return {
		get isSpeaking() {
			return isSpeaking;
		},
		get currentAnalyser() {
			return currentAnalyser;
		},
		speak,
		stop,
		getAnalyserData
	};
}

export const ttsStore = createTTSStore();
