import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateStage } from './stages.ts';
import type { CharacterState } from '$lib/types/character';

function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	return {
		name: 'Utsuwa',
		systemPrompt: '',
		extensions: {},
		mood: { primary: 'neutral', intensity: 50, causes: [] },
		energy: 100,
		affection: 0,
		trust: 0,
		intimacy: 0,
		comfort: 0,
		respect: 0,
		appMode: 'dating_sim',
		relationshipStage: 'stranger',
		personality: {},
		lastInteraction: null,
		firstMet: new Date('2026-01-01'),
		daysKnown: 0,
		totalInteractions: 0,
		currentStreak: 0,
		longestStreak: 0,
		streakLastDate: null,
		completedEvents: [],
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides
	} as CharacterState;
}

// Stats high enough to satisfy every stage's numeric requirements
const MAXED = {
	affection: 1000,
	trust: 100,
	intimacy: 100,
	comfort: 100,
	respect: 100,
	daysKnown: 100,
	totalInteractions: 500
};

test('a fresh state is a stranger', () => {
	assert.equal(calculateStage(makeState(), []), 'stranger');
});

test('acquaintance requires affection, trust, and interactions together', () => {
	assert.equal(
		calculateStage(makeState({ affection: 50, trust: 20, totalInteractions: 3 }), []),
		'acquaintance'
	);
	// Missing interactions keeps them a stranger
	assert.equal(
		calculateStage(makeState({ affection: 50, trust: 20, totalInteractions: 2 }), []),
		'stranger'
	);
});

test('friend and close_friend gate on days known', () => {
	const stats = { affection: 300, trust: 70, comfort: 50, totalInteractions: 25 };
	assert.equal(calculateStage(makeState({ ...stats, daysKnown: 7 }), []), 'close_friend');
	assert.equal(calculateStage(makeState({ ...stats, daysKnown: 3 }), []), 'friend');
	assert.equal(calculateStage(makeState({ ...stats, daysKnown: 0 }), []), 'acquaintance');
});

test('maxed stats without events cap at close_friend', () => {
	assert.equal(calculateStage(makeState(MAXED), []), 'close_friend');
});

test('romantic_interest unlocks with its two milestone events', () => {
	const events = ['first_deep_conversation', 'shared_vulnerability'];
	assert.equal(calculateStage(makeState(MAXED), events), 'romantic_interest');
	// One event alone is not enough
	assert.equal(calculateStage(makeState(MAXED), [events[0]]), 'close_friend');
});

test('each later stage unlocks with its required event', () => {
	const base = ['first_deep_conversation', 'shared_vulnerability'];
	assert.equal(calculateStage(makeState(MAXED), [...base, 'confession_accepted']), 'dating');
	assert.equal(
		calculateStage(makeState(MAXED), [...base, 'confession_accepted', 'commitment_discussion']),
		'committed'
	);
	assert.equal(
		calculateStage(makeState(MAXED), [
			...base,
			'confession_accepted',
			'commitment_discussion',
			'deep_bond_moment'
		]),
		'soulmate'
	);
});

test('stage never regresses below stranger and ignores the companion stage', () => {
	// calculateStage only walks the dating-sim ladder; companion is a mode, not a rung
	const state = makeState({ appMode: 'companion' });
	assert.equal(calculateStage(state, []), 'stranger');
});
