import test from 'node:test';
import assert from 'node:assert/strict';

import {
	canSpeak,
	enqueue,
	beginNext,
	finishCurrent,
	clearQueue,
	runQueue,
	type QueueSnapshot,
	type QueueEngine
} from './tts-store-logic.ts';

function makeEngine(initial: QueueSnapshot): QueueEngine {
	let snapshot = initial;
	return {
		get snapshot() {
			return snapshot;
		},
		set snapshot(value) {
			snapshot = value;
		},
		play: async () => {
			throw new Error('play() must be provided by the test');
		}
	};
}

const empty: QueueSnapshot = { isSpeaking: false, queue: [] };

const cloudOptions = { provider: 'elevenlabs' as const, apiKey: 'secret' };
const cloudNoKey = { provider: 'elevenlabs' as const };
const localOptions = { provider: 'local-tts' as const };

test('canSpeak requires a key for cloud providers', () => {
	assert.equal(canSpeak(cloudNoKey), false);
	assert.equal(canSpeak(cloudOptions), true);
});

test('canSpeak allows local providers without a key', () => {
	assert.equal(canSpeak(localOptions), true);
});

test('canSpeak allows any provider when a key is present', () => {
	assert.equal(canSpeak({ ...localOptions, apiKey: 'secret' }), true);
});

test('enqueue appends an item preserving options', () => {
	const first = enqueue('hello', cloudOptions, empty);
	assert.equal(first.queue.length, 1);
	assert.equal(first.queue[0].text, 'hello');
	assert.equal(first.queue[0].options, cloudOptions);

	const second = enqueue('world', localOptions, first);
	assert.equal(second.queue.length, 2);
	assert.equal(second.queue[1].options, localOptions);
	assert.equal(second.isSpeaking, false);
});

test('beginNext returns null while already speaking', () => {
	const speaking: QueueSnapshot = {
		isSpeaking: true,
		queue: [{ text: 'a', options: cloudOptions }]
	};
	const result = beginNext(speaking);
	assert.equal(result.item, null);
	assert.equal(result.snapshot.isSpeaking, true);
	assert.equal(result.snapshot.queue.length, 1);
});

test('beginNext returns null for an empty queue', () => {
	const result = beginNext(empty);
	assert.equal(result.item, null);
});

test('beginNext claims the next item and marks playback active', () => {
	const snapshot = enqueue('second', localOptions, enqueue('first', cloudOptions, empty));
	const result = beginNext(snapshot);

	assert.notEqual(result.item, null);
	assert.equal(result.item!.text, 'first');
	assert.equal(result.snapshot.isSpeaking, true);
	assert.equal(result.snapshot.queue.length, 1);
	assert.equal(result.snapshot.queue[0].text, 'second');
});

test('finishCurrent releases the speaking flag while keeping remaining queue', () => {
	const snapshot: QueueSnapshot = {
		isSpeaking: true,
		queue: [{ text: 'next', options: cloudOptions }]
	};
	const finished = finishCurrent(snapshot);
	assert.equal(finished.isSpeaking, false);
	assert.equal(finished.queue.length, 1);
});

test('clearQueue stops speaking and drops pending items', () => {
	const snapshot: QueueSnapshot = {
		isSpeaking: true,
		queue: [
			{ text: 'a', options: cloudOptions },
			{ text: 'b', options: localOptions }
		]
	};
	const cleared = clearQueue(snapshot);
	assert.equal(cleared.isSpeaking, false);
	assert.equal(cleared.queue.length, 0);
});

test('sequential beginNext/finishCurrent simulates processing multiple items', () => {
	let snapshot = enqueue(
		'three',
		cloudOptions,
		enqueue('two', localOptions, enqueue('one', cloudOptions, empty))
	);

	const first = beginNext(snapshot);
	assert.equal(first.item?.text, 'one');
	snapshot = finishCurrent(first.snapshot);

	const second = beginNext(snapshot);
	assert.equal(second.item?.text, 'two');
	assert.equal(second.snapshot.queue.length, 1);

	snapshot = finishCurrent(second.snapshot);
	const third = beginNext(snapshot);
	assert.equal(third.item?.text, 'three');

	snapshot = finishCurrent(third.snapshot);
	assert.equal(beginNext(snapshot).item, null);
});

test('runQueue plays all queued items in order', async () => {
	const played: string[] = [];
	const engine = makeEngine(
		enqueue('c', cloudOptions, enqueue('b', localOptions, enqueue('a', cloudOptions, empty)))
	);
	engine.play = async (item) => {
		played.push(item.text);
	};

	await runQueue(engine);

	assert.deepEqual(played, ['a', 'b', 'c']);
	assert.equal(engine.snapshot.isSpeaking, false);
	assert.equal(engine.snapshot.queue.length, 0);
});

test('runQueue does nothing when already speaking', async () => {
	let calls = 0;
	const engine = makeEngine({ isSpeaking: true, queue: [{ text: 'a', options: cloudOptions }] });
	engine.play = async () => {
		calls += 1;
	};

	await runQueue(engine);

	assert.equal(calls, 0);
	assert.equal(engine.snapshot.isSpeaking, true);
	assert.equal(engine.snapshot.queue.length, 1);
});

test('runQueue continues after a play error', async () => {
	const played: string[] = [];
	const errors: unknown[] = [];
	const engine = makeEngine(
		enqueue('b', localOptions, enqueue('a', cloudOptions, empty))
	);
	engine.play = async (item) => {
		if (item.text === 'a') {
			throw new Error('synthesis failed');
		}
		played.push(item.text);
	};
	engine.onError = (error) => errors.push(error);

	await runQueue(engine);

	assert.deepEqual(played, ['b']);
	assert.equal(errors.length, 1);
	assert.ok(errors[0] instanceof Error);
	assert.equal((errors[0] as Error).message, 'synthesis failed');
	assert.equal(engine.snapshot.isSpeaking, false);
	assert.equal(engine.snapshot.queue.length, 0);
});

test('runQueue stops processing when the queue is cleared during playback', async () => {
	const played: string[] = [];
	const finished: number[] = [];
	const engine = makeEngine(
		enqueue('b', localOptions, enqueue('a', cloudOptions, empty))
	);
	engine.play = async (item) => {
		played.push(item.text);
		// Simulate stop() clearing the queue while the first item is playing.
		engine.snapshot = clearQueue(engine.snapshot);
	};
	engine.onFinished = () => finished.push(1);

	await runQueue(engine);

	assert.deepEqual(played, ['a']);
	assert.equal(finished.length, 1);
	assert.equal(engine.snapshot.isSpeaking, false);
	assert.equal(engine.snapshot.queue.length, 0);
});
