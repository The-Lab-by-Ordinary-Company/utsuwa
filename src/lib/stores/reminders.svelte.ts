import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Reminder } from '$lib/types/memory';
import { getWorkingMemory } from '$lib/engine/memory';

const POLL_INTERVAL_MS = 10000;
const GRACE_MS = 5000;

let upcoming = $state<Reminder[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let onReminderFired: ((reminder: Reminder) => void) | null = null;
let onMissedReminders: ((reminders: Reminder[]) => void) | null = null;
let missedChecked = false;

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

async function checkReminders() {
	const sessionId = getWorkingMemory().currentSessionId;
	if (!sessionId) return;

	const now = Date.now();
	const due = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt.getTime() <= now)
		.toArray();

	for (const reminder of due) {
		// Still within polling grace → fire normally.
		if (now - reminder.triggerAt.getTime() <= GRACE_MS) {
			if (reminder.id !== undefined) {
				await db.reminders.update(reminder.id, { executed: true });
			}
			onReminderFired?.(reminder as Reminder);
		}
		// Older reminders are handled as missed in handleMissedReminders.
	}

	await loadUpcoming(sessionId);
}

async function handleMissedReminders() {
	const sessionId = getWorkingMemory().currentSessionId;
	if (!sessionId) return;

	const cutoff = Date.now() - GRACE_MS;
	const missed = await db.reminders
		.where('sessionId')
		.equals(sessionId)
		.and((r) => !r.executed && r.triggerAt.getTime() <= cutoff)
		.toArray();

	if (missed.length === 0) return;

	for (const reminder of missed) {
		if (reminder.id !== undefined) {
			await db.reminders.update(reminder.id, { executed: true });
		}
	}

	onMissedReminders?.(missed as Reminder[]);
}

export function startPolling() {
	if (!browser || pollTimer) return;

	pollTimer = setInterval(() => {
		checkReminders().catch((e) => console.error('[Reminders] Poll error:', e));
	}, POLL_INTERVAL_MS);

	if (!missedChecked) {
		missedChecked = true;
		handleMissedReminders().catch((e) => console.error('[Reminders] Missed check error:', e));
	}

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
