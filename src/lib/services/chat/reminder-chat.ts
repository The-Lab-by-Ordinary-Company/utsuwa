import { chatStore } from '$lib/stores/chat.svelte';
import type { SendCompanionMessageOptions } from './companion-chat';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Send a fired reminder through the chat pipeline as a system event. If the LLM
 * is currently generating, wait briefly so the reminder doesn't interrupt or
 * collide. Logs an error if the LLM stays busy beyond the timeout.
 */
export function sendReminderMessage(
	sendFn: (content: string, options: SendCompanionMessageOptions) => void,
	msg: string
) {
	const options: SendCompanionMessageOptions = { systemEvent: true };

	if (!chatStore.isLoading) {
		sendFn(msg, options);
		return;
	}

	const startTime = Date.now();
	const waitInterval = setInterval(() => {
		if (!chatStore.isLoading) {
			clearInterval(waitInterval);
			sendFn(msg, options);
		} else if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
			clearInterval(waitInterval);
			console.error('[Reminder] Dropped: LLM still busy after 5 minutes:', msg);
		}
	}, 500);
}
