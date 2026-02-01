import { db } from '$lib/db';
import type { Fact, FactCategory } from '$lib/types/memory';

export interface GraphNode {
	id: number;
	content: string;
	category: FactCategory;
	importance: number;
	referenceCount: number;
	createdAt: Date;
	lastAccessed?: Date;
	x?: number;
	y?: number;
}

export interface GraphLink {
	source: number;
	target: number;
	similarity: number;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
}

export interface GraphFilters {
	categories: Set<FactCategory>;
	minSimilarity: number;
}

// Cosine similarity between two embeddings
function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) return 0;

	let dot = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	const denominator = Math.sqrt(normA) * Math.sqrt(normB);
	return denominator === 0 ? 0 : dot / denominator;
}

// Get all facts with embeddings from the database
export async function getFactsWithEmbeddings(): Promise<Fact[]> {
	const allFacts = await db.facts.toArray();
	return allFacts.filter((fact) => fact.embedding && fact.embedding.length > 0) as Fact[];
}

// Build graph data from facts
export function buildGraph(facts: Fact[], threshold = 0.5): GraphData {
	const nodes: GraphNode[] = facts.map((fact) => ({
		id: fact.id!,
		content: fact.content,
		category: fact.category,
		importance: fact.importance,
		referenceCount: fact.referenceCount,
		createdAt: fact.createdAt,
		lastAccessed: fact.lastAccessed
	}));

	const links: GraphLink[] = [];

	// Calculate pairwise similarities
	for (let i = 0; i < facts.length; i++) {
		for (let j = i + 1; j < facts.length; j++) {
			const factA = facts[i];
			const factB = facts[j];

			if (factA.embedding && factB.embedding) {
				const similarity = cosineSimilarity(factA.embedding, factB.embedding);

				if (similarity >= threshold) {
					links.push({
						source: factA.id!,
						target: factB.id!,
						similarity
					});
				}
			}
		}
	}

	return { nodes, links };
}

// Filter graph data by categories
export function filterGraph(data: GraphData, filters: GraphFilters): GraphData {
	const filteredNodes = data.nodes.filter((node) => filters.categories.has(node.category));
	const nodeIds = new Set(filteredNodes.map((n) => n.id));

	const filteredLinks = data.links.filter(
		(link) =>
			nodeIds.has(link.source) &&
			nodeIds.has(link.target) &&
			link.similarity >= filters.minSimilarity
	);

	return { nodes: filteredNodes, links: filteredLinks };
}

// Get connected node IDs for a given node
export function getConnectedNodes(data: GraphData, nodeId: number): Set<number> {
	const connected = new Set<number>();

	for (const link of data.links) {
		if (link.source === nodeId) {
			connected.add(link.target);
		} else if (link.target === nodeId) {
			connected.add(link.source);
		}
	}

	return connected;
}

// Category colors
export const categoryColors: Record<FactCategory, string> = {
	user: '#01B2FF',
	relationship: '#f472b6',
	shared_experience: '#34d399'
};

// Get node size based on importance (normalized to 4-20 range)
export function getNodeSize(importance: number): number {
	const min = 4;
	const max = 20;
	return min + (importance / 100) * (max - min);
}

// Get node opacity based on recency (last 30 days = full opacity)
export function getNodeOpacity(lastAccessed?: Date, createdAt?: Date): number {
	const date = lastAccessed || createdAt;
	if (!date) return 0.5;

	const now = Date.now();
	const daysSince = (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24);

	if (daysSince <= 7) return 1;
	if (daysSince <= 30) return 0.8;
	if (daysSince <= 90) return 0.6;
	return 0.4;
}
