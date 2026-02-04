import { isTauri } from './platform';

export interface WindowPosition {
	x: number;
	y: number;
}

export interface WindowSize {
	width: number;
	height: number;
}

/**
 * Set window position (Tauri only, no-op on web)
 */
export async function setWindowPosition(position: WindowPosition): Promise<void> {
	if (!isTauri()) return;

	const { getCurrentWindow, PhysicalPosition } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	await window.setPosition(new PhysicalPosition(position.x, position.y));
}

/**
 * Get current window position (Tauri only, returns null on web)
 */
export async function getWindowPosition(): Promise<WindowPosition | null> {
	if (!isTauri()) return null;

	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	const position = await window.outerPosition();
	return { x: position.x, y: position.y };
}

/**
 * Set whether the window should ignore cursor events (for click-through)
 * Tauri only, no-op on web
 */
export async function setIgnoreCursorEvents(ignore: boolean): Promise<void> {
	if (!isTauri()) return;

	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	await window.setIgnoreCursorEvents(ignore);
}

/**
 * Set window always on top state (Tauri only, no-op on web)
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
	if (!isTauri()) return;

	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	await window.setAlwaysOnTop(alwaysOnTop);
}

/**
 * Show/hide the window (Tauri only, no-op on web)
 */
export async function setWindowVisible(visible: boolean): Promise<void> {
	if (!isTauri()) return;

	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	if (visible) {
		await window.show();
	} else {
		await window.hide();
	}
}

/**
 * Start dragging the window (Tauri only, no-op on web)
 * Call this on mousedown to enable window dragging
 */
export async function startDragging(): Promise<void> {
	if (!isTauri()) return;

	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const window = getCurrentWindow();
	await window.startDragging();
}
