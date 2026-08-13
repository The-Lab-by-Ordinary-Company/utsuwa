import eld from 'eld/medium';

// Singleton state for the language detector. Uses a promise so concurrent
// callers share one initialization and never race (M4).
let initPromise: Promise<void> | null = null;
let loaded = false;
let activeLanguages: string[] = [];

function normalizeLang(lang: string | undefined): string {
	return (lang || '').toLowerCase().split('-')[0];
}

export function initLanguageDetector(languages: string[]): Promise<void> {
	const langs = languages.filter(Boolean).map(normalizeLang);
	const same =
		langs.length > 0 &&
		activeLanguages.length === langs.length &&
		langs.every((l) => activeLanguages.includes(l));
	// Already loaded with the same languages → nothing to do.
	if (loaded && same) return Promise.resolve();
	// Different languages requested (or first load): (re)initialize. Reset the
	// promise after completion so a later language change can re-init (H2/M1).
	if (!initPromise) {
		initPromise = (async () => {
			try {
				// eld/medium loads the ngrams statically (browser-safe).
				activeLanguages = langs;
				eld.setLanguageSubset(langs);
				loaded = true;
			} catch {
				// Detection is best-effort: on failure stay unloaded so callers
				// fall back to the declared language.
				loaded = false;
			} finally {
				initPromise = null;
			}
		})();
	}
	return initPromise;
}

export function detectLanguage(text: string): string | null {
	if (!loaded) return null;
	try {
		const result = eld.detect(text);
		return result?.language ?? null;
	} catch {
		return null;
	}
}

export function isReliable(text: string): boolean {
	if (!loaded) return false;
	try {
		const result = eld.detect(text);
		return result?.isReliable() ?? false;
	} catch {
		return false;
	}
}

export function validateLanguageTag(text: string, declaredLanguage: string): string {
	const detected = detectLanguage(text);
	if (!detected) return declaredLanguage;
	// Normalize both to primary subtag (H1): "es-ES" must match "es".
	if (normalizeLang(detected) === normalizeLang(declaredLanguage)) return declaredLanguage;
	return activeLanguages[0] ?? declaredLanguage;
}
