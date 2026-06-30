import test from 'node:test';
import assert from 'node:assert/strict';

import { computeScaledDimensions, MAX_EDGE_PX } from './image-scaling.ts';

test('computeScaledDimensions clamps the longest edge and preserves aspect', () => {
	assert.deepEqual(computeScaledDimensions(3000, 1500), { width: MAX_EDGE_PX, height: 784 });
	assert.deepEqual(computeScaledDimensions(1500, 3000), { width: 784, height: MAX_EDGE_PX });
});

test('computeScaledDimensions leaves small images untouched', () => {
	assert.deepEqual(computeScaledDimensions(800, 600), { width: 800, height: 600 });
	assert.deepEqual(computeScaledDimensions(1568, 1000), { width: 1568, height: 1000 });
});
