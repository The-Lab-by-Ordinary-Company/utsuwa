// Spring-bone physics intensity mapping. Every VRM rig ships its own authored
// stiffness/gravity/drag per joint, so the intensity setting multiplies those
// base values rather than overwriting them with absolutes, and everything is
// clamped to ranges that stay numerically stable at both slider extremes.

export interface SpringJointParams {
	stiffness: number;
	gravityPower: number;
	dragForce: number;
}

export const PHYSICS_INTENSITY_MIN = 0.5;
export const PHYSICS_INTENSITY_MAX = 1.6;
export const PHYSICS_INTENSITY_DEFAULT = 1.0;

// Softer springs move more, so stiffness divides by intensity while gravity
// multiplies. Drag divides too (less damping = livelier), with a hard floor:
// zero drag lets a joint oscillate forever.
const DRAG_MIN = 0.05;
const DRAG_MAX = 1;
const GRAVITY_MAX = 10;

// Frames after a tab refocus or window drag can arrive with a huge delta,
// which launches spring bones violently. Clamping to a 30 fps step keeps the
// worst frame a physics solver ever sees boring.
export const FRAME_DELTA_MAX = 1 / 30;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function clampPhysicsIntensity(intensity: number): number {
	if (!Number.isFinite(intensity)) return PHYSICS_INTENSITY_DEFAULT;
	return clamp(intensity, PHYSICS_INTENSITY_MIN, PHYSICS_INTENSITY_MAX);
}

export function computeSpringJointParams(
	base: SpringJointParams,
	intensity: number
): SpringJointParams {
	const i = clampPhysicsIntensity(intensity);
	return {
		stiffness: Math.max(0, base.stiffness / i),
		gravityPower: clamp(base.gravityPower * i, 0, GRAVITY_MAX),
		dragForce: clamp(base.dragForce / i, DRAG_MIN, DRAG_MAX)
	};
}

export function clampFrameDelta(delta: number, max: number = FRAME_DELTA_MAX): number {
	if (Number.isNaN(delta) || delta < 0) return 0;
	return Math.min(delta, max);
}
