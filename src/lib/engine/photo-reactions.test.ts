import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	stageTier,
	pickReaction,
	TOUCH_ZONES,
	REACTION_TIERS,
	type TouchZone
} from './photo-reactions.ts';

test('stages bucket into the expected tiers', () => {
	assert.equal(stageTier('companion'), 'companion');
	assert.equal(stageTier('stranger'), 'early');
	assert.equal(stageTier('acquaintance'), 'early');
	assert.equal(stageTier('friend'), 'warm');
	assert.equal(stageTier('close_friend'), 'warm');
	assert.equal(stageTier('romantic_interest'), 'romantic');
	assert.equal(stageTier('dating'), 'romantic');
	assert.equal(stageTier('committed'), 'romantic');
	assert.equal(stageTier('soulmate'), 'romantic');
});

test('every zone has a reaction in every tier', () => {
	for (const tier of REACTION_TIERS) {
		for (const zone of TOUCH_ZONES) {
			const r = pickReaction(zone as TouchZone, tier, 0);
			assert.ok(r.expressions.length > 0, `${tier}/${zone} has expression candidates`);
			assert.ok(r.weight > 0 && r.weight <= 1, `${tier}/${zone} weight in range`);
			assert.ok(r.impulse >= 0 && r.impulse <= 1, `${tier}/${zone} impulse in range`);
		}
	}
});

test('repeat taps escalate then cap', () => {
	const first = pickReaction('head', 'romantic', 0);
	const second = pickReaction('head', 'romantic', 1);
	const fifth = pickReaction('head', 'romantic', 4);
	assert.ok(second.weight >= first.weight);
	assert.ok(second.impulse >= first.impulse);
	assert.ok(fifth.weight <= 1 && fifth.impulse <= 1);
});

test('bold zones read flustered early and warmer later', () => {
	const early = pickReaction('hip', 'early', 0);
	const romantic = pickReaction('hip', 'romantic', 0);
	// Early stages get startled/indignant candidates, not coy ones
	assert.ok(early.expressions.some((e) => ['surprised', 'angry', 'sad'].includes(e)));
	// Romantic stages lead with the blushing/happy set and push more physics
	assert.ok(romantic.expressions.some((e) => ['shy', 'happy', 'relaxed'].includes(e)));
	assert.ok(romantic.impulse >= early.impulse);
});

test('companion tier stays friendly on every zone', () => {
	for (const zone of TOUCH_ZONES) {
		const r = pickReaction(zone as TouchZone, 'companion', 0);
		assert.ok(
			r.expressions.every((e) => ['happy', 'surprised', 'relaxed', 'neutral'].includes(e)),
			`companion/${zone} stays friendly`
		);
	}
});
