import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	computeSpringJointParams,
	clampFrameDelta,
	clampPhysicsIntensity,
	PHYSICS_INTENSITY_DEFAULT,
	PHYSICS_INTENSITY_MIN,
	PHYSICS_INTENSITY_MAX
} from './spring-physics.ts';

const base = { stiffness: 1.2, gravityPower: 0.1, dragForce: 0.4 };

test('intensity 1 returns the authored values unchanged', () => {
	const out = computeSpringJointParams(base, 1);
	assert.deepEqual(out, base);
});

test('higher intensity softens springs, raises gravity, lowers drag', () => {
	const out = computeSpringJointParams(base, 1.6);
	assert.ok(out.stiffness < base.stiffness);
	assert.ok(out.gravityPower > base.gravityPower);
	assert.ok(out.dragForce < base.dragForce);
});

test('lower intensity stiffens springs, lowers gravity, raises drag', () => {
	const out = computeSpringJointParams(base, 0.5);
	assert.ok(out.stiffness > base.stiffness);
	assert.ok(out.gravityPower < base.gravityPower);
	assert.ok(out.dragForce > base.dragForce);
});

test('multiplies authored values rather than overwriting with absolutes', () => {
	const stiffRig = { stiffness: 4, gravityPower: 0.5, dragForce: 0.9 };
	const softRig = { stiffness: 0.3, gravityPower: 0.02, dragForce: 0.2 };
	const stiffOut = computeSpringJointParams(stiffRig, 1.4);
	const softOut = computeSpringJointParams(softRig, 1.4);
	// The same intensity preserves each rig's relative tuning
	assert.ok(stiffOut.stiffness > softOut.stiffness);
	assert.ok(stiffOut.gravityPower > softOut.gravityPower);
	assert.equal(stiffOut.stiffness, stiffRig.stiffness / 1.4);
	assert.equal(softOut.gravityPower, softRig.gravityPower * 1.4);
});

test('drag stays inside its stable range', () => {
	// 0.9 / 0.5 would be 1.8: must clamp to 1
	const high = computeSpringJointParams({ ...base, dragForce: 0.9 }, 0.5);
	assert.equal(high.dragForce, 1);
	// 0.05 floor guards against zero-drag oscillation
	const low = computeSpringJointParams({ ...base, dragForce: 0.02 }, 1.6);
	assert.ok(low.dragForce >= 0.05);
});

test('degenerate authored values never produce NaN or negatives', () => {
	const zero = computeSpringJointParams({ stiffness: 0, gravityPower: 0, dragForce: 0 }, 1.6);
	assert.ok(Number.isFinite(zero.stiffness) && zero.stiffness >= 0);
	assert.ok(Number.isFinite(zero.gravityPower) && zero.gravityPower >= 0);
	assert.ok(Number.isFinite(zero.dragForce) && zero.dragForce >= 0.05);
});

test('does not mutate the authored base', () => {
	const authored = { stiffness: 1, gravityPower: 0.2, dragForce: 0.5 };
	const copy = { ...authored };
	computeSpringJointParams(authored, 1.5);
	assert.deepEqual(authored, copy);
});

test('intensity is clamped to the supported range', () => {
	assert.equal(clampPhysicsIntensity(0.1), PHYSICS_INTENSITY_MIN);
	assert.equal(clampPhysicsIntensity(5), PHYSICS_INTENSITY_MAX);
	assert.equal(clampPhysicsIntensity(NaN), PHYSICS_INTENSITY_DEFAULT);
	const out = computeSpringJointParams(base, 99);
	assert.equal(out.gravityPower, base.gravityPower * PHYSICS_INTENSITY_MAX);
});

test('clampFrameDelta passes normal frames and clamps stalls', () => {
	assert.equal(clampFrameDelta(1 / 60), 1 / 60);
	assert.equal(clampFrameDelta(0.5), 1 / 30);
	assert.equal(clampFrameDelta(5), 1 / 30);
});

test('clampFrameDelta guards degenerate deltas', () => {
	assert.equal(clampFrameDelta(-1), 0);
	assert.equal(clampFrameDelta(NaN), 0);
	assert.equal(clampFrameDelta(Infinity), 1 / 30);
});
