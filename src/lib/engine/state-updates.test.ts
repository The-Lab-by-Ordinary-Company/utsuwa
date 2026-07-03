import test from 'node:test';
import assert from 'node:assert/strict';

import { applyTimeDecay, mergeUpdates, checkAndApplyStageTransition } from './state-updates.ts';
import type { CharacterState, StateUpdates } from '$lib/types/character';

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

// --- applyTimeDecay ---

test('a short absence only recovers energy', () => {
	const updates = applyTimeDecay(makeState({ energy: 50, affection: 500, trust: 80 }), 1);
	assert.ok((updates.energyDelta ?? 0) >= 1);
	assert.equal(updates.affectionDelta, undefined);
	assert.equal(updates.trustDelta, undefined);
	assert.equal(updates.moodChange, undefined);
});

test('energy recovers fully after 6 hours and never over-fills', () => {
	const updates = applyTimeDecay(makeState({ energy: 40 }), 7);
	assert.equal(updates.energyDelta, 60);
	const full = applyTimeDecay(makeState({ energy: 100 }), 7);
	assert.equal(full.energyDelta, undefined);
});

test('partial energy recovery always restores at least 1', () => {
	const updates = applyTimeDecay(makeState({ energy: 99 }), 1);
	assert.equal(updates.energyDelta, 1);
});

test('affection decays only after 48 hours and is capped at 50', () => {
	const none = applyTimeDecay(makeState({ affection: 500 }), 48);
	assert.equal(none.affectionDelta, undefined);

	const some = applyTimeDecay(makeState({ affection: 500 }), 72);
	assert.equal(some.affectionDelta, -5); // 1 day past grace at 1%/day

	const capped = applyTimeDecay(makeState({ affection: 1000 }), 24 * 60);
	assert.equal(capped.affectionDelta, -50);
});

test('trust decays only after 7 days and is capped at 10', () => {
	const none = applyTimeDecay(makeState({ trust: 90 }), 168);
	assert.equal(none.trustDelta, undefined);

	const oneWeek = applyTimeDecay(makeState({ trust: 90 }), 169);
	assert.equal(oneWeek.trustDelta, -2);

	const capped = applyTimeDecay(makeState({ trust: 90 }), 168 * 10);
	assert.equal(capped.trustDelta, -10);
});

test('mood shifts to melancholy after 3 days away', () => {
	const updates = applyTimeDecay(makeState(), 96);
	assert.equal(updates.moodChange?.emotion, 'melancholy');
	assert.ok((updates.moodChange?.intensityDelta ?? 0) <= 30);
});

// --- mergeUpdates ---

test('LLM deltas are clamped relative to the baseline', () => {
	const baseline: StateUpdates = { affectionDelta: 2, trustDelta: 1 };
	const merged = mergeUpdates(baseline, { affectionDelta: 100, trustDelta: 100 });
	assert.equal(merged.affectionDelta, 5); // max(|2|*2, 5)
	assert.equal(merged.trustDelta, 3); // max(|1|*2, 3)

	const negative = mergeUpdates(baseline, { affectionDelta: -100 });
	assert.equal(negative.affectionDelta, -5);
});

test('intimacy/comfort/respect use fixed clamps', () => {
	const merged = mergeUpdates({}, { intimacyDelta: 99, comfortDelta: -99, respectDelta: 99 });
	assert.equal(merged.intimacyDelta, 5);
	assert.equal(merged.comfortDelta, -3);
	assert.equal(merged.respectDelta, 5);
});

test('missing LLM fields keep the baseline values', () => {
	const baseline: StateUpdates = { affectionDelta: 2, energyDelta: -3 };
	const merged = mergeUpdates(baseline, {});
	assert.equal(merged.affectionDelta, 2);
	assert.equal(merged.energyDelta, -3);
});

test('LLM can override mood and pass through memory/events', () => {
	const merged = mergeUpdates(
		{ moodChange: { emotion: 'neutral', intensityDelta: 0, cause: 'baseline' } },
		{
			moodChange: { emotion: 'happy', intensityDelta: 5, cause: 'good news' },
			newMemory: 'They got the job',
			triggeredEvent: 'first_deep_conversation'
		}
	);
	assert.equal(merged.moodChange?.emotion, 'happy');
	assert.equal(merged.newMemory, 'They got the job');
	assert.equal(merged.triggeredEvent, 'first_deep_conversation');
});

// --- checkAndApplyStageTransition ---

test('transitions when the calculated stage differs', () => {
	const state = makeState({ affection: 50, trust: 20, totalInteractions: 3 });
	const result = checkAndApplyStageTransition(state, []);
	assert.equal(result.transitioned, true);
	assert.equal(result.fromStage, 'stranger');
	assert.equal(result.toStage, 'acquaintance');
	assert.equal(result.newState.relationshipStage, 'acquaintance');
});

test('no transition when the stage already matches', () => {
	const state = makeState();
	const result = checkAndApplyStageTransition(state, []);
	assert.equal(result.transitioned, false);
	assert.equal(result.newState, state);
});
