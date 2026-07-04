import { browser } from '$app/environment';

const STORAGE_KEY = 'utsuwa-display';

export interface CameraSettings {
	/** Vertical field of view in degrees */
	fov: number;
	/** Multiplier on the auto-fitted distance: >1 is closer, <1 is farther */
	zoom: number;
	/** Vertical offset in meters added to the auto-fitted look-at target */
	height: number;
}

export type CameraProfile = 'main' | 'overlay';

export const CAMERA_DEFAULTS: CameraSettings = { fov: 35, zoom: 1, height: 0 };

export const CAMERA_LIMITS = {
	fov: { min: 20, max: 60 },
	zoom: { min: 0.5, max: 2.5 },
	height: { min: -0.5, max: 0.5 }
} as const;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function sanitize(raw: Partial<CameraSettings> | undefined): CameraSettings {
	return {
		fov: clamp(raw?.fov ?? CAMERA_DEFAULTS.fov, CAMERA_LIMITS.fov.min, CAMERA_LIMITS.fov.max),
		zoom: clamp(raw?.zoom ?? CAMERA_DEFAULTS.zoom, CAMERA_LIMITS.zoom.min, CAMERA_LIMITS.zoom.max),
		height: clamp(
			raw?.height ?? CAMERA_DEFAULTS.height,
			CAMERA_LIMITS.height.min,
			CAMERA_LIMITS.height.max
		)
	};
}

function createDisplayStore() {
	// The main scene and the desktop overlay window frame very differently,
	// so each keeps its own camera profile
	let camera = $state<CameraSettings>({ ...CAMERA_DEFAULTS });
	let overlayCamera = $state<CameraSettings>({ ...CAMERA_DEFAULTS });

	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed.camera) {
					camera = sanitize(parsed.camera);
					overlayCamera = sanitize(parsed.overlayCamera);
				}
				// Legacy setting predating auto-fit: old default distance was 2.0
				else if (typeof parsed.cameraDistance === 'number') {
					camera = sanitize({ zoom: 2.0 / parsed.cameraDistance });
				}
			} catch (e) {
				console.error('Failed to load display settings:', e);
			}
		}
	}

	function save() {
		if (browser) {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					camera: $state.snapshot(camera),
					overlayCamera: $state.snapshot(overlayCamera)
				})
			);
		}
	}

	function setCamera(update: Partial<CameraSettings>, profile: CameraProfile = 'main') {
		const current = profile === 'overlay' ? overlayCamera : camera;
		const next = sanitize({ ...current, ...update });
		if (profile === 'overlay') {
			overlayCamera = next;
		} else {
			camera = next;
		}
		save();
	}

	function resetCamera(profile: CameraProfile = 'main') {
		if (profile === 'overlay') {
			overlayCamera = { ...CAMERA_DEFAULTS };
		} else {
			camera = { ...CAMERA_DEFAULTS };
		}
		save();
	}

	return {
		get camera() {
			return camera;
		},
		get overlayCamera() {
			return overlayCamera;
		},
		setCamera,
		resetCamera
	};
}

export const displayStore = createDisplayStore();
