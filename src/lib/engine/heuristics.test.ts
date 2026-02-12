import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeMessage, calculateBaselineUpdates } from './heuristics';
import type { CharacterState } from '../types/character';

// Minimal CharacterState factory for tests
function makeState(overrides: Partial<CharacterState> = {}): CharacterState {
	const now = new Date();
	return {
		name: 'Test',
		systemPrompt: '',
		extensions: {},
		mood: { primary: 'neutral', intensity: 50, causes: [] },
		energy: 80,
		affection: 100,
		trust: 40,
		intimacy: 20,
		comfort: 30,
		respect: 25,
		appMode: 'dating_sim',
		relationshipStage: 'acquaintance',
		personality: {
			openness: 0,
			warmth: 20,
			assertiveness: -10,
			playfulness: 10,
			sensitivity: 20,
			likesTeasing: 0,
			prefersDirectness: -10,
			romanticStyle: 'slow_burn'
		},
		lastInteraction: null,
		firstMet: now,
		daysKnown: 5,
		totalInteractions: 10,
		currentStreak: 2,
		longestStreak: 5,
		streakLastDate: null,
		completedEvents: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

describe('analyzeMessage', () => {
	it('returns positive sentiment for positive messages', () => {
		const result = analyzeMessage('I love this! You are amazing and awesome!');
		expect(result.sentiment).toBeGreaterThan(0);
	});

	it('returns negative sentiment for negative messages', () => {
		const result = analyzeMessage('I hate this. I am so sad and disappointed.');
		expect(result.sentiment).toBeLessThan(0);
	});

	it('returns near-zero sentiment for neutral messages', () => {
		const result = analyzeMessage('The weather is 72 degrees today.');
		expect(Math.abs(result.sentiment)).toBeLessThanOrEqual(0.5);
	});

	it('detects shallow topic depth for short simple messages', () => {
		const result = analyzeMessage('Hey');
		expect(result.topicDepth).toBe('shallow');
	});

	it('detects moderate topic depth when depth markers present', () => {
		const result = analyzeMessage('I think that matters a lot');
		expect(result.topicDepth).toBe('moderate');
	});

	it('detects deep topic depth with many depth markers', () => {
		const result = analyzeMessage(
			'I feel like I need to understand my feelings about our relationship and trust'
		);
		expect(result.topicDepth).toBe('deep');
	});

	it('detects deep topic depth for long messages over 200 chars', () => {
		const longMsg = 'a '.repeat(110); // 220 chars
		const result = analyzeMessage(longMsg);
		expect(result.topicDepth).toBe('deep');
	});

	it('detects emotional content', () => {
		const result = analyzeMessage('I feel so hurt by what happened');
		expect(result.hasEmotionalContent).toBe(true);
	});

	it('does not flag non-emotional content', () => {
		const result = analyzeMessage('The meeting is at 3pm');
		expect(result.hasEmotionalContent).toBe(false);
	});

	it('detects questions with question marks', () => {
		const result = analyzeMessage('How are you doing?');
		expect(result.isQuestion).toBe(true);
	});

	it('detects questions starting with interrogative words', () => {
		const result = analyzeMessage('What is your favorite color');
		expect(result.isQuestion).toBe(true);
	});

	it('non-questions are flagged as false', () => {
		const result = analyzeMessage('I went to the store today');
		expect(result.isQuestion).toBe(false);
	});

	it('extracts "I am" facts', () => {
		// analyzeMessage uses /\b(i'?m|i am|my name is)\s+(\w+)/gi which captures full match
		// "I'm a graphic designer" matches "I'm a" (only one \w+ captured)
		const result = analyzeMessage("I'm Charles");
		expect(result.extractedFacts.length).toBeGreaterThan(0);
		expect(result.extractedFacts.some((f) => f.includes("I'm Charles"))).toBe(true);
	});

	it('extracts preference facts', () => {
		const result = analyzeMessage('I really love cooking Italian food');
		expect(result.extractedFacts.some((f) => f.includes('love cooking Italian food'))).toBe(true);
	});

	it('returns mentioned keywords (words > 4 chars)', () => {
		const result = analyzeMessage('hello world programming');
		expect(result.mentionedKeywords).toContain('hello');
		expect(result.mentionedKeywords).toContain('world');
		expect(result.mentionedKeywords).toContain('programming');
	});

	it('detects happy emotion for strongly positive sentiment', () => {
		const result = analyzeMessage('I love this! Great awesome amazing wonderful!');
		expect(result.detectedEmotion).toBe('happy');
	});

	it('detects sad emotion for strongly negative sentiment', () => {
		const result = analyzeMessage('I hate this. Terrible awful sad disappointed.');
		expect(result.detectedEmotion).toBe('sad');
	});

	it('detects curious emotion for deep questions', () => {
		const result = analyzeMessage('Why do you think life matters so much?');
		expect(result.detectedEmotion).toBe('curious');
	});
});

describe('calculateBaselineUpdates', () => {
	// Mock Math.random for deterministic tests (calculateMessageImpact uses it)
	beforeEach(() => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5); // variance = 0 at 0.5
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns StateUpdates with energy and stat deltas', () => {
		const state = makeState();
		const updates = calculateBaselineUpdates('Hello!', state);
		expect(updates.energyDelta).toBeDefined();
		expect(updates.affectionDelta).toBeDefined();
		expect(updates.trustDelta).toBeDefined();
	});

	it('sets mood change for strongly positive message', () => {
		const state = makeState();
		const updates = calculateBaselineUpdates(
			'I love this! You are amazing and awesome and great!',
			state
		);
		expect(updates.moodChange).toBeDefined();
		if (updates.moodChange) {
			expect(['happy', 'content']).toContain(updates.moodChange.emotion);
			expect(updates.moodChange.cause).toBe('positive conversation');
		}
	});

	it('sets mood change for strongly negative message', () => {
		const state = makeState();
		const updates = calculateBaselineUpdates(
			'I hate everything. Terrible sad awful disappointed.',
			state
		);
		expect(updates.moodChange).toBeDefined();
		if (updates.moodChange) {
			expect(['sad', 'anxious']).toContain(updates.moodChange.emotion);
			expect(updates.moodChange.cause).toBe('concerning conversation');
		}
	});

	it('does not set mood change for neutral messages', () => {
		const state = makeState();
		const updates = calculateBaselineUpdates('The room has a table in it.', state);
		expect(updates.moodChange).toBeUndefined();
	});

	it('extracts first fact as newMemory when facts are found', () => {
		const state = makeState();
		const updates = calculateBaselineUpdates("I'm a pilot", state);
		expect(updates.newMemory).toBeDefined();
	});

	it('decreases energy on every message', () => {
		const state = makeState({ energy: 80 });
		const updates = calculateBaselineUpdates('Hey there!', state);
		expect(updates.energyDelta).toBeLessThan(0);
	});

	it('provides higher affection in honeymoon phase (affection < 300)', () => {
		const lowAffection = makeState({ affection: 100 });
		const highAffection = makeState({ affection: 800 });

		// Deep emotional message to get meaningful deltas
		const msg = 'I feel so happy about our relationship and trust';
		const lowResult = calculateBaselineUpdates(msg, lowAffection);
		const highResult = calculateBaselineUpdates(msg, highAffection);

		// Honeymoon multiplier is 1.5x vs deepBond 0.7x, so low should be >= high
		expect(lowResult.affectionDelta!).toBeGreaterThanOrEqual(highResult.affectionDelta!);
	});
});
