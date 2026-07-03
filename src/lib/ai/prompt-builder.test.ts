import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSystemPrompt, buildExtractionSystemPrompt, type PromptContext } from './prompt-builder.ts';
import type { CharacterState } from '$lib/types/character';
import type { RelevantContext } from '$lib/types/memory';

function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	return {
		name: 'Utsuwa',
		systemPrompt: 'Warm, playful, a little teasing.',
		extensions: {},
		mood: { primary: 'content', intensity: 60, causes: ['good morning chat'] },
		energy: 80,
		affection: 200,
		trust: 40,
		intimacy: 20,
		comfort: 30,
		respect: 10,
		appMode: 'dating_sim',
		relationshipStage: 'friend',
		personality: {},
		lastInteraction: null,
		firstMet: new Date('2026-01-01'),
		daysKnown: 5,
		totalInteractions: 20,
		currentStreak: 2,
		longestStreak: 4,
		streakLastDate: null,
		completedEvents: [],
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides
	} as CharacterState;
}

function emptyMemories(): RelevantContext {
	return { recentTurns: [], relevantFacts: [], triggeredMemories: [], recentSessions: [] };
}

function makeContext(overrides: Partial<PromptContext> = {}): PromptContext {
	return {
		persona: {
			id: 'default',
			name: 'Utsuwa',
			systemPrompt: 'Warm, playful, a little teasing.',
			extensions: {}
		},
		state: makeState(),
		memories: emptyMemories(),
		userMessage: 'hey!',
		systemTime: new Date('2026-07-03T12:00:00'),
		...overrides
	};
}

test('dating-sim prompt includes stage guidance and state', () => {
	const prompt = buildSystemPrompt(makeContext());
	assert.ok(prompt.includes('<current_state>'));
	assert.ok(prompt.includes('Stage: friend'));
	// friend-stage instruction text is present
	assert.ok(prompt.includes("You're comfortable around them"));
});

test('empty memories fall back to an explicit no-memory block', () => {
	const prompt = buildSystemPrompt(makeContext());
	assert.ok(prompt.includes('No specific memories to recall right now.'));
});

test('memories render recent turns and facts', () => {
	const memories: RelevantContext = {
		recentTurns: [
			{ id: 1, role: 'user', content: 'I adopted a cat', createdAt: new Date() },
			{ id: 2, role: 'assistant', content: 'Tell me everything!', createdAt: new Date() }
		],
		relevantFacts: [
			{ id: 1, content: 'They live in Seattle', category: 'user', importance: 80, confidence: 90, referenceCount: 0, createdAt: new Date() }
		],
		triggeredMemories: [],
		recentSessions: []
	};
	const prompt = buildSystemPrompt(makeContext({ memories }));
	assert.ok(prompt.includes('They: I adopted a cat'));
	assert.ok(prompt.includes('You: Tell me everything!'));
	assert.ok(prompt.includes('- They live in Seattle'));
});

test('an empty persona prompt falls back to the default personality line', () => {
	const ctx = makeContext();
	ctx.persona = { ...ctx.persona, systemPrompt: '' };
	const prompt = buildSystemPrompt(ctx);
	assert.ok(prompt.includes('A friendly and caring companion'));
});

test('companion mode drops relationship mechanics entirely', () => {
	const prompt = buildSystemPrompt(makeContext({ state: makeState({ appMode: 'companion' }) }));
	assert.ok(prompt.includes('helpful AI companion'));
	assert.ok(!prompt.includes('dating sim'));
	assert.ok(!prompt.includes('affection_delta'));
	assert.ok(prompt.includes('these relationship stats are disabled'));
});

test('showing an image adds the being_shown layer in both modes', () => {
	const dating = buildSystemPrompt(makeContext({ hasImages: true }));
	assert.ok(dating.includes('<being_shown>'));
	const companion = buildSystemPrompt(
		makeContext({ hasImages: true, state: makeState({ appMode: 'companion' }) })
	);
	assert.ok(companion.includes('<being_shown>'));
	const plain = buildSystemPrompt(makeContext());
	assert.ok(!plain.includes('<being_shown>'));
});

test('extraction prompt only mentions images when there are images', () => {
	assert.ok(buildExtractionSystemPrompt(true).includes('showed the companion an image'));
	assert.ok(!buildExtractionSystemPrompt(false).includes('showed the companion an image'));
	assert.ok(buildExtractionSystemPrompt().includes('ONLY a JSON object'));
});
