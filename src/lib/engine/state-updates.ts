import type { CharacterState, StateUpdates, MoodState, Emotion, RelationshipStage } from '$lib/types/character';
import { calculateStage } from './stages';

// Clamp a value between min and max
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// Apply state updates to character state
export function applyStateUpdates(state: CharacterState, updates: StateUpdates): CharacterState {
	const newState = { ...state };

	// Apply mood change
	if (updates.moodChange) {
		const newMood: MoodState = {
			...newState.mood,
			primary: updates.moodChange.emotion,
			intensity: clamp(newState.mood.intensity + (updates.moodChange.intensityDelta ?? 0), 0, 100)
		};

		// Add cause to causes array (keep last 5)
		if (updates.moodChange.cause) {
			newMood.causes = [...newState.mood.causes.slice(-4), updates.moodChange.cause];
		}

		newState.mood = newMood;
	}

	// Apply energy delta
	if (updates.energyDelta !== undefined) {
		newState.energy = clamp(newState.energy + updates.energyDelta, 0, 100);
	}

	// Apply affection delta
	if (updates.affectionDelta !== undefined) {
		newState.affection = clamp(newState.affection + updates.affectionDelta, 0, 1000);
	}

	// Apply trust delta
	if (updates.trustDelta !== undefined) {
		newState.trust = clamp(newState.trust + updates.trustDelta, 0, 100);
	}

	// Apply intimacy delta
	if (updates.intimacyDelta !== undefined) {
		newState.intimacy = clamp(newState.intimacy + updates.intimacyDelta, 0, 100);
	}

	// Apply comfort delta
	if (updates.comfortDelta !== undefined) {
		newState.comfort = clamp(newState.comfort + updates.comfortDelta, 0, 100);
	}

	// Apply respect delta
	if (updates.respectDelta !== undefined) {
		newState.respect = clamp(newState.respect + updates.respectDelta, 0, 100);
	}

	// Update timestamp
	newState.updatedAt = new Date();

	return newState;
}

// Check and apply stage transition if needed
export function checkAndApplyStageTransition(
	state: CharacterState,
	completedEvents: string[]
): { newState: CharacterState; transitioned: boolean; fromStage?: RelationshipStage; toStage?: RelationshipStage } {
	const calculatedStage = calculateStage(state, completedEvents);

	if (calculatedStage !== state.relationshipStage) {
		return {
			newState: {
				...state,
				relationshipStage: calculatedStage,
				updatedAt: new Date()
			},
			transitioned: true,
			fromStage: state.relationshipStage,
			toStage: calculatedStage
		};
	}

	return { newState: state, transitioned: false };
}

// Apply time-based decay (call on session start)
export function applyTimeDecay(state: CharacterState, hoursSinceLastInteraction: number): StateUpdates {
	const updates: StateUpdates = {};

	// Energy recovery (full after 6+ hours)
	if (state.energy < 100) {
		if (hoursSinceLastInteraction >= 6) {
			updates.energyDelta = 100 - state.energy;
		} else {
			// Partial recovery - use Math.ceil to ensure at least 1 energy recovered
			const recoveryRate = Math.min(1, hoursSinceLastInteraction / 6);
			const recovery = Math.ceil((100 - state.energy) * recoveryRate);
			updates.energyDelta = Math.max(1, recovery); // Always recover at least 1
		}
	}

	// Affection decay (only after 48 hours)
	if (hoursSinceLastInteraction > 48 && state.affection > 0) {
		const daysAway = Math.floor(hoursSinceLastInteraction / 24) - 2; // Start after 2 days
		const decayRate = Math.min(0.05, 0.01 * daysAway);
		const decay = Math.floor(state.affection * decayRate);
		updates.affectionDelta = -Math.min(decay, 50); // Cap at 50 per session
	}

	// Trust decay (only after 7 days)
	if (hoursSinceLastInteraction > 168 && state.trust > 0) {
		const weeksAway = Math.floor(hoursSinceLastInteraction / 168);
		updates.trustDelta = -Math.min(weeksAway * 2, 10); // Slow decay, max 10 per session
	}

	// Mood shifts towards melancholy if away too long (3+ days)
	if (hoursSinceLastInteraction > 72) {
		updates.moodChange = {
			emotion: 'melancholy',
			intensityDelta: Math.min(30, Math.floor(hoursSinceLastInteraction / 24) * 5),
			cause: 'missing you'
		};
	}

	return updates;
}

// Calculate interaction impact based on message analysis
export interface MessageImpact {
	energyDelta: number;
	affectionDelta: number;
	trustDelta: number;
	intimacyDelta: number;
	comfortDelta: number;
	respectDelta: number;
}

export function calculateMessageImpact(
	sentiment: number, // -1 to 1
	topicDepth: 'shallow' | 'moderate' | 'deep',
	isEmotional: boolean,
	isQuestion: boolean,
	state: CharacterState
): MessageImpact {
	// Base impacts
	let energyDelta = -2;
	let affectionDelta = 1;
	let trustDelta = 0;
	let intimacyDelta = 0;
	let comfortDelta = 0;
	let respectDelta = 0;

	// Sentiment modifiers
	if (sentiment > 0.3) {
		affectionDelta += 2;
		comfortDelta += 1;
	} else if (sentiment < -0.3) {
		affectionDelta -= 1;
		comfortDelta -= 1;
	}

	// Topic depth modifiers
	switch (topicDepth) {
		case 'deep':
			energyDelta -= 2;
			affectionDelta += 2;
			intimacyDelta += 2;
			trustDelta += 1;
			break;
		case 'moderate':
			energyDelta -= 1;
			affectionDelta += 1;
			intimacyDelta += 1;
			break;
		case 'shallow':
			// Shallow conversations can increase boredom
			comfortDelta -= 1;
			break;
	}

	// Emotional content
	if (isEmotional) {
		intimacyDelta += 2;
		trustDelta += 1;
		affectionDelta += 1;
	}

	// Questions show interest
	if (isQuestion) {
		respectDelta += 1;
		trustDelta += 1;
	}

	// Non-linear affection growth
	const affectionPhase = state.affection < 300 ? 'honeymoon' : state.affection < 700 ? 'comfort' : 'deepBond';
	switch (affectionPhase) {
		case 'honeymoon':
			affectionDelta = Math.floor(affectionDelta * 1.5);
			break;
		case 'comfort':
			// Normal rate
			break;
		case 'deepBond':
			affectionDelta = Math.floor(affectionDelta * 0.7);
			break;
	}

	// Add randomness (±20%)
	const variance = 0.2;
	affectionDelta = Math.floor(affectionDelta * (1 + (Math.random() - 0.5) * 2 * variance));
	trustDelta = Math.floor(trustDelta * (1 + (Math.random() - 0.5) * 2 * variance));

	return {
		energyDelta,
		affectionDelta: Math.max(-5, Math.min(10, affectionDelta)),
		trustDelta: Math.max(-3, Math.min(5, trustDelta)),
		intimacyDelta: Math.max(-2, Math.min(5, intimacyDelta)),
		comfortDelta: Math.max(-3, Math.min(3, comfortDelta)),
		respectDelta: Math.max(-2, Math.min(3, respectDelta))
	};
}

// Merge baseline heuristics with LLM suggestions
export function mergeUpdates(baseline: StateUpdates, llmSuggestion: Partial<StateUpdates>): StateUpdates {
	const merged: StateUpdates = { ...baseline };

	// LLM can override mood entirely
	if (llmSuggestion.moodChange) {
		merged.moodChange = llmSuggestion.moodChange;
	}

	// LLM can adjust deltas, but baseline provides bounds
	if (llmSuggestion.affectionDelta !== undefined) {
		// Take LLM suggestion but cap it relative to baseline
		const baseAffection = baseline.affectionDelta ?? 0;
		const maxDelta = Math.max(Math.abs(baseAffection) * 2, 5);
		merged.affectionDelta = clamp(llmSuggestion.affectionDelta, -maxDelta, maxDelta);
	}

	if (llmSuggestion.trustDelta !== undefined) {
		const baseTrust = baseline.trustDelta ?? 0;
		const maxDelta = Math.max(Math.abs(baseTrust) * 2, 3);
		merged.trustDelta = clamp(llmSuggestion.trustDelta, -maxDelta, maxDelta);
	}

	if (llmSuggestion.intimacyDelta !== undefined) {
		merged.intimacyDelta = clamp(llmSuggestion.intimacyDelta, -3, 5);
	}

	if (llmSuggestion.comfortDelta !== undefined) {
		merged.comfortDelta = clamp(llmSuggestion.comfortDelta, -3, 5);
	}

	if (llmSuggestion.respectDelta !== undefined) {
		merged.respectDelta = clamp(llmSuggestion.respectDelta, -3, 5);
	}

	// Energy delta stays from baseline (app controls energy)
	// LLM suggestions for memory and events are passed through
	if (llmSuggestion.newMemory) {
		merged.newMemory = llmSuggestion.newMemory;
	}

	if (llmSuggestion.triggeredEvent) {
		merged.triggeredEvent = llmSuggestion.triggeredEvent;
	}

	return merged;
}
