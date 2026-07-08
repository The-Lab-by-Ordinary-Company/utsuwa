import { browser } from '$app/environment';
import { db } from '$lib/db';
import { getWorkingMemory } from '$lib/engine/memory';
import type { Reminder } from '$lib/types/memory';
import {
	classifyReminder,
	isOldExecutedReminder,
	DEFAULT_REMINDER_TTL_MS
} from '$lib/utils/reminders';

const POLL_INTERVAL_MS = 10000;
// Grace must cover a full poll gap so a reminder never classifies as missed
// just because the timer fell on the far side of an interval.
const GRACE_MS = 15000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
// Cap reminder scheduling at one year. Beyond that the entry is almost certainly
// a parsing mistake and would bloat the database indefinitely.
const MAX_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;
// Largest safe date for compound-index range queries.
const MAX_DATE = new Date(8640000000000000);

let upcoming = $state<Reminder[]>([]);
let recentFired = $state<Reminder[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastCleanupAt = 0;
let onReminderFired: ((reminder: Reminder) => void) | null = null;

async function loadUpcoming() {
	const sessionId = getWorkingMemory().currentSessionId;
	if (!sessionId) {
		upcoming = [];
		return;
	}

	const now = new Date();
	const items = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt > now)
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
	const sessionId = getWorkingMemory().currentSessionId;
	if (!sessionId) {
		console.debug('[Reminders] No session ID, skipping check');
		return;
	}

	const now = Date.now();
	const nowDate = new Date(now);
	const due = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt <= nowDate)
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
	if (!content.trim()) {
		throw new Error('Reminder content cannot be empty');
	}

	const now = Date.now();
	const triggerMs = triggerAt.getTime();
	if (Number.isNaN(triggerMs)) {
		throw new Error('Invalid reminder trigger time');
	}
	if (triggerMs > now + MAX_FUTURE_MS) {
		throw new Error('Reminder trigger time is too far in the future');
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
