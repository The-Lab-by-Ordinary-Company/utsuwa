import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	applyStateUpdates,
	checkAndApplyStageTransition,
	applyTimeDecay,
	calculateMessageImpact,
	mergeUpdates
} from './state-updates';
import type { CharacterState, StateUpdates } from '../types/character';

function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	const now = new Date();
	return {
		name: 'Test',
		systemPrompt: '',
		extensions: {},
		mood: { primary: 'neutral', intensity: 50, causes: [] },
		energy: 80,
		affection: 100,
		trust: 40,
		intimacy: 20,
		comfort: 30,
		respect: 25,
		appMode: 'dating_sim',
		relationshipStage: 'acquaintance',
		personality: {
			openness: 0,
			warmth: 20,
			assertiveness: -10,
			playfulness: 10,
			sensitivity: 20,
			likesTeasing: 0,
			prefersDirectness: -10,
			romanticStyle: 'slow_burn'
		},
		lastInteraction: null,
		firstMet: now,
		daysKnown: 5,
		totalInteractions: 10,
		currentStreak: 2,
		longestStreak: 5,
		streakLastDate: null,
		completedEvents: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

describe('mergeUpdates', () => {
	it('returns baseline when LLM suggestion is empty', () => {
		const baseline: StateUpdates = {
			energyDelta: -2,
			affectionDelta: 3,
			trustDelta: 1,
			intimacyDelta: 0,
			comfortDelta: 0,
			respectDelta: 0
		};
		const result = mergeUpdates(baseline, {});
		expect(result).toEqual(baseline);
	});

	it('LLM mood overrides baseline mood', () => {
		const baseline: StateUpdates = {
			moodChange: { emotion: 'happy', intensityDelta: 5, cause: 'conversation' }
		};
		const llm: Partial<StateUpdates> = {
			moodChange: { emotion: 'excited', intensityDelta: 15, cause: 'surprise' }
		};
		const result = mergeUpdates(baseline, llm);
		expect(result.moodChange!.emotion).toBe('excited');
		expect(result.moodChange!.intensityDelta).toBe(15);
	});

	it('caps LLM affection delta relative to baseline', () => {
		const baseline: StateUpdates = { affectionDelta: 3 };
		// maxDelta = max(|3| * 2, 5) = 6
		const llm: Partial<StateUpdates> = { affectionDelta: 20 };
		const result = mergeUpdates(baseline, llm);
		expect(result.affectionDelta).toBe(6); // clamped to maxDelta
	});

	it('caps LLM affection delta with minimum floor of 5', () => {
		const baseline: StateUpdates = { affectionDelta: 1 };
		// maxDelta = max(|1| * 2, 5) = 5
		const llm: Partial<StateUpdates> = { affectionDelta: 10 };
		const result = mergeUpdates(baseline, llm);
		expect(result.affectionDelta).toBe(5);
	});

	it('caps negative LLM affection delta', () => {
		const baseline: StateUpdates = { affectionDelta: 2 };
		// maxDelta = max(|2| * 2, 5) = 5
		const llm: Partial<StateUpdates> = { affectionDelta: -15 };
		const result = mergeUpdates(baseline, llm);
		expect(result.affectionDelta).toBe(-5);
	});

	it('caps LLM trust delta relative to baseline', () => {
		const baseline: StateUpdates = { trustDelta: 2 };
		// maxDelta = max(|2| * 2, 3) = 4
		const llm: Partial<StateUpdates> = { trustDelta: 10 };
		const result = mergeUpdates(baseline, llm);
		expect(result.trustDelta).toBe(4);
	});

	it('clamps intimacy delta to [-3, 5]', () => {
		const baseline: StateUpdates = { intimacyDelta: 1 };
		const result1 = mergeUpdates(baseline, { intimacyDelta: 20 });
		expect(result1.intimacyDelta).toBe(5);

		const result2 = mergeUpdates(baseline, { intimacyDelta: -10 });
		expect(result2.intimacyDelta).toBe(-3);
	});

	it('clamps comfort delta to [-3, 5]', () => {
		const baseline: StateUpdates = {};
		const result = mergeUpdates(baseline, { comfortDelta: 99 });
		expect(result.comfortDelta).toBe(5);
	});

	it('clamps respect delta to [-3, 5]', () => {
		const baseline: StateUpdates = {};
		const result = mergeUpdates(baseline, { respectDelta: -99 });
		expect(result.respectDelta).toBe(-3);
	});

	it('preserves baseline energyDelta (app controls energy)', () => {
		const baseline: StateUpdates = { energyDelta: -5 };
		const llm: Partial<StateUpdates> = { energyDelta: 50 }; // LLM tries to set energy
		const result = mergeUpdates(baseline, llm);
		// energyDelta is only set from baseline (no LLM merge logic for energy)
		expect(result.energyDelta).toBe(-5);
	});

	it('passes through LLM newMemory', () => {
		const baseline: StateUpdates = {};
		const result = mergeUpdates(baseline, { newMemory: 'user likes cats' });
		expect(result.newMemory).toBe('user likes cats');
	});

	it('passes through LLM triggeredEvent', () => {
		const baseline: StateUpdates = {};
		const result = mergeUpdates(baseline, { triggeredEvent: 'cat_event' });
		expect(result.triggeredEvent).toBe('cat_event');
	});

	it('baseline newMemory is kept when LLM does not override', () => {
		const baseline: StateUpdates = { newMemory: 'baseline fact' };
		const result = mergeUpdates(baseline, {});
		expect(result.newMemory).toBe('baseline fact');
	});

	it('LLM newMemory overrides baseline newMemory', () => {
		const baseline: StateUpdates = { newMemory: 'baseline fact' };
		const result = mergeUpdates(baseline, { newMemory: 'llm fact' });
		expect(result.newMemory).toBe('llm fact');
	});
});

describe('applyStateUpdates', () => {
	it('applies mood change', () => {
		const state = makeState();
		const updates: StateUpdates = {
			moodChange: { emotion: 'happy', intensityDelta: 20, cause: 'good chat' }
		};
		const newState = applyStateUpdates(state, updates);
		expect(newState.mood.primary).toBe('happy');
		expect(newState.mood.intensity).toBe(70); // 50 + 20
		expect(newState.mood.causes).toContain('good chat');
	});

	it('clamps mood intensity to [0, 100]', () => {
		const state = makeState({
			mood: { primary: 'happy', intensity: 90, causes: [] }
		});
		const updates: StateUpdates = {
			moodChange: { emotion: 'excited', intensityDelta: 20 }
		};
		const newState = applyStateUpdates(state, updates);
		expect(newState.mood.intensity).toBe(100); // clamped
	});

	it('keeps only last 5 causes', () => {
		const state = makeState({
			mood: { primary: 'neutral', intensity: 50, causes: ['a', 'b', 'c', 'd', 'e'] }
		});
		const updates: StateUpdates = {
			moodChange: { emotion: 'happy', cause: 'f' }
		};
		const newState = applyStateUpdates(state, updates);
		expect(newState.mood.causes).toHaveLength(5);
		expect(newState.mood.causes).toContain('f');
		expect(newState.mood.causes).not.toContain('a');
	});

	it('applies energy delta and clamps to [0, 100]', () => {
		const state = makeState({ energy: 10 });
		const plus = applyStateUpdates(state, { energyDelta: -20 });
		expect(plus.energy).toBe(0);

		const state2 = makeState({ energy: 95 });
		const plus2 = applyStateUpdates(state2, { energyDelta: 10 });
		expect(plus2.energy).toBe(100);
	});

	it('applies affection delta and clamps to [0, 1000]', () => {
		const state = makeState({ affection: 990 });
		const newState = applyStateUpdates(state, { affectionDelta: 20 });
		expect(newState.affection).toBe(1000);

		const state2 = makeState({ affection: 5 });
		const newState2 = applyStateUpdates(state2, { affectionDelta: -10 });
		expect(newState2.affection).toBe(0);
	});

	it('applies trust delta and clamps to [0, 100]', () => {
		const state = makeState({ trust: 98 });
		const newState = applyStateUpdates(state, { trustDelta: 5 });
		expect(newState.trust).toBe(100);
	});

	it('applies intimacy, comfort, respect deltas with clamping', () => {
		const state = makeState({ intimacy: 5, comfort: 5, respect: 95 });
		const updates: StateUpdates = {
			intimacyDelta: -10,
			comfortDelta: -10,
			respectDelta: 10
		};
		const newState = applyStateUpdates(state, updates);
		expect(newState.intimacy).toBe(0);
		expect(newState.comfort).toBe(0);
		expect(newState.respect).toBe(100);
	});

	it('updates the timestamp', () => {
		const state = makeState();
		const before = new Date();
		const newState = applyStateUpdates(state, {});
		expect(newState.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
	});

	it('does not mutate the original state', () => {
		const state = makeState({ energy: 50 });
		const original = { ...state };
		applyStateUpdates(state, { energyDelta: -10 });
		expect(state.energy).toBe(original.energy);
	});
});

describe('checkAndApplyStageTransition', () => {
	it('returns transitioned=false when stage does not change', () => {
		// stranger with 0 affection/trust stays stranger
		const state = makeState({
			affection: 0,
			trust: 0,
			relationshipStage: 'stranger',
			totalInteractions: 0,
			daysKnown: 0
		});
		const result = checkAndApplyStageTransition(state, []);
		expect(result.transitioned).toBe(false);
		expect(result.newState.relationshipStage).toBe('stranger');
	});

	it('transitions from stranger to acquaintance when requirements met', () => {
		const state = makeState({
			affection: 50,
			trust: 20,
			relationshipStage: 'stranger',
			totalInteractions: 5,
			daysKnown: 1
		});
		const result = checkAndApplyStageTransition(state, []);
		expect(result.transitioned).toBe(true);
		expect(result.fromStage).toBe('stranger');
		expect(result.toStage).toBe('acquaintance');
		expect(result.newState.relationshipStage).toBe('acquaintance');
	});

	it('transitions from acquaintance to friend when requirements met', () => {
		const state = makeState({
			affection: 150,
			trust: 50,
			relationshipStage: 'acquaintance',
			totalInteractions: 10,
			daysKnown: 3
		});
		const result = checkAndApplyStageTransition(state, []);
		expect(result.transitioned).toBe(true);
		expect(result.toStage).toBe('friend');
	});

	it('requires completed events for romantic_interest', () => {
		const state = makeState({
			affection: 500,
			trust: 80,
			intimacy: 35,
			relationshipStage: 'close_friend',
			totalInteractions: 30,
			daysKnown: 15,
			comfort: 55
		});
		// Without required events, should stay at close_friend
		const result1 = checkAndApplyStageTransition(state, []);
		expect(result1.newState.relationshipStage).toBe('close_friend');

		// With required events, should go to romantic_interest
		const result2 = checkAndApplyStageTransition(state, [
			'first_deep_conversation',
			'shared_vulnerability'
		]);
		expect(result2.transitioned).toBe(true);
		expect(result2.toStage).toBe('romantic_interest');
	});

	it('does not skip stages even with very high stats', () => {
		// High stats but missing required events for later stages
		const state = makeState({
			affection: 600,
			trust: 90,
			intimacy: 55,
			comfort: 50,
			respect: 50,
			relationshipStage: 'stranger',
			totalInteractions: 50,
			daysKnown: 20
		});
		// Has events for romantic_interest but not for dating
		const result = checkAndApplyStageTransition(state, [
			'first_deep_conversation',
			'shared_vulnerability'
		]);
		// Should land at romantic_interest (highest achievable without confession_accepted)
		expect(result.newState.relationshipStage).toBe('romantic_interest');
	});
});

describe('applyTimeDecay', () => {
	it('fully recovers energy after 6+ hours', () => {
		const state = makeState({ energy: 30 });
		const updates = applyTimeDecay(state, 8);
		expect(updates.energyDelta).toBe(70); // 100 - 30
	});

	it('partially recovers energy for < 6 hours', () => {
		const state = makeState({ energy: 50 });
		const updates = applyTimeDecay(state, 3); // half of 6
		expect(updates.energyDelta).toBeDefined();
		expect(updates.energyDelta!).toBeGreaterThanOrEqual(1);
		expect(updates.energyDelta!).toBeLessThanOrEqual(50);
	});

	it('does not recover energy if already at 100', () => {
		const state = makeState({ energy: 100 });
		const updates = applyTimeDecay(state, 10);
		expect(updates.energyDelta).toBeUndefined();
	});

	it('always recovers at least 1 energy', () => {
		const state = makeState({ energy: 99 });
		const updates = applyTimeDecay(state, 0.1);
		expect(updates.energyDelta).toBeGreaterThanOrEqual(1);
	});

	it('does not decay affection within 48 hours', () => {
		const state = makeState({ affection: 500 });
		const updates = applyTimeDecay(state, 24);
		expect(updates.affectionDelta).toBeUndefined();
	});

	it('decays affection after 48 hours', () => {
		const state = makeState({ affection: 500 });
		const updates = applyTimeDecay(state, 72);
		expect(updates.affectionDelta).toBeDefined();
		expect(updates.affectionDelta!).toBeLessThan(0);
	});

	it('caps affection decay at -50 per session', () => {
		const state = makeState({ affection: 900 });
		const updates = applyTimeDecay(state, 24 * 30); // 30 days
		expect(updates.affectionDelta!).toBeGreaterThanOrEqual(-50);
	});

	it('does not decay trust within 7 days', () => {
		const state = makeState({ trust: 80 });
		const updates = applyTimeDecay(state, 24 * 6); // 6 days
		expect(updates.trustDelta).toBeUndefined();
	});

	it('decays trust after 7 days', () => {
		const state = makeState({ trust: 80 });
		const updates = applyTimeDecay(state, 24 * 14); // 2 weeks
		expect(updates.trustDelta).toBeDefined();
		expect(updates.trustDelta!).toBeLessThan(0);
	});

	it('caps trust decay at -10 per session', () => {
		const state = makeState({ trust: 80 });
		const updates = applyTimeDecay(state, 24 * 365); // 1 year
		expect(updates.trustDelta!).toBeGreaterThanOrEqual(-10);
	});

	it('shifts mood to melancholy after 3+ days', () => {
		const state = makeState();
		const updates = applyTimeDecay(state, 80); // > 72
		expect(updates.moodChange).toBeDefined();
		expect(updates.moodChange!.emotion).toBe('melancholy');
		expect(updates.moodChange!.cause).toBe('missing you');
	});

	it('does not shift mood within 3 days', () => {
		const state = makeState();
		const updates = applyTimeDecay(state, 48);
		expect(updates.moodChange).toBeUndefined();
	});
});

describe('calculateMessageImpact', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns base energy cost of -2 for shallow neutral message', () => {
		const state = makeState();
		const impact = calculateMessageImpact(0, 'shallow', false, false, state);
		expect(impact.energyDelta).toBe(-2);
	});

	it('increases energy cost for deep conversations', () => {
		const state = makeState();
		const impact = calculateMessageImpact(0, 'deep', false, false, state);
		expect(impact.energyDelta).toBe(-4); // -2 base + -2 deep
	});

	it('boosts affection and comfort for positive sentiment', () => {
		const state = makeState({ affection: 100 }); // honeymoon phase
		const pos = calculateMessageImpact(0.5, 'shallow', false, false, state);
		const neu = calculateMessageImpact(0, 'shallow', false, false, state);
		expect(pos.affectionDelta).toBeGreaterThan(neu.affectionDelta);
		expect(pos.comfortDelta).toBeGreaterThan(neu.comfortDelta);
	});

	it('decreases affection and comfort for negative sentiment', () => {
		const state = makeState({ affection: 100 });
		const neg = calculateMessageImpact(-0.5, 'shallow', false, false, state);
		expect(neg.comfortDelta).toBeLessThan(0);
	});

	it('increases intimacy and trust for deep topics', () => {
		const state = makeState();
		const deep = calculateMessageImpact(0, 'deep', false, false, state);
		expect(deep.intimacyDelta).toBeGreaterThanOrEqual(2);
		expect(deep.trustDelta).toBeGreaterThanOrEqual(1);
	});

	it('emotional content boosts intimacy, trust, and affection', () => {
		const state = makeState({ affection: 100 });
		const emotional = calculateMessageImpact(0, 'shallow', true, false, state);
		const noEmotion = calculateMessageImpact(0, 'shallow', false, false, state);
		expect(emotional.intimacyDelta).toBeGreaterThan(noEmotion.intimacyDelta);
		expect(emotional.trustDelta).toBeGreaterThan(noEmotion.trustDelta);
	});

	it('questions boost respect and trust', () => {
		const state = makeState();
		const question = calculateMessageImpact(0, 'shallow', false, true, state);
		const notQuestion = calculateMessageImpact(0, 'shallow', false, false, state);
		expect(question.respectDelta).toBeGreaterThan(notQuestion.respectDelta);
		expect(question.trustDelta).toBeGreaterThan(notQuestion.trustDelta);
	});

	it('honeymoon phase (affection < 300) gives 1.5x affection', () => {
		const honeymoon = makeState({ affection: 100 });
		const comfort = makeState({ affection: 500 });
		const h = calculateMessageImpact(0, 'deep', true, false, honeymoon);
		const c = calculateMessageImpact(0, 'deep', true, false, comfort);
		// Honeymoon floor(x * 1.5) vs comfort floor(x * 1.0)
		expect(h.affectionDelta).toBeGreaterThanOrEqual(c.affectionDelta);
	});

	it('deep bond phase (affection >= 700) gives 0.7x affection', () => {
		const deep = makeState({ affection: 800 });
		const comfort = makeState({ affection: 500 });
		const d = calculateMessageImpact(0, 'deep', true, false, deep);
		const c = calculateMessageImpact(0, 'deep', true, false, comfort);
		expect(d.affectionDelta).toBeLessThanOrEqual(c.affectionDelta);
	});

	it('clamps all output values within expected ranges', () => {
		const state = makeState();
		// Extreme inputs
		const impact = calculateMessageImpact(1, 'deep', true, true, state);
		expect(impact.affectionDelta).toBeGreaterThanOrEqual(-5);
		expect(impact.affectionDelta).toBeLessThanOrEqual(10);
		expect(impact.trustDelta).toBeGreaterThanOrEqual(-3);
		expect(impact.trustDelta).toBeLessThanOrEqual(5);
		expect(impact.intimacyDelta).toBeGreaterThanOrEqual(-2);
		expect(impact.intimacyDelta).toBeLessThanOrEqual(5);
		expect(impact.comfortDelta).toBeGreaterThanOrEqual(-3);
		expect(impact.comfortDelta).toBeLessThanOrEqual(3);
		expect(impact.respectDelta).toBeGreaterThanOrEqual(-2);
		expect(impact.respectDelta).toBeLessThanOrEqual(3);
	});
});
