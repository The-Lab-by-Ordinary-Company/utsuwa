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

// --- OmniVoice, served by this same client since the fold in #141 ---

test('fetchAudioBuffer sends WAV request with base fields and no API key', async () => {
	const requests: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (url: string, init: RequestInit) => {
		requests.push({ url, body: parseBody(init), headers: init.headers as Record<string, string> });
		return mockFetchResponse();
	};

	const tts = new OpenAITTS({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'de',
		speed: 1.2
	});

	await tts.fetchAudioBuffer('Hallo Welt.');

	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, 'http://localhost:8881/v1/audio/speech');
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

	const tts = new OpenAITTS({
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

	const tts = new OpenAITTS({
		provider: 'omnivoice'
	});

	const result = await tts.speak('Hello world.');
	assert.ok(result.source);
	assert.ok(result.analyser);
});

test('connection error surfaces a local OmniVoice hint', async () => {
	globalThis.fetch = () => Promise.reject(new Error('Failed to fetch'));

	const tts = new OpenAITTS({
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

	const tts = new OpenAITTS({
		provider: 'omnivoice'
	});

	await assert.rejects(tts.fetchAudioBuffer('Hello.'), /OmniVoice error 400: bad request/);
});

test('OmniVoice keeps its own hint when a plain local server would not', async () => {
	// omnivoice is in LOCAL_TTS_PROVIDERS, so a bare isLocal check would wrongly
	// hand it the local-tts messages. Guard the two apart explicitly.
	globalThis.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
	await assert.rejects(
		() => new OpenAITTS({ provider: 'omnivoice' }).fetchAudioBuffer('x'),
		/OmniVoice proxy/
	);
	await assert.rejects(
		() => new OpenAITTS({ provider: 'local-tts' }).fetchAudioBuffer('x'),
		/local TTS server/i
	);

	globalThis.fetch = () =>
		Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) } as Response);
	await assert.rejects(
		() => new OpenAITTS({ provider: 'omnivoice' }).fetchAudioBuffer('x'),
		/OmniVoice error 400/
	);
	await assert.rejects(
		() => new OpenAITTS({ provider: 'local-tts' }).fetchAudioBuffer('x'),
		/Local TTS server returned 400/
	);
});

test('fetchAudioBuffer includes OmniVoice advanced parameters when set', async () => {
	const requests: { body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (_url: string, init: RequestInit) => {
		requests.push({ body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new OpenAITTS({
		provider: 'omnivoice',
		voiceId: 'alloy',
		instructions: 'female, young adult, moderate pitch, american accent',
		numStep: 16,
		positionTemperature: 0.8,
		classTemperature: 0.4
	});

	await tts.fetchAudioBuffer('Hello.');

	assert.equal(requests[0].body.instructions, 'female, young adult, moderate pitch, american accent');
	assert.equal(requests[0].body.num_step, 16);
	assert.equal(requests[0].body.position_temperature, 0.8);
	assert.equal(requests[0].body.class_temperature, 0.4);
});

test('fetchAudioBuffer omits instructions for cloned OmniVoice voices', async () => {
	const requests: { body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (_url: string, init: RequestInit) => {
		requests.push({ body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new OpenAITTS({
		provider: 'omnivoice',
		voiceId: 'clone:my_voice',
		instructions: 'female, young adult, moderate pitch, american accent'
	});

	await tts.fetchAudioBuffer('Hello.');

	assert.equal('instructions' in requests[0].body, false);
});

test('fetchAudioBuffer treats near-empty WAV responses as silence instead of throwing', async () => {
	// OmniVoice returns header-plus-a-few-samples WAVs for very short inputs;
	// decodeAudioData can reject those. The client must not surface a decode
	// error for them.
	let decodeCalled = 0;
	const tts = new OpenAITTS({ provider: 'omnivoice' });
	const ctx = tts.getAudioContext() as unknown as MockAudioContext;
	ctx.decodeAudioData = async () => {
		decodeCalled++;
		return ctx.createBuffer(1, 48000, 48000);
	};

	globalThis.fetch = () =>
		Promise.resolve({
			ok: true,
			status: 200,
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(80))
		} as Response);

	const buffer = await tts.fetchAudioBuffer('es');
	assert.ok(buffer);
	assert.equal(decodeCalled, 0);

	// A normal-size response still goes through decodeAudioData.
	globalThis.fetch = () =>
		Promise.resolve({
			ok: true,
			status: 200,
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(95120))
		} as Response);
	await tts.fetchAudioBuffer('Hallo Welt.');
	assert.equal(decodeCalled, 1);
});
