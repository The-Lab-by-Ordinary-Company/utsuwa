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

import { ElevenLabsTTS } from './elevenlabs.ts';

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

test('fetchAudioBuffer sends the correct request shape', async () => {
	const requests: { url: string; body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (url: string, init: RequestInit) => {
		requests.push({ url, body: parseBody(init) });
		return mockFetchResponse();
	};

	const tts = new ElevenLabsTTS({
		provider: 'elevenlabs',
		apiKey: 'test-key',
		voiceId: 'test-voice',
		model: 'eleven_turbo_v2_5',
		speed: 1.2
	});

	await tts.fetchAudioBuffer('Hello world.');

	assert.equal(requests.length, 1);
	assert.ok(requests[0].url.includes('/text-to-speech/test-voice/stream'));
	assert.equal(requests[0].body.text, 'Hello world.');
	assert.equal(requests[0].body.model_id, 'eleven_turbo_v2_5');
	assert.equal((requests[0].body.voice_settings as Record<string, unknown>).stability, 0.5);
	assert.equal(
		(requests[0].body.voice_settings as Record<string, unknown>).similarity_boost,
		0.75
	);
});

test('speak returns a source and analyser', async () => {
	globalThis.fetch = () => mockFetchResponse();

	const tts = new ElevenLabsTTS({
		provider: 'elevenlabs',
		apiKey: 'test-key'
	});

	const result = await tts.speak('Hello world.');
	assert.ok(result.source);
	assert.ok(result.analyser);
});

test('speak applies client-side speed via playbackRate', async () => {
	globalThis.fetch = () => mockFetchResponse();

	const tts = new ElevenLabsTTS({
		provider: 'elevenlabs',
		apiKey: 'test-key',
		speed: 1.3
	});

	const result = await tts.speak('Hello world.');
	assert.equal((result.source as unknown as { playbackRate: { value: number } }).playbackRate.value, 1.3);
});
