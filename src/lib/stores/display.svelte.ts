import { browser } from '$app/environment';
import { clampPhysicsIntensity, PHYSICS_INTENSITY_DEFAULT } from '../engine/spring-physics.ts';
import {
	CAMERA_DEFAULTS,
	CAMERA_LIMITS,
	DEFAULT_CHAT_DISPLAY_MODE,
	DEFAULT_SIDEBAR_POSITION,
	type CameraSettings,
	type CameraProfile,
	type ChatDisplayMode,
	type SidebarPosition
} from './display-types';
import { parseDisplaySettings, sanitizeCamera } from './display-parser';
import {
	resetChatDisplay as computeResetChatDisplay,
	setChatDisplayMode as computeSetChatDisplayMode,
	setSidebarPosition as computeSetSidebarPosition
} from './display-store-logic';

const STORAGE_KEY = 'utsuwa-display';

export type { CameraSettings, CameraProfile, ChatDisplayMode, SidebarPosition };
export { CAMERA_DEFAULTS, CAMERA_LIMITS, DEFAULT_CHAT_DISPLAY_MODE, DEFAULT_SIDEBAR_POSITION };

function createDisplayStore() {
	// The main scene and the desktop overlay window frame very differently,
	// so each keeps its own camera profile
	let camera = $state<CameraSettings>({ ...CAMERA_DEFAULTS });
	let overlayCamera = $state<CameraSettings>({ ...CAMERA_DEFAULTS });
	// One physics intensity for both surfaces: it's a model-feel setting, not framing
	let physicsIntensity = $state(PHYSICS_INTENSITY_DEFAULT);

	// Chat display mode and sidebar docking
	let chatDisplayMode = $state<ChatDisplayMode>(DEFAULT_CHAT_DISPLAY_MODE);
	let sidebarPosition = $state<SidebarPosition>(DEFAULT_SIDEBAR_POSITION);

	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = parseDisplaySettings(saved);
			camera = parsed.camera;
			overlayCamera = parsed.overlayCamera;
			physicsIntensity = parsed.physicsIntensity;
			chatDisplayMode = parsed.chatDisplayMode;
			sidebarPosition = parsed.sidebarPosition;
		}
	}

	function save() {
		if (browser) {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					camera: $state.snapshot(camera),
					overlayCamera: $state.snapshot(overlayCamera),
					physicsIntensity,
					chatDisplayMode,
					sidebarPosition
				})
			);
		}
	}

	function setCamera(update: Partial<CameraSettings>, profile: CameraProfile = 'main') {
		const current = profile === 'overlay' ? overlayCamera : camera;
		const next = sanitizeCamera({ ...current, ...update });
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

	function setPhysicsIntensity(value: number) {
		physicsIntensity = clampPhysicsIntensity(value);
		save();
	}

	function setChatDisplayMode(mode: ChatDisplayMode) {
		const next = computeSetChatDisplayMode({ chatDisplayMode, sidebarPosition }, mode);
		chatDisplayMode = next.chatDisplayMode;
		sidebarPosition = next.sidebarPosition;
		save();
	}

	function setSidebarPosition(pos: SidebarPosition) {
		const next = computeSetSidebarPosition({ chatDisplayMode, sidebarPosition }, pos);
		chatDisplayMode = next.chatDisplayMode;
		sidebarPosition = next.sidebarPosition;
		save();
	}

	function resetChatDisplay() {
		const next = computeResetChatDisplay();
		chatDisplayMode = next.chatDisplayMode;
		sidebarPosition = next.sidebarPosition;
		save();
	}

	return {
		get camera() {
			return camera;
		},
		get overlayCamera() {
			return overlayCamera;
		},
		get physicsIntensity() {
			return physicsIntensity;
		},
		get chatDisplayMode() {
			return chatDisplayMode;
		},
		get sidebarPosition() {
			return sidebarPosition;
		},
		setCamera,
		resetCamera,
		setPhysicsIntensity,
		setChatDisplayMode,
		setSidebarPosition,
		resetChatDisplay
	};
}

export const displayStore = createDisplayStore();
