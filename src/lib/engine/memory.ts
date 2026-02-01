import type {
	Fact,
	SessionSummary,
	ConversationTurn,
	RelevantContext,
	WorkingMemory,
	MemorySearchOptions,
	NewFact
} from '$lib/types/memory';
import { MAX_WORKING_MEMORY_TURNS, MAX_RELEVANT_FACTS, MAX_RECENT_SESSIONS, DEFAULT_FACT_IMPORTANCE, DEFAULT_FACT_CONFIDENCE } from '$lib/types/memory';
import * as memoryStorage from '$lib/services/storage/memory';
import { embedText, findSimilarFacts, isEmbeddingReady } from '$lib/services/embeddings';

// Working memory store (single instance for the session)
let workingMemory: WorkingMemory = {
	turns: [],
	sessionStartedAt: new Date(),
	messageCount: 0
};

// Initialize working memory
export function initWorkingMemory(): WorkingMemory {
	workingMemory = {
		turns: [],
		sessionStartedAt: new Date(),
		messageCount: 0
	};
	return workingMemory;
}

// Get working memory
export function getWorkingMemory(): WorkingMemory {
	return workingMemory;
}

// Add a turn to working memory
export function addTurnToWorkingMemory(turn: Omit<ConversationTurn, 'id'>): void {
	workingMemory.turns.push({
		...turn,
		createdAt: new Date()
	} as ConversationTurn);

	// Trim to max size
	if (workingMemory.turns.length > MAX_WORKING_MEMORY_TURNS) {
		workingMemory.turns = workingMemory.turns.slice(-MAX_WORKING_MEMORY_TURNS);
	}

	workingMemory.messageCount++;
}

// Get recent turns from working memory
export function getRecentTurns(limit: number = 10): ConversationTurn[] {
	return workingMemory.turns.slice(-limit);
}

// Clear working memory (call on session end)
export function clearWorkingMemory(): void {
	workingMemory = {
		turns: [],
		sessionStartedAt: new Date(),
		messageCount: 0
	};
}

// Hydrate working memory from IndexedDB (call on page load)
export async function hydrateWorkingMemory(): Promise<void> {
	// console.log('[Memory] Hydrating working memory');

	// Skip if already hydrated this session
	if (workingMemory.turns.length > 0) {
		// console.log('[Memory] Already hydrated with', workingMemory.turns.length, 'turns');
		return;
	}

	// Load recent conversation turns from IndexedDB
	const recentTurns = await memoryStorage.getConversationTurns({ limit: 20 });

	// Populate working memory
	workingMemory.turns = recentTurns;
	workingMemory.messageCount = recentTurns.length;
	// console.log('[Memory] Hydrated', workingMemory.turns.length, 'turns from IndexedDB');
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
		// console.log('[Memory] Saving fact:', fact.content, '(importance:', fact.importance ?? DEFAULT_FACT_IMPORTANCE, ')');
		const id = await memoryStorage.saveFact({
			...fact,
			importance: fact.importance ?? DEFAULT_FACT_IMPORTANCE,
			confidence: fact.confidence ?? DEFAULT_FACT_CONFIDENCE
		});
		// console.log('[Memory] Fact saved with id:', id);
		// Return the created fact
		const facts = await memoryStorage.getFacts({ limit: 1 });
		return facts.find((f) => f.id === id) || {
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

// Retrieve relevant context for prompt building
export async function retrieveRelevantContext(userMessage: string): Promise<RelevantContext> {
	// Get recent turns from working memory
	const recentTurns = getRecentTurns(10);

	// Search for relevant facts based on user message
	let relevantFacts: Fact[] = [];
	let triggeredMemories: Fact[] = [];

	try {
		// Try semantic search first if embedding model is ready
		if (isEmbeddingReady()) {
			const queryEmbedding = await embedText(userMessage);
			if (queryEmbedding) {
				// Get all facts with embeddings for semantic search
				const allFacts = await memoryStorage.getAllFactsWithEmbeddings();
				const semanticResults = findSimilarFacts(queryEmbedding, allFacts, MAX_RELEVANT_FACTS, {
					similarityWeight: 0.7,
					importanceWeight: 0.3,
					minSimilarity: 0.3
				});
				relevantFacts = semanticResults.map((r) => r.fact);

				// Debug logging for semantic search results (uncomment to enable)
				// if (semanticResults.length > 0) {
				// 	console.log('[Memory] Semantic search results:');
				// 	semanticResults.forEach((r, i) => {
				// 		console.log(`  ${i + 1}. [sim: ${r.similarity.toFixed(3)}, score: ${r.score.toFixed(3)}] "${r.fact.content.slice(0, 60)}..."`);
				// 	});
				// } else {
				// 	console.log('[Memory] Semantic search: no matches above threshold');
				// }

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
			// console.log('[Memory] Falling back to keyword search (semantic unavailable or no matches)');

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

	// Personal triggers
	const personalPatterns = [
		/\b(remember|recall|forgot|forget)\s+(?:when|that|about)\s+([^.!?]+)/gi,
		/\b(last time|before|earlier|yesterday|ago)\b/gi,
		/\b(you said|you mentioned|you told)\b/gi
	];

	for (const pattern of personalPatterns) {
		let match;
		while ((match = pattern.exec(lowerMessage)) !== null) {
			if (match[2]) {
				triggers.push(match[2].trim());
			}
		}
	}

	// Name extraction (might trigger facts about the user)
	const namePattern = /\b([A-Z][a-z]+)\b/g;
	let nameMatch;
	while ((nameMatch = namePattern.exec(message)) !== null) {
		triggers.push(nameMatch[1]);
	}

	return triggers.filter((t) => t.length > 2);
}

// Extract potential facts from a conversation
export function extractFactsFromConversation(
	userMessage: string,
	companionResponse: string
): string[] {
	const facts: string[] = [];

	// User statements about themselves
	const userSelfPatterns = [
		/\bI(?:'m| am)\s+(a |an )?([^.!?,]+)/gi,
		/\bmy (?:name|job|hobby|favorite|family) is\s+([^.!?,]+)/gi,
		/\bI (?:work|live|study) (?:at|in|as)\s+([^.!?,]+)/gi,
		/\bI (?:like|love|enjoy|hate|prefer)\s+([^.!?,]+)/gi
	];

	for (const pattern of userSelfPatterns) {
		let match;
		while ((match = pattern.exec(userMessage)) !== null) {
			const fact = match[match.length - 1].trim();
			if (fact.length > 3 && fact.length < 150) {
				facts.push(`User: ${fact}`);
			}
		}
	}

	// Companion acknowledgments of facts
	const acknowledgmentPatterns = [
		/I(?:'ll)? remember\s+([^.!?]+)/gi,
		/so you(?:'re| are)\s+([^.!?,]+)/gi,
		/you (?:like|love|enjoy)\s+([^.!?,]+)/gi
	];

	for (const pattern of acknowledgmentPatterns) {
		let match;
		while ((match = pattern.exec(companionResponse)) !== null) {
			const fact = match[1].trim();
			if (fact.length > 3 && fact.length < 150 && !facts.some((f) => f.includes(fact))) {
				facts.push(fact);
			}
		}
	}

	return facts;
}

// Determine fact category
export function determinFactCategory(content: string): 'user' | 'relationship' | 'shared_experience' {
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

// Check if there are facts without embeddings
export async function getEmbeddingBackfillStatus(): Promise<{
	total: number;
	withEmbeddings: number;
	withoutEmbeddings: number;
}> {
	const allFacts = await memoryStorage.getAllFactsWithEmbeddings();
	const withEmbeddings = allFacts.filter((f) => f.embedding && f.embedding.length > 0).length;
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
