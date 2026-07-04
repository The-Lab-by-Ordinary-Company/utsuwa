import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeTurns } from './session-summary.ts';

type Turn = { role: 'user' | 'assistant'; content: string };

test('empty session yields empty summary', () => {
	assert.deepEqual(summarizeTurns([]), { summary: '', keyTopics: [], emotionalArc: '' });
});

test('assistant-only turns yield empty summary (topics come from the user)', () => {
	const turns: Turn[] = [{ role: 'assistant', content: 'Hello there, how are you feeling today?' }];
	assert.equal(summarizeTurns(turns).summary, '');
});

test('extracts frequent topics from user turns and phrases a summary', () => {
	const turns: Turn[] = [
		{ role: 'user', content: 'I adopted a puppy this weekend! The puppy is so playful.' },
		{ role: 'assistant', content: 'A puppy! Tell me more.' },
		{ role: 'user', content: 'We went hiking with the puppy near the mountains.' }
	];
	const result = summarizeTurns(turns);
	assert.ok(result.keyTopics.includes('puppy'), 'puppy is the dominant topic');
	assert.ok(result.summary.startsWith('You talked about'), 'phrased summary');
	assert.ok(result.summary.includes('puppy'));
});

test('stopwords and short words are excluded from topics', () => {
	const turns: Turn[] = [
		{ role: 'user', content: 'I think that you are so nice and I really like you a lot today' }
	];
	const result = summarizeTurns(turns);
	for (const banned of ['think', 'that', 'you', 'nice', 'really', 'like', 'today']) {
		assert.ok(!result.keyTopics.includes(banned), `${banned} should be filtered out`);
	}
});

test('falls back to a trimmed first message when there are too few topics', () => {
	const turns: Turn[] = [{ role: 'user', content: 'hey there' }];
	const result = summarizeTurns(turns);
	// no strong topics -> fall back to the first user message verbatim
	assert.equal(result.summary, 'hey there');
});

test('long fallback message is truncated with an ellipsis', () => {
	const long = 'x'.repeat(200);
	const turns: Turn[] = [{ role: 'user', content: long }];
	const result = summarizeTurns(turns);
	assert.ok(result.summary.endsWith('…'));
	assert.ok(result.summary.length <= 118);
});
