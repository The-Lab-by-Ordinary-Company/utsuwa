import { browser } from '$app/environment';
import { isTauri } from './platform';
import { registerHotkey, DEFAULT_HOTKEYS, type HotkeyConfig } from './hotkeys';

// Event bus for hotkey actions (allows components to subscribe)
type HotkeyEventHandler = () => void;
const eventHandlers: Map<string, Set<HotkeyEventHandler>> = new Map();

/**
 * Subscribe to a hotkey event
 */
export function onHotkeyEvent(event: string, handler: HotkeyEventHandler): () => void {
	if (!eventHandlers.has(event)) {
		eventHandlers.set(event, new Set());
	}
	eventHandlers.get(event)!.add(handler);

	return () => {
		eventHandlers.get(event)?.delete(handler);
	};
}

/**
 * Emit a hotkey event
 */
function emitHotkeyEvent(event: string): void {
	eventHandlers.get(event)?.forEach((handler) => handler());
}

// Push-to-talk state
let isPTTActive = false;

/**
 * Initialize all global hotkeys (Tauri only)
 */
export async function initializeHotkeys(config?: Partial<HotkeyConfig>): Promise<void> {
	if (!browser || !isTauri()) return;

	const hotkeys = { ...DEFAULT_HOTKEYS, ...config };

	// Push-to-talk: hold to record, release to send
	await registerHotkey(
		'pushToTalk',
		hotkeys.pushToTalk,
		() => {
			// Key down - start recording
			if (!isPTTActive) {
				isPTTActive = true;
				emitHotkeyEvent('ptt:start');
			}
		},
		() => {
			// Key up - stop recording and send
			if (isPTTActive) {
				isPTTActive = false;
				emitHotkeyEvent('ptt:stop');
			}
		}
	);

	// Toggle overlay visibility
	await registerHotkey('toggleOverlay', hotkeys.toggleOverlay, () => {
		emitHotkeyEvent('overlay:toggle');
	});

	// Focus chat (expand chat input)
	await registerHotkey('focusChat', hotkeys.focusChat, () => {
		emitHotkeyEvent('chat:focus');
	});
}

/**
 * Check if push-to-talk is currently active
 */
export function isPushToTalkActive(): boolean {
	return isPTTActive;
}
