import type { CharacterState } from '$lib/types/character';

function laterOf(a: Date | null | undefined, b: Date | null | undefined): Date | null {
	if (!a) return b ?? null;
	if (!b) return a;
	return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function earlierOf(a: Date, b: Date): Date {
	return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

/**
 * Merge an incoming character snapshot into the already-persisted one.
 *
 * The main and overlay windows each run their own store, so a window holding a
 * stale boot snapshot can save long after the other window made progress. A
 * blind full-object put would erase that progress; instead, fields that only
 * ever move one way are reconciled here so no writer can roll them back:
 *
 * - completedEvents: union (markers are never removed; reset deletes the record)
 * - totalInteractions / daysKnown / longestStreak: max
 * - currentStreak + streakLastDate: the pair with the later check-in date wins
 *   (a broken streak legitimately resets to 1, but always with a newer date)
 * - firstMet / createdAt: earliest, lastInteraction / lastDecayAt: latest
 *
 * Everything else (stats, mood, persona, stage) is last-writer-wins; the
 * cross-window broadcast keeps live windows rehydrated so their writes are
 * based on current values.
 */
export function mergeCharacterStates(
	existing: CharacterState,
	incoming: CharacterState
): CharacterState {
	const completedEvents = [...existing.completedEvents];
	for (const marker of incoming.completedEvents) {
		if (!completedEvents.includes(marker)) {
			completedEvents.push(marker);
		}
	}

	// Dates are local YYYY-MM-DD strings, so string comparison orders them
	let currentStreak = incoming.currentStreak;
	let streakLastDate = incoming.streakLastDate;
	if (existing.streakLastDate) {
		if (!incoming.streakLastDate || existing.streakLastDate > incoming.streakLastDate) {
			currentStreak = existing.currentStreak;
			streakLastDate = existing.streakLastDate;
		} else if (existing.streakLastDate === incoming.streakLastDate) {
			currentStreak = Math.max(existing.currentStreak, incoming.currentStreak);
		}
	}

	return {
		...incoming,
		completedEvents,
		currentStreak,
		streakLastDate,
		longestStreak: Math.max(existing.longestStreak, incoming.longestStreak, currentStreak),
		totalInteractions: Math.max(existing.totalInteractions, incoming.totalInteractions),
		daysKnown: Math.max(existing.daysKnown, incoming.daysKnown),
		firstMet: earlierOf(existing.firstMet, incoming.firstMet),
		createdAt: earlierOf(existing.createdAt, incoming.createdAt),
		lastInteraction: laterOf(existing.lastInteraction, incoming.lastInteraction),
		lastDecayAt: laterOf(existing.lastDecayAt, incoming.lastDecayAt)
	};
}
