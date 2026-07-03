import test from 'node:test';
import assert from 'node:assert/strict';

import { completionMarkers } from './event-completion.ts';
import { calculateStage } from './stages.ts';
import { romanticEvents } from '../data/events/romantic.ts';
import type { EventDefinition } from '$lib/types/events';
import type { CharacterState } from '$lib/types/character';

const confession = romanticEvents.find((e) => e.id === 'confession_event') as EventDefinition;

test('an event with no choices records only its own id', () => {
	const event = { id: 'plain_event', type: 'conditional' } as EventDefinition;
	assert.deepEqual(completionMarkers(event), ['plain_event']);
	assert.deepEqual(completionMarkers(event, 0), ['plain_event']);
});

test('accepting the confession records the outcome marker that gates dating', () => {
	// Choice 0 is "I feel the same way." -> nextSceneId: confession_accepted
	const markers = completionMarkers(confession, 0);
	assert.ok(markers.includes('confession_event'));
	assert.ok(
		markers.includes('confession_accepted'),
		'accepting the confession must record confession_accepted so the dating stage can unlock'
	);
});

test('declining the confession does NOT record the dating-gate marker', () => {
	// Choice 1 is "I need time to think about this." -> nextSceneId: confession_delayed
	const markers = completionMarkers(confession, 1);
	assert.ok(markers.includes('confession_event'));
	assert.ok(!markers.includes('confession_accepted'));
});

test('a choice without a nextSceneId records only the event id', () => {
	// first_i_love_you has choices but no nextSceneId on them
	const iLoveYou = romanticEvents.find((e) => e.id === 'first_i_love_you') as EventDefinition;
	assert.deepEqual(completionMarkers(iLoveYou, 0), ['first_i_love_you']);
});

test('regression: accepting the confession actually unlocks the dating stage', () => {
	// Stats high enough for the dating gate, plus the two romantic_interest events
	const state = {
		affection: 1000,
		trust: 100,
		intimacy: 100,
		comfort: 100,
		respect: 100,
		daysKnown: 100,
		totalInteractions: 500,
		appMode: 'dating_sim',
		relationshipStage: 'romantic_interest'
	} as CharacterState;

	const events = ['first_deep_conversation', 'shared_vulnerability'];
	// Before accepting the confession, dating is unreachable (this was the deadlock)
	assert.equal(calculateStage(state, events), 'romantic_interest');

	// Completing the confession with the accept choice records confession_accepted
	const afterConfession = [...events, ...completionMarkers(confession, 0)];
	assert.equal(calculateStage(state, afterConfession), 'dating');
});
