import { isTauri } from './platform';

export type HotkeyAction = 'pushToTalk' | 'toggleOverlay' | 'focusChat';

export interface HotkeyConfig {
	pushToTalk: string;
	toggleOverlay: string;
	focusChat: string;
}

export const DEFAULT_HOTKEYS: HotkeyConfig = {
	pushToTalk: 'Ctrl+Shift+Space',
	toggleOverlay: 'Ctrl+Shift+U',
	focusChat: 'Ctrl+Shift+C'
};

type HotkeyHandler = () => void;
type KeyUpHandler = () => void;

const handlers: Map<HotkeyAction, { onKeyDown: HotkeyHandler; onKeyUp?: KeyUpHandler }> = new Map();
const registeredShortcuts: Set<string> = new Set();

/**
 * Register a global hotkey handler (Tauri only, no-op on web)
 * For push-to-talk, provide both onKeyDown and onKeyUp handlers
 */
export async function registerHotkey(
	action: HotkeyAction,
	shortcut: string,
	onKeyDown: HotkeyHandler,
	onKeyUp?: KeyUpHandler
): Promise<boolean> {
	if (!isTauri()) return false;

	try {
		const { register } = await import('@tauri-apps/plugin-global-shortcut');

		// Unregister existing shortcut for this action if any
		await unregisterHotkey(action);

		await register(shortcut, (event) => {
			const handler = handlers.get(action);
			if (!handler) return;

			if (event.state === 'Pressed') {
				handler.onKeyDown();
			} else if (event.state === 'Released' && handler.onKeyUp) {
				handler.onKeyUp();
			}
		});

		handlers.set(action, { onKeyDown, onKeyUp });
		registeredShortcuts.add(shortcut);
		return true;
	} catch (e) {
		console.error(`Failed to register hotkey ${shortcut}:`, e);
		return false;
	}
}

/**
 * Unregister a global hotkey (Tauri only, no-op on web)
 */
export async function unregisterHotkey(action: HotkeyAction): Promise<void> {
	if (!isTauri()) return;

	const handler = handlers.get(action);
	if (!handler) return;

	try {
		const { unregister } = await import('@tauri-apps/plugin-global-shortcut');

		for (const shortcut of registeredShortcuts) {
			try {
				await unregister(shortcut);
				registeredShortcuts.delete(shortcut);
			} catch {
				// Shortcut may not be registered
			}
		}

		handlers.delete(action);
	} catch (e) {
		console.error(`Failed to unregister hotkey:`, e);
	}
}

/**
 * Unregister all global hotkeys (Tauri only, no-op on web)
 */
export async function unregisterAllHotkeys(): Promise<void> {
	if (!isTauri()) return;

	try {
		const { unregisterAll } = await import('@tauri-apps/plugin-global-shortcut');
		await unregisterAll();
		handlers.clear();
		registeredShortcuts.clear();
	} catch (e) {
		console.error('Failed to unregister all hotkeys:', e);
	}
}

/**
 * Check if global hotkeys are supported in the current environment
 */
export function isHotkeysSupported(): boolean {
	return isTauri();
}
