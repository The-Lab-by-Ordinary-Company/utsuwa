import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTranscriptionRequest, type OpenAiSttConfig } from './openai-stt.ts';

function formToObject(form: FormData): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of form.entries()) out[k] = v;
	return out;
}

const audio = new Blob(['fake-audio'], { type: 'audio/webm' });

test('posts to {base}/audio/transcriptions with the model and file', () => {
	const config: OpenAiSttConfig = {
		baseUrl: 'https://api.groq.com/openai/v1',
		model: 'whisper-large-v3-turbo',
		apiKey: 'gsk_test',
		label: 'Groq'
	};
	const req = buildTranscriptionRequest(config, audio, 'recording.webm');
	assert.equal(req.url, 'https://api.groq.com/openai/v1/audio/transcriptions');
	const fields = formToObject(req.body);
	assert.equal(fields.model, 'whisper-large-v3-turbo');
	assert.ok(fields.file, 'file part present');
	assert.equal(req.headers.Authorization, 'Bearer gsk_test');
});

test('trailing slashes on the base URL are trimmed', () => {
	const req = buildTranscriptionRequest(
		{ baseUrl: 'http://localhost:8000/v1///', model: 'whisper-1', label: 'the local STT server' },
		audio,
		'recording.m4a'
	);
	assert.equal(req.url, 'http://localhost:8000/v1/audio/transcriptions');
});

test('no Authorization header is sent when there is no API key (local servers)', () => {
	const req = buildTranscriptionRequest(
		{ baseUrl: 'http://localhost:8000/v1', model: 'Systran/faster-whisper-large-v3', label: 'the local STT server' },
		audio,
		'recording.m4a'
	);
	assert.equal(req.headers.Authorization, undefined);
	assert.equal(Object.keys(req.headers).length, 0);
	assert.equal(formToObject(req.body).model, 'Systran/faster-whisper-large-v3');
});
