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

test('start after destroy creates a fresh controller', () => {
	const tone = createWaitTone({ pingIntervalMs: 10 });
	tone.destroy();
	assert.doesNotThrow(() => tone.start());
});
