import type {
	Fact,
	SessionSummary,
	ConversationTurn,
	RelevantContext,
	WorkingMemory,
	MemorySearchOptions,
	NewFact
} from '$lib/types/memory';
import {
	MAX_WORKING_MEMORY_TURNS,
	MAX_RELEVANT_FACTS,
	MAX_RECENT_SESSIONS,
	DEFAULT_FACT_IMPORTANCE,
	DEFAULT_FACT_CONFIDENCE,
	getMemoryBudget
} from '$lib/types/memory';
import * as memoryStorage from '$lib/services/storage/memory';
import { embedText, findSimilarFacts, isEmbeddingReady } from '$lib/services/embeddings';
import { hasCurrentEmbedding } from './embedding-version';
import { summarizeTurns } from './session-summary';

// Working memory store (single instance for the session)
let workingMemory: WorkingMemory = {
	turns: [],
	sessionStartedAt: new Date(),
	messageCount: 0
};

// Expose read-only access to the current working memory state
export function getWorkingMemory(): WorkingMemory {
	return workingMemory;
}

// Add a turn to working memory
export function addTurnToWorkingMemory(turn: Omit<ConversationTurn, 'id'>): void {
	workingMemory.turns.push({
		...turn,
		createdAt: turn.createdAt ?? new Date()
	} as ConversationTurn);

	// Trim to max size
	if (workingMemory.turns.length > MAX_WORKING_MEMORY_TURNS) {
		workingMemory.turns = workingMemory.turns.slice(-MAX_WORKING_MEMORY_TURNS);
	}

	workingMemory.messageCount++;
}

// How many turns have been persisted under the current session.
let currentSessionTurnCount = 0;

// Open a session for this run on first use, so persisted turns can be grouped
// and "last time you talked" style context has something to read.
async function ensureSession(): Promise<number | undefined> {
	if (workingMemory.currentSessionId !== undefined) return workingMemory.currentSessionId;
	try {
		const session = await memoryApi.createSession();
		workingMemory.currentSessionId = session.id;
		workingMemory.sessionStartedAt = session.startedAt;
		currentSessionTurnCount = 0;
		return session.id;
	} catch (e) {
		console.debug('[Memory] Failed to create session:', e);
		return undefined;
	}
}

// Record a conversation turn: mirror it into working memory AND persist it to
// IndexedDB so history survives reloads and exports aren't empty. Persistence
// failures are non-fatal — the in-RAM copy still drives the current session.
export async function recordTurn(
	turn: Omit<ConversationTurn, 'id' | 'createdAt' | 'sessionId'>
): Promise<void> {
	const sessionId = await ensureSession();
	const full: Omit<ConversationTurn, 'id'> = { ...turn, sessionId, createdAt: new Date() };

	addTurnToWorkingMemory(full);

	try {
		await memoryStorage.saveConversationTurn(full);
		if (sessionId !== undefined) {
			currentSessionTurnCount++;
			await memoryStorage.updateSession(sessionId, {
				messageCount: currentSessionTurnCount,
				endedAt: full.createdAt
			});
		}
	} catch (e) {
		console.debug('[Memory] Failed to persist conversation turn:', e);
	}
}

// Get recent turns from working memory
export function getRecentTurns(limit: number = 10): ConversationTurn[] {
	return workingMemory.turns.slice(-limit);
}

// Hydrate working memory from IndexedDB (call on page load)
export async function hydrateWorkingMemory(): Promise<void> {
	if (workingMemory.turns.length > 0) return;

	const recentTurns = await memoryStorage.getConversationTurns({ limit: 20 });
	workingMemory.turns = recentTurns;
	workingMemory.messageCount = recentTurns.length;

	// Backfill summaries for past sessions that ended without one, so the
	// "last time you talked" prompt context actually has something to read.
	await finalizeStaleSessions();
}

// Generate summaries for any past session that has turns but no summary yet
// (skipping the current run's session, which is still active). Runs on load so
// summaries exist before the first message of a returning session builds its prompt.
export async function finalizeStaleSessions(): Promise<void> {
	try {
		const sessions = await memoryStorage.getSessions();
		for (const session of sessions) {
			if (session.id === undefined) continue;
			if (session.id === workingMemory.currentSessionId) continue;
			if (session.summary && session.summary.length > 0) continue;

			const turns = await memoryStorage.getConversationTurns({ sessionId: session.id });
			if (turns.length === 0) continue;

			const { summary, keyTopics, emotionalArc } = summarizeTurns(turns);
			if (summary) {
				await memoryStorage.updateSession(session.id, { summary, keyTopics, emotionalArc });
			}
		}
	} catch (e) {
		console.debug('[Memory] Failed to finalize stale sessions:', e);
	}
}

// Memory API - uses IndexedDB storage directly
export const memoryApi = {
	// Get facts from IndexedDB
	async getFacts(limit: number = 50): Promise<Fact[]> {
		return memoryStorage.getFacts({ limit });
	},

	// Get sessions from IndexedDB
	async getSessions(limit: number = 10): Promise<SessionSummary[]> {
		return memoryStorage.getSessions(limit);
	},

	// Search facts by keywords
	async searchFacts(query: string, options: MemorySearchOptions = {}): Promise<Fact[]> {
		const keywords = query.split(/\s+/).filter((w) => w.length > 2);
		return memoryStorage.getFacts({
			...options,
			keywords: keywords.length > 0 ? keywords : undefined
		});
	},

	// Create a new fact
	async createFact(fact: NewFact): Promise<Fact> {
		const id = await memoryStorage.saveFact({
			...fact,
			importance: fact.importance ?? DEFAULT_FACT_IMPORTANCE,
			confidence: fact.confidence ?? DEFAULT_FACT_CONFIDENCE
		});
		return {
			id,
			...fact,
			importance: fact.importance ?? DEFAULT_FACT_IMPORTANCE,
			confidence: fact.confidence ?? DEFAULT_FACT_CONFIDENCE,
			referenceCount: 0,
			createdAt: new Date()
		};
	},

	// Create a new session
	async createSession(): Promise<SessionSummary> {
		const now = new Date();
		const id = await memoryStorage.saveSession({
			summary: '',
			keyTopics: [],
			messageCount: 0,
			emotionalArc: '',
			startedAt: now
		});
		return {
			id,
			summary: '',
			keyTopics: [],
			messageCount: 0,
			emotionalArc: '',
			startedAt: now
		};
	},

	// Save a conversation turn
	async saveTurn(turn: Omit<ConversationTurn, 'id' | 'createdAt'>): Promise<ConversationTurn> {
		const now = new Date();
		const id = await memoryStorage.saveConversationTurn({
			...turn,
			createdAt: now
		});
		return {
			id,
			...turn,
			createdAt: now
		};
	}
};

// Retrieve relevant context for prompt building.
// When contextSize is provided, recent turns are bounded by the memory budget
// so the 20-turn tier for large context windows is actually reachable.
export async function retrieveRelevantContext(
	userMessage: string,
	contextSize?: number
): Promise<RelevantContext> {
	// Get recent turns from working memory
	const turnLimit = contextSize ? getMemoryBudget(contextSize).workingMemoryTurns : 10;
	const recentTurns = getRecentTurns(turnLimit);

	// Search for relevant facts based on user message
	let relevantFacts: Fact[] = [];
	let triggeredMemories: Fact[] = [];

	try {
		// Try semantic search first if embedding model is ready
		if (isEmbeddingReady()) {
			const queryEmbedding = await embedText(userMessage);
			if (queryEmbedding) {
				// Bounded candidate pool (top-importance facts with embeddings) so
				// scoring cost doesn't grow linearly with total memory count.
				const allFacts = await memoryStorage.getFactsForSemanticSearch();
				const semanticResults = findSimilarFacts(queryEmbedding, allFacts, MAX_RELEVANT_FACTS, {
					similarityWeight: 0.7,
					importanceWeight: 0.3,
					minSimilarity: 0.3
				});
				relevantFacts = semanticResults.map((r) => r.fact);

				// For triggered memories, use higher similarity threshold
				const triggerWords = extractTriggerWords(userMessage);
				if (triggerWords.length > 0) {
					const triggerQuery = triggerWords.join(' ');
					const triggerEmbedding = await embedText(triggerQuery);
					if (triggerEmbedding) {
						const triggerResults = findSimilarFacts(triggerEmbedding, allFacts, 5, {
							similarityWeight: 0.6,
							importanceWeight: 0.4,
							minSimilarity: 0.5
						});
						triggeredMemories = triggerResults
							.map((r) => r.fact)
							.filter((t) => !relevantFacts.some((r) => r.id === t.id));
					}
				}
			}
		}

		// Fall back to keyword search if semantic search didn't work or returned nothing
		if (relevantFacts.length === 0) {
			// Get high-importance facts (always include these regardless of keywords)
			const importantFacts = await memoryApi.getFacts(5);

			// Search by keywords in user message
			const keywordFacts = await memoryApi.searchFacts(userMessage, {
				limit: MAX_RELEVANT_FACTS
			});

			// Merge important facts with keyword-matched facts, dedupe by id
			const allFacts = [...importantFacts];
			for (const fact of keywordFacts) {
				if (!allFacts.some((f) => f.id === fact.id)) {
					allFacts.push(fact);
				}
			}
			relevantFacts = allFacts.slice(0, MAX_RELEVANT_FACTS);

			// Check for triggered memories (specific keywords)
			const triggerWords = extractTriggerWords(userMessage);
			if (triggerWords.length > 0) {
				const triggered = await memoryApi.searchFacts(triggerWords.join(' '), {
					minImportance: 70,
					limit: 5
				});
				triggeredMemories = triggered.filter(
					(t) => !relevantFacts.some((r) => r.id === t.id)
				);
			}
		}
	} catch (e) {
		console.error('[Memory] Failed to fetch relevant facts:', e);
	}

	// Get recent sessions for context
	let recentSessions: SessionSummary[] = [];
	try {
		recentSessions = await memoryApi.getSessions(MAX_RECENT_SESSIONS);
	} catch (e) {
		console.error('Failed to fetch recent sessions:', e);
	}

	// Increment reference counts for retrieved facts
	const allRetrievedFacts = [...relevantFacts, ...triggeredMemories];
	for (const fact of allRetrievedFacts) {
		if (fact.id !== undefined) {
			memoryStorage.incrementFactReference(fact.id);
		}
	}

	return {
		recentTurns,
		relevantFacts,
		triggeredMemories,
		recentSessions
	};
}

// Extract trigger words from a message
function extractTriggerWords(message: string): string[] {
	const triggers: string[] = [];
	const lowerMessage = message.toLowerCase();

	// Personal triggers ("remember when ...", "recall that ...")
	const recallPattern = /\b(?:remember|recall|forgot|forget)\s+(?:when|that|about)\s+([^.!?]+)/gi;
	let match;
	while ((match = recallPattern.exec(lowerMessage)) !== null) {
		if (match[1]) {
			triggers.push(match[1].trim());
		}
	}

	// Name extraction (might trigger facts about the user). Only capture a
	// capitalized word that follows another word — skipping sentence-initial
	// words like "Today"/"Thanks" that aren't names but were being treated as such.
	const namePattern = /(?<=[a-z,]\s+)([A-Z][a-z]+)\b/g;
	let nameMatch;
	while ((nameMatch = namePattern.exec(message)) !== null) {
		triggers.push(nameMatch[1]);
	}

	return triggers.filter((t) => t.length > 2);
}

// Determine fact category
export function determineFactCategory(content: string): 'user' | 'relationship' | 'shared_experience' {
	const lowerContent = content.toLowerCase();

	// Check for user-related content
	if (
		lowerContent.includes('user') ||
		lowerContent.includes('their') ||
		lowerContent.includes('they') ||
		lowerContent.match(/\b(name|job|work|live|family|hobby|favorite)\b/)
	) {
		return 'user';
	}

	// Check for shared experience
	if (
		lowerContent.match(/\b(we|together|our|shared|both)\b/) ||
		lowerContent.match(/\b(talked about|discussed|laughed|cried)\b/)
	) {
		return 'shared_experience';
	}

	// Default to relationship
	return 'relationship';
}

// Backfill embeddings for facts that don't have them
export async function backfillEmbeddings(
	onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number }> {
	if (!isEmbeddingReady()) {
		return { success: 0, failed: 0 };
	}

	const factsWithoutEmbeddings = await memoryStorage.getFactsWithoutEmbeddings();
	let success = 0;
	let failed = 0;

	for (let i = 0; i < factsWithoutEmbeddings.length; i++) {
		const fact = factsWithoutEmbeddings[i];
		if (fact.id === undefined) continue;

		try {
			const embedding = await embedText(fact.content);
			if (embedding) {
				await memoryStorage.updateFactEmbedding(fact.id, embedding);
				success++;
			} else {
				failed++;
			}
		} catch {
			failed++;
		}

		onProgress?.(i + 1, factsWithoutEmbeddings.length);
	}

	return { success, failed };
}

// Check if there are facts without a current-model embedding. Facts embedded
// by an older model count as "without": the boot-time backfill re-embeds them
// so retrieval isn't comparing vectors across embedding spaces.
export async function getEmbeddingBackfillStatus(): Promise<{
	total: number;
	withEmbeddings: number;
	withoutEmbeddings: number;
}> {
	const allFacts = await memoryStorage.getAllFactsWithEmbeddings();
	const withEmbeddings = allFacts.filter((f) => hasCurrentEmbedding(f)).length;
	return {
		total: allFacts.length,
		withEmbeddings,
		withoutEmbeddings: allFacts.length - withEmbeddings
	};
}

// Calculate importance score for a fact
export function calculateFactImportance(content: string, sentiment: number = 0): number {
	let importance = 50; // Base

	// Length bonus (longer = more detailed = more important)
	if (content.length > 50) importance += 10;
	if (content.length > 100) importance += 5;

	// Emotional content bonus
	const emotionalWords = ['love', 'hate', 'fear', 'dream', 'hope', 'wish', 'important', 'special'];
	for (const word of emotionalWords) {
		if (content.toLowerCase().includes(word)) {
			importance += 10;
			break;
		}
	}

	// Personal info bonus
	const personalWords = ['name', 'birthday', 'family', 'job', 'home', 'secret'];
	for (const word of personalWords) {
		if (content.toLowerCase().includes(word)) {
			importance += 15;
			break;
		}
	}

	// Sentiment bonus
	if (Math.abs(sentiment) > 0.5) {
		importance += 10;
	}

	return Math.min(100, importance);
}
