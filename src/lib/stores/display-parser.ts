import { clampPhysicsIntensity, PHYSICS_INTENSITY_DEFAULT } from '../engine/spring-physics.ts';
import {
	sanitizeSceneBackground,
	type SceneBackground
} from '../services/scene-backgrounds.ts';
import {
	CAMERA_DEFAULTS,
	CAMERA_LIMITS,
	DEFAULT_CHAT_DISPLAY_MODE,
	DEFAULT_SIDEBAR_POSITION,
	type CameraSettings,
	type ChatDisplayMode,
	type SidebarPosition
} from './display-types.ts';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function sanitizeCamera(raw: Partial<CameraSettings> | undefined): CameraSettings {
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

function isChatDisplayMode(value: unknown): value is ChatDisplayMode {
	return value === 'bubble' || value === 'sidebar' || value === 'both' || value === 'off';
}

function isSidebarPosition(value: unknown): value is SidebarPosition {
	return value === 'left' || value === 'right';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export interface ParsedDisplaySettings {
	camera: CameraSettings;
	overlayCamera: CameraSettings;
	physicsIntensity: number;
	sceneBackground: SceneBackground;
	chatDisplayMode: ChatDisplayMode;
	sidebarPosition: SidebarPosition;
}

/**
 * Parse a raw JSON value from localStorage into a validated display settings object.
 * Unknown or missing fields are replaced with sensible defaults.
 */
export function parseDisplaySettings(raw: unknown): ParsedDisplaySettings {
	let parsed: Record<string, unknown> | null = null;
	if (typeof raw === 'string') {
		try {
			const parsedValue = JSON.parse(raw);
			parsed = isPlainObject(parsedValue) ? parsedValue : null;
		} catch (e) {
			console.warn('Failed to parse display settings, falling back to defaults:', e);
			parsed = null;
		}
	} else if (isPlainObject(raw)) {
		parsed = raw;
	}

	if (!parsed) {
		return {
			camera: { ...CAMERA_DEFAULTS },
			overlayCamera: { ...CAMERA_DEFAULTS },
			physicsIntensity: PHYSICS_INTENSITY_DEFAULT,
			sceneBackground: sanitizeSceneBackground(undefined),
			chatDisplayMode: DEFAULT_CHAT_DISPLAY_MODE,
			sidebarPosition: DEFAULT_SIDEBAR_POSITION
		};
	}

	let camera: CameraSettings;
	let overlayCamera: CameraSettings;

	if (parsed.camera && typeof parsed.camera === 'object') {
		camera = sanitizeCamera(parsed.camera as Partial<CameraSettings>);
		// If only the main camera is stored, mirror it to the overlay so both
		// surfaces start with the same look instead of silently resetting one.
		overlayCamera =
			parsed.overlayCamera && typeof parsed.overlayCamera === 'object'
				? sanitizeCamera(parsed.overlayCamera as Partial<CameraSettings>)
				: { ...camera };
	} else if (typeof parsed.cameraDistance === 'number') {
		// Legacy setting predating auto-fit: old default distance was 2.0
		const legacyCamera = sanitizeCamera({ zoom: 2.0 / parsed.cameraDistance });
		camera = legacyCamera;
		overlayCamera = { ...legacyCamera };
	} else {
		camera = { ...CAMERA_DEFAULTS };
		overlayCamera = { ...CAMERA_DEFAULTS };
	}

	let physicsIntensity = PHYSICS_INTENSITY_DEFAULT;
	if (typeof parsed.physicsIntensity === 'number') {
		physicsIntensity = clampPhysicsIntensity(parsed.physicsIntensity);
	}

	const sceneBackground = sanitizeSceneBackground(parsed.sceneBackground);

	const chatDisplayMode = isChatDisplayMode(parsed.chatDisplayMode)
		? parsed.chatDisplayMode
		: DEFAULT_CHAT_DISPLAY_MODE;

	const sidebarPosition = isSidebarPosition(parsed.sidebarPosition)
		? parsed.sidebarPosition
		: DEFAULT_SIDEBAR_POSITION;

	return { camera, overlayCamera, physicsIntensity, sceneBackground, chatDisplayMode, sidebarPosition };
}
