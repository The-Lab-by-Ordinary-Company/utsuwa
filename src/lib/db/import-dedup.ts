// Dedup helpers for save-file import. Kept dependency-free (no Dexie, no stores)
// so they can be unit tested. Exported records have their auto-increment ids
// stripped, so merge-mode re-import must dedup on natural content keys instead.

const asTime = (v: unknown): string => {
	const t = v == null ? NaN : new Date(v as string | number | Date).getTime();
	return Number.isNaN(t) ? '' : String(t);
};

export const factKey = (f: { content?: unknown; category?: unknown }): string =>
	`${f.category ?? ''}|${f.content ?? ''}`;

export const sessionKey = (s: { startedAt?: unknown }): string => asTime(s.startedAt);

export const turnKey = (t: { createdAt?: unknown; role?: unknown; content?: unknown }): string =>
	`${asTime(t.createdAt)}|${t.role ?? ''}|${t.content ?? ''}`;

export const eventKey = (e: { eventId?: unknown; completedAt?: unknown }): string =>
	`${e.eventId ?? ''}|${asTime(e.completedAt)}`;

// Split incoming records into those to insert vs. duplicates to skip. Dedupes
// against records already present AND within the incoming batch itself.
export function partitionNewRecords<T>(
	records: T[],
	keyOf: (r: T) => string,
	existingKeys: Set<string>
): { toAdd: T[]; skipped: number } {
	const seen = new Set(existingKeys);
	const toAdd: T[] = [];
	let skipped = 0;
	for (const record of records) {
		const key = keyOf(record);
		if (seen.has(key)) {
			skipped++;
			continue;
		}
		seen.add(key);
		toAdd.push(record);
	}
	return { toAdd, skipped };
}
