import test from 'node:test';
import assert from 'node:assert/strict';

import { phaseLabel } from './chat-phase.ts';

test('maps remembering to its label', () => {
	assert.equal(phaseLabel('remembering'), 'Remembering...');
});

test('maps seeing to its label', () => {
	assert.equal(phaseLabel('seeing'), 'Looking at your photo...');
});

test('maps thinking to its label', () => {
	assert.equal(phaseLabel('thinking'), 'Thinking...');
});
