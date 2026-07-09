import { chatStore } from '$lib/stores/chat.svelte';
import type { SendCompanionMessageOptions } from './companion-chat';
import type { Reminder } from '$lib/types/memory';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Build the fired-reminder handler shared by the main app and the overlay.
 * Both surfaces must deliver the trigger through sendReminderMessage with the
 * systemEvent option intact; wiring this in one place keeps the two pages from
 * drifting (the main app previously dropped the options argument, which sent
 * fired reminders through the normal user path).
 */
export function createReminderFiredHandler(
	sendFn: (content: string, options: SendCompanionMessageOptions) => void
): (reminder: Reminder) => void {
	return (reminder) => {
		const msg = `⏰ REMINDER TRIGGERED: "${reminder.content}" — This is your reminder. React to it NOW by performing the described action or saying something enthusiastic and fitting.`;
		sendReminderMessage(sendFn, msg);
	};
}

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
