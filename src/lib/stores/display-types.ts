export interface CameraSettings {
	/** Vertical field of view in degrees */
	fov: number;
	/** Multiplier on the auto-fitted distance: >1 is closer, <1 is farther */
	zoom: number;
	/** Vertical offset in meters added to the auto-fitted look-at target */
	height: number;
}

export type CameraProfile = 'main' | 'overlay';
export type ChatDisplayMode = 'bubble' | 'sidebar' | 'both' | 'off';
export type SidebarPosition = 'left' | 'right';

export const CAMERA_DEFAULTS: CameraSettings = { fov: 35, zoom: 1, height: 0 };
export const DEFAULT_CHAT_DISPLAY_MODE: ChatDisplayMode = 'bubble';
export const DEFAULT_SIDEBAR_POSITION: SidebarPosition = 'right';
export const DEFAULT_WAIT_TONE_ENABLED = false;

export const CAMERA_LIMITS = {
	fov: { min: 20, max: 60 },
	zoom: { min: 0.5, max: 2.5 },
	height: { min: -0.5, max: 0.5 }
} as const;
