import type { SpeechSegment } from '../voice-orchestrator.ts';
import { splitIntoSegments, stripSpeechArtifacts, stripForSpeech } from '../../utils/sentences.ts';

export interface StreamingSpeechBufferOptions {
	defaultLanguage?: string;
	streaming?: boolean;
	onSegment: (segment: SpeechSegment) => void;
}

/**
 * Buffers streaming LLM text and emits SpeechSegments as soon as complete
 * sentences are available. A flush timer ensures trailing text without a
 * sentence terminator is still emitted after a short timeout.
 */
export class StreamingSpeechBuffer {
	private buffer = '';
	private emittedLength = 0;
	// Tracks depth of curly braces so JSON state-update blocks that span
	// multiple streaming chunks are held back from TTS until fully received.
	private jsonDepth = 0;
	private flushTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly FLUSH_TIMEOUT_MS = 1500;
	private readonly options: StreamingSpeechBufferOptions;

	constructor(options: StreamingSpeechBufferOptions) {
		this.options = options;
	}

	feed(chunk: string): void {
		// Track curly-brace depth across chunks so we never emit text that is
		// inside an open JSON state-update block.
		for (const ch of chunk) {
			if (ch === '{') this.jsonDepth++;
			else if (ch === '}') this.jsonDepth--;
		}
		this.buffer += chunk;
		this.tryEmit();
		this.armFlushTimer();
	}

	flush(): void {
		let remaining = this.buffer.slice(this.emittedLength).trim();
		if (!remaining) return;

		const { cleaned } = stripForSpeech(remaining);
		remaining = cleaned.trim();
		if (!remaining) {
			this.emittedLength = this.buffer.length;
			this.jsonDepth = 0;
			return;
		}

		for (const seg of splitIntoSegments(remaining, this.options.defaultLanguage)) {
			this.options.onSegment(seg);
		}
		this.emittedLength = this.buffer.length;
		this.jsonDepth = 0;
	}

	reset(): void {
		this.buffer = '';
		this.emittedLength = 0;
		this.jsonDepth = 0;
		this.clearFlushTimer();
	}

	private tryEmit(): void {
		this.clearFlushTimer();

		let unprocessed = this.buffer.slice(this.emittedLength);
		while (unprocessed.length > 0) {
			const before = this.emittedLength;
			this.tryEmitBlock(unprocessed);
			if (this.emittedLength === before) break; // no sentence boundary found
			unprocessed = this.buffer.slice(this.emittedLength);
		}

		if (this.emittedLength < this.buffer.length) {
			this.armFlushTimer();
		}
	}

	private armFlushTimer(): void {
		if (this.flushTimer) return;
		this.flushTimer = setTimeout(() => {
			this.flushTimer = null;
			this.flush();
		}, this.FLUSH_TIMEOUT_MS);
	}

	private clearFlushTimer(): void {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
	}

	private emit(block: string): void {
		const { cleaned } = stripForSpeech(block);
		for (const seg of splitIntoSegments(cleaned, this.options.defaultLanguage)) {
			this.options.onSegment(seg);
		}
	}

	private tryEmitBlock(text: string): void {
		// While we are inside an open JSON state-update block, do not emit anything
		// that follows the opening brace. Content before the brace is still safe to
		// emit (e.g. a completed sentence before a state-update block starts).
		if (this.jsonDepth > 0) {
			const braceIndex = text.indexOf('{');
			if (braceIndex <= 0) return;
			text = text.slice(0, braceIndex);
		}

		// Strip any completed JSON state-update block(s) from the current tail.
		// Use the non-trimming variant so trailing whitespace is preserved for the
		// next streaming chunk.
		const { cleaned } = stripSpeechArtifacts(text);
		if (cleaned !== text) {
			this.buffer = this.buffer.slice(0, this.emittedLength) + cleaned;
			text = cleaned;
		}

		const paraBreak = text.indexOf('\n\n');
		if (paraBreak > 0) {
			const block = text.slice(0, paraBreak);
			if (block.trim()) {
				this.emit(block);
				this.emittedLength += paraBreak + 2;
			}
			return;
		}

		const singleBreak = text.indexOf('\n');
		if (singleBreak > 0) {
			const block = text.slice(0, singleBreak);
			if (block.trim()) {
				this.emit(block);
				this.emittedLength += singleBreak + 1;
			}
			return;
		}

		// Emit up to the first sentence boundary so TTS can start immediately.
		const sentenceEnd = /([.!?…])(\s+|$)/;
		const m = sentenceEnd.exec(text);
		if (!m) return;

		const firstEnd = m.index + m[0].length;
		const block = text.slice(0, firstEnd);
		if (block.trim()) {
			this.emit(block);
			this.emittedLength += firstEnd;
		}
	}
}
