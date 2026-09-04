import test from 'node:test';
import assert from 'node:assert/strict';
import { isWebGLAvailable } from './webgl.ts';

function stubDocument(getContext: (kind: string) => unknown) {
	(globalThis as Record<string, unknown>).document = {
		createElement: () => ({ getContext })
	};
}

test('isWebGLAvailable: webgl2 context counts as available (happy path)', () => {
	stubDocument(() => ({}));
	assert.equal(isWebGLAvailable(), true);
});

test('isWebGLAvailable: falls back to webgl1 when webgl2 is unavailable', () => {
	stubDocument((kind) => {
		if (kind === 'webgl2') return null;
		return {};
	});
	assert.equal(isWebGLAvailable(), true);
});

test('isWebGLAvailable: no context at all (blocked/lost) reports unavailable', () => {
	stubDocument(() => null);
	assert.equal(isWebGLAvailable(), false);
});

test('isWebGLAvailable: getContext throwing or missing document reports unavailable (edge)', () => {
	stubDocument(() => {
		throw new Error('blocked');
	});
	assert.equal(isWebGLAvailable(), false);

	delete (globalThis as Record<string, unknown>).document;
	assert.equal(isWebGLAvailable(), false);
});