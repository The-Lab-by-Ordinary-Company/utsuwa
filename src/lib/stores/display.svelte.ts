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

export const CAMERA_DEFAULTS: CameraSettings = { fov: 35, zoom: 1, height: 0 };

export const CAMERA_LIMITS = {
	fov: { min: 20, max: 60 },
	zoom: { min: 0.5, max: 2.5 },
	height: { min: -0.5, max: 0.5 }
} as const;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function createDisplayStore() {
	let camera = $state<CameraSettings>({ ...CAMERA_DEFAULTS });

	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed.camera) {
					camera = {
						fov: clamp(parsed.camera.fov ?? CAMERA_DEFAULTS.fov, CAMERA_LIMITS.fov.min, CAMERA_LIMITS.fov.max),
						zoom: clamp(parsed.camera.zoom ?? CAMERA_DEFAULTS.zoom, CAMERA_LIMITS.zoom.min, CAMERA_LIMITS.zoom.max),
						height: clamp(parsed.camera.height ?? CAMERA_DEFAULTS.height, CAMERA_LIMITS.height.min, CAMERA_LIMITS.height.max)
					};
				}
				// Legacy setting predating auto-fit: old default distance was 2.0
				else if (typeof parsed.cameraDistance === 'number') {
					camera = {
						...CAMERA_DEFAULTS,
						zoom: clamp(2.0 / parsed.cameraDistance, CAMERA_LIMITS.zoom.min, CAMERA_LIMITS.zoom.max)
					};
				}
			} catch (e) {
				console.error('Failed to load display settings:', e);
			}
		}
	}

	function save() {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ camera: $state.snapshot(camera) }));
		}
	}

	function setCamera(update: Partial<CameraSettings>) {
		camera = {
			fov: clamp(update.fov ?? camera.fov, CAMERA_LIMITS.fov.min, CAMERA_LIMITS.fov.max),
			zoom: clamp(update.zoom ?? camera.zoom, CAMERA_LIMITS.zoom.min, CAMERA_LIMITS.zoom.max),
			height: clamp(update.height ?? camera.height, CAMERA_LIMITS.height.min, CAMERA_LIMITS.height.max)
		};
		save();
	}

	function resetCamera() {
		camera = { ...CAMERA_DEFAULTS };
		save();
	}

	return {
		get camera() {
			return camera;
		},
		setCamera,
		resetCamera
	};
}

export const displayStore = createDisplayStore();
