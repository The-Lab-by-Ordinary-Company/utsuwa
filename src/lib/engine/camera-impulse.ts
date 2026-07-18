// Camera-driven spring bone excitation. Orbiting the camera produces no bone
// movement on its own, so the scene feeds camera angular velocity through a
// damped spring whose offset is applied as a small additive bone nudge each
// frame; the VRM's own spring bones then swing naturally from that movement.

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export interface CameraAngles {
	azimuth: number;
	polar: number;
}

export interface JiggleState {
	yaw: number;
	pitch: number;
	yawVel: number;
	pitchVel: number;
}

export const JIGGLE = {
	// rad/s of camera motion below which nothing reacts (mouse drift)
	deadZone: 0.15,
	// rad/s cap so a whip pan cannot inject unbounded energy
	maxVel: 8,
	// how strongly camera angular velocity accelerates the spring
	gain: 0.6,
	// spring constant and damping; damping is slightly under critical so the
	// settle has one soft overshoot, which reads as physical
	stiffness: 40,
	damping: 11,
	// hard cap on the additive rotation offset (radians)
	maxOffset: 0.09
} as const;

export function createJiggleState(): JiggleState {
	return { yaw: 0, pitch: 0, yawVel: 0, pitchVel: 0 };
}

export function cameraAngles(camera: Vec3, target: Vec3): CameraAngles {
	const dx = camera.x - target.x;
	const dy = camera.y - target.y;
	const dz = camera.z - target.z;
	const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
	return {
		azimuth: Math.atan2(dx, dz),
		polar: r > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, dy / r))) : 0
	};
}

const TWO_PI = Math.PI * 2;

function wrapAngle(a: number): number {
	// Map to [-PI, PI] so crossing the atan2 seam is a small delta
	return a - TWO_PI * Math.round(a / TWO_PI);
}

export function angularVelocity(
	prev: CameraAngles,
	current: CameraAngles,
	dt: number
): { yaw: number; pitch: number } {
	if (!(dt > 0)) return { yaw: 0, pitch: 0 };
	return {
		yaw: wrapAngle(current.azimuth - prev.azimuth) / dt,
		pitch: (current.polar - prev.polar) / dt
	};
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function applyDeadZone(v: number): number {
	return Math.abs(v) < JIGGLE.deadZone ? 0 : clamp(v, -JIGGLE.maxVel, JIGGLE.maxVel);
}

/**
 * Advance the damped spring one frame. `drive` is camera angular velocity in
 * rad/s; `intensity` is the physics intensity setting, which scales how much
 * energy the camera injects (never the spring's return to rest).
 */
export function stepJiggle(
	state: JiggleState,
	drive: { yaw: number; pitch: number },
	intensity: number,
	dt: number
): JiggleState {
	if (!(dt > 0)) return { ...state };
	// Large frame gaps (tab refocus) must not integrate into a violent kick
	const step = Math.min(dt, 1 / 30);

	const driveYaw = applyDeadZone(drive.yaw) * JIGGLE.gain * intensity * 0.01;
	const drivePitch = applyDeadZone(drive.pitch) * JIGGLE.gain * intensity * 0.01;

	const yawAcc = driveYaw / step - JIGGLE.stiffness * state.yaw - JIGGLE.damping * state.yawVel;
	const pitchAcc =
		drivePitch / step - JIGGLE.stiffness * state.pitch - JIGGLE.damping * state.pitchVel;

	const yawVel = state.yawVel + yawAcc * step;
	const pitchVel = state.pitchVel + pitchAcc * step;

	return {
		yaw: clamp(state.yaw + yawVel * step, -JIGGLE.maxOffset, JIGGLE.maxOffset),
		pitch: clamp(state.pitch + pitchVel * step, -JIGGLE.maxOffset, JIGGLE.maxOffset),
		yawVel,
		pitchVel
	};
}
