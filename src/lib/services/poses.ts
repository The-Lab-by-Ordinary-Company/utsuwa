import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMAnimationLoaderPlugin, type VRMAnimation } from '@pixiv/three-vrm-animation';

// Pose catalog for photo mode. Poses ship as .vrma files listed in
// /static/poses/manifest.json, so adding one is a data change: drop the file,
// add an entry. Clips are model-specific (createVRMAnimationClip needs the
// VRM), so this service caches the parsed VRMAnimation per URL and lets the
// caller build the clip against whichever model is loaded.

export interface PoseEntry {
	id: string;
	name: string;
	file: string;
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

const animationCache = new Map<string, Promise<VRMAnimation>>();

export function loadPoseAnimation(file: string): Promise<VRMAnimation> {
	let cached = animationCache.get(file);
	if (!cached) {
		cached = new Promise<VRMAnimation>((resolve, reject) => {
			const loader = new GLTFLoader();
			loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
			loader.load(
				file,
				(gltf) => {
					const anims: VRMAnimation[] | undefined = gltf.userData.vrmAnimations;
					if (anims && anims.length > 0) {
						resolve(anims[0]);
					} else {
						reject(new Error(`No VRM animation in ${file}`));
					}
				},
				undefined,
				(error) => reject(error)
			);
		});
		cached.catch(() => animationCache.delete(file)); // failed loads retry
		animationCache.set(file, cached);
	}
	return cached;
}
