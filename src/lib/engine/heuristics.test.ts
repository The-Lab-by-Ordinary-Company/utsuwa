import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeMessage, calculateBaselineUpdates } from './heuristics.ts';
import type { CharacterState } from '$lib/types/character';

function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	return {
		name: 'Utsuwa',
		systemPrompt: '',
		extensions: {},
		mood: { primary: 'neutral', intensity: 50, causes: [] },
		energy: 100,
		affection: 0,
		trust: 0,
		intimacy: 0,
		comfort: 0,
		respect: 0,
		appMode: 'dating_sim',
		relationshipStage: 'stranger',
		personality: {},
		lastInteraction: null,
		firstMet: new Date('2026-01-01'),
		daysKnown: 0,
		totalInteractions: 0,
		currentStreak: 0,
		longestStreak: 0,
		streakLastDate: null,
		completedEvents: [],
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides
	} as CharacterState;
}

// --- analyzeMessage ---

test('clearly positive text scores positive sentiment', () => {
	const analysis = analyzeMessage('This is awesome, thank you so much!');
	assert.ok(analysis.sentiment > 0.3);
});

test('clearly negative text scores negative sentiment', () => {
	const analysis = analyzeMessage('I am so upset and worried, this is terrible');
	assert.ok(analysis.sentiment < -0.3);
});

test('neutral text scores zero sentiment', () => {
	const analysis = analyzeMessage('The meeting starts at three');
	assert.equal(analysis.sentiment, 0);
});

test('questions are detected by mark and by leading interrogative', () => {
	assert.equal(analyzeMessage('Are you there?').isQuestion, true);
	assert.equal(analyzeMessage('what happened after the show').isQuestion, true);
	assert.equal(analyzeMessage('Tell me about the show.').isQuestion, false);
});

test('depth markers and length drive topic depth', () => {
	assert.equal(analyzeMessage('ok').topicDepth, 'shallow');
	assert.equal(analyzeMessage('I believe in you').topicDepth, 'moderate');
	const deep = analyzeMessage('I feel like I can trust you with what this relationship means to me');
	assert.equal(deep.topicDepth, 'deep');
});

test('emotional content is flagged', () => {
	assert.equal(analyzeMessage('My heart is racing, I am so nervous').hasEmotionalContent, true);
	assert.equal(analyzeMessage('The bus was late').hasEmotionalContent, false);
});

test('self-statements and preferences become extracted facts', () => {
	const intro = analyzeMessage("I'm Alex and I love hiking in the mountains");
	assert.ok(intro.extractedFacts.some((f) => f.includes("I'm Alex")));
	assert.ok(intro.extractedFacts.some((f) => f.toLowerCase().includes('i love hiking')));
	assert.equal(analyzeMessage('The weather is fine').extractedFacts.length, 0);
});

// --- calculateBaselineUpdates ---

test('baseline updates carry all six deltas within their clamps', () => {
	const updates = calculateBaselineUpdates('Thanks, that was really kind of you!', makeState());
	assert.ok(typeof updates.energyDelta === 'number');
	assert.ok((updates.affectionDelta ?? 0) >= -5 && (updates.affectionDelta ?? 0) <= 10);
	assert.ok((updates.trustDelta ?? 0) >= -3 && (updates.trustDelta ?? 0) <= 5);
	assert.ok((updates.intimacyDelta ?? 0) >= -2 && (updates.intimacyDelta ?? 0) <= 5);
	assert.ok((updates.comfortDelta ?? 0) >= -3 && (updates.comfortDelta ?? 0) <= 3);
	assert.ok((updates.respectDelta ?? 0) >= -2 && (updates.respectDelta ?? 0) <= 3);
});

test('strong sentiment sets a mood change', () => {
	const happy = calculateBaselineUpdates('This is wonderful, I am so happy, thank you!', makeState());
	assert.equal(happy.moodChange?.emotion, 'happy');

	const flat = calculateBaselineUpdates('The meeting starts at three', makeState());
	assert.equal(flat.moodChange, undefined);
});

test('extracted facts surface as a new memory', () => {
	const updates = calculateBaselineUpdates("I'm Alex, nice to meet you", makeState());
	assert.ok(updates.newMemory?.includes("I'm Alex"));
});
