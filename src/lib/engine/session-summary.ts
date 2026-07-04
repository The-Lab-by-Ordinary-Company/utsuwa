import type { ConversationTurn } from '../types/memory.ts';

// Words too common to be useful topic signals.
const STOPWORDS = new Set([
	'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
	'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'as', 'by', 'from', 'up', 'out',
	'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
	'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'here', 'there',
	'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
	'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
	'than', 'too', 'very', 'can', 'will', 'just', 'do', 'does', 'did', 'have', 'has', 'had',
	'would', 'could', 'should', 'get', 'got', 'like', 'really', 'think', 'know', 'want',
	'yeah', 'okay', 'hey', 'hi', 'hello', 'thanks', 'thank', 'well', 'good', 'nice',
	'today', 'now', 'then', 'much', 'also', 'because', 'into', 'over', 'been'
]);

export interface SessionSummaryResult {
	summary: string;
	keyTopics: string[];
	emotionalArc: string;
}

/**
 * Build a lightweight, deterministic summary of a session from its turns.
 * Intentionally dependency-free (no LLM, no storage) so it's cheap and testable —
 * it exists so the "last time you talked" prompt context has something to read.
 */
export function summarizeTurns(turns: Pick<ConversationTurn, 'role' | 'content'>[]): SessionSummaryResult {
	const userText = turns
		.filter((t) => t.role === 'user' && t.content)
		.map((t) => t.content)
		.join(' ');

	if (!userText.trim()) {
		return { summary: '', keyTopics: [], emotionalArc: '' };
	}

	// Frequency-rank meaningful words as topics.
	const counts = new Map<string, number>();
	for (const raw of userText.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
		const word = raw.replace(/^['-]+|['-]+$/g, '');
		if (word.length < 4 || STOPWORDS.has(word)) continue;
		counts.set(word, (counts.get(word) ?? 0) + 1);
	}

	const keyTopics = Array.from(counts.entries())
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, 4)
		.map(([w]) => w);

	let summary: string;
	if (keyTopics.length >= 2) {
		const list =
			keyTopics.length === 2
				? `${keyTopics[0]} and ${keyTopics[1]}`
				: `${keyTopics.slice(0, -1).join(', ')}, and ${keyTopics[keyTopics.length - 1]}`;
		summary = `You talked about ${list}.`;
	} else {
		// Not enough distinct topics — fall back to a trimmed first user message.
		const first = turns.find((t) => t.role === 'user' && t.content)?.content ?? '';
		summary = first.length > 120 ? `${first.slice(0, 117).trimEnd()}…` : first;
	}

	return { summary, keyTopics, emotionalArc: '' };
}
