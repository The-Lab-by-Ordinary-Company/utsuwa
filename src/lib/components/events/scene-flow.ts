import type { Scene } from '$lib/types/events';

export type ScenePhase = 'intro' | 'dialogue' | 'choices' | 'response' | 'outro';

// Where a click-to-advance lands from the current phase. Returns null when the
// click should be ignored: no scene (the overlay keeps its click handlers while
// it fades out after the parent clears the event) or the choices phase, which
// only moves through an explicit choice pick.
export function nextPhase(
	phase: ScenePhase,
	scene: Scene | null | undefined
): ScenePhase | 'complete' | null {
	if (!scene) return null;

	switch (phase) {
		case 'intro':
			return 'dialogue';
		case 'dialogue':
			if (scene.choices && scene.choices.length > 0) return 'choices';
			return scene.outro ? 'outro' : 'complete';
		case 'response':
			return scene.outro ? 'outro' : 'complete';
		case 'outro':
			return 'complete';
		default:
			return null;
	}
}
