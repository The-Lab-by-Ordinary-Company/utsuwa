import test from 'node:test';
import assert from 'node:assert/strict';

import { parseResponse } from './response-parser.ts';

test('parses a clean fenced json block', () => {
	const raw = [
		'Hey, good to see you.',
		'```json',
		'{ "mood_change": { "emotion": "happy", "intensity_delta": 5 }, "trust_delta": 3, "new_memory": "They like jazz" }',
		'```'
	].join('\n');
	const { dialogue, stateUpdates } = parseResponse(raw);
	assert.equal(dialogue, 'Hey, good to see you.');
	assert.equal(stateUpdates?.moodChange?.emotion, 'happy');
	assert.equal(stateUpdates?.trustDelta, 3);
	assert.equal(stateUpdates?.newMemory, 'They like jazz');
});

test('strips <think> reasoning so it never reaches dialogue', () => {
	const raw = [
		'<think>The user seems tired. I should be warm. I will set trust up a bit.</think>',
		"I hear you. Let's take it easy tonight.",
		'```json',
		'{ "mood_change": { "emotion": "content", "intensity_delta": 2 }, "comfort_delta": 4 }',
		'```'
	].join('\n');
	const { dialogue, stateUpdates } = parseResponse(raw);
	assert.ok(!dialogue.includes('think'), 'reasoning leaked into dialogue');
	assert.ok(!dialogue.includes('trust up'), 'reasoning leaked into dialogue');
	assert.equal(dialogue, "I hear you. Let's take it easy tonight.");
	assert.equal(stateUpdates?.comfortDelta, 4);
});

test('handles a lone </think> closing tag (opener consumed as a special token)', () => {
	const raw =
		'Okay, weighing how to respond here.</think>That sounds rough, I am glad you told me.\n```json\n{ "mood_change": { "emotion": "sad", "intensity_delta": 3 }, "new_memory": "They had a rough day" }\n```';
	const { dialogue, stateUpdates } = parseResponse(raw);
	assert.equal(dialogue, 'That sounds rough, I am glad you told me.');
	assert.ok(!dialogue.includes('weighing'));
	assert.equal(stateUpdates?.newMemory, 'They had a rough day');
});

test('does not parse json that lives inside a reasoning block', () => {
	const raw =
		'<think>Maybe I should output {"trust_delta": 99} but that is too much.</think>Nice to meet you.\n```json\n{ "mood_change": { "emotion": "curious", "intensity_delta": 2 }, "trust_delta": 2 }\n```';
	const { stateUpdates } = parseResponse(raw);
	assert.equal(stateUpdates?.trustDelta, 2, 'used the real block, not the reasoning one');
});

test('tolerates trailing commas', () => {
	const raw = '```json\n{ "mood_change": { "emotion": "playful", "intensity_delta": 4, }, "affection_delta": 5, }\n```';
	const { stateUpdates } = parseResponse(raw);
	assert.equal(stateUpdates?.moodChange?.emotion, 'playful');
	assert.equal(stateUpdates?.affectionDelta, 5);
});

test('tolerates // and /* */ comments in the json', () => {
	const raw = [
		'```json',
		'{',
		'  "mood_change": { "emotion": "content", "intensity_delta": 1 }, // small lift',
		'  /* relationship barely moved */',
		'  "trust_delta": 1',
		'}',
		'```'
	].join('\n');
	const { stateUpdates } = parseResponse(raw);
	assert.equal(stateUpdates?.moodChange?.emotion, 'content');
	assert.equal(stateUpdates?.trustDelta, 1);
});

test('recovers bare JSON with no code fence', () => {
	const raw =
		'Sure, I can help with that.\n{ "mood_change": { "emotion": "happy", "intensity_delta": 3 }, "new_memory": "They are learning Rust" }';
	const { dialogue, stateUpdates } = parseResponse(raw);
	assert.equal(dialogue, 'Sure, I can help with that.');
	assert.equal(stateUpdates?.newMemory, 'They are learning Rust');
});

test('recovers a memory-only object (no delta keys)', () => {
	const raw = 'Got it.\n```json\n{ "new_memory": "They have a dog named Pixel" }\n```';
	const { stateUpdates } = parseResponse(raw);
	assert.equal(stateUpdates?.newMemory, 'They have a dog named Pixel');
});

test('ignores unrelated JSON the user pasted, with no state block', () => {
	const raw = 'Here is my config: { "theme": "dark", "fontSize": 14 } looks good right?';
	const { dialogue, stateUpdates } = parseResponse(raw);
	assert.equal(stateUpdates, null);
	assert.ok(dialogue.includes('config'));
});

test('returns null state for plain prose', () => {
	const { stateUpdates } = parseResponse('Just a normal reply with no JSON at all.');
	assert.equal(stateUpdates, null);
});
