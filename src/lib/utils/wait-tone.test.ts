import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaitTone } from './wait-tone.ts';

test('controller methods can be called repeatedly without throwing', () => {
	const tone = createWaitTone({ pingIntervalMs: 10 });
	assert.doesNotThrow(() => tone.start());
	assert.doesNotThrow(() => tone.start());
	assert.doesNotThrow(() => tone.stop());
	assert.doesNotThrow(() => tone.stop());
	assert.doesNotThrow(() => tone.destroy());
	assert.doesNotThrow(() => tone.destroy());
});

test('start is a no-op after destroy', () => {
	const tone = createWaitTone({ pingIntervalMs: 10 });
	tone.destroy();
	assert.doesNotThrow(() => tone.start());
});

test('start is safe in SSR environments without AudioContext', () => {
	const tone = createWaitTone({ pingIntervalMs: 10 });
	assert.equal(typeof window, 'undefined');
	assert.doesNotThrow(() => tone.start());
});

// The app page destroys the singleton on navigation (onDestroy), and the
// settings page is where the feature gets enabled. The singleton must come
// back to life on the next start or the tone can never play.
test('singleton: startWaitTone works again after destroyWaitTone', async (t) => {
	let contextsCreated = 0;
	let oscStarts = 0;

	class FakeParam {
		value = 0;
		setValueAtTime() {}
		linearRampToValueAtTime() {}
		exponentialRampToValueAtTime() {}
	}
	class FakeNode {
		gain = new FakeParam();
		frequency = new FakeParam();
		type = '';
		onended: (() => void) | null = null;
		connect() {}
		disconnect() {}
		start() {
			oscStarts++;
		}
		stop() {}
	}
	class FakeAudioContext {
		currentTime = 0;
		state = 'running';
		destination = new FakeNode();
		constructor() {
			contextsCreated++;
		}
		createOscillator() {
			return new FakeNode();
		}
		createGain() {
			return new FakeNode();
		}
		resume() {}
		suspend() {}
		close() {
			this.state = 'closed';
		}
	}

	const g = globalThis as Record<string, unknown>;
	g.window = {};
	g.AudioContext = FakeAudioContext;
	t.after(() => {
		delete g.window;
		delete g.AudioContext;
	});

	const { startWaitTone, stopWaitTone, destroyWaitTone } = await import('./wait-tone.ts');
	try {
		startWaitTone();
		assert.equal(contextsCreated, 1);
		assert.ok(oscStarts > 0);

		// leaving /app: page onDestroy
		stopWaitTone();
		destroyWaitTone();

		// user enabled the tone in settings, came back, companion is typing
		const before = oscStarts;
		startWaitTone();
		assert.equal(contextsCreated, 2, 'a fresh AudioContext should be created after destroy');
		assert.ok(oscStarts > before, 'the ping should play again after destroy');
	} finally {
		stopWaitTone();
		destroyWaitTone();
	}
});
