import { getTTSProvider, type TTSOptions } from '$lib/services/tts';
import { isLocalTTSProvider } from '$lib/services/providers/local-endpoints';

function createTTSStore() {
	let isSpeaking = $state(false);
	let currentAnalyser = $state<AnalyserNode | null>(null);
	let currentSource = $state<AudioBufferSourceNode | null>(null);
	let queue = $state<string[]>([]);
	// Last playback failure, surfaced by the UI as a toast. Silent failures made
	// misconfigurations (like a stale voice id from another provider) look like
	// the companion just chose not to speak.
	let lastError = $state<string | null>(null);
	let errorTimer: ReturnType<typeof setTimeout> | null = null;

	function reportError(error: unknown) {
		lastError = error instanceof Error ? error.message : 'Voice playback failed';
		if (errorTimer) clearTimeout(errorTimer);
		errorTimer = setTimeout(() => (lastError = null), 8000);
	}

	async function speak(text: string, options: TTSOptions) {
		// Cloud providers need a key; local servers (e.g. Kokoro) don't.
		if (!options.apiKey && !isLocalTTSProvider(options.provider)) {
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
			reportError(error);
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

	return {
		get isSpeaking() {
			return isSpeaking;
		},
		get currentAnalyser() {
			return currentAnalyser;
		},
		get lastError() {
			return lastError;
		},
		speak,
		stop
	};
}

export const ttsStore = createTTSStore();
