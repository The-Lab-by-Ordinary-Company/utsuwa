import { type VRMAnimation } from '@pixiv/three-vrm-animation';
import { loadVrmAnimation } from './vrm-animations.ts';

// Pose catalog for photo mode. Poses ship as .vrma files listed in
// /static/poses/manifest.json, so adding one is a data change: drop the file,
// add an entry. Caching lives in vrm-animations, shared with the idle loop.

export interface PoseEntry {
	id: string;
	name: string;
	file: string;
	// Where in the clip to freeze, as a fraction of its duration (default 0).
	// Motion clips read best held mid-gesture, not at their neutral first frame.
	hold?: number;
	thumbnail?: string;
}

let manifestPromise: Promise<PoseEntry[]> | null = null;

export function loadPoseManifest(): Promise<PoseEntry[]> {
	if (!manifestPromise) {
		manifestPromise = fetch('/poses/manifest.json')
			.then((res) => {
				if (!res.ok) throw new Error(`Pose manifest: ${res.status}`);
				return res.json();
			})
			.then((entries: PoseEntry[]) =>
				entries.filter((e) => e && typeof e.id === 'string' && typeof e.file === 'string')
			)
			.catch((e) => {
				console.error('[Poses] Failed to load manifest:', e);
				manifestPromise = null; // allow a retry on next open
				return [];
			});
	}
	return manifestPromise;
}

export function loadPoseAnimation(file: string): Promise<VRMAnimation> {
	return loadVrmAnimation(file);
}
