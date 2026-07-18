# Camera-Driven Spring Bone Impulse ("jiggle on orbit")

Date: 2026-07-18
Status: approved
Scope: PR 2 of 2 (follows the chat UX overhaul)

## Goal

Orbiting or dollying the camera should excite the VRM spring bones (hair,
chest, accessories) in the main view and in photo mode, so the model reads as
physical instead of frozen while the viewpoint moves.

## Decision (locked with CJ)

Scaled by the existing physics intensity setting. No new UI.

## Approach

VRM spring bones only react to bone movement, so camera motion produces no
force today. We inject one: each frame, compute the camera's angular and
positional velocity, derive a world-space impulse, and apply it to the spring
bone simulation scaled by `physicsIntensity`.

- Pure logic (`src/lib/engine/camera-impulse.ts`, TDD): given previous and
  current camera state (position, quaternion) and delta time, produce a
  clamped impulse vector. Dead zone for tiny drifts, cap for whip pans,
  exponential decay so the impulse settles instead of cutting.
- Integration: the scene's per-frame update applies the impulse to the spring
  bone manager before its update tick. Exact injection point against
  three-vrm's spring bone API (joint settings vs manual offset of joint
  initial state) is a short research spike at implementation start; the spec
  commits to behavior, not the mechanism.
- Photo mode shares the same scene loop, so it comes free. Verify explicitly
  in e2e.

## Testing

- TDD for the impulse math: dead zone, clamping, decay, intensity scaling,
  zero-delta safety.
- `pnpm test` and `pnpm check` clean.
- Live e2e: orbit in main view and in photo mode at intensity 0 (no effect),
  default, and max; confirm no drift or oscillation after the camera stops.
