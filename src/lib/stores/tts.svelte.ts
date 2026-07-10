import { type TTSOptions } from '$lib/services/tts';
import { VoiceOrchestrator, type SpeechSegment } from '$lib/services/voice-orchestrator';
import { splitIntoSentences } from '$lib/utils/sentences';
import {
	canSpeak,
	clearQueue,
	enqueue,
	runQueue,
	type QueueEngine,
	type QueueItem
} from './tts-store-logic';

function createTTSStore() {
	let isSpeaking = $state(false);
	let currentAnalyser = $state<AnalyserNode | null>(null);
	let queue = $state<QueueItem[]>([]);
	// Last playback failure, surfaced by the UI as a toast. Silent failures made
	// misconfigurations (like a stale voice id from another provider) look like
	// the companion just chose not to speak.
	let lastError = $state<string | null>(null);
	let errorTimer: ReturnType<typeof setTimeout> | null = null;

	const orchestrator = new VoiceOrchestrator();

	function reportError(error: unknown) {
		lastError = error instanceof Error ? error.message : 'Voice playback failed';
		if (errorTimer) clearTimeout(errorTimer);
		errorTimer = setTimeout(() => (lastError = null), 8000);
	}

	function buildCallbacks(): {
		onAnalyserUpdate: (analyser: AnalyserNode) => void;
	} {
		return {
			onAnalyserUpdate: (analyser: AnalyserNode) => {
				currentAnalyser = analyser;
			}
		};
	}

	const engine: QueueEngine = {
		get snapshot() {
			return { isSpeaking, queue };
		},
		set snapshot(value) {
			isSpeaking = value.isSpeaking;
			queue = value.queue;
		},
		play: async (item) => {
			const sentences = splitIntoSentences(item.text);
			const segments: SpeechSegment[] = sentences.map((sentence) => ({ text: sentence }));

			await orchestrator.speakSegments(segments, item.options, buildCallbacks());
		},
		onError: (error) => {
			console.error('TTS error:', error);
			reportError(error);
		},
		onFinished: () => {
			currentAnalyser = null;
		}
	};

	async function speak(text: string, options: TTSOptions) {
		// Cloud providers need a key; local servers (e.g. Kokoro) don't.
		if (!canSpeak(options)) {
			console.warn('TTS not configured - missing API key');
			return;
		}

		const next = enqueue(text, options, { isSpeaking, queue });
		queue = next.queue;
		await processQueue();
	}

	async function processQueue() {
		await runQueue(engine);
	}

	function stop() {
		orchestrator.interrupt();
		// clearQueue resets the queue snapshot only; currentAnalyser is store-level
		// state and is cleared separately below.
		const cleared = clearQueue({ isSpeaking, queue });
		isSpeaking = cleared.isSpeaking;
		queue = cleared.queue;
		currentAnalyser = null;
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
