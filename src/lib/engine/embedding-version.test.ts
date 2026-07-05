import test from 'node:test';
import assert from 'node:assert/strict';

import {
	EMBEDDING_MODEL_ID,
	hasCurrentEmbedding,
	needsReembedding
} from './embedding-version.ts';

test('the embedding model id is the multilingual MiniLM', () => {
	assert.match(EMBEDDING_MODEL_ID, /multilingual/i);
});

test('a fact embedded by the current model is current', () => {
	const fact = { embedding: [0.1, 0.2], embeddingModel: EMBEDDING_MODEL_ID };
	assert.equal(hasCurrentEmbedding(fact), true);
	assert.equal(needsReembedding(fact), false);
});

test('legacy facts with untagged embeddings need re-embedding and are excluded from search', () => {
	// Everything embedded before the model swap has no embeddingModel field.
	// Cosine similarity across two different embedding spaces is meaningless,
	// so these must not participate in retrieval or dedup until re-embedded.
	const legacy = { embedding: [0.1, 0.2] };
	assert.equal(hasCurrentEmbedding(legacy), false);
	assert.equal(needsReembedding(legacy), true);
});

test('facts tagged by a different model need re-embedding', () => {
	const other = { embedding: [0.1], embeddingModel: 'Xenova/all-MiniLM-L6-v2' };
	assert.equal(hasCurrentEmbedding(other), false);
	assert.equal(needsReembedding(other), true);
});

test('facts without any embedding need embedding but are never search-current', () => {
	assert.equal(hasCurrentEmbedding({}), false);
	assert.equal(needsReembedding({}), true);
	assert.equal(hasCurrentEmbedding({ embedding: [] }), false);
	assert.equal(needsReembedding({ embedding: [], embeddingModel: EMBEDDING_MODEL_ID }), true);
});
