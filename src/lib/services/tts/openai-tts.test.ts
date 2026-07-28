import test from 'node:test';
import assert from 'node:assert/strict';

class MockAudioBufferSourceNode {
	buffer: AudioBuffer | null = null;
	onended: (() => void) | null = null;
	playbackRate = { value: 1 };
	start() {
		setImmediate(() => this.onended?.());
	}
	stop() {}
	connect() {
		return this;
	}
	disconnect() {}
}

class MockAnalyserNode {
	fftSize = 256;
	connect() {
		return this;
	}
	disconnect() {}
	getByteFrequencyData() {}
}

class MockAudioContext {
	state = 'running';
	currentTime = 0;
	destination = {};
	createBufferSource() {
		return new MockAudioBufferSourceNode() as unknown as AudioBufferSourceNode;
	}
	createAnalyser() {
		return new MockAnalyserNode() as unknown as AnalyserNode;
	}
	createBuffer(numChannels: number, length: number, sampleRate: number) {
		return {
			duration: length / sampleRate,
			getChannelData: () => new Float32Array(length),
			numberOfChannels: numChannels,
			sampleRate,
			length
		} as unknown as AudioBuffer;
	}
	async decodeAudioData() {
		return this.createBuffer(1, 480, 48000);
	}
	resume() {
		return Promise.resolve();
	}
}

// @ts-expect-error globalThis.AudioContext is not available in Node test environment
globalThis.AudioContext = MockAudioContext;

import { OpenAITTS } from './openai-tts.ts';

function parseBody(init?: RequestInit): Record<string, unknown> {
	if (!init?.body) return {};
	try {
		return JSON.parse(init.body as string) as Record<string, unknown>;
	} catch {
		return {};
	}
}

function mockFetchResponse() {
	return Promise.resolve({
		ok: true,
		status: 200,
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
	} as Response);
}

test('OpenAI TTS request body remains unchanged (regression)', async () => {
	const requests: { url: string; body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (url: string, init: RequestInit) => {
		requests.push({ url, body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new OpenAITTS({
		provider: 'openai-tts',
		apiKey: 'test-key',
		voiceId: 'nova',
		model: 'tts-1-hd',
		speed: 1.15
	});

	await tts.fetchAudioBuffer('Hello world.');

	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, 'https://api.openai.com/v1/audio/speech');
	assert.equal(requests[0].body.model, 'tts-1-hd');
	assert.equal(requests[0].body.input, 'Hello world.');
	assert.equal(requests[0].body.voice, 'nova');
	assert.equal(requests[0].body.speed, 1.15);
	assert.equal(requests[0].body.response_format, 'mp3');
	// Key must be absent, not merely undefined: OmniVoice shares this client.
	assert.equal('language' in requests[0].body, false);
});

test('Local TTS request body remains unchanged and uses mp3 format (regression)', async () => {
	const requests: { body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (_url: string, init: RequestInit) => {
		requests.push({ body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new OpenAITTS({
		provider: 'local-tts',
		baseUrl: 'http://localhost:8880/v1',
		voiceId: 'af_bella',
		model: 'kokoro',
		speed: 1.0
	});

	await tts.fetchAudioBuffer('Hello world.');

	assert.equal(requests[0].body.model, 'kokoro');
	assert.equal(requests[0].body.voice, 'af_bella');
	assert.equal(requests[0].body.response_format, 'mp3');
	assert.equal(requests[0].body.speed, 1.0);
	assert.equal('language' in requests[0].body, false);
});

test('Local TTS keeps its own connection hint and HTTP error message', async () => {
	globalThis.fetch = () => Promise.reject(new TypeError('Failed to fetch'));

	const tts = new OpenAITTS({ provider: 'local-tts', baseUrl: 'http://localhost:8880/v1' });
	await assert.rejects(() => tts.fetchAudioBuffer('Hi.'), /local TTS server/i);

	globalThis.fetch = () =>
		Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);

	await assert.rejects(
		() => tts.fetchAudioBuffer('Hi.'),
		/Local TTS server returned 404 at http:\/\/localhost:8880\/v1\//
	);
});

test('Hosted OpenAI TTS rethrows network errors and uses the OpenAI error label', async () => {
	const networkError = new TypeError('Failed to fetch');
	globalThis.fetch = () => Promise.reject(networkError);

	const tts = new OpenAITTS({ provider: 'openai-tts', apiKey: 'k' });
	// Hosted OpenAI must rethrow the original error, not a local-server hint.
	await assert.rejects(() => tts.fetchAudioBuffer('Hi.'), (err) => err === networkError);

	globalThis.fetch = () =>
		Promise.resolve({
			ok: false,
			status: 401,
			json: () => Promise.resolve({ error: { message: 'bad key' } })
		} as Response);

	await assert.rejects(() => tts.fetchAudioBuffer('Hi.'), /OpenAI TTS/);
});

test('sends Authorization only when an API key is present', async () => {
	const seen: (Record<string, string> | undefined)[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (_url: string, init: RequestInit) => {
		seen.push(init.headers as Record<string, string>);
		return mockFetchResponse();
	};

	await new OpenAITTS({ provider: 'openai-tts', apiKey: 'secret' }).fetchAudioBuffer('a');
	await new OpenAITTS({ provider: 'local-tts' }).fetchAudioBuffer('b');

	assert.equal(seen[0]?.Authorization, 'Bearer secret');
	assert.equal('Authorization' in (seen[1] ?? {}), false);
});
