import { describe, it, expect } from 'vitest';
import { parseResponse, validateStateUpdates, extractPotentialFacts } from './response-parser';

// Helper to build a JSON code block the LLM would emit
function jsonBlock(obj: Record<string, unknown>): string {
	return '```json\n' + JSON.stringify(obj) + '\n```';
}

describe('parseResponse', () => {
	it('returns raw dialogue when there is no JSON block', () => {
		const result = parseResponse('Hello! How are you today?');
		expect(result.dialogue).toBe('Hello! How are you today?');
		expect(result.stateUpdates).toBeNull();
		expect(result.parseError).toBeUndefined();
	});

	it('extracts dialogue and state updates from a fenced JSON block', () => {
		const raw =
			'Oh that is so sweet of you!' +
			'\n\n' +
			jsonBlock({ mood_change: { emotion: 'happy', intensity_delta: 10 }, affection_delta: 5 });

		const result = parseResponse(raw);
		expect(result.dialogue).toContain('Oh that is so sweet of you!');
		expect(result.stateUpdates).not.toBeNull();
		expect(result.stateUpdates!.moodChange).toEqual({ emotion: 'happy', intensityDelta: 10 });
		expect(result.stateUpdates!.affectionDelta).toBe(5);
	});

	it('handles inline JSON (no code fences)', () => {
		const raw = 'Sure thing! {"affection_delta": 3, "trust_delta": 1}';
		const result = parseResponse(raw);
		expect(result.stateUpdates).not.toBeNull();
		expect(result.stateUpdates!.affectionDelta).toBe(3);
		expect(result.stateUpdates!.trustDelta).toBe(1);
	});

	it('records a parseError when JSON is malformed in a code block', () => {
		const raw = 'Hey!\n```json\n{broken json\n```';
		const result = parseResponse(raw);
		expect(result.parseError).toBeDefined();
		expect(result.stateUpdates).toBeNull();
		// dialogue should still come through without the broken block
		expect(result.dialogue).toContain('Hey!');
	});

	it('clamps delta values that exceed allowed ranges', () => {
		const raw = jsonBlock({
			affection_delta: 100,
			trust_delta: -50,
			intimacy_delta: 99,
			comfort_delta: -99,
			respect_delta: 99
		});
		const result = parseResponse('Nice! ' + raw);
		const u = result.stateUpdates!;
		expect(u.affectionDelta).toBe(20); // clamped to [-20, 20]
		expect(u.trustDelta).toBe(-10); // clamped to [-10, 10]
		expect(u.intimacyDelta).toBe(10);
		expect(u.comfortDelta).toBe(-10);
		expect(u.respectDelta).toBe(10);
	});

	it('rejects invalid emotion in mood_change', () => {
		const raw = 'Hey! ' + jsonBlock({ mood_change: { emotion: 'INVALID', intensity_delta: 5 } });
		const result = parseResponse(raw);
		// convertLLMOutput silently drops invalid emotions
		expect(result.stateUpdates).not.toBeNull();
		expect(result.stateUpdates!.moodChange).toBeUndefined();
	});

	it('passes through newMemory and triggeredEvent strings', () => {
		const raw = jsonBlock({
			new_memory: 'User likes cats',
			triggered_event: 'cat_discussion'
		});
		const result = parseResponse('Ok! ' + raw);
		expect(result.stateUpdates!.newMemory).toBe('User likes cats');
		expect(result.stateUpdates!.triggeredEvent).toBe('cat_discussion');
	});

	it('strips action asterisks from dialogue', () => {
		const result = parseResponse('*smiles warmly* Hi there!');
		expect(result.dialogue).not.toContain('*smiles warmly*');
		expect(result.dialogue).toContain('Hi there!');
	});

	it('strips stage directions in parentheses', () => {
		const result = parseResponse('(laughs softly) That was funny!');
		expect(result.dialogue).not.toContain('(laughs softly)');
		expect(result.dialogue).toContain('That was funny!');
	});

	it('strips character name prefixes', () => {
		const result = parseResponse('Miku: I like that idea!');
		expect(result.dialogue).not.toContain('Miku:');
		expect(result.dialogue).toContain('I like that idea!');
	});

	it('returns fallback dialogue when everything gets stripped', () => {
		// All content is action text or stage directions
		const result = parseResponse('*nods* (smiles)');
		expect(result.dialogue).toBe('Hmm... *thinking*');
	});

	it('handles undefined/NaN intensity_delta gracefully', () => {
		const raw = jsonBlock({ mood_change: { emotion: 'happy' } });
		const result = parseResponse('Yay! ' + raw);
		expect(result.stateUpdates!.moodChange!.intensityDelta).toBe(0);
	});

	it('ignores null new_memory and null triggered_event', () => {
		const raw = jsonBlock({ new_memory: null, triggered_event: null, affection_delta: 1 });
		const result = parseResponse('Ok ' + raw);
		expect(result.stateUpdates!.newMemory).toBeUndefined();
		expect(result.stateUpdates!.triggeredEvent).toBeUndefined();
		expect(result.stateUpdates!.affectionDelta).toBe(1);
	});
});

describe('validateStateUpdates', () => {
	it('passes valid updates through unchanged', () => {
		const updates = {
			moodChange: { emotion: 'happy' as const, intensityDelta: 10 },
			affectionDelta: 5,
			trustDelta: 3
		};
		const result = validateStateUpdates(updates);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
		expect(result.sanitized.moodChange!.emotion).toBe('happy');
		expect(result.sanitized.affectionDelta).toBe(5);
		expect(result.sanitized.trustDelta).toBe(3);
	});

	it('warns and drops invalid emotion', () => {
		const updates = {
			moodChange: { emotion: 'BOGUS' as any, intensityDelta: 5 }
		};
		const result = validateStateUpdates(updates);
		expect(result.valid).toBe(false);
		expect(result.warnings.some((w) => w.includes('Invalid emotion'))).toBe(true);
		expect(result.sanitized.moodChange).toBeUndefined();
	});

	it('warns when affection delta exceeds 50', () => {
		const updates = { affectionDelta: 60 };
		const result = validateStateUpdates(updates);
		expect(result.valid).toBe(false);
		expect(result.warnings.some((w) => w.includes('Affection delta too large'))).toBe(true);
		// Still sanitized/clamped to 20
		expect(result.sanitized.affectionDelta).toBe(20);
	});

	it('warns when trust delta exceeds 20', () => {
		const updates = { trustDelta: -25 };
		const result = validateStateUpdates(updates);
		expect(result.valid).toBe(false);
		expect(result.warnings.some((w) => w.includes('Trust delta too large'))).toBe(true);
		expect(result.sanitized.trustDelta).toBe(-10);
	});

	it('clamps intimacy, comfort, and respect without warning', () => {
		const updates = { intimacyDelta: 50, comfortDelta: -50, respectDelta: 50 };
		const result = validateStateUpdates(updates);
		// No warnings for these since there is no explicit threshold check
		expect(result.sanitized.intimacyDelta).toBe(10);
		expect(result.sanitized.comfortDelta).toBe(-10);
		expect(result.sanitized.respectDelta).toBe(10);
	});

	it('passes through newMemory and triggeredEvent strings', () => {
		const updates = { newMemory: 'likes dogs', triggeredEvent: 'pet_talk' };
		const result = validateStateUpdates(updates);
		expect(result.sanitized.newMemory).toBe('likes dogs');
		expect(result.sanitized.triggeredEvent).toBe('pet_talk');
	});

	it('returns valid=true when there are no warnings', () => {
		const result = validateStateUpdates({});
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('clamps mood intensity delta to [-30, 30]', () => {
		const updates = {
			moodChange: { emotion: 'excited' as const, intensityDelta: 100 }
		};
		const result = validateStateUpdates(updates);
		expect(result.sanitized.moodChange!.intensityDelta).toBe(30);
	});
});

describe('extractPotentialFacts', () => {
	it('extracts "I am" statements from user message', () => {
		const facts = extractPotentialFacts('', "I'm a software engineer");
		expect(facts.some((f) => f.toLowerCase().includes('software engineer'))).toBe(true);
	});

	it('extracts "I like" statements from user message', () => {
		const facts = extractPotentialFacts('', 'I like playing guitar');
		expect(facts.some((f) => f.toLowerCase().includes('playing guitar'))).toBe(true);
	});

	it('extracts "I work at" statements from user message', () => {
		const facts = extractPotentialFacts('', 'I work at a bakery downtown');
		expect(facts.some((f) => f.toLowerCase().includes('bakery downtown'))).toBe(true);
	});

	it('extracts AI-perspective "you are" facts from dialogue', () => {
		const facts = extractPotentialFacts('you are really talented at drawing', '');
		expect(facts.some((f) => f.toLowerCase().includes('talented at drawing'))).toBe(true);
	});

	it('extracts "I\'ll remember" patterns from dialogue', () => {
		const facts = extractPotentialFacts("I'll remember that you love pizza", '');
		expect(facts.some((f) => f.toLowerCase().includes('you love pizza'))).toBe(true);
	});

	it('filters out facts shorter than 6 chars or longer than 199 chars', () => {
		const facts = extractPotentialFacts('', "I'm ab"); // "ab" is too short after extraction
		// The extracted capture group would be "ab" which is 2 chars -- filtered by length > 2 in extractor,
		// then filtered by > 5 in the final filter
		const shortFacts = facts.filter((f) => {
			// Get the part after "User: " prefix
			const content = f.replace(/^User:\s*/, '');
			return content.length <= 5;
		});
		expect(shortFacts).toHaveLength(0);
	});

	it('returns empty array when no patterns match', () => {
		const facts = extractPotentialFacts('Hello!', 'Hi there');
		expect(facts).toEqual([]);
	});

	it('extracts multiple facts from a single user message', () => {
		const facts = extractPotentialFacts('', "I'm a teacher and I love hiking");
		expect(facts.length).toBeGreaterThanOrEqual(2);
	});

	it('extracts "my favorite is" pattern', () => {
		// The regex captures: /\bmy (?:name|job|hobby|favorite|family) is\s+([^.!?,]+)/
		// For "my favorite food is sushi", the actual match group includes "food is sushi"
		const facts = extractPotentialFacts('', 'my favorite is sushi');
		expect(facts.some((f) => f.toLowerCase().includes('sushi'))).toBe(true);
	});
});
