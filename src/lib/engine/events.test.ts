import test from 'node:test';
import assert from 'node:assert/strict';

import { checkAllEvents, checkEvent } from './event-matching.ts';
import { romanticEvents } from '../data/events/romantic.ts';
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

// --- Confession revisit: the deadlock fix, exercised with the real event data ---

const confession = romanticEvents.find((e) => e.id === 'confession_event') as EventDefinition;
const revisit = romanticEvents.find((e) => e.id === 'confession_revisit') as EventDefinition;

function daysAgo(days: number): Date {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// A player who deferred the confession: markers from the decline choice,
// stats recovered back above the confession floor.
function declinedState(overrides: Partial<CharacterState> = {}): CharacterState {
	return makeState({
		affection: 520,
		trust: 82,
		intimacy: 45,
		relationshipStage: 'romantic_interest',
		completedEvents: ['first_deep_conversation', 'confession_event', 'confession_delayed'],
		...overrides
	});
}

test('after declining, the one-time confession stays blocked but the revisit is eligible', () => {
	const dbRecords = [
		{ eventId: 'confession_event', completedAt: daysAgo(5) } as unknown as CompletedEventRecord
	];
	const state = declinedState();

	// The original is oneTime and already recorded — permanently on cooldown.
	assert.equal(checkEvent(confession, state, dbRecords).triggered, false);

	// The revisit picks it up: this is what un-deadlocks the dating stage.
	assert.equal(checkEvent(revisit, state, dbRecords).triggered, true);
	const triggered = checkAllEvents(romanticEvents, state, dbRecords);
	assert.deepEqual(
		triggered.map((e) => e.id),
		['confession_revisit']
	);
});

test('the revisit does not fire before the player has ever deferred', () => {
	const state = declinedState({
		completedEvents: ['first_deep_conversation']
	});
	assert.equal(checkEvent(revisit, state, []).triggered, false);
});

test('the revisit retires once the confession is accepted', () => {
	const state = declinedState({
		completedEvents: [
			'first_deep_conversation',
			'confession_event',
			'confession_delayed',
			'confession_revisit',
			'confession_accepted'
		]
	});
	const dbRecords = [
		{ eventId: 'confession_event', completedAt: daysAgo(9) } as unknown as CompletedEventRecord,
		{ eventId: 'confession_revisit', completedAt: daysAgo(5) } as unknown as CompletedEventRecord
	];
	assert.equal(checkEvent(revisit, state, dbRecords).triggered, false);
});

test('deferring the revisit only puts it on cooldown, never locks it out', () => {
	const state = declinedState({
		completedEvents: [
			'first_deep_conversation',
			'confession_event',
			'confession_delayed',
			'confession_revisit'
		]
	});

	// Deferred the revisit yesterday: within cooldownDays, so not yet
	const recent = [
		{ eventId: 'confession_revisit', completedAt: daysAgo(1) } as unknown as CompletedEventRecord
	];
	assert.equal(checkEvent(revisit, state, recent).triggered, false);

	// Once the cooldown lapses she brings it up again
	const lapsed = [
		{ eventId: 'confession_revisit', completedAt: daysAgo(4) } as unknown as CompletedEventRecord
	];
	assert.equal(checkEvent(revisit, state, lapsed).triggered, true);
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
