// Pure event-matching logic, split out from events.ts so it carries no storage
// (IndexedDB) dependency and can be unit-tested in isolation. events.ts re-exports
// these and layers the storage-backed eventsApi on top.
import type { CharacterState } from '../types/character';
import type {
	EventDefinition,
	EventCondition,
	EventCheckResult,
	CompletedEventRecord
} from '../types/events';
import { getTimeOfDay, isEventOnCooldown, isStageAtLeast } from '../types/events.ts';

// Check if a single condition is met
export function checkCondition(
	condition: EventCondition,
	state: CharacterState,
	completedEvents: string[],
	currentMessage?: string
): boolean {
	switch (condition.type) {
		case 'min_affection':
			return state.affection >= condition.value;

		case 'min_trust':
			return state.trust >= condition.value;

		case 'min_intimacy':
			return state.intimacy >= condition.value;

		case 'min_comfort':
			return state.comfort >= condition.value;

		case 'min_respect':
			return state.respect >= condition.value;

		case 'max_energy':
			return state.energy <= condition.value;

		case 'relationship_stage':
			return state.relationshipStage === condition.value;

		case 'relationship_stage_min':
			return isStageAtLeast(state.relationshipStage, condition.value);

		case 'days_known':
			return state.daysKnown >= condition.value;

		case 'total_interactions':
			return state.totalInteractions >= condition.value;

		case 'event_completed':
			return completedEvents.includes(condition.value);

		case 'event_not_completed':
			return !completedEvents.includes(condition.value);

		case 'time_of_day':
			return getTimeOfDay() === condition.value;

		case 'day_of_week':
			return new Date().getDay() === condition.value;

		case 'random_chance':
			return Math.random() < condition.value;

		case 'keyword_mentioned':
			return currentMessage
				? currentMessage.toLowerCase().includes(condition.value.toLowerCase())
				: false;

		case 'mood_is':
			return state.mood.primary === condition.value;

		case 'mood_intensity_min':
			return state.mood.intensity >= condition.value;

		case 'consecutive_days':
			return state.currentStreak >= condition.value;

		case 'hours_since_last_interaction_min': {
			if (!state.lastInteraction) return true;
			const hours = (Date.now() - new Date(state.lastInteraction).getTime()) / (1000 * 60 * 60);
			return hours >= condition.value;
		}

		case 'hours_since_last_interaction_max': {
			if (!state.lastInteraction) return false;
			const hours = (Date.now() - new Date(state.lastInteraction).getTime()) / (1000 * 60 * 60);
			return hours <= condition.value;
		}

		default:
			console.warn('Unknown condition type:', (condition as EventCondition).type);
			return false;
	}
}

// Check if an event should trigger
export function checkEvent(
	event: EventDefinition,
	state: CharacterState,
	completedEvents: CompletedEventRecord[],
	currentMessage?: string
): EventCheckResult {
	// Check if on cooldown
	if (isEventOnCooldown(event, completedEvents)) {
		return { triggered: false, failedConditions: [] };
	}

	// Completed markers come from two places that must agree: the durable DB
	// records (bare event ids, also carrying the timestamps cooldown needs) and
	// state.completedEvents, which additionally holds each choice's *outcome*
	// marker (e.g. confession_accepted). Condition gating needs the union, or
	// events guarded on an outcome marker never see it and mis-trigger.
	const completedMarkers = Array.from(
		new Set([...(state.completedEvents ?? []), ...completedEvents.map((e) => e.eventId)])
	);
	const failedConditions: EventCondition[] = [];

	for (const condition of event.conditions) {
		if (!checkCondition(condition, state, completedMarkers, currentMessage)) {
			failedConditions.push(condition);
		}
	}

	return {
		triggered: failedConditions.length === 0,
		event: failedConditions.length === 0 ? event : undefined,
		failedConditions
	};
}

// Check all events and return triggered ones (sorted by priority)
export function checkAllEvents(
	events: EventDefinition[],
	state: CharacterState,
	completedEvents: CompletedEventRecord[],
	currentMessage?: string
): EventDefinition[] {
	const triggered: EventDefinition[] = [];

	for (const event of events) {
		const result = checkEvent(event, state, completedEvents, currentMessage);
		if (result.triggered && result.event) {
			triggered.push(result.event);
		}
	}

	// Sort by priority (higher first)
	return triggered.sort((a, b) => b.priority - a.priority);
}
