import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultVoiceForProvider, providerErrorMessage } from './provider-utils.ts';

// --- defaultVoiceForProvider ---

test('returns the first declared voice for a provider', () => {
	const provider = { voices: [{ id: '21m00Tcm4TlvDq8ikWAM' }, { id: 'EXAVITQu4vr4xnSDxMaL' }] };
	assert.equal(defaultVoiceForProvider(provider), '21m00Tcm4TlvDq8ikWAM');
});

test('returns empty for providers without declared voices, so the provider default applies', () => {
	assert.equal(defaultVoiceForProvider({}), '');
	assert.equal(defaultVoiceForProvider({ voices: [] }), '');
	assert.equal(defaultVoiceForProvider(undefined), '');
	assert.equal(defaultVoiceForProvider(null), '');
});

// --- providerErrorMessage ---

test('extracts the ElevenLabs detail shape', () => {
	const body = {
		detail: { type: 'not_found', code: 'voice_not_found', message: "A voice with voice_id 'af_bella' was not found.", status: 'voice_not_found' }
	};
	assert.equal(
		providerErrorMessage('ElevenLabs', 404, body),
		"ElevenLabs error 404: A voice with voice_id 'af_bella' was not found."
	);
});

test('extracts the OpenAI error shape', () => {
	const body = { error: { message: 'Invalid voice: bella-af', type: 'invalid_request_error' } };
	assert.equal(providerErrorMessage('OpenAI TTS', 400, body), 'OpenAI TTS error 400: Invalid voice: bella-af');
});

test('falls back to a generic message field, a string body, or status only', () => {
	assert.equal(providerErrorMessage('TTS', 500, { message: 'boom' }), 'TTS error 500: boom');
	assert.equal(providerErrorMessage('TTS', 502, 'Bad gateway'), 'TTS error 502: Bad gateway');
	assert.equal(providerErrorMessage('TTS', 429), 'TTS error 429');
	assert.equal(providerErrorMessage('TTS', 401, {}), 'TTS error 401');
});

test('long details are truncated so toasts stay readable', () => {
	const message = providerErrorMessage('TTS', 400, { message: 'x'.repeat(500) });
	assert.ok(message.length <= 'TTS error 400: '.length + 160);
});
