import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Reminder } from '$lib/types/memory';
import {
	classifyReminder,
	isOldExecutedReminder,
	validateReminder,
	DEFAULT_REMINDER_TTL_MS
} from '$lib/utils/reminders';

const POLL_INTERVAL_MS = 10000;
// Grace must cover a full poll gap so a reminder never classifies as missed
// just because the timer fell on the far side of an interval.
const GRACE_MS = 15000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
// Largest safe date for compound-index range queries.
const MAX_DATE = new Date(8640000000000000);

let upcoming = $state<Reminder[]>([]);
let recentFired = $state<Reminder[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastCleanupAt = 0;
let onReminderFired: ((reminder: Reminder) => void) | null = null;

async function loadUpcoming() {
	const now = new Date();
	// sessionId is kept only as metadata; pending reminders from any session are
	// visible and fireable so timers survive a browser restart even when the
	// current in-memory session id changes.
	const items = await db.reminders
		.where('[executed+triggerAt]')
		.between([0, now], [0, MAX_DATE], false, false)
		.toArray();

	items.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
	upcoming = items as Reminder[];
}

async function cleanupOldReminders() {
	const now = Date.now();
	const old = await db.reminders
		.where('executed')
		.equals(1)
		.and((r) => isOldExecutedReminder(r, now, DEFAULT_REMINDER_TTL_MS))
		.toArray();

	for (const reminder of old) {
		if (reminder.id !== undefined) {
			await db.reminders.delete(reminder.id);
		}
	}
}

async function checkReminders() {
	const now = Date.now();
	const nowDate = new Date(now);
	// Query all non-executed due reminders regardless of session so missed timers
	// fire correctly after a browser restart.
	const due = await db.reminders
		.where('[executed+triggerAt]')
		.between([0, new Date(0)], [0, nowDate], true, true)
		.toArray();

	const newlyFired: Reminder[] = [];

	for (const reminder of due) {
		if (reminder.id === undefined) continue;

		// Atomic claim: only the first caller/window gets to process this row.
		const claimed = await db.reminders
			.where('id')
			.equals(reminder.id)
			.and((r) => !r.executed)
			.modify({ executed: 1 });

		if (claimed === 0) continue;

		const fate = classifyReminder(reminder.triggerAt, now, GRACE_MS);
		if (fate === 'fire' || fate === 'missed') {
			newlyFired.push(reminder as Reminder);
		}
	}

	if (newlyFired.length > 0) {
		// Avoid duplicates if a reminder somehow gets processed twice in the same
		// window before the UI re-renders.
		const existingIds = new Set(recentFired.map((r) => r.id));
		for (const reminder of newlyFired) {
			if (!existingIds.has(reminder.id)) {
				recentFired.push(reminder as Reminder);
				onReminderFired?.(reminder as Reminder);
			}
		}
	}

	await loadUpcoming();

	if (now - lastCleanupAt > CLEANUP_INTERVAL_MS) {
		lastCleanupAt = now;
		cleanupOldReminders().catch((e) => console.error('[Reminders] Cleanup error:', e));
	}
}

function handleVisibilityChange() {
	if (document.hidden) return;
	// Browsers throttle setInterval while the tab is hidden. Check immediately
	// when the user returns so reminders don't sit unhandled.
	checkReminders().catch((e) => console.error('[Reminders] Visibility check error:', e));
}

export function startPolling() {
	if (!browser || pollTimer) return;

	pollTimer = setInterval(() => {
		checkReminders().catch((e) => console.error('[Reminders] Poll error:', e));
	}, POLL_INTERVAL_MS);

	document.addEventListener('visibilitychange', handleVisibilityChange);

	checkReminders().catch((e) => console.error('[Reminders] Initial check error:', e));
}

export function stopPolling() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	document.removeEventListener('visibilitychange', handleVisibilityChange);
}

export async function addReminder(
	content: string,
	triggerAt: Date,
	sessionId: number
): Promise<Reminder> {
	const validationError = validateReminder(content, triggerAt);
	if (validationError) {
		throw new Error(validationError);
	}

	const id = await db.reminders.add({
		content,
		triggerAt,
		sessionId,
		executed: 0,
		createdAt: new Date()
	});
	const reminder = await db.reminders.get(id);
	if (!reminder) throw new Error('Failed to create reminder');

	await loadUpcoming();
	return reminder as Reminder;
}

export async function deleteReminder(id: number) {
	await db.reminders.delete(id);
	await loadUpcoming();
}

export function dismissRecentFired(id?: number) {
	if (id === undefined) return;
	recentFired = recentFired.filter((r) => r.id !== id);
}

export function setOnReminderFired(callback: ((reminder: Reminder) => void) | null) {
	onReminderFired = callback;
}

export const reminderStore = {
	get upcoming() {
		return upcoming;
	},
	get recentFired() {
		return recentFired;
	},
	startPolling,
	stopPolling,
	addReminder,
	deleteReminder,
	dismissRecentFired,
	setOnReminderFired
};
