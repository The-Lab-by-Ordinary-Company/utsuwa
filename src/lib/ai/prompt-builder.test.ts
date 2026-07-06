import test from 'node:test';
import assert from 'node:assert/strict';

import {
	buildSystemPrompt,
	buildExtractionSystemPrompt,
	truncateMessagesToContext,
	type PromptContext
} from './prompt-builder.ts';
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

test('context size scales memory injection in dating-sim mode', () => {
	const memories: RelevantContext = {
		recentTurns: Array.from({ length: 12 }, (_, i) => ({
			id: i,
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `turn ${i}`,
			createdAt: new Date()
		})) as Array<{ id: number; role: 'user' | 'assistant'; content: string; createdAt: Date }>,
		relevantFacts: Array.from({ length: 8 }, (_, i) => ({
			id: i,
			content: `fact ${i}`,
			category: 'user' as const,
			importance: 50,
			confidence: 0.8,
			referenceCount: 0,
			createdAt: new Date()
		})),
		triggeredMemories: [],
		recentSessions: []
	};

	const small = buildSystemPrompt(makeContext({ contextSize: 2048, memories }));
	const large = buildSystemPrompt(makeContext({ contextSize: 32768, memories }));

	// Small context keeps fewer turns/facts than large context.
	const smallTurns = (small.match(/turn \d+/g) || []).length;
	const largeTurns = (large.match(/turn \d+/g) || []).length;
	assert.ok(smallTurns < largeTurns, `expected small context to keep fewer turns (${smallTurns} vs ${largeTurns})`);

	const smallFacts = (small.match(/fact \d+/g) || []).length;
	const largeFacts = (large.match(/fact \d+/g) || []).length;
	assert.ok(smallFacts < largeFacts, `expected small context to keep fewer facts (${smallFacts} vs ${largeFacts})`);
});

test('context size scales memory injection in companion mode', () => {
	const memories: RelevantContext = {
		recentTurns: Array.from({ length: 12 }, (_, i) => ({
			id: i,
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `turn ${i}`,
			createdAt: new Date()
		})) as Array<{ id: number; role: 'user' | 'assistant'; content: string; createdAt: Date }>,
		relevantFacts: Array.from({ length: 8 }, (_, i) => ({
			id: i,
			content: `fact ${i}`,
			category: 'user' as const,
			importance: 50,
			confidence: 0.8,
			referenceCount: 0,
			createdAt: new Date()
		})),
		triggeredMemories: [],
		recentSessions: []
	};

	const small = buildSystemPrompt(
		makeContext({ state: makeState({ appMode: 'companion' }), contextSize: 2048, memories })
	);
	const large = buildSystemPrompt(
		makeContext({ state: makeState({ appMode: 'companion' }), contextSize: 32768, memories })
	);

	const smallTurns = (small.match(/turn \d+/g) || []).length;
	const largeTurns = (large.match(/turn \d+/g) || []).length;
	assert.ok(smallTurns < largeTurns, `expected small context to keep fewer turns (${smallTurns} vs ${largeTurns})`);

	const smallFacts = (small.match(/fact \d+/g) || []).length;
	const largeFacts = (large.match(/fact \d+/g) || []).length;
	assert.ok(smallFacts < largeFacts, `expected small context to keep fewer facts (${smallFacts} vs ${largeFacts})`);
});

test('truncateMessagesToContext keeps all messages when within budget', () => {
	const messages = [
		{ role: 'system', content: 'x'.repeat(400) }, // ~100 tokens
		{ role: 'user', content: 'hello' },
		{ role: 'assistant', content: 'hi there' },
		{ role: 'user', content: 'how are you?' }
	];
	truncateMessagesToContext(messages, 2048);
	assert.equal(messages.length, 4);
});

test('truncateMessagesToContext removes oldest history to fit budget', () => {
	const messages = [
		{ role: 'system', content: 'x'.repeat(400) }, // ~100 tokens
		{ role: 'user', content: 'a'.repeat(400) }, // ~100 tokens
		{ role: 'assistant', content: 'b'.repeat(400) }, // ~100 tokens
		{ role: 'user', content: 'newest message' }
	];
	// 100 system + 500 reserve = 600 used; 700 - 600 = 100 history budget.
	// The two oldest history messages exceed that, so at least one is dropped.
	truncateMessagesToContext(messages, 700);
	// System + newest user must remain.
	assert.equal(messages[0].role, 'system');
	assert.equal(messages[messages.length - 1].content, 'newest message');
	// At least one older message was dropped.
	assert.ok(messages.length < 4);
});

test('truncateMessagesToContext always keeps newest user message even with oversized system prompt', () => {
	const messages = [
		{ role: 'system', content: 'x'.repeat(10000) }, // ~2500 tokens, exceeds context window
		{ role: 'user', content: 'please help me' }
	];
	truncateMessagesToContext(messages, 2048);
	assert.equal(messages.length, 2);
	assert.equal(messages[0].role, 'system');
	assert.equal(messages[1].content, 'please help me');
});

test('truncateMessagesToContext handles empty history gracefully', () => {
	const messages = [{ role: 'system', content: 'you are helpful' }];
	truncateMessagesToContext(messages, 2048);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].role, 'system');
});

test('truncateMessagesToContext is a no-op with no messages', () => {
	const messages: Array<{ role: string; content: string }> = [];
	truncateMessagesToContext(messages, 2048);
	assert.equal(messages.length, 0);
});
