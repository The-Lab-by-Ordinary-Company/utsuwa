import test from 'node:test';
import assert from 'node:assert/strict';

import { nextPhase, type ScenePhase } from './scene-flow.ts';
import type { Scene } from '$lib/types/events';

function makeScene(overrides: Partial<Scene> = {}): Scene {
	return {
		id: 'test_scene',
		intro: 'She looks up as you approach.',
		dialogue: 'There is something I want to say.',
		outro: 'The moment lingers.',
		...overrides
	};
}

const choice = {
	text: 'I feel the same way.',
	response: 'Really? I was so nervous...',
	stateChanges: { affectionDelta: 10 }
};

test('intro advances to dialogue', () => {
	assert.equal(nextPhase('intro', makeScene()), 'dialogue');
});

test('dialogue advances to choices when the scene has them', () => {
	assert.equal(nextPhase('dialogue', makeScene({ choices: [choice] })), 'choices');
});

test('dialogue skips to outro when there are no choices', () => {
	assert.equal(nextPhase('dialogue', makeScene({ choices: undefined })), 'outro');
	assert.equal(nextPhase('dialogue', makeScene({ choices: [] })), 'outro');
});

test('dialogue completes when there are no choices and no outro', () => {
	assert.equal(nextPhase('dialogue', makeScene({ choices: undefined, outro: undefined })), 'complete');
});

test('response goes to outro, or completes without one', () => {
	assert.equal(nextPhase('response', makeScene()), 'outro');
	assert.equal(nextPhase('response', makeScene({ outro: undefined })), 'complete');
});

test('outro completes', () => {
	assert.equal(nextPhase('outro', makeScene()), 'complete');
});

test('choices phase ignores click-to-advance', () => {
	assert.equal(nextPhase('choices', makeScene({ choices: [choice] })), null);
});

test('a missing scene is a no-op in every phase', () => {
	// The overlay keeps its click handlers during the fade-out after the parent
	// clears the active event, so a late click must never advance or throw.
	const phases: ScenePhase[] = ['intro', 'dialogue', 'choices', 'response', 'outro'];
	for (const phase of phases) {
		assert.equal(nextPhase(phase, null), null);
		assert.equal(nextPhase(phase, undefined), null);
	}
});
