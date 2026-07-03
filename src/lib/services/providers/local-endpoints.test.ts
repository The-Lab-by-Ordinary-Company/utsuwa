import test from 'node:test';
import assert from 'node:assert/strict';

import {
	getChatBaseUrl,
	getModelsBaseUrl,
	isLocalLLMProvider,
	getLocalProviderConnectionHint,
	isLocalTTSProvider,
	getTTSBaseUrl,
	getLocalTTSConnectionHint,
	isLocalSTTProvider,
	getSTTBaseUrl,
	getLocalSTTConnectionHint
} from './local-endpoints.ts';

test('identifies local STT providers', () => {
	assert.equal(isLocalSTTProvider('local-stt'), true);
	assert.equal(isLocalSTTProvider('groq-stt'), false);
});

test('local STT base URL is normalized to end in /v1', () => {
	assert.equal(getSTTBaseUrl('local-stt', 'http://localhost:8000'), 'http://localhost:8000/v1');
	assert.equal(getSTTBaseUrl('local-stt', 'http://localhost:8000/'), 'http://localhost:8000/v1');
	assert.equal(getSTTBaseUrl('local-stt', 'http://localhost:8000/v1'), 'http://localhost:8000/v1');
	// Falls back to the default when no base URL is given
	assert.equal(getSTTBaseUrl('local-stt'), 'http://localhost:8000/v1');
});

test('cloud STT base URL is only trimmed, not path-normalized', () => {
	assert.equal(
		getSTTBaseUrl('groq-stt', 'https://api.groq.com/openai/v1/'),
		'https://api.groq.com/openai/v1'
	);
});

test('local STT connection hint names the endpoint and origin', () => {
	const hint = getLocalSTTConnectionHint('http://localhost:8000/v1', 'https://utsuwa.ai');
	assert.match(hint, /audio\/transcriptions/);
	assert.match(hint, /utsuwa\.ai/);
});

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

test('identifies local TTS providers', () => {
	assert.equal(isLocalTTSProvider('local-tts'), true);
	assert.equal(isLocalTTSProvider('openai-tts'), false);
	assert.equal(isLocalTTSProvider('elevenlabs'), false);
});

test('normalizes local TTS base URL to a trailing-slash /v1 path', () => {
	// OpenAI-compatible clients append "audio/speech", so the base must end in /v1/
	assert.equal(getTTSBaseUrl('local-tts', 'http://localhost:8880'), 'http://localhost:8880/v1/');
	assert.equal(getTTSBaseUrl('local-tts', 'http://localhost:8880/'), 'http://localhost:8880/v1/');
	assert.equal(getTTSBaseUrl('local-tts', 'http://localhost:8880/v1'), 'http://localhost:8880/v1/');
	assert.equal(getTTSBaseUrl('local-tts', 'http://localhost:8880/v1/'), 'http://localhost:8880/v1/');
	assert.equal(getTTSBaseUrl('local-tts'), 'http://localhost:8880/v1/');
});

test('provides local TTS troubleshooting hint with CORS guidance', () => {
	const hint = getLocalTTSConnectionHint('http://localhost:8880');
	assert.match(hint, /audio\/speech/);
	assert.match(hint, /CORS/);
	assert.match(
		getLocalTTSConnectionHint('http://localhost:8880', 'https://utsuwa.app'),
		/https:\/\/utsuwa\.app/
	);
});
