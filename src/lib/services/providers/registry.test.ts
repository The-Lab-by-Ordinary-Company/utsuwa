import test from 'node:test';
import assert from 'node:assert/strict';

import { LLM_PROVIDERS, TTS_PROVIDERS, getTTSProvider } from './registry.ts';

test('local LLM providers rely on discovered installed models', () => {
	const localProviders = LLM_PROVIDERS.filter((provider) => provider.isLocal);

	assert.ok(localProviders.length > 0);
	for (const provider of localProviders) {
		assert.deepEqual(provider.models ?? [], [], `${provider.name} should not expose static model choices`);
	}
});

test('local TTS provider is keyless, local, and ships fallback voices', () => {
	const localTTS = getTTSProvider('local-tts');

	assert.ok(localTTS, 'local-tts should be registered');
	assert.equal(localTTS?.isLocal, true);
	assert.equal(localTTS?.requiresApiKey, false);
	assert.ok((localTTS?.voices?.length ?? 0) > 0, 'local-tts should seed voices for offline use');
});

test('every TTS provider declares whether it needs an API key', () => {
	for (const provider of TTS_PROVIDERS) {
		assert.equal(typeof provider.requiresApiKey, 'boolean', `${provider.name} must declare requiresApiKey`);
	}
});
