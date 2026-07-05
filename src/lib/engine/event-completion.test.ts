import test from 'node:test';
import assert from 'node:assert/strict';

import { completionMarkers, reconcileLegacyMarkers } from './event-completion.ts';
import { calculateStage } from './stages.ts';
import { romanticEvents } from '../data/events/romantic.ts';
import type { EventDefinition } from '$lib/types/events';
import type { CharacterState } from '$lib/types/character';

const confession = romanticEvents.find((e) => e.id === 'confession_event') as EventDefinition;
const confessionRevisit = romanticEvents.find((e) => e.id === 'confession_revisit') as EventDefinition;
const commitmentTalk = romanticEvents.find((e) => e.id === 'commitment_discussion') as EventDefinition;
const commitmentRevisit = romanticEvents.find((e) => e.id === 'commitment_revisit') as EventDefinition;

// Stats high enough for every stage's numeric floor, so only event markers gate
const maxedState = {
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
	const events = ['first_deep_conversation', 'shared_vulnerability'];
	// Before accepting the confession, dating is unreachable (this was the deadlock)
	assert.equal(calculateStage(maxedState, events), 'romantic_interest');

	// Completing the confession with the accept choice records confession_accepted
	const afterConfession = [...events, ...completionMarkers(confession, 0)];
	assert.equal(calculateStage(maxedState, afterConfession), 'dating');
});

test('accepting the confession revisit unlocks dating after an earlier decline', () => {
	// The player deferred the original confession: they hold confession_event +
	// confession_delayed but not the accept marker, so dating is still locked.
	const declined = [
		'first_deep_conversation',
		'shared_vulnerability',
		...completionMarkers(confession, 1)
	];
	assert.equal(calculateStage(maxedState, declined), 'romantic_interest');

	// Choice 0 of the revisit is the accept path -> confession_accepted
	const markers = completionMarkers(confessionRevisit, 0);
	assert.ok(markers.includes('confession_accepted'));
	assert.equal(calculateStage(maxedState, [...declined, ...markers]), 'dating');
});

test('deferring the confession revisit records no accept marker', () => {
	assert.deepEqual(completionMarkers(confessionRevisit, 1), ['confession_revisit']);
});

test('accepting the commitment talk records commitment_accepted; declining does not', () => {
	assert.ok(completionMarkers(commitmentTalk, 0).includes('commitment_accepted'));
	assert.deepEqual(completionMarkers(commitmentTalk, 1), ['commitment_discussion']);
});

test('declining the commitment talk no longer unlocks committed', () => {
	const base = [
		'first_deep_conversation',
		'shared_vulnerability',
		'confession_event',
		'confession_accepted'
	];
	// Decline: only the event id lands, committed stays locked
	const afterDecline = [...base, ...completionMarkers(commitmentTalk, 1)];
	assert.equal(calculateStage(maxedState, afterDecline), 'dating');

	// Accept (via the original talk or the revisit) unlocks it
	const afterAccept = [...base, ...completionMarkers(commitmentTalk, 0)];
	assert.equal(calculateStage(maxedState, afterAccept), 'committed');
	const afterRevisitAccept = [...afterDecline, ...completionMarkers(commitmentRevisit, 0)];
	assert.equal(calculateStage(maxedState, afterRevisitAccept), 'committed');
});

test('legacy committed saves are grandfathered into commitment_accepted', () => {
	const legacy = {
		relationshipStage: 'committed',
		completedEvents: ['commitment_discussion']
	} as unknown as CharacterState;
	assert.deepEqual(reconcileLegacyMarkers(legacy), ['commitment_discussion', 'commitment_accepted']);

	// A soulmate save stashed by Companion Mode counts too
	const stashed = {
		relationshipStage: 'companion',
		savedDatingSimStage: 'soulmate',
		completedEvents: ['commitment_discussion']
	} as unknown as CharacterState;
	assert.deepEqual(reconcileLegacyMarkers(stashed), ['commitment_discussion', 'commitment_accepted']);
});

test('reconcile is a no-op for saves below committed or already carrying the marker', () => {
	const stillDating = {
		relationshipStage: 'dating',
		completedEvents: ['commitment_discussion']
	} as unknown as CharacterState;
	assert.equal(reconcileLegacyMarkers(stillDating), null);

	const alreadyPatched = {
		relationshipStage: 'committed',
		completedEvents: ['commitment_discussion', 'commitment_accepted']
	} as unknown as CharacterState;
	assert.equal(reconcileLegacyMarkers(alreadyPatched), null);
});
