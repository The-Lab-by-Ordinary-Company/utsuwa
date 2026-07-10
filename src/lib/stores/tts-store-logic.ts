// NOTE: relative imports use .ts extensions because this file is loaded directly
// by the Node test runner (`node --test --experimental-strip-types`).
import { isLocalTTSProvider } from '../services/providers/local-endpoints.ts';
import type { TTSOptions } from '../services/tts/index.ts';

export interface QueueItem {
	text: string;
	options: TTSOptions;
}

export interface QueueSnapshot {
	isSpeaking: boolean;
	queue: QueueItem[];
}

export interface QueueEngine {
	get snapshot(): QueueSnapshot;
	set snapshot(value: QueueSnapshot);
	play(item: QueueItem): Promise<void>;
	onError?(error: unknown): void;
	onFinished?(): void;
}

/** Cloud providers need an API key; local endpoints (e.g. Kokoro) don't. */
export function canSpeak(options: TTSOptions): boolean {
	if (options.apiKey) return true;
	return isLocalTTSProvider(options.provider);
}

/** Append a new utterance to the queue without starting playback. */
export function enqueue(
	text: string,
	options: TTSOptions,
	snapshot: QueueSnapshot
): QueueSnapshot {
	return { ...snapshot, queue: [...snapshot.queue, { text, options }] };
}

/**
 * Claim the next queue item for playback.
 * Returns `null` when playback is already active or the queue is empty.
 */
export function beginNext(
	snapshot: QueueSnapshot
): { snapshot: QueueSnapshot; item: QueueItem | null } {
	if (snapshot.isSpeaking || snapshot.queue.length === 0) {
		return { snapshot, item: null };
	}
	return {
		snapshot: { ...snapshot, isSpeaking: true, queue: snapshot.queue.slice(1) },
		item: snapshot.queue[0]
	};
}

/** Mark the current utterance as finished so the next one can start. */
export function finishCurrent(snapshot: QueueSnapshot): QueueSnapshot {
	return { ...snapshot, isSpeaking: false };
}

/** Stop playback and drop all pending utterances. */
export function clearQueue(snapshot: QueueSnapshot): QueueSnapshot {
	return { ...snapshot, isSpeaking: false, queue: [] };
}

/**
 * Drive the queue until it is empty.
 * The engine's `snapshot` is read and written through getters/setters so the
 * caller can wire it to Svelte runes or plain state.
 */
export async function runQueue(engine: QueueEngine): Promise<void> {
	const claim = beginNext(engine.snapshot);
	if (!claim.item) return;

	engine.snapshot = claim.snapshot;

	try {
		await engine.play(claim.item);
	} catch (error) {
		engine.onError?.(error);
	} finally {
		engine.snapshot = finishCurrent(engine.snapshot);
		engine.onFinished?.();
		await runQueue(engine);
	}
}
