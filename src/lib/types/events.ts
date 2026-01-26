import type { Emotion, RelationshipStage, StateUpdates } from './character';

// Event types
export type EventType = 'milestone' | 'random' | 'scheduled' | 'conditional' | 'anniversary';

// Time of day for time-based conditions
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// Event condition types (discriminated union)
export type EventCondition =
	| { type: 'min_affection'; value: number }
	| { type: 'min_trust'; value: number }
	| { type: 'min_intimacy'; value: number }
	| { type: 'min_comfort'; value: number }
	| { type: 'min_respect'; value: number }
	| { type: 'max_energy'; value: number }
	| { type: 'relationship_stage'; value: RelationshipStage }
	| { type: 'relationship_stage_min'; value: RelationshipStage }
	| { type: 'days_known'; value: number }
	| { type: 'total_interactions'; value: number }
	| { type: 'event_completed'; value: string }
	| { type: 'event_not_completed'; value: string }
	| { type: 'time_of_day'; value: TimeOfDay }
	| { type: 'day_of_week'; value: number } // 0 = Sunday, 6 = Saturday
	| { type: 'random_chance'; value: number } // 0-1 probability
	| { type: 'keyword_mentioned'; value: string }
	| { type: 'mood_is'; value: Emotion }
	| { type: 'mood_intensity_min'; value: number }
	| { type: 'consecutive_days'; value: number }
	| { type: 'hours_since_last_interaction_min'; value: number }
	| { type: 'hours_since_last_interaction_max'; value: number };

// Scene choice (for branching events)
export interface SceneChoice {
	text: string; // What the user sees
	response: string; // Companion's response if chosen
	stateChanges: Partial<StateUpdates>; // State changes if chosen
	nextSceneId?: string; // For multi-scene branches
	unlocks?: string[]; // Content/feature unlocks
}

// Scene definition
export interface Scene {
	id: string;
	intro?: string; // Narration before dialogue (optional)
	dialogue?: string; // What the companion says
	choices?: SceneChoice[]; // Branching options (optional)
	outro?: string; // Narration after (optional)
	backgroundChange?: string; // Change background/scene
	expressionOverride?: string; // Force a specific VRM expression
	musicCue?: string; // Play specific music/sound
}

// Full event definition
export interface EventDefinition {
	id: string;
	name: string;
	type: EventType;

	// Trigger conditions (all must be met)
	conditions: EventCondition[];

	// What happens when triggered
	scene?: Scene;
	stateChanges?: Partial<StateUpdates>;
	unlocks?: string[]; // IDs of unlocked content/features
	achievementId?: string; // Link to achievement system (future)

	// Repeat rules
	oneTime: boolean;
	cooldownDays?: number; // Days before can trigger again (if not oneTime)
	lastTriggered?: Date; // Track last trigger (runtime)

	// Priority for when multiple events could trigger
	priority: number; // Higher = checked first
}

// Completed event record (database)
export interface CompletedEventRecord {
	id?: number;
	eventId: string;
	eventType: EventType;
	choiceIndex?: number;
	outcome?: string;
	stateChanges?: Partial<StateUpdates>;
	completedAt: Date;
}

// Event check result
export interface EventCheckResult {
	triggered: boolean;
	event?: EventDefinition;
	failedConditions?: EventCondition[];
}

// Event execution result
export interface EventExecutionResult {
	eventId: string;
	scenePresented: boolean;
	choiceMade?: number;
	stateChanges: Partial<StateUpdates>;
	unlocks: string[];
}

// Event queue (for managing multiple triggered events)
export interface EventQueue {
	pending: EventDefinition[];
	current: EventDefinition | null;
	completed: string[];
}

// Helper function to get time of day
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 17) return 'afternoon';
	if (hour >= 17 && hour < 21) return 'evening';
	return 'night';
}

// Helper to check if event is on cooldown
export function isEventOnCooldown(event: EventDefinition, completedEvents: CompletedEventRecord[]): boolean {
	if (event.oneTime) {
		return completedEvents.some((e) => e.eventId === event.id);
	}

	if (!event.cooldownDays) return false;

	const lastTrigger = completedEvents.filter((e) => e.eventId === event.id).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0];

	if (!lastTrigger) return false;

	const daysSince = (Date.now() - lastTrigger.completedAt.getTime()) / (1000 * 60 * 60 * 24);
	return daysSince < event.cooldownDays;
}

// Stage ordering for comparison
export const STAGE_ORDER: RelationshipStage[] = ['stranger', 'acquaintance', 'friend', 'close_friend', 'romantic_interest', 'dating', 'committed', 'soulmate'];

export function getStageIndex(stage: RelationshipStage): number {
	return STAGE_ORDER.indexOf(stage);
}

export function isStageAtLeast(current: RelationshipStage, minimum: RelationshipStage): boolean {
	return getStageIndex(current) >= getStageIndex(minimum);
}
