import type { SpeechRecognitionCallbacks } from './web-speech';

class GroqSttService {
	private apiKey: string | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private audioChunks: Blob[] = [];
	private stream: MediaStream | null = null;
	private analyser: AnalyserNode | null = null;
	private audioContext: AudioContext | null = null;
	private animFrameId: number | null = null;
	private callbacks: SpeechRecognitionCallbacks | null = null;
	private abortController: AbortController | null = null;
	private listening = false;
	private transcribing = false;

	setApiKey(key: string) {
		this.apiKey = key;
	}

	isSupported(): boolean {
		return !!navigator.mediaDevices?.getUserMedia;
	}

	isConfigured(): boolean {
		return !!this.apiKey;
	}

	getIsListening(): boolean {
		return this.listening;
	}

	getIsTranscribing(): boolean {
		return this.transcribing;
	}

	async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
		if (this.listening) return true;
		if (!this.apiKey) {
			callbacks.onError('Groq API key not configured. Go to Settings > Persona to add it.');
			return false;
		}

		this.callbacks = callbacks;
		this.audioChunks = [];

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (err) {
			if (err instanceof DOMException) {
				const messages: Record<string, string> = {
					NotAllowedError: 'Microphone access denied. Check system permissions.',
					NotFoundError: 'No microphone found. Please connect a microphone.',
					NotReadableError: 'Microphone is busy or in use by another app.',
					OverconstrainedError: 'Microphone does not meet requirements.'
				};
				callbacks.onError(messages[err.name] || `Microphone error: ${err.message}`);
			} else {
				callbacks.onError('Failed to access microphone');
			}
			return false;
		}

		// Watch for mic disconnection
		this.stream.getTracks().forEach((track) => {
			track.onended = () => {
				if (this.listening) {
					this.callbacks?.onError('Microphone disconnected');
					this.cleanup();
					this.listening = false;
					this.callbacks?.onEnd();
				}
			};
		});

		// Set up audio analysis for real levels
		this.audioContext = new AudioContext();
		const source = this.audioContext.createMediaStreamSource(this.stream);
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 256;
		source.connect(this.analyser);
		this.startLevelMonitoring();

		// Record audio — mimeType may be undefined to let browser pick default
		const mimeType = this.getSupportedMimeType();
		try {
			this.mediaRecorder = mimeType
				? new MediaRecorder(this.stream, { mimeType })
				: new MediaRecorder(this.stream);
		} catch (err) {
			callbacks.onError('Audio recording not supported on this platform');
			this.releaseStream();
			return false;
		}

		this.mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) this.audioChunks.push(e.data);
		};

		this.mediaRecorder.onstop = () => this.handleRecordingStop();

		this.mediaRecorder.start(250);
		this.listening = true;
		return true;
	}

	stopListening(): void {
		if (this.mediaRecorder && this.listening) {
			this.mediaRecorder.stop();
		}
	}

	abort(): void {
		this.abortController?.abort();
		this.abortController = null;
		this.callbacks = null;
		this.cleanup();
		this.listening = false;
		this.transcribing = false;
	}

	private getSupportedMimeType(): string | undefined {
		// mp4/m4a first for Safari/WKWebView, then webm for Chromium
		const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
		for (const type of types) {
			if (MediaRecorder.isTypeSupported(type)) return type;
		}
		// Let browser pick its default
		return undefined;
	}

	private startLevelMonitoring() {
		if (!this.analyser || !this.callbacks?.onAudioLevel) return;

		const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		const tick = () => {
			if (!this.analyser || !this.listening) return;
			this.analyser.getByteFrequencyData(dataArray);
			// Average amplitude normalized to 0-1
			let sum = 0;
			for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
			const level = sum / (dataArray.length * 255);
			this.callbacks?.onAudioLevel?.(level);
			this.animFrameId = requestAnimationFrame(tick);
		};
		this.animFrameId = requestAnimationFrame(tick);
	}

	private async handleRecordingStop() {
		this.listening = false;
		this.stopLevelMonitoring();
		this.releaseStream();

		// abort() was called — don't transcribe or fire callbacks
		if (!this.callbacks) return;

		if (this.audioChunks.length === 0) {
			this.callbacks?.onEnd();
			return;
		}

		this.transcribing = true;
		const actualMime = this.mediaRecorder?.mimeType || 'audio/mp4';
		const audioBlob = new Blob(this.audioChunks, { type: actualMime });
		this.audioChunks = [];

		const ext = actualMime.includes('webm') ? 'webm' : actualMime.includes('ogg') ? 'ogg' : 'm4a';

		this.abortController = new AbortController();
		const timeoutId = setTimeout(() => this.abortController?.abort(), 30000);

		try {
			const formData = new FormData();
			formData.append('file', audioBlob, `recording.${ext}`);
			formData.append('model', 'whisper-large-v3-turbo');

			const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
				method: 'POST',
				headers: { Authorization: `Bearer ${this.apiKey}` },
				body: formData,
				signal: this.abortController.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const msg = (errorData as { error?: { message?: string } })?.error?.message || `Groq API error (${response.status})`;
				this.callbacks?.onError(msg);
				this.transcribing = false;
				return;
			}

			const data = (await response.json()) as { text: string };
			const text = data.text?.trim();
			this.transcribing = false;

			if (text) {
				this.callbacks?.onResult(text, true);
			}
			this.callbacks?.onEnd();
		} catch (err) {
			clearTimeout(timeoutId);
			this.transcribing = false;
			if (err instanceof DOMException && err.name === 'AbortError') {
				// Aborted by user or timeout — don't surface as error
				this.callbacks?.onEnd();
				return;
			}
			const msg = err instanceof Error ? err.message : 'Failed to transcribe audio';
			this.callbacks?.onError(msg);
		} finally {
			this.abortController = null;
		}
	}

	private stopLevelMonitoring() {
		if (this.animFrameId !== null) {
			cancelAnimationFrame(this.animFrameId);
			this.animFrameId = null;
		}
	}

	private releaseStream() {
		if (this.stream) {
			this.stream.getTracks().forEach((t) => t.stop());
			this.stream = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
		this.analyser = null;
	}

	private cleanup() {
		this.stopLevelMonitoring();
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		this.mediaRecorder = null;
		this.audioChunks = [];
		this.releaseStream();
	}
}

export const groqSttService = new GroqSttService();
