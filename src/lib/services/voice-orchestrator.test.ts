import test from 'node:test';
import assert from 'node:assert/strict';

// Mock the browser AudioContext before importing the orchestrator.
class MockAudioBufferSourceNode {
	buffer: AudioBuffer | null = null;
	onended: (() => void) | null = null;
	start() {
		// Simulate immediate playback completion on the next tick.
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
	async decodeAudioData(buffer: ArrayBuffer) {
		return this.createBuffer(1, 480, 48000);
	}
	resume() {
		return Promise.resolve();
	}
}

// @ts-expect-error globalThis.AudioContext is not available in Node test environment
globalThis.AudioContext = MockAudioContext;

import { VoiceOrchestrator, type SpeechSegment } from './voice-orchestrator.ts';
import type { TTSOptions } from './tts/index.ts';

const baseOptions: TTSOptions = { provider: 'openai-tts', apiKey: 'test-key' };

function mockFetchResponse() {
	return Promise.resolve({
		ok: true,
		status: 200,
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
	} as Response);
}

function parseBody(init?: RequestInit): Record<string, unknown> {
	if (!init?.body) return {};
	try {
		return JSON.parse(init.body as string) as Record<string, unknown>;
	} catch {
		return {};
	}
}

test('speakSegments plays all segments and fires onSegmentStart for each', async () => {
	const fetchCalls: { url: string; body: Record<string, unknown> }[] = [];
	// @ts-expect-error global fetch mock
	globalThis.fetch = (url: string, init: RequestInit) => {
		fetchCalls.push({ url, body: parseBody(init) });
		return mockFetchResponse();
	};

	const orchestrator = new VoiceOrchestrator();
	const starts: string[] = [];
	const segments: SpeechSegment[] = [
		{ text: 'First sentence.' },
		{ text: 'Second sentence.' }
	];

	let complete = false;
	await orchestrator.speakSegments(segments, baseOptions, {
		onSegmentStart: (seg) => starts.push(seg.text),
		onComplete: () => {
			complete = true;
		}
	});

	assert.equal(fetchCalls.length, 2);
	assert.equal(fetchCalls[0].body.input, 'First sentence.');
	assert.equal(fetchCalls[1].body.input, 'Second sentence.');
	assert.deepEqual(starts, ['First sentence.', 'Second sentence.']);
	assert.equal(complete, true);
});

test('skips empty or punctuation-only segments', async () => {
	globalThis.fetch = () => mockFetchResponse();

	const orchestrator = new VoiceOrchestrator();
	const starts: string[] = [];
	const segments: SpeechSegment[] = [
		{ text: 'Hello.' },
		{ text: '   ' },
		{ text: '!!!' },
		{ text: 'Goodbye.' }
	];

	await orchestrator.speakSegments(segments, baseOptions, {
		onSegmentStart: (seg) => starts.push(seg.text)
	});

	assert.deepEqual(starts, ['Hello.', 'Goodbye.']);
});

test('caps parallel synthesis when the provider declares no limit', async () => {
	let inFlight = 0;
	let maxInFlight = 0;
	globalThis.fetch = async () => {
		inFlight++;
		maxInFlight = Math.max(maxInFlight, inFlight);
		await new Promise((resolve) => setTimeout(resolve, 20));
		inFlight--;
		return {
			ok: true,
			status: 200,
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
		} as Response;
	};

	const orchestrator = new VoiceOrchestrator();
	const segments: SpeechSegment[] = Array.from({ length: 6 }, (_, i) => ({
		text: `Sentence number ${i + 1}.`
	}));

	await orchestrator.speakSegments(segments, baseOptions, {});

	// Cloud providers enforce per-plan concurrency caps (ElevenLabs Free allows 2),
	// so an uncapped fan-out turns an ordinary reply into a 429 storm.
	assert.ok(
		maxInFlight <= 2,
		`expected at most 2 parallel synthesis requests, saw ${maxInFlight}`
	);
});

test('speakSegments rejects when a segment fails so the store can surface it', async () => {
	let call = 0;
	globalThis.fetch = () => {
		call++;
		if (call === 2) {
			return Promise.resolve({
				ok: false,
				status: 429,
				json: () => Promise.reject(new Error('no body'))
			} as unknown as Response);
		}
		return mockFetchResponse();
	};

	const orchestrator = new VoiceOrchestrator();
	const starts: string[] = [];
	const segments: SpeechSegment[] = [{ text: 'One.' }, { text: 'Two.' }, { text: 'Three.' }];

	await assert.rejects(
		orchestrator.speakSegments(segments, baseOptions, {
			onSegmentStart: (seg) => starts.push(seg.text)
		}),
		/429/
	);
	// The surviving segments still play; the failure is reported, not swallowed.
	assert.deepEqual(starts, ['One.', 'Three.']);
});

test('interrupt stops playback and onComplete fires', async () => {
	globalThis.fetch = () => mockFetchResponse();

	const orchestrator = new VoiceOrchestrator();
	let complete = false;

	orchestrator.beginSession(baseOptions, {
		onComplete: () => {
			complete = true;
		}
	});
	orchestrator.pushSegment({ text: 'A long sentence that gets interrupted.' });
	orchestrator.interrupt();

	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(complete, true);
	assert.equal(orchestrator.getIsPlaying(), false);
});

// --- alt-voice language selection ------------------------------------------
// The companion pipeline must not invent a session language. When it is unset
// the orchestrator infers the primary language from the first segment; pinning
// it to 'en' inverts alt-voice selection for every non-English companion.

async function altVoiceTags(sessionLanguage: string | undefined): Promise<(string | undefined)[]> {
	globalThis.fetch = () => mockFetchResponse();

	const orchestrator = new VoiceOrchestrator();
	const tags: (string | undefined)[] = [];

	await orchestrator.speakSegments(
		[
			{ text: 'これはテストです。', language: 'ja' },
			{ text: 'This is a test.', language: 'en' }
		],
		{ ...baseOptions, altVoiceId: 'alt-voice', language: sessionLanguage },
		{ onSegmentStart: (seg) => tags.push(seg.voiceId) }
	);

	return tags;
}

test('infers primary language from the first segment when none is configured', async () => {
	// Japanese leads, so Japanese is primary and only the English line switches.
	assert.deepEqual(await altVoiceTags(undefined), [undefined, 'alt']);
});

test('an explicitly configured primary language overrides inference', async () => {
	// This is why the caller must send undefined rather than a default of 'en':
	// pinning 'en' flips which line is treated as foreign.
	assert.deepEqual(await altVoiceTags('en'), ['alt', undefined]);
	assert.deepEqual(await altVoiceTags('ja'), [undefined, 'alt']);
});
