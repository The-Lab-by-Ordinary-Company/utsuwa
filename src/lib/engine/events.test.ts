import test from 'node:test';
import assert from 'node:assert/strict';

import { checkAllEvents, checkEvent } from './event-matching.ts';
import type { EventDefinition, CompletedEventRecord } from '$lib/types/events';
import type { CharacterState } from '$lib/types/character';

// Minimal state factory — only the fields the event engine reads.
function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	return {
		affection: 50,
		trust: 50,
		intimacy: 50,
		comfort: 50,
		respect: 50,
		energy: 100,
		relationshipStage: 'dating',
		daysKnown: 10,
		totalInteractions: 100,
		currentStreak: 3,
		mood: { primary: 'happy', intensity: 50 },
		lastInteraction: new Date(),
		completedEvents: [],
		...(overrides as object)
	} as unknown as CharacterState;
}

const gatedEvent: EventDefinition = {
	id: 'post_confession_event',
	type: 'conditional',
	priority: 10,
	conditions: [{ type: 'event_completed', value: 'confession_accepted' }],
	cooldownHours: 0
} as unknown as EventDefinition;

const blockedEvent: EventDefinition = {
	id: 'pre_confession_event',
	type: 'conditional',
	priority: 10,
	conditions: [{ type: 'event_not_completed', value: 'confession_accepted' }],
	cooldownHours: 0
} as unknown as EventDefinition;

test('event gated on an outcome marker triggers when the marker is only in state.completedEvents', () => {
	// The outcome marker lives in state (from completionMarkers), NOT in the DB
	// records — this is exactly the case the two-store split used to break.
	const state = makeState({ completedEvents: ['confession_event', 'confession_accepted'] });
	const dbRecords: CompletedEventRecord[] = []; // empty DB history

	const result = checkEvent(gatedEvent, state, dbRecords);
	assert.equal(result.triggered, true, 'event_completed on an outcome marker must see the state marker');
});

test('event_not_completed on an outcome marker is correctly blocked once the marker is set', () => {
	const state = makeState({ completedEvents: ['confession_event', 'confession_accepted'] });
	const result = checkEvent(blockedEvent, state, []);
	assert.equal(result.triggered, false, 'the marker being present must block event_not_completed');
});

test('event_not_completed passes when the outcome marker is absent', () => {
	const state = makeState({ completedEvents: [] });
	const result = checkEvent(blockedEvent, state, []);
	assert.equal(result.triggered, true);
});

test('checkAllEvents unions state markers with DB record ids', () => {
	// event id only in DB, outcome marker only in state — both must count.
	const state = makeState({ completedEvents: ['confession_accepted'] });
	const dbRecords = [{ eventId: 'confession_event', completedAt: new Date() } as unknown as CompletedEventRecord];

	const gatedOnDbId: EventDefinition = {
		id: 'needs_both',
		type: 'conditional',
		priority: 5,
		conditions: [
			{ type: 'event_completed', value: 'confession_event' },
			{ type: 'event_completed', value: 'confession_accepted' }
		],
		cooldownHours: 0
	} as unknown as EventDefinition;

	const triggered = checkAllEvents([gatedOnDbId], state, dbRecords);
	assert.equal(triggered.length, 1, 'a DB-id condition and a state-marker condition must both resolve true');
});
