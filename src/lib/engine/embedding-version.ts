// Which embedding model produced a fact's vector. Vectors from different
// models live in different spaces, so cosine similarity across them is
// meaningless: retrieval, dedup, and the memory graph must only compare
// same-model embeddings, and anything else gets re-embedded by the backfill.

// Multilingual so Japanese (and other non-Latin) memories retrieve properly;
// same 384-dim output and on-device size class as the English-only model it
// replaced.
export const EMBEDDING_MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

interface EmbeddedLike {
	embedding?: number[];
	embeddingModel?: string;
}

export function hasCurrentEmbedding(fact: EmbeddedLike, model: string = EMBEDDING_MODEL_ID): boolean {
	return !!fact.embedding && fact.embedding.length > 0 && fact.embeddingModel === model;
}

export function needsReembedding(fact: EmbeddedLike, model: string = EMBEDDING_MODEL_ID): boolean {
	return !hasCurrentEmbedding(fact, model);
}
