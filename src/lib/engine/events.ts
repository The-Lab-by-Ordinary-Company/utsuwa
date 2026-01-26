import type { CharacterState } from '$lib/types/character';
import type {
	EventDefinition,
	EventCondition,
	EventCheckResult,
	CompletedEventRecord,
	TimeOfDay
} from '$lib/types/events';
import { getTimeOfDay, isEventOnCooldown, isStageAtLeast } from '$lib/types/events';
import { getStageIndex } from './stages';
import * as eventsStorage from '$lib/services/storage/events';

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

	// Check all conditions
	const completedEventIds = completedEvents.map((e) => e.eventId);
	const failedConditions: EventCondition[] = [];

	for (const condition of event.conditions) {
		if (!checkCondition(condition, state, completedEventIds, currentMessage)) {
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

// Events API - uses IndexedDB storage directly
export const eventsApi = {
	async getCompletedEvents(): Promise<CompletedEventRecord[]> {
		return eventsStorage.getCompletedEvents();
	},

	async recordCompletedEvent(
		event: EventDefinition,
		choiceIndex?: number,
		outcome?: string
	): Promise<CompletedEventRecord> {
		const now = new Date();
		const id = await eventsStorage.saveCompletedEvent({
			eventId: event.id,
			eventType: event.type,
			choiceIndex,
			outcome,
			stateChanges: event.stateChanges,
			completedAt: now
		});
		return {
			id,
			eventId: event.id,
			eventType: event.type,
			choiceIndex,
			outcome,
			stateChanges: event.stateChanges,
			completedAt: now
		};
	}
};

// Get events that are close to triggering (for UI hints)
export function getNearTriggerEvents(
	events: EventDefinition[],
	state: CharacterState,
	completedEvents: CompletedEventRecord[]
): Array<{ event: EventDefinition; progress: number; missingConditions: EventCondition[] }> {
	const nearTrigger: Array<{
		event: EventDefinition;
		progress: number;
		missingConditions: EventCondition[];
	}> = [];

	const completedEventIds = completedEvents.map((e) => e.eventId);

	for (const event of events) {
		// Skip if already completed (one-time) or on cooldown
		if (isEventOnCooldown(event, completedEvents)) continue;

		const totalConditions = event.conditions.length;
		let metConditions = 0;
		const missingConditions: EventCondition[] = [];

		for (const condition of event.conditions) {
			// Skip random conditions for progress calc
			if (condition.type === 'random_chance') {
				metConditions += 0.5; // Count as half met
				continue;
			}

			if (checkCondition(condition, state, completedEventIds)) {
				metConditions++;
			} else {
				missingConditions.push(condition);
			}
		}

		const progress = totalConditions > 0 ? (metConditions / totalConditions) * 100 : 0;

		// Show events that are >50% ready
		if (progress > 50 && progress < 100) {
			nearTrigger.push({
				event,
				progress: Math.floor(progress),
				missingConditions
			});
		}
	}

	return nearTrigger.sort((a, b) => b.progress - a.progress);
}
