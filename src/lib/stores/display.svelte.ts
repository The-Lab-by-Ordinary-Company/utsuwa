import { browser } from '$app/environment';

const STORAGE_KEY = 'utsuwa-display';
const DEFAULT_CAMERA_DISTANCE = 2.6;

function createDisplayStore() {
	let cameraDistance = $state(DEFAULT_CAMERA_DISTANCE);

	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				cameraDistance = parsed.cameraDistance ?? DEFAULT_CAMERA_DISTANCE;
			} catch (e) {
				console.error('Failed to load display settings:', e);
			}
		}
	}

	function save() {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ cameraDistance }));
		}
	}

	function setCameraDistance(distance: number) {
		cameraDistance = Math.max(1.0, Math.min(4.0, distance));
		save();
	}

	return {
		get cameraDistance() {
			return cameraDistance;
		},
		setCameraDistance
	};
}

export const displayStore = createDisplayStore();
