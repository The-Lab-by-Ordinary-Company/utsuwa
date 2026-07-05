import test from 'node:test';
import assert from 'node:assert/strict';

import {
	calculateStage,
	meetsStageRequirements,
	resolveStageTransition,
	DEMOTION_HYSTERESIS
} from './stages.ts';
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
		calculateStage(makeState(MAXED), [...base, 'confession_accepted', 'commitment_accepted']),
		'committed'
	);
	assert.equal(
		calculateStage(makeState(MAXED), [
			...base,
			'confession_accepted',
			'commitment_accepted',
			'deep_bond_moment'
		]),
		'soulmate'
	);
});

test('committed gates on the commitment outcome, not the commitment_discussion event id', () => {
	// Both choices of the talk grant the event id; only accepting grants the
	// outcome marker. The bare id must no longer be enough.
	const base = ['first_deep_conversation', 'shared_vulnerability', 'confession_accepted'];
	assert.equal(calculateStage(makeState(MAXED), [...base, 'commitment_discussion']), 'dating');
	assert.equal(
		calculateStage(makeState(MAXED), [...base, 'commitment_discussion', 'commitment_accepted']),
		'committed'
	);
});

test('stage never regresses below stranger and ignores the companion stage', () => {
	// calculateStage only walks the dating-sim ladder; companion is a mode, not a rung
	const state = makeState({ appMode: 'companion' });
	assert.equal(calculateStage(state, []), 'stranger');
});

// --- meetsStageRequirements (explicit requirement objects) ---

test('an explicit zero minimum is evaluated, not skipped', () => {
	const requirements = { minAffection: 0, minTrust: 0, minIntimacy: 0 };
	assert.equal(meetsStageRequirements(makeState(), requirements, []), true);
	assert.equal(
		meetsStageRequirements(makeState(), { ...requirements, minIntimacy: 1 }, []),
		false
	);
});

test('omitted optional minimums are skipped', () => {
	const requirements = { minAffection: 10, minTrust: 5 };
	assert.equal(meetsStageRequirements(makeState({ affection: 10, trust: 5 }), requirements, []), true);
});

// --- resolveStageTransition (hysteresis) ---

const ROMANTIC_EVENTS = ['first_deep_conversation', 'shared_vulnerability'];
const ROMANTIC_STATS = {
	affection: 460,
	trust: 75,
	intimacy: 30,
	comfort: 50,
	respect: 10,
	daysKnown: 10,
	totalInteractions: 25,
	relationshipStage: 'romantic_interest' as const
};

test('promotion happens as soon as requirements are met', () => {
	const state = makeState({ ...ROMANTIC_STATS, relationshipStage: 'close_friend' });
	const result = resolveStageTransition(state, ROMANTIC_EVENTS);
	assert.equal(result.stage, 'romantic_interest');
	assert.equal(result.direction, 'promotion');
});

test('a dip inside the hysteresis band holds the current stage', () => {
	// romantic_interest needs 450 affection; the demotion floor is 450 * 0.85
	const floor = 450 * DEMOTION_HYSTERESIS;
	const state = makeState({ ...ROMANTIC_STATS, affection: Math.ceil(floor) });
	const result = resolveStageTransition(state, ROMANTIC_EVENTS);
	assert.equal(result.stage, 'romantic_interest');
	assert.equal(result.changed, false);
});

test('a collapse below the band demotes to the earned stage and reports strain', () => {
	const state = makeState({ ...ROMANTIC_STATS, affection: 300 });
	const result = resolveStageTransition(state, ROMANTIC_EVENTS);
	assert.equal(result.stage, 'close_friend');
	assert.equal(result.direction, 'demotion');
});

test('hysteresis applies per stat, not just affection', () => {
	// trust floor for romantic_interest is 75 * 0.85 = 63.75
	const held = resolveStageTransition(makeState({ ...ROMANTIC_STATS, trust: 70 }), ROMANTIC_EVENTS);
	assert.equal(held.changed, false);

	const dropped = resolveStageTransition(makeState({ ...ROMANTIC_STATS, trust: 60 }), ROMANTIC_EVENTS);
	assert.equal(dropped.direction, 'demotion');
	assert.equal(dropped.stage, 'friend'); // trust 60 also fails close_friend's 70
});
