// eld/medium carries ~2 MB of ngram data, so it is loaded on demand the first
// time a session actually needs language validation instead of riding along
// in the main bundle for everyone.
type Eld = typeof import('eld/medium').default;
let eld: Eld | null = null;

// Singleton state for the language detector. Uses a promise so concurrent
// callers share one initialization and never race (M4).
let initPromise: Promise<void> | null = null;
let loaded = false;
let activeLanguages: string[] = [];
let requestedLanguages: string[] | null = null;

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
	// Remember the latest request so a change that arrives while a load is
	// still running is picked up by the loop below (H2/M1).
	requestedLanguages = langs;
	if (initPromise) return initPromise;
	// Build the promise FIRST. The `await 0` forces an async boundary so the
	// body never runs synchronously while initPromise is still being assigned
	// (that used to clobber `initPromise = null` with the settled promise and
	// silently froze every later subset change). Resetting initPromise inside
	// the body's own finally guarantees the loop and the reset are one
	// uninterrupted turn: a request that arrives right after the loop has
	// consumed everything still lands in the same synchronous continuation,
	// so no request can slip through the gap and be dropped.
	const task = (async () => {
		await 0;
		try {
			while (requestedLanguages) {
				const target = requestedLanguages;
				requestedLanguages = null;
				try {
					if (!eld) eld = (await import('eld/medium')).default;
					activeLanguages = target;
					eld.setLanguageSubset(target);
					loaded = true;
				} catch {
					// Detection is best-effort: on failure stay unloaded so callers
					// fall back to the declared language.
					loaded = false;
				}
			}
		} finally {
			initPromise = null;
		}
	})();
	initPromise = task;
	return task;
}

export function detectLanguage(text: string): string | null {
	if (!loaded || !eld) return null;
	try {
		const result = eld.detect(text);
		return result?.language ?? null;
	} catch {
		return null;
	}
}

export function isReliable(text: string): boolean {
	if (!loaded || !eld) return false;
	try {
		const result = eld.detect(text);
		return result?.isReliable() ?? false;
	} catch {
		return false;
	}
}

/**
 * Score-margin thresholds per primary/alt pair, calibrated from the word
 * battery in language-sim.test.ts. eld's isReliable() is sentence-oriented
 * (it vetoes text with fewer than three ngrams), so single tokens never
 * pass it no matter how clearly they score. The normalised getScores()
 * margin between the two active languages separates tokens reliably and
 * is the token-level signal for words the signature lists do not cover.
 */
const PAIR_FLIP_MARGIN: Record<string, number> = {
	'de-es': 0.4,
	'es-de': 0.4,
	'de-en': 0.1,
	'en-de': 0.1,
	'en-es': 0.3,
	'es-en': 0.3
};

function flipMargin(primary: string, alt: string): number {
	return PAIR_FLIP_MARGIN[`${primary}-${alt}`] ?? 0.15;
}

/**
 * Normalised eld scores for a text, or null when the detector is not
 * loaded or produced no scores at all (empty detection).
 */
function detectScores(text: string): Record<string, number> | null {
	if (!loaded || !eld) return null;
	try {
		const scores = eld.detect(text).getScores();
		return Object.keys(scores).length ? scores : null;
	} catch {
		return null;
	}
}

/**
 * Whether eld's normalised score margin between the active primary and
 * alt language clears the calibrated pair threshold.
 */
function marginFavorsAlt(text: string, primary: string, alt: string): boolean {
	const scores = detectScores(text);
	if (!scores) return false;
	const altScore = scores[alt] ?? 0;
	const primaryScore = scores[primary] ?? 0;
	return altScore - primaryScore >= flipMargin(primary, alt);
}

export function validateLanguageTag(text: string, declaredLanguage: string, primaryLanguage?: string): string {
	const detected = detectLanguage(text);
	if (!detected) return declaredLanguage;
	// Normalize both to primary subtag (H1): "es-ES" must match "es".
	if (normalizeLang(detected) === normalizeLang(declaredLanguage)) return declaredLanguage;
	// Only act on reliable detections: short phrases produce confident-looking
	// but wrong results too often to justify an override.
	if (!isReliable(text)) return declaredLanguage;
	// A reliable detection that disagrees with the declared tag wins: a
	// teacher-style mix tags Spanish quotes inside German sentences, so the
	// detected alt language must flip the segment to its own voice. Only a
	// detection of the primary language itself stays conservative — the
	// model mis-tagged primary text as the alt language.
	const primary = primaryLanguage ? normalizeLang(primaryLanguage) : activeLanguages[0];
	if (primary && normalizeLang(detected) === primary) return primaryLanguage ?? primary;
	return normalizeLang(detected);
}

/** A text fragment with its resolved language (M4: teacher-style splitting). */
export interface LanguageFragment {
	text: string;
	language: string;
}

// Fragment boundaries: sentence punctuation (attached separators belong to
// the preceding piece) and dash separators surrounded by spaces. Punctuation
// that is not followed by whitespace ("1.5") does not split.
const FRAGMENT_BOUNDARY = /[\s\S]*?(?:[.!?…]+(?:\s|$)|\s[–—]\s|$)/g;

// ---------------------------------------------------------------------------
// Alt-language token runs (mid-sentence quotes without sentence boundaries).
// "Zum Beispiel: el coche es rojo, das Auto ist rot." has no boundary around
// the Spanish phrase, so ELD only sees a mixed sentence and resolves it
// wholesale — one of the two languages is then spoken with the wrong voice.
// Inside a piece, short alt-language runs are therefore anchored on tokens
// the primary language practically never contains and handed to the alt
// voice.
// ---------------------------------------------------------------------------

// The signal tables are deliberately limited to the fleshed-out trio
// {de, en, es}. Unlisted languages degrade gracefully: no run signals means
// whole-piece ELD resolution only, which still assigns correct voices to
// homogeneous sentences.

interface PrimarySignals {
	/** Function words of the primary language that close an alt run. */
	stops: RegExp;
	/** All common primary function words. Used to filter alt starters that
	 *  collide with the primary language ("es" is German and Spanish; "in"
	 *  is German and English) and defaults to `stops` when unset. */
	words?: RegExp;
	/** Articles — an article directly before an -ar/-ir token marks a primary
	 *  noun ("der Bibliothekar"), not an alt infinitive. */
	articles: RegExp;
	/** Primary-language contractions that prove a token is primary
	 *  ("geht's", "don't") even when ELD leans toward the alt language. */
	contractions?: RegExp;
}

interface AltSignals {
	/** Run starters that only anchor in lowercase (or at piece start): the
	 *  capitalized form collides with primary nouns ("Los geht's"). */
	lowercaseStarters?: RegExp;
	/** Run starters without a case constraint (English/German function
	 *  words) — unambiguous in any of the supported primary languages. */
	starters?: RegExp;
	/** Pronoun starters — only enabled when the primary language is German
	 *  (Spanish "me", "te" … collide with English "me", "I"). */
	pronouns?: RegExp;
	/** Alt-only diacritics that anchor runs. */
	diacritics?: RegExp;
	/** Tokens with these endings are strong verb signals. */
	infinitives?: RegExp;
	/** Common function words of the alt language. Stops of the primary
	 *  language that are also valid alt words ("es" is German and Spanish)
	 *  must not close a run. */
	words?: RegExp;
}

const PRIMARY_SIGNALS: Record<string, PrimarySignals> = {
	de: {
		stops: /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|ist|sind|war|waren|und|oder|aber|ich|du|wir|ihr|sie|er|es|man|nicht|muss|kann|soll|will|hat|haben|hatte|werden|wird|zum|zur|im|in|am|an|auf|für|mit|von|zu|doch|noch|schon|auch|nur|dann|wenn|weil|sehr|hier|mehr|mein|meine|meinen|meiner|dein|deine|deinen|unser|unsere|euer|eure|sein|seine|seinen|ihre|ihren|heißt|bedeutet|sagt|meint|nennt)$/i,
		// Same function words plus "es" (the German pronoun — a stop only when
		// the alt language cannot contain it; the words filter excludes it for
		// Spanish runs).
		words: /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|ist|sind|war|waren|und|oder|aber|ich|du|wir|ihr|sie|er|es|man|nicht|muss|kann|soll|will|hat|haben|hatte|werden|wird|zum|zur|im|in|am|an|auf|für|mit|von|zu|doch|noch|schon|auch|nur|dann|wenn|weil|sehr|hier|mehr|mein|meine|meinen|meiner|dein|deine|deinen|unser|unsere|euer|eure|sein|seine|seinen|ihre|ihren|heißt|bedeutet|sagt|meint|nennt|es)$/i,
		articles: /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)$/i,
		contractions: /\p{L}'s\b/u
	},
	en: {
		stops: /^(?:the|a|an|is|are|was|were|and|or|but|I|you|we|they|he|she|it|not|can|will|has|have|had|to|of|in|on|at|for|with|from|by|up|down|this|that|these|those|my|your|his|her|our|their|says|means|called)$/i,
		articles: /^(?:the|a|an)$/i,
		contractions: /(?:\p{L}n't|\p{L}'s)\b/u
	},
	es: {
		stops: /^(?:el|la|los|las|un|una|unos|unas|es|son|era|eran|y|o|pero|yo|tú|nosotros|vosotros|ellos|ellas|no|puede|pueden|tiene|tienen|ha|han|a|de|en|por|para|con|sin|que|cual|este|esta|estos|estas|ese|esa|esos|esas|me|te|nos|os|mi|tu|su|nuestro|nuestra|vuestro|vuestra|se|lo|le|más|muy|aquí|dice|significa|quiere|llama)$/i,
		articles: /^(?:el|la|los|las|un|una|unos|unas)$/i
	}
};

const ALT_SIGNALS: Record<string, AltSignals> = {
	es: {
		lowercaseStarters: /^(?:el|la|los|las|un|una|unos|unas)$/i,
		pronouns: /^(?:me|te|se|le|lo|les|nos|os|mi|tu|su)$/i,
		// Residual vocabulary the calibrated ELD margin cannot decide (empty
		// scores like "hola"/"guapa", or corpus homographs like "besos"/
		// "playa" that German corpora absorbed). Everything else — common
		// teaching vocabulary such as "gracias", "amor", "vida", "claro",
		// "divertidos" — flips via marginFavorsAlt()/per-token ELD in
		// findAltRuns. The calibration battery lives in language-sim.test.ts.
		starters: /^(?:hola|adiós|guapa|guapo|bonito|bonita|lindo|linda|triste|amo|dulce|beso|besos|playa|corazon|noche|soy|muy|sol|mar)$/i,
		diacritics: /[ñáíóú]/,
		infinitives: /^\p{L}{4,}(?:ar|ir)$/u,
		words: /^(?:el|la|los|las|un|una|unos|unas|es|son|y|o|a|de|en|por|para|con|sin|que|se|lo|le|no|mi|tu|su|me|te|nos|os|más|muy|pero|este|esta|hay)$/i
	},
	en: {
		starters: /^(?:the|and|of|to|you|your|I|it|with|for|that|this|are|hello|funny|cat|slow|world|darling)$/i,
		words: /^(?:the|a|an|is|are|was|were|and|or|but|of|to|in|on|at|for|with|from|by|I|you|we|they|he|she|it|not|no|can|will|has|have|had|this|that|these|those|my|your|his|her|our|their)$/i
	},
	de: {
		starters: /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|ist|sind|war|waren|und|oder|aber|ich|du|wir|ihr|sie|er|es|man|nicht|muss|kann|soll|will|hat|haben|werden|wird|zum|zur|im|in|am|an|auf|für|mit|von|zu|heißt|bedeutet|sagt|meint|nennt)$/i,
		diacritics: /[äöüß]/,
		words: /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|ist|sind|war|waren|und|oder|aber|ich|du|wir|ihr|sie|er|es|man|nicht|muss|kann|soll|will|hat|haben|hatte|werden|wird|zum|zur|im|in|am|an|auf|für|mit|von|zu|doch|noch|schon|auch|nur|dann|wenn|weil|sehr|hier|mehr|mein|meine|meinen|meiner|dein|deine|deinen|unser|unsere|euer|eure|sein|seine|seinen|ihre|ihren|heißt|bedeutet|sagt|meint|nennt)$/i
	}
};

// Unlisted Romance alts share the Spanish starter/diacritic signals so the
// previously supported pairs (fr, it, pt, …) keep working unchanged.
const ROMANCE_ALTS = /^(?:fr|it|pt|ca|gl|la)/;

function primarySignals(language: string): PrimarySignals {
	return PRIMARY_SIGNALS[normalizeLang(language)] ?? { stops: /(?!)/, articles: /(?!)/ };
}

function altSignals(language: string): AltSignals | undefined {
	const alt = normalizeLang(language);
	return ALT_SIGNALS[alt] ?? (ROMANCE_ALTS.test(alt) ? ALT_SIGNALS.es : undefined);
}

interface AltRun {
	start: number;
	end: number;
	/** Run anchored by explicit Spanish punctuation (¿/¡). */
	marker?: boolean;
}

function tokenCore(token: string): string {
	return token.replace(/^[\p{P}\p{S}]+/u, '').replace(/[\p{P}\p{S}]+$/u, '');
}

function hasPrimaryStopToken(piece: string, primaryLanguage: string, altLanguage: string): boolean {
	return firstPrimaryStopIndex(piece, primaryLanguage, altLanguage) !== -1;
}

/** Character index of the first primary stop token, or -1 if none. */
function firstPrimaryStopIndex(piece: string, primaryLanguage: string, altLanguage: string): number {
	const primary = primarySignals(primaryLanguage);
	const alt = altSignals(altLanguage);
	for (const match of piece.matchAll(/\S+/gu)) {
		const core = tokenCore(match[0]);
		if (core && primary.stops.test(core) && !alt?.words?.test(core)) {
			return match.index;
		}
	}
	return -1;
}

/** Find [start, end) ranges of probable alt-language phrases inside a piece. */
function findAltRuns(piece: string, primaryLanguage: string, altLanguage: string): AltRun[] {
	const primary = primarySignals(primaryLanguage);
	const primaryWords = primary.words ?? primary.stops;
	const sig = altSignals(altLanguage);
	if (!sig) return [];
	// Pronoun starters only apply when the primary language is German: in a
	// German sentence they unambiguously belong to the alt language.
	const allowPronouns = normalizeLang(primaryLanguage) === 'de';
	const runs: AltRun[] = [];
	let run: AltRun | null = null;
	let runHasContent = false;
	let markerRun = false; // ¿/¡-anchored: closes after the matching ?/!
	let prevCore = '';
	let prevStart = -1;
	let prevEnd = -1;
	const closeRun = (end: number) => {
		if (run && runHasContent && end > run.start) runs.push({ start: run.start, end, marker: run.marker });
		run = null;
		runHasContent = false;
		markerRun = false;
	};
	for (const match of piece.matchAll(/\S+/gu)) {
		const start = match.index;
		const end = start + match[0].length;
		const core = tokenCore(match[0]);
		if (run) {
			if (markerRun) {
				run.end = end;
				if (/[?!…]["')\]]?$/.test(match[0])) closeRun(end);
				continue;
			}
			if (
				core &&
				(primary.stops.test(core) &&
					!sig.words?.test(core) ||
					// Primary contractions prove the run is primary after all
					// ("Los geht's" — the apostrophe-s cannot be alt).
					(primary.contractions?.test(core) ?? false))
			) {
			closeRun(start);
			prevCore = core;
			prevStart = start;
			prevEnd = end;
			continue;
			}
				run.end = end;
				runHasContent = true;
				prevCore = core;
				prevStart = start;
				prevEnd = end;
				continue;
		}
		if (!core) {
			prevCore = '';
			prevStart = -1;
			prevEnd = -1;
			continue;
		}
		const isMarker = match[0].includes('¿') || match[0].includes('¡');
		// Lowercase-constrained starters anchor only in lowercase (or at piece
		// start, where sentence-capitalization is expected); unconstrained
		// starters (pronouns, English function words) are unambiguous in a
		// German primary sentence and only enabled there.
		const atPieceStart = piece.slice(0, start).trim() === '';
		// German typography capitalizes nouns: a capitalized token mid-sentence
		// is a primary-language noun ("Wir gehen in die Arena."), not a
		// teaching word, even if its lowercase spelling anchors an alt run
		// ("Und arena bedeutet Sand."). Clause starts (sentence, ":", "!",
		// "…") are expected in both languages and stay allowed — the LLM
		// capitalizes Spanish after colons too ("Satz:\nMe gusta beber té.").
		const afterClauseEnd = /(?:^|[.:!?…])\s*$/.test(piece.slice(0, start));
		const midSentenceCapitalized = !afterClauseEnd && /[A-ZÄÖÜ]/.test(match[0][0] ?? '');
		const isStarter =
			(!!sig.starters?.test(core) && !primaryWords.test(core) && !midSentenceCapitalized) ||
			(allowPronouns && !!sig.pronouns?.test(core) && !midSentenceCapitalized) ||
			(!!sig.lowercaseStarters?.test(core) && (atPieceStart || match[0] === match[0].toLowerCase()));
		// ELD can reliably recognise longer alt words on their own (e.g.
		// "divertidos", "preciosa"), even when the surrounding German frame
		// makes whole-sentence ELD call the text primary. Use that as an
		// additional signal so we do not have to maintain a second closed
		// vocabulary list for words the model already knows. Only trust the
		// per-token ELD result when the loaded subset exactly matches the
		// current primary/alt pair, otherwise a previous init with different
		// languages could poison the signal.
		const currentPrimary = normalizeLang(primaryLanguage);
		const currentAlt = normalizeLang(altLanguage);
		const eldMatchesCurrentPair =
			activeLanguages.includes(currentPrimary) && activeLanguages.includes(currentAlt);
		const reliableAltToken =
			eldMatchesCurrentPair &&
			core.length >= 4 &&
			!primaryWords.test(core) &&
			!midSentenceCapitalized &&
			!sig.starters?.test(core) &&
			!sig.lowercaseStarters?.test(core) &&
			!sig.pronouns?.test(core) &&
			!sig.words?.test(core) &&
			!sig.diacritics?.test(core) &&
			!sig.infinitives?.test(core) &&
			(marginFavorsAlt(core, currentPrimary, currentAlt) ||
				(normalizeLang(detectLanguage(core) ?? '') === currentAlt && isReliable(core)));
		const isSignal = isStarter || isMarker || !!sig.diacritics?.test(core) || reliableAltToken;
		if (isSignal) {
			// A run that opens directly behind a pronoun that is inactive
			// only because it collides with the primary language ("Me
			// gusta …" with English primary) swallows the pronoun: in
			// context it belongs to the alt phrase.
			let runStart = start;
			if (
				prevStart >= 0 &&
				prevStart < start &&
				!!sig.pronouns?.test(prevCore) &&
				piece.slice(prevEnd, start).trim() === '' &&
				(/^[a-zäöüß]/u.test(piece[prevStart] ?? '') ||
					/(?:^|[.:!?…])\s*$/.test(piece.slice(0, prevStart)))
			) {
				runStart = prevStart;
			}
			run = { start: runStart, end, marker: isMarker };
			runHasContent = !!core && !sig.lowercaseStarters?.test(core);
			markerRun = isMarker;
			if (markerRun && /[?!…]["')\]]?$/.test(match[0])) closeRun(end);
			prevCore = core;
			prevStart = start;
			prevEnd = end;
			continue;
		}
		// Single-token verb run ("ist conducir – fahren"): a bare infinitive.
		// Skipped after a primary article, which marks a primary noun instead.
		if (sig.infinitives?.test(core) && !(prevCore && primary.articles.test(prevCore))) {
			runs.push({ start, end });
		}
		prevCore = core;
		prevStart = start;
		prevEnd = end;
	}
	if (run) closeRun(run.end);
	return runs;
}

function resolvePiece(
	piece: string,
	declaredLanguage: string,
	primaryLanguage: string,
	altLanguage: string
): LanguageFragment[] {
	const runs = findAltRuns(piece, primaryLanguage, altLanguage);
	const whole = validateLanguageTag(piece, declaredLanguage, primaryLanguage);
	// A piece ELD already resolves to the alt language stays whole unless it
	// contains German stop tokens ("… gasolina, das Auto braucht Benzin." —
	// reliable es overall, but the tail needs its own voice).
	if (runs.length === 0) {
		if (normalizeLang(whole) === normalizeLang(altLanguage)) {
			// Primary contractions prove the piece is primary after all
			// ("geht's" for de, "don't" for en) — ELD misreads such
			// colloquialisms via shared article spellings ("Los"/"los").
			const contractions = primarySignals(primaryLanguage).contractions;
			if (contractions && contractions.test(piece)) {
				return [{ text: piece, language: declaredLanguage }];
			}
			// ELD resolved the piece wholesale to the alt language (or the alt
			// declaration was inherited) but primary stop tokens prove primary
			// content ("El té – der Tee." → the "der Tee." tail must not be
			// spoken with the alt voice). Split at the first stop token.
			const stopIdx = firstPrimaryStopIndex(piece, primaryLanguage, altLanguage);
			if (stopIdx === 0) return [{ text: piece, language: primaryLanguage }];
			if (stopIdx > 0) {
				const head = piece.slice(0, stopIdx);
				return [
					{ text: head, language: altLanguage },
					{ text: piece.slice(stopIdx), language: primaryLanguage }
				];
			}
		}
		return [{ text: piece, language: whole }];
	}
	if (
		normalizeLang(whole) === normalizeLang(altLanguage) &&
		!hasPrimaryStopToken(piece, primaryLanguage, altLanguage)
	) {
		// Only when the piece really starts with alt text: otherwise
		// non-stop primary words in front of the first run (terms of
		// address like "Schatz, te amo …") would be swallowed by the
		// whole-piece verdict even though they deserve the primary
		// voice.
		const leadingGap = piece.slice(0, runs[0].start).trim();
		if (leadingGap === '' || marginFavorsAlt(leadingGap, primaryLanguage, altLanguage)) {
			return [{ text: piece, language: whole }];
		}
	}
	const parts: LanguageFragment[] = [];
	let cursor = 0;
	for (const run of runs) {
		if (run.start > cursor) {
			// Surrounding parts may themselves contain alt quotes — resolve
			// recursively (each part is strictly shorter, so this terminates).
			parts.push(...resolvePiece(piece.slice(cursor, run.start), declaredLanguage, primaryLanguage, altLanguage));
		}
		const runText = piece.slice(run.start, run.end);
		// Signals decide; a reliable primary detection on the run itself
		// demotes a false positive.
		const detected = detectLanguage(runText);
		const primaryCandidate =
			detected && isReliable(runText) && normalizeLang(detected) === normalizeLang(primaryLanguage);
		// ¿/¡ are explicit Spanish punctuation — German prose virtually never
		// uses them. ELD misreads mixed teaching sentences ("… más Spanisch
		// mit mir?") as primary and would demote the run to the German voice;
		// an explicit marker opener wins over that verdict.
		const runLang = !run.marker && primaryCandidate ? primaryLanguage : altLanguage;
		parts.push({ text: runText, language: runLang });
		cursor = run.end;
	}
	if (cursor < piece.length) {
		parts.push(...resolvePiece(piece.slice(cursor), declaredLanguage, primaryLanguage, altLanguage));
	}
	return parts.filter((part) => part.text.length > 0);
}

/**
 * Split text into fragments at sentence and dash boundaries and resolve each
 * fragment's language with ELD (M4: teacher-style mixes quote foreign phrases
 * inside a primary-language sentence; a reliable detection flips only the
 * affected part to its own voice). Mid-sentence quotes without boundaries are
 * additionally carved out as alt-language token runs, so "…el coche es rojo,
 * das Auto ist rot." keeps both voices. Joining the fragments reproduces the
 * input exactly. Fragments without a reliable detection inherit the declared
 * language, so single-language text stays one fragment.
 */
export function splitByDetectedLanguage(
	text: string,
	declaredLanguage: string,
	primaryLanguage: string,
	altLanguage?: string
): LanguageFragment[] {
	if (!text) return [{ text, language: declaredLanguage }];
	const pieces = text.match(FRAGMENT_BOUNDARY) ?? [text];
	const fragments: LanguageFragment[] = [];
	for (const piece of pieces) {
		if (altLanguage) fragments.push(...resolvePiece(piece, declaredLanguage, primaryLanguage, altLanguage));
		else fragments.push({ text: piece, language: validateLanguageTag(piece, declaredLanguage, primaryLanguage) });
	}
	// Whitespace-only pieces carry no language signal; fold them into the
	// neighbouring fragment so joining still reproduces the input exactly.
	const consolidated: LanguageFragment[] = [];
	let leadingPrefix = '';
	for (const fragment of fragments) {
		if (fragment.text.trim() === '') {
			if (consolidated.length > 0) consolidated[consolidated.length - 1].text += fragment.text;
			else leadingPrefix += fragment.text;
			continue;
		}
		if (leadingPrefix) {
			consolidated.push({ text: leadingPrefix, language: fragment.language });
			leadingPrefix = '';
		}
		consolidated.push(fragment);
	}
	if (leadingPrefix) consolidated.push({ text: leadingPrefix, language: declaredLanguage });
	// Merge adjacent fragments of the same language so a single-language text
	// stays one segment and mixed sentences keep one segment per part.
	const merged: LanguageFragment[] = [];
	for (const fragment of consolidated) {
		const last = merged[merged.length - 1];
		if (last && normalizeLang(last.language) === normalizeLang(fragment.language)) last.text += fragment.text;
		else merged.push({ ...fragment });
	}
	return merged;
}
