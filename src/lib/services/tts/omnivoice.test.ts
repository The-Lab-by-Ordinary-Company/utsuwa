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

import { OmniVoiceTTS } from './omnivoice.ts';

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

test('fetchAudioBuffer sends WAV request with base fields and no API key', async () => {
	const requests: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (url: string, init: RequestInit) => {
		requests.push({ url, body: parseBody(init), headers: init.headers as Record<string, string> });
		return mockFetchResponse();
	};

	const tts = new OmniVoiceTTS({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'de',
		speed: 1.2
	});

	await tts.fetchAudioBuffer('Hallo Welt.');

	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, 'http://localhost:8880/v1/audio/speech');
	assert.equal(requests[0].body.model, 'omnivoice');
	assert.equal(requests[0].body.input, 'Hallo Welt.');
	assert.equal(requests[0].body.voice, 'alloy');
	assert.equal(requests[0].body.language, 'de');
	assert.equal(requests[0].body.speed, 1.2);
	assert.equal(requests[0].body.response_format, 'wav');
	assert.equal('Authorization' in requests[0].headers, false);
});

test('fetchAudioBuffer overrides language and speed from stream options', async () => {
	const requests: { body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (_url: string, init: RequestInit) => {
		requests.push({ body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new OmniVoiceTTS({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'en',
		speed: 1.0
	});

	await tts.fetchAudioBuffer('Hello.', { language: 'es', speed: 0.9 });

	assert.equal(requests[0].body.language, 'es');
	assert.equal(requests[0].body.speed, 0.9);
});

test('speak returns a source and analyser', async () => {
	globalThis.fetch = () => mockFetchResponse();

	const tts = new OmniVoiceTTS({
		provider: 'omnivoice'
	});

	const result = await tts.speak('Hello world.');
	assert.ok(result.source);
	assert.ok(result.analyser);
});

test('connection error surfaces a local OmniVoice hint', async () => {
	globalThis.fetch = () => Promise.reject(new Error('Failed to fetch'));

	const tts = new OmniVoiceTTS({
		provider: 'omnivoice',
		baseUrl: 'http://localhost:8880/v1'
	});

	await assert.rejects(tts.fetchAudioBuffer('Hello.'), /OmniVoice proxy/);
});

test('HTTP error surfaces providerErrorMessage-style detail', async () => {
	globalThis.fetch = () =>
		Promise.resolve({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: { message: 'bad request' } })
		} as Response);

	const tts = new OmniVoiceTTS({
		provider: 'omnivoice'
	});

	await assert.rejects(tts.fetchAudioBuffer('Hello.'), /OmniVoice error 400: bad request/);
});
