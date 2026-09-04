import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLanguageTag, initLanguageDetector, splitByDetectedLanguage } from './language-detector.ts';

// Initialise the detector before running tests.
await initLanguageDetector(['de', 'es']);

test('validateLanguageTag matches regional tags to their base language (H1)', () => {
	// "es-ES" (regional) must match "es" (what ELD returns).
	assert.equal(validateLanguageTag('el amigo', 'es-ES'), 'es-ES');
	assert.equal(validateLanguageTag('Hoy el sol brilla', 'es-MX'), 'es-MX');
	// German text stays German even with a regional tag.
	assert.equal(validateLanguageTag('Der Tisch', 'de-DE'), 'de-DE');
});

test('validateLanguageTag falls back to primary when ELD disagrees', () => {
	// German text tagged as Spanish → ELD detects "de" → falls back to primary.
	assert.equal(validateLanguageTag('Der Tisch', 'es'), 'de');
});

test('validateLanguageTag keeps correct tags', () => {
	assert.equal(validateLanguageTag('el amigo', 'es'), 'es');
	assert.equal(validateLanguageTag('der Tisch', 'de'), 'de');
});

test('validateLanguageTag flips reliably detected alt quotes to the alt voice (H2)', () => {
	// Teacher-style mix: German-tagged segments quoting Spanish. ELD detects
	// "es" reliably → the segment must flip to the alt voice instead of
	// staying on the primary voice (previously it was pressed to primary).
	assert.equal(validateLanguageTag('el coche – das Auto.', 'de', 'de'), 'es');
	assert.equal(validateLanguageTag('el coche', 'de', 'de'), 'es');
	assert.equal(validateLanguageTag('¿Cómo se dice coche?', 'de', 'de'), 'es');
});

test('validateLanguageTag stays conservative when the primary language is detected', () => {
	// German text tagged as Spanish, with the primary passed explicitly:
	// the detection of the primary language wins (existing M2 purpose).
	assert.equal(validateLanguageTag('Der Hund bellt laut.', 'es', 'de'), 'de');
});

test('validateLanguageTag treats undetectable text conservatively', () => {
	// No detection (empty text) → the declared tag survives untouched.
	assert.equal(validateLanguageTag('', 'es', 'de'), 'es');
	assert.equal(validateLanguageTag('', 'de', 'de'), 'de');
});

test('splitByDetectedLanguage splits teacher-style mixed sentences (M4)', () => {
	const mixed = splitByDetectedLanguage('El coche es rojo. – Das Auto ist rot.', 'de', 'de', 'es');
	assert.deepEqual(
		mixed.map((p) => [p.language, p.text.trim()]),
		[['es', 'El coche es rojo.'], ['de', '– Das Auto ist rot.']]
	);
	const dash = splitByDetectedLanguage('el coche – das Auto.', 'de', 'de', 'es');
	assert.deepEqual(
		dash.map((p) => [p.language, p.text.trim()]),
		[['es', 'el coche –'], ['de', 'das Auto.']]
	);
});

test('splitByDetectedLanguage reproduces the input exactly', () => {
	const text = 'Guten Tag! ¿Cómo estás? – Danke, gut.';
	const parts = splitByDetectedLanguage(text, 'de', 'de', 'es');
	assert.equal(parts.map((p) => p.text).join(''), text);
	assert.ok(parts.some((p) => p.language === 'es'), `no es fragment in ${JSON.stringify(parts)}`);
});

test('splitByDetectedLanguage keeps single-language texts as one fragment', () => {
	assert.equal(splitByDetectedLanguage('Der Hund bellt laut. Miau.', 'de', 'de', 'es').length, 1);
	assert.equal(splitByDetectedLanguage('El amigo vive en Madrid y trabaja mucho.', 'es', 'de', 'es').length, 1);
});

test('splitByDetectedLanguage handles empty text and inherits unreliable fragments', () => {
	assert.deepEqual(splitByDetectedLanguage('', 'de', 'de', 'es'), [{ text: '', language: 'de' }]);
	// A number-only fragment has no reliable detection and inherits the
	// declared language; the Spanish part still flips.
	const parts = splitByDetectedLanguage('1.5 Millionen – el coche', 'de', 'de', 'es');
	assert.deepEqual(
		parts.map((p) => p.language),
		['de', 'es']
	);
});

test('splitByDetectedLanguage carves out unbounded Spanish quotes inside a sentence (M6)', () => {
	// No sentence boundary surrounds the quote — ELD only sees a mixed
	// sentence, so the alt run must be cut out by its signal tokens.
	const comma = splitByDetectedLanguage('Zum Beispiel: el coche es rojo, das Auto ist rot.', 'de', 'de', 'es');
	assert.deepEqual(
		comma.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Zum Beispiel:'],
			['es', 'el coche es rojo,'],
			['de', 'das Auto ist rot.']
		]
	);
	// Pronoun-anchored run ("me gusta …" does not exist in German).
	const pronoun = splitByDetectedLanguage('Me gusta conducir, ich fahre gern.', 'de', 'de', 'es');
	assert.deepEqual(
		pronoun.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Me gusta conducir,'],
			['de', 'ich fahre gern.']
		]
	);
	// Bare infinitives form a single-token run.
	const infinitive = splitByDetectedLanguage('Das zweite Wort ist conducir – fahren.', 'de', 'de', 'es');
	assert.deepEqual(
		infinitive.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Das zweite Wort ist'],
			['es', 'conducir'],
			['de', '– fahren.']
		]
	);
});

test('splitByDetectedLanguage splits the German tail off an es-declared sentence', () => {
	// Reverse case: the whole sentence was reliably detected as Spanish, but
	// the German gloss must keep its own voice.
	const parts = splitByDetectedLanguage('El coche necesita gasolina, das Auto braucht Benzin.', 'es', 'de', 'es');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'El coche necesita gasolina,'],
			['de', 'das Auto braucht Benzin.']
		]
	);
});

test('splitByDetectedLanguage does not run-split German look-alikes', () => {
	// A German article before an -ar/-ir token marks a German noun.
	assert.equal(splitByDetectedLanguage('der Bibliothekar liest laut.', 'de', 'de', 'es').length, 1);
	// é is a common German loanword diacritic and must not anchor a run.
	assert.equal(splitByDetectedLanguage('Wir gehen ins Café.', 'de', 'de', 'es').length, 1);
});

test('splitByDetectedLanguage carves out unbounded English quotes inside a sentence (M7)', () => {
	// Articles and pronouns that do not exist in German anchor English runs.
	const article = splitByDetectedLanguage('Das erste Wort ist the car – das Auto.', 'de', 'de', 'en');
	assert.deepEqual(
		article.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Das erste Wort ist'],
			['en', 'the car –'],
			['de', 'das Auto.']
		]
	);
	const pronoun = splitByDetectedLanguage("I don't know, ich weiß es nicht.", 'de', 'de', 'en');
	assert.deepEqual(
		pronoun.map((p) => [p.language, p.text.trim()]),
		[
			['en', "I don't know,"],
			['de', 'ich weiß es nicht.']
		]
	);
	// A German "es" closes the English run instead of being swallowed.
	const esStop = splitByDetectedLanguage('It is late, es ist spät.', 'de', 'de', 'en');
	assert.deepEqual(
		esStop.map((p) => [p.language, p.text.trim()]),
		[
			['en', 'It is late,'],
			['de', 'es ist spät.']
		]
	);
	// Reverse case: English-declared sentence with a German gloss.
	const reverse = splitByDetectedLanguage('The dog barks loudly, der Hund bellt laut.', 'en', 'de', 'en');
	assert.deepEqual(
		reverse.map((p) => [p.language, p.text.trim()]),
		[
			['en', 'The dog barks loudly,'],
			['de', 'der Hund bellt laut.']
		]
	);
});

test('splitByDetectedLanguage keeps edge cases stable for es and en mixes', () => {
	// Bare romance infinitive forms a single-token run.
	const infinitive = splitByDetectedLanguage('Hablar ist nicht schwer.', 'de', 'de', 'es');
	assert.deepEqual(
		infinitive.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Hablar'],
			['de', 'ist nicht schwer.']
		]
	);
	// Possessive pronouns close a Spanish run ("mi casa es tu casa, mein …").
	const possessive = splitByDetectedLanguage('Mi casa es tu casa, mein Haus ist dein Haus.', 'de', 'de', 'es');
	assert.deepEqual(
		possessive.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Mi casa es tu casa,'],
			['de', 'mein Haus ist dein Haus.']
		]
	);
	// A closing ¿…? question at the very end of the sentence is detected.
	const marker = splitByDetectedLanguage('Am dritten Tag fragen wir ¿cómo estás?', 'de', 'de', 'es');
	assert.deepEqual(
		marker.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Am dritten Tag fragen wir'],
			['es', '¿cómo estás?']
		]
	);
	// Reported 2026-09-02 (vocabulary dialogue): German teaching verbs must
	// close the Spanish run instead of being swallowed by it — an
	// over-extended run made ELD demote the whole run to German.
	const night = splitByDetectedLanguage('la noche bedeutet die Nacht.', 'de', 'de', 'es');
	assert.deepEqual(
		night.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'la noche'],
			['de', 'bedeutet die Nacht.']
		]
	);
	const water = splitByDetectedLanguage('el agua heißt Wasser.', 'de', 'de', 'es');
	assert.deepEqual(
		water.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'el agua'],
			['de', 'heißt Wasser.']
		]
	);
	// Pure Spanish sentences with look-alike verbs stay whole.
	assert.equal(splitByDetectedLanguage('Por ejemplo: Me gusta mucho la noche.', 'de', 'de', 'es').length, 1);
	// Proper names starting with "El" are rescued by the reliable-detection
	// demotion and keep the primary voice.
	assert.equal(splitByDetectedLanguage('El País berichtete gestern darüber.', 'de', 'de', 'es').length, 1);
});

test('splitByDetectedLanguage keeps the reported teacher dialogue intact', () => {
	// Regression for the manual multilingual test report (2026-09-02): both
	// failure directions — German words spoken Spanish and Spanish words
	// spoken German — must resolve to per-phrase voices.
	const text =
		'Das erste Wort ist el coche – das Auto. ' +
		'Zum Beispiel: el coche es rojo, das Auto ist rot. ' +
		'Me gusta conducir, ich fahre gern. ' +
		'El coche necesita gasolina, das Auto braucht Benzin.';
	const parts = splitByDetectedLanguage(text, 'de', 'de', 'es');
	assert.equal(parts.map((p) => p.text).join(''), text);
	for (const part of parts) {
		if (part.language === 'es') {
			assert.match(part.text, /el coche|Me gusta|gasolina,/i);
		}
	}
	const spanish = parts.filter((p) => p.language === 'es').map((p) => p.text.trim());
	assert.ok(spanish.every((t) => !/das |ist rot|fahre gern|braucht Benzin/i.test(t)), `wrong es fragments: ${JSON.stringify(spanish)}`);
});

test('splitByDetectedLanguage keeps the German gloss of an es-declared short sentence (regression)', () => {
	// Reported 2026-09-02 ("el té – der Tee"): a short sentence ELD resolves
	// wholesale to es must not speak the German gloss with the alt voice.
	const parts = splitByDetectedLanguage('El té – der Tee.', 'es', 'de', 'es');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'El té –'],
			['de', 'der Tee.']
		]
	);
	// Same mechanism with the stop token at the piece start ("der Tee." was
	// its own sentence piece after the dash boundary).
	const gloss = splitByDetectedLanguage('der Tee.', 'es', 'de', 'es');
	assert.deepEqual(
		gloss.map((p) => [p.language, p.text.trim()]),
		[['de', 'der Tee.']]
	);
});

test('splitByDetectedLanguage demotes German colloquialisms ELD misreads as Spanish', () => {
	// ELD resolves "Los geht's" to es via "Los"/"los" — the apostrophe-s
	// contraction (impossible in romance languages) proves German. The
	// capitalized article mid-piece must also not anchor a run.
	const parts = splitByDetectedLanguage("😊 Los geht's – hier ist dein erstes Wort: el té.", 'de', 'de', 'es');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['de', "😊 Los geht's – hier ist dein erstes Wort:"],
			['es', 'el té.']
		]
	);
	assert.deepEqual(
		splitByDetectedLanguage("Los geht's –", 'de', 'de', 'es').map((p) => p.language),
		['de']
	);
});

test('splitByDetectedLanguage recurses into surrounding parts of a run', () => {
	// "El té verde" precedes the German clause, and the German clause itself
	// contains a Spanish quote — the surrounding part must be run-split again.
	const parts = splitByDetectedLanguage('El té verde Und ein typischer Satz: Me gusta beber té.', 'de', 'de', 'es');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'El té verde'],
			['de', 'Und ein typischer Satz:'],
			['es', 'Me gusta beber té.']
		]
	);
});
// ── generic {de,en,es} pair directions ───────────────────────

test('splitByDetectedLanguage splits German runs inside English primary text', async () => {
	await initLanguageDetector(['en', 'de']);
	const parts = splitByDetectedLanguage('The first word is der Tisch – the table.', 'en', 'en', 'de');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['en', 'The first word is'],
			['de', 'der Tisch –'],
			['en', 'the table.']
		]
	);
});

test('splitByDetectedLanguage keeps German umlaut words as runs (en primary)', async () => {
	await initLanguageDetector(['en', 'de']);
	const parts = splitByDetectedLanguage('That means schön – nice.', 'en', 'en', 'de');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['en', 'That means'],
			['de', 'schön –'],
			['en', 'nice.']
		]
	);
});

test('splitByDetectedLanguage does not start a German run on Spanish "es"', async () => {
	// "es" is both the German pronoun and the Spanish verb: inside Spanish
	// primary text it must never open a German run.
	await initLanguageDetector(['es', 'de']);
	const parts = splitByDetectedLanguage('La primera palabra es der Tisch – la mesa.', 'es', 'es', 'de');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'La primera palabra es'],
			['de', 'der Tisch –'],
			['es', 'la mesa.']
		]
	);
});

test('splitByDetectedLanguage splits English runs inside Spanish primary text', async () => {
	await initLanguageDetector(['es', 'en']);
	const parts = splitByDetectedLanguage('I like to drive, me gusta conducir.', 'es', 'es', 'en');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['en', 'I like to drive,'],
			['es', 'me gusta conducir.']
		]
	);
});

test('splitByDetectedLanguage splits Spanish runs inside English primary text', async () => {
	await initLanguageDetector(['en', 'es']);
	const parts = splitByDetectedLanguage('Me gusta conducir, I like to drive.', 'en', 'en', 'es');
	assert.deepEqual(
		parts.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Me gusta conducir,'],
			['en', 'I like to drive.']
		]
	);
});

test('splitByDetectedLanguage validates whole foreign sentences with any primary', async () => {
	await initLanguageDetector(['en', 'es']);
	assert.deepEqual(
		splitByDetectedLanguage('¿Cómo estás?', 'en', 'en', 'es').map((p) => p.language),
		['es']
	);
	await initLanguageDetector(['en', 'de']);
	assert.deepEqual(
		splitByDetectedLanguage('Wie geht es dir?', 'en', 'en', 'de').map((p) => p.language),
		['de']
	);
	await initLanguageDetector(['es', 'de']);
	assert.deepEqual(
		splitByDetectedLanguage('Wie geht es dir?', 'es', 'es', 'de').map((p) => p.language),
		['de']
	);
});

test('initLanguageDetector picks up a subset change that arrives mid-load (race regression)', async () => {
	// Fire a load and immediately overwrite with a different subset while it
	// is still in flight: the loop must consume the latest request instead of
	// returning a stale resolved promise that drops it.
	const first = initLanguageDetector(['de', 'es']);
	const second = initLanguageDetector(['de', 'en']);
	await Promise.all([first, second]);
	// The last requested subset must be active: reliable English detection
	// must be able to answer 'en'. A stale ['de','es'] subset would force the
	// result to es/de instead.
	assert.equal(validateLanguageTag('the quick brown fox jumps', 'de', 'de'), 'en');
});

test('initLanguageDetector applies a subset change after the load finished', async () => {
	await initLanguageDetector(['de', 'es']);
	await initLanguageDetector(['de', 'en']);
	assert.equal(validateLanguageTag('the quick brown fox jumps', 'de', 'de'), 'en');
});

test('splitByDetectedLanguage anchors common teaching vocabulary without articles (regression)', async () => {
	// Reported 2026-09-02: "Amor", "guapo/guapa", "Hola" and "Eres" were
	// spoken with the German voice — no article or diacritic to anchor them.
	await initLanguageDetector(['de', 'es']);
	const amor = splitByDetectedLanguage('Amor bedeutet Liebe auf Deutsch.', 'de', 'de', 'es');
	assert.deepEqual(
		amor.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Amor'],
			['de', 'bedeutet Liebe auf Deutsch.']
		]
	);
	const hola = splitByDetectedLanguage('Und das Wort hola heißt hallo.', 'de', 'de', 'es');
	assert.deepEqual(
		hola.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Und das Wort'],
			['es', 'hola'],
			['de', 'heißt hallo.']
		]
	);
	const guapo = splitByDetectedLanguage('Und guapo oder guapa für hübsch und schön.', 'de', 'de', 'es');
	assert.deepEqual(
		guapo.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Und'],
			['es', 'guapo'],
			['de', 'oder'],
			['es', 'guapa'],
			['de', 'für hübsch und schön.']
		]
	);
	// Whole Spanish sentence anchored by the greeting.
	assert.equal(splitByDetectedLanguage('Hola, cariño.', 'de', 'de', 'es').length, 1);
	assert.equal(splitByDetectedLanguage('Eres mi corazón.', 'de', 'de', 'es').length, 1);
	// No false anchors in German prose.
	assert.equal(splitByDetectedLanguage('Das ist mein neuer Fernseher.', 'de', 'de', 'es').length, 1);
});

test('splitByDetectedLanguage possessive clusters stay Spanish ("te amo, mi amor")', () => {
	const parts = splitByDetectedLanguage('Schatz, te amo, mi amor. Das bleibt so.', 'de', 'de', 'es');
	const es = parts.filter((p) => p.language === 'es').map((p) => p.text.trim()).join(' ');
	assert.ok(/te amo, mi amor/.test(es), `es-Phrase nicht erkannt: ${JSON.stringify(parts)}`);
	const oneRun = parts.filter((p) => p.language === 'es').length === 1;
	assert.ok(oneRun, `es wurde in mehrere Fragmente zerschlagen: ${JSON.stringify(parts)}`);
	assert.deepEqual(parts.map((p) => p.language), ['de', 'es', 'de']);
});

test('splitByDetectedLanguage teaching nouns: standalone word before a German copula (happy path)', () => {
	// Reported smoke test: "Sol bedeutet Sonne. Playa ist Strand. Mar heißt Meer."
	const sol = splitByDetectedLanguage('Sol bedeutet Sonne.', 'de', 'de', 'es');
	assert.deepEqual(
		sol.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Sol'],
			['de', 'bedeutet Sonne.']
		]
	);
	const playa = splitByDetectedLanguage('Playa ist Strand.', 'de', 'de', 'es');
	assert.deepEqual(
		playa.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Playa'],
			['de', 'ist Strand.']
		]
	);
});

test('splitByDetectedLanguage teaching nouns: full Spanish chunks stay whole', async () => {
	await initLanguageDetector(['de', 'es']);
	const vamos = splitByDetectedLanguage('Vamos a la playa.', 'de', 'de', 'es');
	assert.deepEqual(vamos.map((p) => p.language), ['es']);
	const claro = splitByDetectedLanguage('Claro que sí!', 'de', 'de', 'es');
	assert.deepEqual(claro.map((p) => p.language), ['es']);
});

test('splitByDetectedLanguage teaching nouns: lowercase mid-sentence anchor (edge)', async () => {
	await initLanguageDetector(['de', 'es']);
	// The LLM wrote the teaching word lowercase inside a German frame.
	const arena = splitByDetectedLanguage('Und arena bedeutet Sand.', 'de', 'de', 'es');
	assert.deepEqual(
		arena.map((p) => [p.language, p.text.trim()]),
		[
			['de', 'Und'],
			['es', 'arena'],
			['de', 'bedeutet Sand.']
		]
	);
});

test('splitByDetectedLanguage teaching nouns: capitalized mid-sentence is a German noun (edge)', async () => {
	await initLanguageDetector(['de', 'es']);
	// German typography capitalizes nouns — "Arena" (Stadion), "Sol",
	// "Mar", "Playa" mid-sentence are primary-language nouns, not teaching
	// words, and must keep the German voice.
	for (const text of [
		'Wir gehen in die Arena.',
		'Die Arena ist rappelvoll.',
		'Der Sol ist gesetzlich geregelt.',
		'Die Playa wird voll.',
		'Ich habe einen Mar in der Hand.'
	]) {
		const parts = splitByDetectedLanguage(text, 'de', 'de', 'es');
		assert.equal(parts.length, 1, `expected one part for "${text}"`);
		assert.equal(parts[0].language, 'de', `expected German for "${text}"`);
	}
});

test('splitByDetectedLanguage teaching nouns: sentence-initial noun ambiguity is accepted (edge)', async () => {
	await initLanguageDetector(['de', 'es']);
	// "Arena ist ein Stadion." starts with the capitalized noun that also
	// anchors Spanish — genuinely ambiguous. We accept the Spanish "Arena"
	// here: the teaching frame is the common case in this app, mid-sentence
	// German nouns are all blocked by the capitalization guard.
	const arenaFirst = splitByDetectedLanguage('Arena ist ein Stadion.', 'de', 'de', 'es');
	assert.deepEqual(
		arenaFirst.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'Arena'],
			['de', 'ist ein Stadion.']
		]
	);
});

test('splitByDetectedLanguage explicit Spanish punctuation keeps the alt voice even when ELD sees German loanwords (user regression)', () => {
	// "¿Quieres aprender más Spanisch mit mir?" contains German words
	// (Spanisch, mit, mir) that make ELD call the whole sentence reliably
	// German. The explicit Spanish opener (¿) must win.
	const parts = splitByDetectedLanguage(
		'Schön, dass du wieder da bist. Wie geht es dir heute? ¿Quieres aprender más Spanisch mit mir?',
		'de',
		'de',
		'es'
	);
	const esParts = parts.filter((p) => p.language === 'es').map((p) => p.text.trim());
	assert.ok(esParts.some((t) => t.includes('¿Quieres')), `expected Spanish fragment, got ${JSON.stringify(parts)}`);
});

test('splitByDetectedLanguage explicit Spanish punctuation wins over primary ELD (edge)', () => {
	// A marker run with almost only German words still stays alt; explicit
	// Spanish punctuation is a stronger signal than ELD in this code-switch
	// teaching context.
	const parts = splitByDetectedLanguage('¿Genau das will ich doch!', 'de', 'de', 'es');
	assert.equal(parts.length, 1);
	assert.equal(parts[0].language, 'es');
});

test('splitByDetectedLanguage without explicit Spanish punctuation the run is still demoted by reliable primary ELD (edge)', () => {
	// The same words without ¿/¡ are not a marker run, so ELD demotion still
	// applies when it reliably detects German.
	const parts = splitByDetectedLanguage('Quieres aprender más Spanisch mit mir', 'de', 'de', 'es');
	assert.equal(parts.length, 1);
	assert.equal(parts[0].language, 'de');
});

test('splitByDetectedLanguage teaching vocabulary: adjective forms and conjugated verbs (regression)', () => {
	const text =
		'¡Claro que somos divertidos! Gern nochmal, mi vida. divertidos heißt lustig oder spaßig. somos divertidos bedeutet: wir sind lustig. Du hörst es wohl gern, was?';
	const parts = splitByDetectedLanguage(text, 'de', 'de', 'es');
	const byLang: Record<string, string> = { de: '', es: '' };
	for (const p of parts) byLang[p.language] += p.text;
	assert.ok(byLang.es.includes('divertidos'), `es missing divertidos: ${JSON.stringify(parts)}`);
	assert.ok(byLang.es.includes('somos'), `es missing somos: ${JSON.stringify(parts)}`);
	assert.ok(byLang.de.includes('heißt lustig'), `de missing explanation: ${JSON.stringify(parts)}`);
	assert.ok(byLang.de.includes('bedeutet'), `de missing bedeutet: ${JSON.stringify(parts)}`);
});

test('splitByDetectedLanguage teaching vocabulary: sentence-start bare words still anchor', async () => {
	await initLanguageDetector(['de', 'es']);
	const divertidos = splitByDetectedLanguage('divertidos heißt lustig.', 'de', 'de', 'es');
	assert.deepEqual(
		divertidos.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'divertidos'],
			['de', 'heißt lustig.']
		]
	);
	const somos = splitByDetectedLanguage('somos divertidos bedeutet wir sind lustig.', 'de', 'de', 'es');
	assert.deepEqual(
		somos.map((p) => [p.language, p.text.trim()]),
		[
			['es', 'somos divertidos'],
			['de', 'bedeutet wir sind lustig.']
		]
	);
});
