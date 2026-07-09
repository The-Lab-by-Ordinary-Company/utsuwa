import { clampPhysicsIntensity, PHYSICS_INTENSITY_DEFAULT } from '../engine/spring-physics.ts';
import {
	CAMERA_DEFAULTS,
	CAMERA_LIMITS,
	DEFAULT_CHAT_DISPLAY_MODE,
	DEFAULT_SIDEBAR_POSITION,
	type CameraSettings,
	type ChatDisplayMode,
	type SidebarPosition
} from './display-types.ts';

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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

export interface ParsedDisplaySettings {
	camera: CameraSettings;
	overlayCamera: CameraSettings;
	physicsIntensity: number;
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
			parsed = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			parsed = null;
		}
	} else if (raw && typeof raw === 'object') {
		parsed = raw as Record<string, unknown>;
	}

	if (!parsed) {
		return {
			camera: { ...CAMERA_DEFAULTS },
			overlayCamera: { ...CAMERA_DEFAULTS },
			physicsIntensity: PHYSICS_INTENSITY_DEFAULT,
			chatDisplayMode: DEFAULT_CHAT_DISPLAY_MODE,
			sidebarPosition: DEFAULT_SIDEBAR_POSITION
		};
	}

	let camera: CameraSettings;
	let overlayCamera: CameraSettings;

	if (parsed.camera && typeof parsed.camera === 'object') {
		camera = sanitizeCamera(parsed.camera as Partial<CameraSettings>);
		overlayCamera = sanitizeCamera((parsed.overlayCamera ?? parsed.camera) as Partial<CameraSettings>);
	} else if (typeof parsed.cameraDistance === 'number') {
		// Legacy setting predating auto-fit: old default distance was 2.0
		camera = sanitizeCamera({ zoom: 2.0 / parsed.cameraDistance });
		overlayCamera = { ...CAMERA_DEFAULTS };
	} else {
		camera = { ...CAMERA_DEFAULTS };
		overlayCamera = { ...CAMERA_DEFAULTS };
	}

	let physicsIntensity = PHYSICS_INTENSITY_DEFAULT;
	if (typeof parsed.physicsIntensity === 'number') {
		physicsIntensity = clampPhysicsIntensity(parsed.physicsIntensity);
	}

	const chatDisplayMode = isChatDisplayMode(parsed.chatDisplayMode)
		? parsed.chatDisplayMode
		: DEFAULT_CHAT_DISPLAY_MODE;

	const sidebarPosition = isSidebarPosition(parsed.sidebarPosition)
		? parsed.sidebarPosition
		: DEFAULT_SIDEBAR_POSITION;

	return { camera, overlayCamera, physicsIntensity, chatDisplayMode, sidebarPosition };
}
