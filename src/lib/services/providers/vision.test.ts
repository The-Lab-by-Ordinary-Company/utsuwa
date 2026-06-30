import test from 'node:test';
import assert from 'node:assert/strict';

import { modelSupportsVision, canShowImages } from './vision.ts';

test('model heuristic catches vision models and rejects text-only ones', () => {
	assert.equal(modelSupportsVision('llava:13b'), true);
	assert.equal(modelSupportsVision('llama3.2-vision'), true);
	assert.equal(modelSupportsVision('qwen2.5-vl-7b'), true);
	assert.equal(modelSupportsVision('moondream'), true);
	assert.equal(modelSupportsVision('gpt-4o'), true);
	assert.equal(modelSupportsVision('gemma3:4b'), true);
	assert.equal(modelSupportsVision('llama3.1:8b'), false);
	assert.equal(modelSupportsVision('mistral'), false);
	assert.equal(modelSupportsVision('gpt-3.5-turbo'), false);
	// gemma3 matches the hint but the 1b variant is text-only
	assert.equal(modelSupportsVision('gemma3:1b'), false);
	assert.equal(modelSupportsVision(undefined), false);
	assert.equal(modelSupportsVision(''), false);
});

test('canShowImages needs a vision-capable model on a vision/local provider', () => {
	// Cloud vision provider + vision model
	assert.equal(canShowImages(true, false, 'gpt-4o'), true);
	// Cloud vision provider + text model -> prompt
	assert.equal(canShowImages(true, false, 'gpt-3.5-turbo'), false);
	// Local provider + vision model
	assert.equal(canShowImages(false, true, 'llava:13b'), true);
	// Local provider + text model -> prompt
	assert.equal(canShowImages(false, true, 'gemma3:1b'), false);
	// Non-vision, non-local provider (e.g. DeepSeek) -> never
	assert.equal(canShowImages(false, false, 'gpt-4o'), false);
});
