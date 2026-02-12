import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkCondition, checkEvent, checkAllEvents } from './events';
import type { CharacterState } from '../types/character';
import type {
	EventCondition,
	EventDefinition,
	CompletedEventRecord
} from '../types/events';

// Mock getTimeOfDay since it's imported by events.ts from $lib/types/events
vi.mock('../types/events', async () => {
	const actual = await vi.importActual<typeof import('../types/events')>('../types/events');
	return {
		...actual,
		getTimeOfDay: vi.fn(() => 'morning')
	};
});

// We need access to the mock to change return values
import { getTimeOfDay } from '../types/events';

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
		relationshipStage: 'friend',
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
		lastInteraction: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
		firstMet: now,
		daysKnown: 10,
		totalInteractions: 20,
		currentStreak: 3,
		longestStreak: 5,
		streakLastDate: null,
		completedEvents: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

function makeEvent(overrides: Partial<EventDefinition> = {}): EventDefinition {
	return {
		id: 'test_event',
		name: 'Test Event',
		type: 'conditional',
		conditions: [],
		oneTime: false,
		priority: 5,
		...overrides
	};
}

function makeCompletedRecord(overrides: Partial<CompletedEventRecord> = {}): CompletedEventRecord {
	return {
		id: 1,
		eventId: 'test_event',
		eventType: 'conditional',
		completedAt: new Date(),
		...overrides
	};
}

describe('checkCondition', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('min_affection: passes when affection meets threshold', () => {
		const state = makeState({ affection: 100 });
		expect(checkCondition({ type: 'min_affection', value: 50 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'min_affection', value: 100 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'min_affection', value: 101 }, state, [])).toBe(false);
	});

	it('min_trust: passes when trust meets threshold', () => {
		const state = makeState({ trust: 60 });
		expect(checkCondition({ type: 'min_trust', value: 60 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'min_trust', value: 61 }, state, [])).toBe(false);
	});

	it('min_intimacy: passes when intimacy meets threshold', () => {
		const state = makeState({ intimacy: 30 });
		expect(checkCondition({ type: 'min_intimacy', value: 30 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'min_intimacy', value: 31 }, state, [])).toBe(false);
	});

	it('min_comfort: passes when comfort meets threshold', () => {
		const state = makeState({ comfort: 50 });
		expect(checkCondition({ type: 'min_comfort', value: 50 }, state, [])).toBe(true);
	});

	it('min_respect: passes when respect meets threshold', () => {
		const state = makeState({ respect: 40 });
		expect(checkCondition({ type: 'min_respect', value: 40 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'min_respect', value: 41 }, state, [])).toBe(false);
	});

	it('max_energy: passes when energy is at or below threshold', () => {
		const state = makeState({ energy: 30 });
		expect(checkCondition({ type: 'max_energy', value: 50 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'max_energy', value: 30 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'max_energy', value: 29 }, state, [])).toBe(false);
	});

	it('relationship_stage: passes for exact match', () => {
		const state = makeState({ relationshipStage: 'friend' });
		expect(checkCondition({ type: 'relationship_stage', value: 'friend' }, state, [])).toBe(true);
		expect(checkCondition({ type: 'relationship_stage', value: 'stranger' }, state, [])).toBe(
			false
		);
	});

	it('relationship_stage_min: passes when at or above minimum stage', () => {
		const state = makeState({ relationshipStage: 'friend' });
		expect(
			checkCondition({ type: 'relationship_stage_min', value: 'stranger' }, state, [])
		).toBe(true);
		expect(checkCondition({ type: 'relationship_stage_min', value: 'friend' }, state, [])).toBe(
			true
		);
		expect(
			checkCondition({ type: 'relationship_stage_min', value: 'close_friend' }, state, [])
		).toBe(false);
	});

	it('days_known: passes when enough days have passed', () => {
		const state = makeState({ daysKnown: 10 });
		expect(checkCondition({ type: 'days_known', value: 10 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'days_known', value: 11 }, state, [])).toBe(false);
	});

	it('total_interactions: passes when enough interactions occurred', () => {
		const state = makeState({ totalInteractions: 20 });
		expect(checkCondition({ type: 'total_interactions', value: 20 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'total_interactions', value: 21 }, state, [])).toBe(false);
	});

	it('event_completed: passes when event ID is in completed list', () => {
		const state = makeState();
		expect(
			checkCondition({ type: 'event_completed', value: 'intro' }, state, ['intro', 'chat_1'])
		).toBe(true);
		expect(
			checkCondition({ type: 'event_completed', value: 'missing' }, state, ['intro'])
		).toBe(false);
	});

	it('event_not_completed: passes when event ID is not in completed list', () => {
		const state = makeState();
		expect(
			checkCondition({ type: 'event_not_completed', value: 'boss_fight' }, state, ['intro'])
		).toBe(true);
		expect(
			checkCondition({ type: 'event_not_completed', value: 'intro' }, state, ['intro'])
		).toBe(false);
	});

	it('time_of_day: uses mocked getTimeOfDay', () => {
		const state = makeState();
		expect(checkCondition({ type: 'time_of_day', value: 'morning' }, state, [])).toBe(true);
		expect(checkCondition({ type: 'time_of_day', value: 'night' }, state, [])).toBe(false);

		// Change mock
		vi.mocked(getTimeOfDay).mockReturnValue('night');
		expect(checkCondition({ type: 'time_of_day', value: 'night' }, state, [])).toBe(true);
	});

	it('random_chance: passes when Math.random() < value', () => {
		// Math.random mocked to 0.5
		const state = makeState();
		expect(checkCondition({ type: 'random_chance', value: 0.6 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'random_chance', value: 0.5 }, state, [])).toBe(false);
		expect(checkCondition({ type: 'random_chance', value: 0.3 }, state, [])).toBe(false);
	});

	it('keyword_mentioned: checks current message content', () => {
		const state = makeState();
		expect(
			checkCondition({ type: 'keyword_mentioned', value: 'hello' }, state, [], 'Hello world!')
		).toBe(true);
		expect(
			checkCondition({ type: 'keyword_mentioned', value: 'goodbye' }, state, [], 'Hello world!')
		).toBe(false);
	});

	it('keyword_mentioned: returns false when no message provided', () => {
		const state = makeState();
		expect(checkCondition({ type: 'keyword_mentioned', value: 'hello' }, state, [])).toBe(false);
	});

	it('mood_is: checks primary mood', () => {
		const state = makeState({ mood: { primary: 'happy', intensity: 60, causes: [] } });
		expect(checkCondition({ type: 'mood_is', value: 'happy' }, state, [])).toBe(true);
		expect(checkCondition({ type: 'mood_is', value: 'sad' }, state, [])).toBe(false);
	});

	it('mood_intensity_min: checks mood intensity', () => {
		const state = makeState({ mood: { primary: 'neutral', intensity: 70, causes: [] } });
		expect(checkCondition({ type: 'mood_intensity_min', value: 70 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'mood_intensity_min', value: 71 }, state, [])).toBe(false);
	});

	it('consecutive_days: checks current streak', () => {
		const state = makeState({ currentStreak: 5 });
		expect(checkCondition({ type: 'consecutive_days', value: 5 }, state, [])).toBe(true);
		expect(checkCondition({ type: 'consecutive_days', value: 6 }, state, [])).toBe(false);
	});

	it('hours_since_last_interaction_min: passes when enough hours passed', () => {
		const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2);
		const state = makeState({ lastInteraction: twoHoursAgo });
		expect(
			checkCondition({ type: 'hours_since_last_interaction_min', value: 1 }, state, [])
		).toBe(true);
		expect(
			checkCondition({ type: 'hours_since_last_interaction_min', value: 3 }, state, [])
		).toBe(false);
	});

	it('hours_since_last_interaction_min: returns true if no last interaction', () => {
		const state = makeState({ lastInteraction: null });
		expect(
			checkCondition({ type: 'hours_since_last_interaction_min', value: 1 }, state, [])
		).toBe(true);
	});

	it('hours_since_last_interaction_max: passes when within time window', () => {
		const thirtyMinAgo = new Date(Date.now() - 1000 * 60 * 30);
		const state = makeState({ lastInteraction: thirtyMinAgo });
		expect(
			checkCondition({ type: 'hours_since_last_interaction_max', value: 1 }, state, [])
		).toBe(true);
		expect(
			checkCondition({ type: 'hours_since_last_interaction_max', value: 0.1 }, state, [])
		).toBe(false);
	});

	it('hours_since_last_interaction_max: returns false if no last interaction', () => {
		const state = makeState({ lastInteraction: null });
		expect(
			checkCondition({ type: 'hours_since_last_interaction_max', value: 100 }, state, [])
		).toBe(false);
	});
});

describe('checkEvent', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('triggers when all conditions are met', () => {
		const state = makeState({ affection: 200, trust: 60 });
		const event = makeEvent({
			conditions: [
				{ type: 'min_affection', value: 100 },
				{ type: 'min_trust', value: 50 }
			]
		});
		const result = checkEvent(event, state, []);
		expect(result.triggered).toBe(true);
		expect(result.event).toBe(event);
		expect(result.failedConditions).toHaveLength(0);
	});

	it('does not trigger when any condition fails', () => {
		const state = makeState({ affection: 30, trust: 60 });
		const event = makeEvent({
			conditions: [
				{ type: 'min_affection', value: 100 },
				{ type: 'min_trust', value: 50 }
			]
		});
		const result = checkEvent(event, state, []);
		expect(result.triggered).toBe(false);
		expect(result.event).toBeUndefined();
		expect(result.failedConditions!.length).toBeGreaterThan(0);
	});

	it('reports all failed conditions', () => {
		const state = makeState({ affection: 10, trust: 10 });
		const event = makeEvent({
			conditions: [
				{ type: 'min_affection', value: 100 },
				{ type: 'min_trust', value: 50 }
			]
		});
		const result = checkEvent(event, state, []);
		expect(result.failedConditions).toHaveLength(2);
	});

	it('blocks one-time events that are already completed', () => {
		const state = makeState({ affection: 200 });
		const event = makeEvent({
			id: 'once_event',
			oneTime: true,
			conditions: [{ type: 'min_affection', value: 100 }]
		});
		const completed: CompletedEventRecord[] = [
			makeCompletedRecord({ eventId: 'once_event' })
		];
		const result = checkEvent(event, state, completed);
		expect(result.triggered).toBe(false);
	});

	it('blocks events on cooldown', () => {
		const state = makeState({ affection: 200 });
		const event = makeEvent({
			id: 'cooldown_event',
			oneTime: false,
			cooldownDays: 7,
			conditions: [{ type: 'min_affection', value: 100 }]
		});
		const completed: CompletedEventRecord[] = [
			makeCompletedRecord({
				eventId: 'cooldown_event',
				completedAt: new Date() // just completed
			})
		];
		const result = checkEvent(event, state, completed);
		expect(result.triggered).toBe(false);
	});

	it('allows repeatable events after cooldown expires', () => {
		const state = makeState({ affection: 200 });
		const event = makeEvent({
			id: 'repeat_event',
			oneTime: false,
			cooldownDays: 1,
			conditions: [{ type: 'min_affection', value: 100 }]
		});
		const completed: CompletedEventRecord[] = [
			makeCompletedRecord({
				eventId: 'repeat_event',
				completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
			})
		];
		const result = checkEvent(event, state, completed);
		expect(result.triggered).toBe(true);
	});

	it('triggers event with no conditions', () => {
		const state = makeState();
		const event = makeEvent({ conditions: [] });
		const result = checkEvent(event, state, []);
		expect(result.triggered).toBe(true);
	});
});

describe('checkAllEvents', () => {
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns only triggered events', () => {
		const state = makeState({ affection: 200, trust: 60 });
		const events: EventDefinition[] = [
			makeEvent({
				id: 'e1',
				priority: 3,
				conditions: [{ type: 'min_affection', value: 100 }]
			}),
			makeEvent({
				id: 'e2',
				priority: 5,
				conditions: [{ type: 'min_affection', value: 500 }] // fails
			}),
			makeEvent({
				id: 'e3',
				priority: 1,
				conditions: [{ type: 'min_trust', value: 50 }]
			})
		];
		const triggered = checkAllEvents(events, state, []);
		expect(triggered).toHaveLength(2);
		expect(triggered.map((e) => e.id)).toContain('e1');
		expect(triggered.map((e) => e.id)).toContain('e3');
		expect(triggered.map((e) => e.id)).not.toContain('e2');
	});

	it('sorts triggered events by priority descending', () => {
		const state = makeState({ affection: 200, trust: 60 });
		const events: EventDefinition[] = [
			makeEvent({ id: 'low', priority: 1, conditions: [] }),
			makeEvent({ id: 'high', priority: 10, conditions: [] }),
			makeEvent({ id: 'mid', priority: 5, conditions: [] })
		];
		const triggered = checkAllEvents(events, state, []);
		expect(triggered[0].id).toBe('high');
		expect(triggered[1].id).toBe('mid');
		expect(triggered[2].id).toBe('low');
	});

	it('returns empty array when no events trigger', () => {
		const state = makeState({ affection: 0 });
		const events: EventDefinition[] = [
			makeEvent({
				id: 'e1',
				conditions: [{ type: 'min_affection', value: 500 }]
			})
		];
		const triggered = checkAllEvents(events, state, []);
		expect(triggered).toHaveLength(0);
	});

	it('filters out completed one-time events', () => {
		const state = makeState({ affection: 200 });
		const events: EventDefinition[] = [
			makeEvent({
				id: 'done',
				oneTime: true,
				priority: 10,
				conditions: [{ type: 'min_affection', value: 100 }]
			}),
			makeEvent({
				id: 'available',
				oneTime: false,
				priority: 5,
				conditions: [{ type: 'min_affection', value: 100 }]
			})
		];
		const completed: CompletedEventRecord[] = [
			makeCompletedRecord({ eventId: 'done' })
		];
		const triggered = checkAllEvents(events, state, completed);
		expect(triggered).toHaveLength(1);
		expect(triggered[0].id).toBe('available');
	});

	it('passes currentMessage through to condition checks', () => {
		const state = makeState();
		const events: EventDefinition[] = [
			makeEvent({
				id: 'keyword_event',
				conditions: [{ type: 'keyword_mentioned', value: 'birthday' }]
			})
		];
		const triggered = checkAllEvents(events, state, [], 'Happy birthday!');
		expect(triggered).toHaveLength(1);

		const notTriggered = checkAllEvents(events, state, [], 'Hello there');
		expect(notTriggered).toHaveLength(0);
	});

	it('handles empty events array', () => {
		const state = makeState();
		const triggered = checkAllEvents([], state, []);
		expect(triggered).toHaveLength(0);
	});
});
