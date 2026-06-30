import test from 'node:test';
import assert from 'node:assert/strict';

import { modelSupportsVision, canShowImages } from './vision.ts';

test('model heuristic catches local vision models', () => {
	assert.equal(modelSupportsVision('llava:13b'), true);
	assert.equal(modelSupportsVision('llama3.2-vision'), true);
	assert.equal(modelSupportsVision('qwen2.5-vl-7b'), true);
	assert.equal(modelSupportsVision('moondream'), true);
	assert.equal(modelSupportsVision('llama3.1:8b'), false);
	assert.equal(modelSupportsVision('mistral'), false);
	assert.equal(modelSupportsVision(undefined), false);
	assert.equal(modelSupportsVision(''), false);
});

test('canShowImages gates on the provider flag OR the model', () => {
	// Provider is vision-capable: allowed regardless of model id
	assert.equal(canShowImages(true, 'anything'), true);
	// Provider not flagged, but a local vision model: allowed via the heuristic
	assert.equal(canShowImages(false, 'llava:13b'), true);
	// Provider not flagged, text-only model: not allowed
	assert.equal(canShowImages(false, 'llama3.1:8b'), false);
	assert.equal(canShowImages(false, undefined), false);
});
