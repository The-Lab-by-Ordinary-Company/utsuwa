import test from 'node:test';
import assert from 'node:assert/strict';

import { StreamingSpeechBuffer } from './streaming-speech-buffer.ts';

function createBuffer() {
	const segments: { text: string; language?: string }[] = [];
	const buffer = new StreamingSpeechBuffer({
		defaultLanguage: 'en',
		onSegment: (seg) => segments.push(seg)
	});
	return { buffer, segments };
}

test('emits a complete sentence immediately', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello world.');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello world.');
});

test('emits multiple sentences from one chunk', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('First sentence. Second sentence.');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, 'First sentence.');
	assert.equal(segments[1].text, 'Second sentence.');
});

test('buffers partial sentences until a terminator arrives', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello ');
	assert.equal(segments.length, 0);
	buffer.feed('world.');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello world.');
});

test('flushes remaining text without a terminator', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('No terminator here');
	assert.equal(segments.length, 0);
	buffer.flush();
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'No terminator here');
});

test('splits at paragraph breaks', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Paragraph one.\n\nParagraph two.');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, 'Paragraph one.');
	assert.equal(segments[1].text, 'Paragraph two.');
});

test('does not emit while inside an open JSON block', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello. {"mood_change":');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello.');
	buffer.feed('{"emotion":"happy"}} Goodbye.');
	assert.equal(segments.length, 2);
	assert.equal(segments[1].text, 'Goodbye.');
});

test('reset clears pending text', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Pending');
	buffer.reset();
	buffer.flush();
	assert.equal(segments.length, 0);
});

test('skips segments containing only punctuation and whitespace', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('   ');
	buffer.flush();
	assert.equal(segments.length, 0);
});
