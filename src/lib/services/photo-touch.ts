import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import * as THREE from 'three';
import type { TouchZone } from '$lib/engine/photo-reactions';

// Buckets a raycast hit on the model into a coarse touch zone by finding the
// nearest mapped humanoid bone. Coarse is the point: reactions are staged per
// zone, not per bone, and unusual rigs only need these standard bones.

const ZONE_BONES: Array<{ bone: VRMHumanBoneName; zone: TouchZone }> = [
	{ bone: 'head', zone: 'head' },
	{ bone: 'neck', zone: 'face' },
	{ bone: 'leftShoulder', zone: 'shoulder' },
	{ bone: 'rightShoulder', zone: 'shoulder' },
	{ bone: 'leftUpperArm', zone: 'shoulder' },
	{ bone: 'rightUpperArm', zone: 'shoulder' },
	{ bone: 'chest', zone: 'torso' },
	{ bone: 'spine', zone: 'torso' },
	{ bone: 'hips', zone: 'hip' },
	{ bone: 'leftUpperLeg', zone: 'hip' },
	{ bone: 'rightUpperLeg', zone: 'hip' }
];

const scratch = new THREE.Vector3();

export function bucketTouchZone(vrm: VRM, hitPoint: THREE.Vector3): TouchZone | null {
	let best: { zone: TouchZone; distance: number } | null = null;
	for (const { bone, zone } of ZONE_BONES) {
		const node = vrm.humanoid.getNormalizedBoneNode(bone);
		if (!node) continue;
		node.getWorldPosition(scratch);
		const distance = scratch.distanceTo(hitPoint);
		if (!best || distance < best.distance) {
			best = { zone, distance };
		}
	}
	// A hit further than a meter from every mapped bone is scenery, not her
	if (!best || best.distance > 1) return null;
	return best.zone;
}
