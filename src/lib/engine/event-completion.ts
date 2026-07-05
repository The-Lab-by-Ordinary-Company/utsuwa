import type { EventDefinition } from '$lib/types/events';
import type { CharacterState } from '$lib/types/character';

// The completed-event markers a finished event contributes. Always the event's
// own id, plus the chosen choice's outcome marker (nextSceneId) when present.
// Those outcome markers (e.g. 'confession_accepted') are what gate later
// relationship stages, so the accept path unlocks progression while the decline
// path does not. Kept dependency-free so it can be unit tested.
export function completionMarkers(event: EventDefinition, choiceIndex?: number): string[] {
	const markers = [event.id];
	const choice = choiceIndex !== undefined ? event.scene?.choices?.[choiceIndex] : undefined;
	if (choice?.nextSceneId) {
		markers.push(choice.nextSceneId);
	}
	return markers;
}

// The committed stage used to gate on the commitment_discussion event id, which
// both choices grant; it now gates on the accept outcome (commitment_accepted).
// Saves from before that change can already sit at committed/soulmate without
// the new marker, and the per-turn stage recalc would demote them. Grandfather
// those saves in: if they reached committed under the old gate, treat the talk
// as accepted. Returns the patched marker list, or null when nothing to do.
export function reconcileLegacyMarkers(state: CharacterState): string[] | null {
	const completed = state.completedEvents ?? [];
	const reachedCommitted = [state.relationshipStage, state.savedDatingSimStage].some(
		(stage) => stage === 'committed' || stage === 'soulmate'
	);
	if (
		reachedCommitted &&
		completed.includes('commitment_discussion') &&
		!completed.includes('commitment_accepted')
	) {
		return [...completed, 'commitment_accepted'];
	}
	return null;
}
