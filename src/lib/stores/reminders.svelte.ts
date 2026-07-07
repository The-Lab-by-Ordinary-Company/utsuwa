import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Reminder } from '$lib/types/memory';
import { getWorkingMemory } from '$lib/engine/memory';
import {
	classifyReminder,
	isOldExecutedReminder,
	DEFAULT_REMINDER_TTL_MS
} from '$lib/utils/reminders';

const POLL_INTERVAL_MS = 10000;
const GRACE_MS = 5000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let upcoming = $state<Reminder[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let onReminderFired: ((reminder: Reminder) => void) | null = null;
let onMissedReminders: ((reminders: Reminder[]) => void) | null = null;
let lastCleanupAt = 0;

async function loadUpcoming(sessionId: number) {
	const now = new Date();
	const items = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt > now)
		.toArray();

	items.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
	upcoming = items as Reminder[];
}

async function cleanupOldReminders(sessionId: number) {
	const now = Date.now();
	const old = await db.reminders
		.where('sessionId')
		.equals(sessionId)
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
	if (!sessionId) return;

	const now = Date.now();
	const due = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt.getTime() <= now)
		.toArray();

	const fired: Reminder[] = [];
	const missed: Reminder[] = [];

	for (const reminder of due) {
		if (reminder.id !== undefined) {
			await db.reminders.update(reminder.id, { executed: true });
		}

		const fate = classifyReminder(reminder.triggerAt, now, GRACE_MS);
		if (fate === 'fire') {
			fired.push(reminder as Reminder);
		} else if (fate === 'missed') {
			missed.push(reminder as Reminder);
		}
	}

	for (const reminder of fired) {
		onReminderFired?.(reminder);
	}
	if (missed.length > 0) {
		onMissedReminders?.(missed);
	}

	await loadUpcoming(sessionId);

	if (now - lastCleanupAt > CLEANUP_INTERVAL_MS) {
		lastCleanupAt = now;
		cleanupOldReminders(sessionId).catch((e) =>
			console.error('[Reminders] Cleanup error:', e)
		);
	}
}

export function startPolling() {
	if (!browser || pollTimer) return;

	pollTimer = setInterval(() => {
		checkReminders().catch((e) => console.error('[Reminders] Poll error:', e));
	}, POLL_INTERVAL_MS);

	checkReminders().catch((e) => console.error('[Reminders] Initial check error:', e));
}

export function stopPolling() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

export function setOnReminderFired(callback: ((reminder: Reminder) => void) | null) {
	onReminderFired = callback;
}

export function setOnMissedReminders(callback: ((reminders: Reminder[]) => void) | null) {
	onMissedReminders = callback;
}

export async function addReminder(content: string, triggerAt: Date, sessionId: number): Promise<Reminder> {
	const id = await db.reminders.add({
		content,
		triggerAt,
		sessionId,
		executed: false,
		createdAt: new Date()
	});
	const reminder = await db.reminders.get(id);
	if (!reminder) throw new Error('Failed to create reminder');

	await loadUpcoming(sessionId);
	return reminder as Reminder;
}

export async function deleteReminder(id: number) {
	await db.reminders.delete(id);
	const sessionId = getWorkingMemory().currentSessionId;
	if (sessionId) await loadUpcoming(sessionId);
}

export const reminderStore = {
	get upcoming() {
		return upcoming;
	},
	startPolling,
	stopPolling,
	setOnReminderFired,
	setOnMissedReminders,
	addReminder,
	deleteReminder
};
