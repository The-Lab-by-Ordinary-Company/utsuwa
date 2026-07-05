import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeCharacterStates } from './character-merge.ts';
import type { CharacterState } from '$lib/types/character';

// A day of progress in the main window: markers earned, streak kept alive
const persisted = {
	affection: 250,
	trust: 60,
	energy: 40,
	completedEvents: ['first_deep_conversation', 'confession_event', 'confession_accepted'],
	totalInteractions: 120,
	daysKnown: 30,
	currentStreak: 7,
	longestStreak: 7,
	streakLastDate: '2026-07-03',
	firstMet: new Date('2026-06-01T10:00:00Z'),
	createdAt: new Date('2026-06-01T10:00:00Z'),
	lastInteraction: new Date('2026-07-03T18:00:00Z'),
	lastDecayAt: new Date('2026-07-02T09:00:00Z'),
	updatedAt: new Date('2026-07-03T18:00:00Z')
} as unknown as CharacterState;

// What the overlay window still holds: its snapshot from this morning's boot
const staleSnapshot = {
	affection: 12,
	trust: 5,
	energy: 95,
	completedEvents: ['first_deep_conversation'],
	totalInteractions: 20,
	daysKnown: 29,
	currentStreak: 6,
	longestStreak: 6,
	streakLastDate: '2026-07-02',
	firstMet: new Date('2026-06-01T10:00:00Z'),
	createdAt: new Date('2026-06-01T10:00:00Z'),
	lastInteraction: new Date('2026-07-03T08:00:00Z'),
	lastDecayAt: null,
	updatedAt: new Date('2026-07-03T19:00:00Z')
} as unknown as CharacterState;

test('a stale snapshot cannot erase completed-event markers it never saw', () => {
	const merged = mergeCharacterStates(persisted, staleSnapshot);
	assert.ok(merged.completedEvents.includes('confession_event'));
	assert.ok(
		merged.completedEvents.includes('confession_accepted'),
		'the dating-gate marker must survive a save from a window that booted before it was earned'
	);
	assert.ok(merged.completedEvents.includes('first_deep_conversation'));
});

test('new markers from the incoming snapshot are appended without duplicates', () => {
	const incoming = {
		...staleSnapshot,
		completedEvents: ['first_deep_conversation', 'shared_vulnerability']
	} as CharacterState;
	const merged = mergeCharacterStates(persisted, incoming);
	assert.deepEqual(merged.completedEvents, [
		'first_deep_conversation',
		'confession_event',
		'confession_accepted',
		'shared_vulnerability'
	]);
});

test('monotonic counters never regress', () => {
	const merged = mergeCharacterStates(persisted, staleSnapshot);
	assert.equal(merged.totalInteractions, 120);
	assert.equal(merged.daysKnown, 30);
	assert.equal(merged.longestStreak, 7);
});

test('the streak pair with the later check-in date wins', () => {
	const merged = mergeCharacterStates(persisted, staleSnapshot);
	assert.equal(merged.currentStreak, 7);
	assert.equal(merged.streakLastDate, '2026-07-03');
});

test('a legitimately broken streak (newer date) does overwrite the old one', () => {
	const incoming = {
		...staleSnapshot,
		currentStreak: 1,
		streakLastDate: '2026-07-10'
	} as CharacterState;
	const merged = mergeCharacterStates(persisted, incoming);
	assert.equal(merged.currentStreak, 1);
	assert.equal(merged.streakLastDate, '2026-07-10');
	// ...but the longest streak it once reached is kept
	assert.equal(merged.longestStreak, 7);
});

test('same-day writes keep the higher streak', () => {
	const incoming = {
		...staleSnapshot,
		currentStreak: 6,
		streakLastDate: '2026-07-03'
	} as CharacterState;
	const merged = mergeCharacterStates(persisted, incoming);
	assert.equal(merged.currentStreak, 7);
});

test('a fresh record with no streak date cannot clear an established streak', () => {
	const incoming = { ...staleSnapshot, currentStreak: 0, streakLastDate: null } as CharacterState;
	const merged = mergeCharacterStates(persisted, incoming);
	assert.equal(merged.currentStreak, 7);
	assert.equal(merged.streakLastDate, '2026-07-03');
});

test('scalar stats are last-writer-wins (live sync keeps writers fresh)', () => {
	const merged = mergeCharacterStates(persisted, staleSnapshot);
	assert.equal(merged.affection, 12);
	assert.equal(merged.trust, 5);
	assert.equal(merged.energy, 95);
});

test('temporal anchors keep the earliest origin and the latest activity', () => {
	const incoming = {
		...staleSnapshot,
		firstMet: new Date('2026-06-15T10:00:00Z'),
		createdAt: new Date('2026-06-15T10:00:00Z')
	} as CharacterState;
	const merged = mergeCharacterStates(persisted, incoming);
	assert.equal(merged.firstMet.getTime(), new Date('2026-06-01T10:00:00Z').getTime());
	assert.equal(merged.createdAt.getTime(), new Date('2026-06-01T10:00:00Z').getTime());
	assert.equal(merged.lastInteraction?.getTime(), new Date('2026-07-03T18:00:00Z').getTime());
	assert.equal(merged.lastDecayAt?.getTime(), new Date('2026-07-02T09:00:00Z').getTime());
});
