import test from 'node:test';
import assert from 'node:assert/strict';

import { LLM_PROVIDERS } from './registry.ts';

test('local LLM providers rely on discovered installed models', () => {
	const localProviders = LLM_PROVIDERS.filter((provider) => provider.isLocal);

	assert.ok(localProviders.length > 0);
	for (const provider of localProviders) {
		assert.deepEqual(provider.models ?? [], [], `${provider.name} should not expose static model choices`);
	}
});
