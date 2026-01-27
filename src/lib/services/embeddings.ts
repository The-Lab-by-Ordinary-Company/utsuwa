import { browser } from '$app/environment';
import type { Fact } from '$lib/types/memory';

// Model config
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

// State
let pipeline: unknown = null;
let isLoading = false;
let isReady = false;
let loadError: string | null = null;

// Listeners for state changes
type StateListener = (state: EmbeddingState) => void;
const listeners: Set<StateListener> = new Set();

export interface EmbeddingState {
	isLoading: boolean;
	isReady: boolean;
	error: string | null;
}

function notifyListeners() {
	const state: EmbeddingState = { isLoading, isReady, error: loadError };
	listeners.forEach((fn) => fn(state));
}

export function subscribeToEmbeddingState(fn: StateListener): () => void {
	listeners.add(fn);
	fn({ isLoading, isReady, error: loadError });
	return () => listeners.delete(fn);
}

export function getEmbeddingState(): EmbeddingState {
	return { isLoading, isReady, error: loadError };
}

export async function initEmbeddingModel(): Promise<boolean> {
	if (!browser) return false;
	if (isReady) return true;
	if (isLoading) {
		// Wait for existing load to complete
		return new Promise((resolve) => {
			const unsub = subscribeToEmbeddingState((state) => {
				if (!state.isLoading) {
					unsub();
					resolve(state.isReady);
				}
			});
		});
	}

	isLoading = true;
	loadError = null;
	notifyListeners();

	try {
		// Dynamic import to avoid SSR issues
		const { pipeline: createPipeline } = await import('@xenova/transformers');

		pipeline = await createPipeline('feature-extraction', MODEL_NAME, {
			progress_callback: (progress: { status: string }) => {
				// Could emit progress events here if needed
				// console.log('[embeddings] Loading model:', progress.status);
			}
		});

		isReady = true;
		isLoading = false;
		notifyListeners();
		// console.log('[embeddings] Model loaded successfully');
		return true;
	} catch (err) {
		loadError = err instanceof Error ? err.message : 'Failed to load embedding model';
		isLoading = false;
		isReady = false;
		notifyListeners();
		// console.error('[embeddings] Failed to load model:', err);
		return false;
	}
}

export async function embedText(text: string): Promise<number[] | null> {
	if (!isReady || !pipeline) {
		// console.warn('[embeddings] Model not ready, cannot embed text');
		return null;
	}

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const output = await (pipeline as any)(text, {
			pooling: 'mean',
			normalize: true
		});

		// Convert tensor to array
		const embedding = Array.from(output.data as Float32Array);

		// if (embedding.length !== EMBEDDING_DIM) {
		// 	console.warn(
		// 		`[embeddings] Unexpected embedding dimension: ${embedding.length}, expected ${EMBEDDING_DIM}`
		// 	);
		// }

		return embedding;
	} catch (err) {
		// console.error('[embeddings] Failed to embed text:', err);
		return null;
	}
}

export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		// console.warn('[embeddings] Vector length mismatch in similarity calculation');
		return 0;
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	if (normA === 0 || normB === 0) return 0;

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SimilarFact {
	fact: Fact;
	similarity: number;
	score: number; // blended score (similarity + importance)
}

export function findSimilarFacts(
	queryEmbedding: number[],
	facts: Fact[],
	limit: number = 10,
	options: {
		similarityWeight?: number; // 0-1, weight for semantic similarity
		importanceWeight?: number; // 0-1, weight for importance score
		minSimilarity?: number; // minimum similarity threshold
	} = {}
): SimilarFact[] {
	const { similarityWeight = 0.7, importanceWeight = 0.3, minSimilarity = 0.3 } = options;

	const results: SimilarFact[] = [];

	for (const fact of facts) {
		if (!fact.embedding || fact.embedding.length === 0) {
			continue;
		}

		const similarity = cosineSimilarity(queryEmbedding, fact.embedding);

		if (similarity < minSimilarity) {
			continue;
		}

		// Blend similarity with importance (normalized to 0-1)
		const normalizedImportance = fact.importance / 100;
		const score = similarity * similarityWeight + normalizedImportance * importanceWeight;

		results.push({ fact, similarity, score });
	}

	// Sort by blended score descending
	results.sort((a, b) => b.score - a.score);

	return results.slice(0, limit);
}

export async function embedFacts(
	facts: Fact[],
	onProgress?: (done: number, total: number) => void
): Promise<Map<number, number[]>> {
	const embeddings = new Map<number, number[]>();

	for (let i = 0; i < facts.length; i++) {
		const fact = facts[i];
		if (fact.id === undefined) continue;

		const embedding = await embedText(fact.content);
		if (embedding) {
			embeddings.set(fact.id, embedding);
		}

		onProgress?.(i + 1, facts.length);
	}

	return embeddings;
}

export function isEmbeddingReady(): boolean {
	return isReady;
}
