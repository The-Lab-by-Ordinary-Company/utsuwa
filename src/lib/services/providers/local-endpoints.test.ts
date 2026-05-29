import test from 'node:test';
import assert from 'node:assert/strict';

import {
	getChatBaseUrl,
	getModelsBaseUrl,
	isLocalLLMProvider,
	getLocalProviderConnectionHint
} from './local-endpoints.ts';

test('identifies local LLM providers', () => {
	assert.equal(isLocalLLMProvider('ollama'), true);
	assert.equal(isLocalLLMProvider('lmstudio'), true);
	assert.equal(isLocalLLMProvider('openai'), false);
});

test('normalizes Ollama root URL to OpenAI-compatible chat URL', () => {
	assert.equal(getChatBaseUrl('ollama', 'http://localhost:11434'), 'http://localhost:11434/v1');
	assert.equal(getChatBaseUrl('ollama', 'http://localhost:11434/'), 'http://localhost:11434/v1');
	assert.equal(getChatBaseUrl('ollama', 'http://localhost:11434/v1'), 'http://localhost:11434/v1');
});

test('normalizes Ollama model-list URL to the Ollama API root', () => {
	assert.equal(getModelsBaseUrl('ollama', 'http://localhost:11434/v1'), 'http://localhost:11434');
	assert.equal(getModelsBaseUrl('ollama'), 'http://localhost:11434');
});

test('normalizes LM Studio root URL to OpenAI-compatible v1 URL', () => {
	assert.equal(getChatBaseUrl('lmstudio', 'http://localhost:1234'), 'http://localhost:1234/v1');
	assert.equal(getModelsBaseUrl('lmstudio', 'http://localhost:1234'), 'http://localhost:1234/v1');
	assert.equal(getChatBaseUrl('lmstudio', 'http://localhost:1234/v1'), 'http://localhost:1234/v1');
});

test('provides local provider troubleshooting hints', () => {
	assert.match(getLocalProviderConnectionHint('ollama', 'http://localhost:11434'), /ollama serve/);
	assert.match(
		getLocalProviderConnectionHint(
			'ollama',
			'http://localhost:11434',
			'https://utsuwa-git-fix-ollama-local-provider.vercel.app'
		),
		/OLLAMA_ORIGINS="https:\/\/utsuwa-git-fix-ollama-local-provider\.vercel\.app"/
	);
	assert.match(
		getLocalProviderConnectionHint('ollama', 'http://localhost:11434'),
		/docs\.ollama\.com\/faq#how-can-i-allow-additional-web-origins-to-access-ollama/
	);
	assert.match(getLocalProviderConnectionHint('lmstudio', 'http://localhost:1234/v1'), /Start Server/);
});
