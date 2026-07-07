export interface ParsedReminder {
	content: string;
	triggerAt: Date;
}

/**
 * Extract `[reminder:TIME]content[/reminder]` tags from assistant output.
 * Returns the extracted reminders and the text with tags removed.
 */
export function extractReminderTags(text: string): { reminders: ParsedReminder[]; cleanedText: string } {
	const regex = /\[reminder:([^\]]+)\]([\s\S]*?)\[\/reminder\]/gi;
	const reminders: ParsedReminder[] = [];
	let match;

	while ((match = regex.exec(text)) !== null) {
		const timeStr = match[1].trim();
		const content = match[2].trim();
		const triggerAt = parseReminderTime(timeStr);
		if (triggerAt) {
			reminders.push({ content, triggerAt });
		}
	}

	const cleanedText = text.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
	return { reminders, cleanedText };
}

/**
 * Parse a relative time expression like `5min`, `1h30m`, `30s` into a Date.
 * Returns null if no usable time unit is found.
 */
export function parseReminderTime(timeStr: string): Date | null {
	const now = Date.now();
	let totalMs = 0;

	const hMatch = timeStr.match(/(\d+)\s*h(?:our)?s?/i);
	const mMatch = timeStr.match(/(\d+)\s*m(?:in)?/i);
	const sMatch = timeStr.match(/(\d+)\s*s(?:ec)?/i);

	if (hMatch) totalMs += parseInt(hMatch[1], 10) * 60 * 60 * 1000;
	if (mMatch) totalMs += parseInt(mMatch[1], 10) * 60 * 1000;
	if (sMatch) totalMs += parseInt(sMatch[1], 10) * 1000;

	if (totalMs === 0) return null;
	return new Date(now + totalMs);
}

// Fallback patterns for natural-language reminder requests.
// Group 1 = time, Group 2 = content when group1IsTime is true.
const REMINDER_PATTERNS: { pattern: RegExp; group1IsTime: boolean }[] = [
	// German
	{
		pattern: /(?:in|nach)\s+(\d[\d\s]*(?:minuten?|min|sekunden?|sek|stunden?|h)?)\b[\s\S]*?(?:reminder|erinnern|erinnere|erinnerung|dass|zu|an|daran)\s*(.+)/i,
		group1IsTime: true
	},
	{
		pattern: /erinn(?:ere|er)\s+mich\s+(?:bitte\s+)?(?:in|nach)\s+([\d\s]+(?:minuten?|min|sekunden?|sek|stunden?|h)?(?:\s+\d+\s*(?:minuten?|min|sekunden?|sek|stunden?|h))?)\s+(?:an|daran|zu|das|dass)?\s+(.+?)(?:\.|$)/i,
		group1IsTime: true
	},
	{
		pattern: /erinn(?:ere|er)\s+mich\s+(?:bitte\s+)?(?:an|daran|zu|das|dass)?\s+(.+?)\s+(?:in|nach)\s+([\d\s]+(?:minuten?|min|sekunden?|sek|stunden?|h)?(?:\s+\d+\s*(?:minuten?|min|sekunden?|sek|stunden?|h))?)/i,
		group1IsTime: false
	},
	// English
	{
		pattern: /(?:in|after)\s+(\d[\d\s]*(?:minutes?|mins?|seconds?|secs?|hours?|h)?)\b[\s\S]*?(?:remind|reminder|to|about|that)\s*(.+)/i,
		group1IsTime: true
	},
	{
		pattern: /remind\s+me\s+(?:in|after)\s+([\d\s]+(?:minutes?|mins?|seconds?|secs?|hours?|h)?(?:\s+\d+\s*(?:minutes?|mins?|seconds?|secs?|hours?|h))?)\s+(?:to|about|that)?\s+(.+?)(?:\.|$)/i,
		group1IsTime: true
	},
	{
		pattern: /remind\s+me\s+(?:to|about|that)?\s+(.+?)\s+(?:in|after)\s+([\d\s]+(?:minutes?|mins?|seconds?|secs?|hours?|h)?(?:\s+\d+\s*(?:minutes?|mins?|seconds?|secs?|hours?|h))?)/i,
		group1IsTime: false
	}
];

/**
 * Try to extract a reminder directly from a user message when the LLM
 * didn't emit a `[reminder:...]` tag. Used as a client-side fallback.
 */
export function tryExtractReminderFromUserMessage(text: string): ParsedReminder | null {
	for (const { pattern, group1IsTime } of REMINDER_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			const timeStr = (group1IsTime ? match[1] : match[2]).trim();
			const content = (group1IsTime ? match[2] : match[1]).trim();
			const triggerAt = parseReminderTime(timeStr);
			if (triggerAt && content) {
				return { content, triggerAt };
			}
		}
	}
	return null;
}
