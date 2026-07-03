import test from 'node:test';
import assert from 'node:assert/strict';

import { partitionNewRecords, factKey, sessionKey, turnKey, eventKey } from './import-dedup.ts';

// --- key functions ---

test('factKey distinguishes by category and content', () => {
	assert.equal(factKey({ category: 'user', content: 'likes tea' }), 'user|likes tea');
	assert.notEqual(
		factKey({ category: 'user', content: 'a' }),
		factKey({ category: 'relationship', content: 'a' })
	);
});

test('date-based keys normalize Date objects and ISO strings to the same value', () => {
	const iso = '2026-07-03T12:00:00.000Z';
	const date = new Date(iso);
	assert.equal(sessionKey({ startedAt: iso }), sessionKey({ startedAt: date }));
	assert.equal(
		turnKey({ createdAt: iso, role: 'user', content: 'hi' }),
		turnKey({ createdAt: date, role: 'user', content: 'hi' })
	);
	assert.equal(
		eventKey({ eventId: 'confession_event', completedAt: iso }),
		eventKey({ eventId: 'confession_event', completedAt: date })
	);
});

test('missing dates produce a stable empty key rather than NaN', () => {
	assert.equal(sessionKey({}), '');
	assert.equal(turnKey({ role: 'user', content: 'x' }), '|user|x');
});

// --- partitionNewRecords (the merge dedup) ---

test('with no existing keys, all unique records are added', () => {
	const recs = [{ content: 'a' }, { content: 'b' }, { content: 'c' }];
	const { toAdd, skipped } = partitionNewRecords(recs, (r) => r.content, new Set());
	assert.equal(toAdd.length, 3);
	assert.equal(skipped, 0);
});

test('regression: re-importing records already present adds nothing', () => {
	const recs = [
		{ category: 'user', content: 'a' },
		{ category: 'user', content: 'b' }
	];
	const existing = new Set(recs.map(factKey));
	const { toAdd, skipped } = partitionNewRecords(recs, factKey, existing);
	assert.equal(toAdd.length, 0);
	assert.equal(skipped, 2);
});

test('duplicates within the same batch are only added once', () => {
	const recs = [
		{ category: 'user', content: 'a' },
		{ category: 'user', content: 'a' },
		{ category: 'user', content: 'b' }
	];
	const { toAdd, skipped } = partitionNewRecords(recs, factKey, new Set());
	assert.equal(toAdd.length, 2);
	assert.equal(skipped, 1);
});

test('mixed present-and-new: only the new records are added', () => {
	const recs = [
		{ category: 'user', content: 'old' },
		{ category: 'user', content: 'new' }
	];
	const existing = new Set([factKey({ category: 'user', content: 'old' })]);
	const { toAdd, skipped } = partitionNewRecords(recs, factKey, existing);
	assert.deepEqual(
		toAdd.map((r) => r.content),
		['new']
	);
	assert.equal(skipped, 1);
});
