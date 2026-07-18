import test from 'node:test';
import assert from 'node:assert/strict';

import {
	cameraAngles,
	angularVelocity,
	stepJiggle,
	createJiggleState,
	JIGGLE
} from './camera-impulse.ts';

test('cameraAngles derives azimuth and polar from camera position', () => {
	// Camera on +z axis looking at origin: azimuth 0, polar ~PI/2
	const a = cameraAngles({ x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: 0 });
	assert.equal(a.azimuth, 0);
	assert.ok(Math.abs(a.polar - Math.PI / 2) < 1e-9);
	// Camera on +x axis: azimuth PI/2
	const b = cameraAngles({ x: 2, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
	assert.ok(Math.abs(b.azimuth - Math.PI / 2) < 1e-9);
});

test('angularVelocity is zero for identical frames and guards bad dt', () => {
	const a = { azimuth: 1, polar: 1.5 };
	assert.deepEqual(angularVelocity(a, a, 1 / 60), { yaw: 0, pitch: 0 });
	assert.deepEqual(angularVelocity(a, { azimuth: 2, polar: 1 }, 0), { yaw: 0, pitch: 0 });
	assert.deepEqual(angularVelocity(a, { azimuth: 2, polar: 1 }, -1), { yaw: 0, pitch: 0 });
});

test('angularVelocity wraps the azimuth seam without spiking', () => {
	// Crossing from just below PI to just above -PI is a tiny move, not a full turn
	const v = angularVelocity(
		{ azimuth: Math.PI - 0.01, polar: 1.5 },
		{ azimuth: -Math.PI + 0.01, polar: 1.5 },
		1 / 60
	);
	assert.ok(Math.abs(v.yaw) < 2);
});

test('drives below the dead zone leave the state at rest', () => {
	const state = createJiggleState();
	const next = stepJiggle(state, { yaw: JIGGLE.deadZone * 0.5, pitch: 0 }, 1.0, 1 / 60);
	assert.equal(next.yaw, 0);
	assert.equal(next.yawVel, 0);
});

test('a strong drive deflects the state and it decays back to rest', () => {
	let state = createJiggleState();
	state = stepJiggle(state, { yaw: 3, pitch: 0 }, 1.0, 1 / 60);
	assert.ok(state.yawVel !== 0);
	// Let it ring down with no further drive
	for (let i = 0; i < 600; i++) {
		state = stepJiggle(state, { yaw: 0, pitch: 0 }, 1.0, 1 / 60);
	}
	assert.ok(Math.abs(state.yaw) < 1e-4);
	assert.ok(Math.abs(state.yawVel) < 1e-4);
});

test('offset never exceeds the clamp even under a whip pan', () => {
	let state = createJiggleState();
	for (let i = 0; i < 120; i++) {
		state = stepJiggle(state, { yaw: 1000, pitch: -1000 }, 1.6, 1 / 60);
		assert.ok(Math.abs(state.yaw) <= JIGGLE.maxOffset + 1e-9);
		assert.ok(Math.abs(state.pitch) <= JIGGLE.maxOffset + 1e-9);
	}
});

test('intensity scales the response monotonically', () => {
	const drive = { yaw: 2, pitch: 0 };
	const low = stepJiggle(createJiggleState(), drive, 0.5, 1 / 60);
	const high = stepJiggle(createJiggleState(), drive, 1.6, 1 / 60);
	assert.ok(Math.abs(high.yawVel) > Math.abs(low.yawVel));
});

test('zero and negative dt are inert', () => {
	const state = stepJiggle(createJiggleState(), { yaw: 5, pitch: 5 }, 1.0, 0);
	assert.deepEqual(state, createJiggleState());
});
