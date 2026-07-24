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

import { getTTSProvider } from './index.ts';
import { OmniVoiceTTS } from './omnivoice.ts';
import { OpenAITTS } from './openai-tts.ts';
import { ElevenLabsTTS } from './elevenlabs.ts';

function mockFetchResponse() {
	return Promise.resolve({
		ok: true,
		status: 200,
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
	} as Response);
}

globalThis.fetch = () => mockFetchResponse();

test('factory returns OmniVoiceTTS for omnivoice provider', () => {
	const provider = getTTSProvider({ provider: 'omnivoice' });
	assert.ok(provider instanceof OmniVoiceTTS);
});

test('factory returns OpenAITTS for openai-tts and local-tts providers', () => {
	assert.ok(getTTSProvider({ provider: 'openai-tts' }) instanceof OpenAITTS);
	assert.ok(getTTSProvider({ provider: 'local-tts' }) instanceof OpenAITTS);
});

test('factory returns ElevenLabsTTS for elevenlabs provider', () => {
	assert.ok(getTTSProvider({ provider: 'elevenlabs' }) instanceof ElevenLabsTTS);
});

test('factory reuses OmniVoice provider when only unrelated fields differ', () => {
	const first = getTTSProvider({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'de',
		speed: 1.0
	});
	const second = getTTSProvider({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'de',
		speed: 1.0
	});
	assert.equal(first, second);
});

test('factory creates new OmniVoice provider when language changes', () => {
	const first = getTTSProvider({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'de',
		speed: 1.0
	});
	const second = getTTSProvider({
		provider: 'omnivoice',
		voiceId: 'alloy',
		language: 'es',
		speed: 1.0
	});
	assert.notEqual(first, second);
});
