import { browser } from '$app/environment';
import { webSpeechService } from '$lib/services/stt/web-speech';

function createSttStore() {
	let isListening = $state(false);
	let transcript = $state('');
	let interimTranscript = $state('');
	let error = $state<string | null>(null);
	let audioLevel = $state(0);
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;

	async function startListening(onComplete: (text: string) => void) {
		if (!browser) return;

		// console.log('[STT Store] Starting listening...');
		error = null;
		transcript = '';
		interimTranscript = '';
		audioLevel = 0.2; // Base level while listening

		// Start speech recognition (it handles its own mic access)
		const started = webSpeechService.startListening({
			onResult: (text, isFinal) => {
				// console.log('[STT Store] Received:', text, isFinal ? '(final)' : '(interim)');
				if (isFinal) {
					// Accumulate final results
					transcript = transcript ? transcript + ' ' + text : text;
					interimTranscript = '';
					audioLevel = 0.3; // Dim when final
				} else {
					interimTranscript = text;
					// Simulate audio activity when receiving interim results
					audioLevel = 0.5 + Math.random() * 0.5;
				}
			},
			onEnd: () => {
				// console.log('[STT Store] Recognition ended, transcript:', transcript);
				isListening = false;
				audioLevel = 0;
				// Auto-send if we have a transcript
				const finalText = transcript.trim();
				transcript = '';
				interimTranscript = '';
				if (finalText) {
					onComplete(finalText);
				}
			},
			onError: (err) => {
				console.error('[STT Store] Error:', err);
				setError(err);
				isListening = false;
				audioLevel = 0;
			}
		});

		if (started) {
			// console.log('[STT Store] Recognition started successfully');
			isListening = true;
			// Skip audio analyser - it can conflict with Speech API mic access
		} else {
			// console.log('[STT Store] Failed to start recognition');
		}
	}

	function stopListening() {
		webSpeechService.stopListening();
	}

	function cancel() {
		webSpeechService.abort();
		isListening = false;
		transcript = '';
		interimTranscript = '';
		audioLevel = 0;
	}

	function isSupported() {
		return browser && webSpeechService.isSupported();
	}

	function showUnsupportedError() {
		setError('Voice input is not supported in this browser. Try Chrome or Edge.');
	}

	function setError(message: string) {
		// Clear any existing timeout
		if (errorTimeout) {
			clearTimeout(errorTimeout);
		}
		error = message;
		// Auto-dismiss after 4 seconds
		errorTimeout = setTimeout(() => {
			error = null;
			errorTimeout = null;
		}, 4000);
	}

	function clearError() {
		if (errorTimeout) {
			clearTimeout(errorTimeout);
			errorTimeout = null;
		}
		error = null;
	}

	return {
		get isListening() {
			return isListening;
		},
		get transcript() {
			return transcript;
		},
		get interimTranscript() {
			return interimTranscript;
		},
		get displayTranscript() {
			// Show accumulated final transcript + current interim
			if (transcript && interimTranscript) {
				return transcript + ' ' + interimTranscript;
			}
			return transcript || interimTranscript;
		},
		get error() {
			return error;
		},
		get audioLevel() {
			return audioLevel;
		},
		startListening,
		stopListening,
		cancel,
		isSupported,
		showUnsupportedError,
		clearError
	};
}

export const sttStore = createSttStore();
