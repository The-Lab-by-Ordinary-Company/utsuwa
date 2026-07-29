import test from 'node:test';
import assert from 'node:assert/strict';
import {
	selectDefaultModel,
	isProviderReadyForFetch,
	createFetchSignature,
	buildInstructions,
	parseInstructions,
	DEFAULT_OMNI_VOICE_DESIGN
} from './ai-services-settings-logic.ts';
import type { ProviderMetadata } from '$lib/services/providers/registry';
import type { ProviderConfig } from '$lib/types';

const mockModel = (id: string, name = id): { id: string; name: string } => ({ id, name });

const cloudProvider: ProviderMetadata = {
	id: 'openai',
	name: 'OpenAI',
	category: 'llm',
	requiresApiKey: true,
	defaultBaseUrl: 'https://api.openai.com/v1/'
} as ProviderMetadata;

const localProvider: ProviderMetadata = {
	id: 'ollama',
	name: 'Ollama',
	category: 'llm',
	isLocal: true,
	requiresApiKey: false,
	defaultBaseUrl: 'http://localhost:11434/v1/'
} as ProviderMetadata;

const customProvider: ProviderMetadata = {
	id: 'custom-endpoint',
	name: 'Custom Endpoint',
	category: 'llm',
	custom: true,
	requiresApiKey: false
} as ProviderMetadata;

test('selectDefaultModel preserves current selection when it exists', () => {
	const models = [mockModel('a'), mockModel('b'), mockModel('c')];
	assert.equal(selectDefaultModel(models, 'b'), 'b');
});

test('selectDefaultModel falls back to first model when current is missing', () => {
	const models = [mockModel('a'), mockModel('b')];
	assert.equal(selectDefaultModel(models, 'z'), 'a');
});

test('selectDefaultModel falls back to first model when current is empty', () => {
	const models = [mockModel('a'), mockModel('b')];
	assert.equal(selectDefaultModel(models, ''), 'a');
});

test('selectDefaultModel preserves current selection when list is empty', () => {
	assert.equal(selectDefaultModel([], 'my-model'), 'my-model');
});

test('isProviderReadyForFetch requires API key for cloud providers', () => {
	assert.equal(isProviderReadyForFetch(cloudProvider, {}), false);
	assert.equal(isProviderReadyForFetch(cloudProvider, { apiKey: 'key' }), true);
});

test('isProviderReadyForFetch is always true for local providers', () => {
	assert.equal(isProviderReadyForFetch(localProvider, {}), true);
	assert.equal(isProviderReadyForFetch(localProvider, { apiKey: 'key' }), true);
});

test('isProviderReadyForFetch requires base URL for custom endpoints', () => {
	assert.equal(isProviderReadyForFetch(customProvider, {}), false);
	assert.equal(isProviderReadyForFetch(customProvider, { apiKey: 'key' }), false);
	assert.equal(isProviderReadyForFetch(customProvider, { baseUrl: 'http://localhost/v1' }), true);
});

test('createFetchSignature is stable for same inputs', () => {
	assert.equal(createFetchSignature('ollama', 'http://localhost:11434'), 'ollama:http://localhost:11434');
	assert.equal(createFetchSignature('ollama', undefined), 'ollama:');
});

test('createFetchSignature distinguishes different endpoints', () => {
	const a = createFetchSignature('ollama', 'http://a:11434');
	const b = createFetchSignature('ollama', 'http://b:11434');
	assert.notEqual(a, b);
});

test('buildInstructions produces the expected OmniVoice instruction string', () => {
	assert.equal(
		buildInstructions('female', 'young adult', 'moderate', 'american'),
		'female, young adult, moderate pitch, american accent'
	);
});

test('buildInstructions omits neutral accent', () => {
	assert.equal(
		buildInstructions('male', 'middle-aged', 'low', 'neutral'),
		'male, middle-aged, low pitch'
	);
});

test('parseInstructions falls back to defaults for empty strings', () => {
	assert.deepEqual(parseInstructions(''), DEFAULT_OMNI_VOICE_DESIGN);
});

test('parseInstructions extracts all design attributes', () => {
	assert.deepEqual(parseInstructions('male, elderly, very low pitch, british accent'), {
		gender: 'male',
		age: 'elderly',
		pitch: 'very low',
		accent: 'british'
	});
});

test('parseInstructions ignores unsupported accent values', () => {
	assert.deepEqual(parseInstructions('female, young adult, high pitch, martian accent'), {
		gender: 'female',
		age: 'young adult',
		pitch: 'high',
		accent: DEFAULT_OMNI_VOICE_DESIGN.accent
	});
});
