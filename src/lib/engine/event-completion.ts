import type { EventDefinition } from '$lib/types/events';

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
