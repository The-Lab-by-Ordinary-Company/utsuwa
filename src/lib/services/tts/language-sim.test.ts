import test from 'node:test';
import assert from 'node:assert/strict';
import { initLanguageDetector, splitByDetectedLanguage } from './language-detector.ts';

// Golden master derived from the local language-sim harness (reported teacher
// dialogue from 2026-09-02). Every case declares the language the way the LLM
// would via speak_segment; the assertions cover the orchestrator's validation
// and fragment-splitting layer (M2/M4). Changes to these expectations must be
// deliberate regressions, never silent drift.

type ExpectedFragment = [language: string, text: string];

function run(text: string, declared: string, primary: string, alt: string): ExpectedFragment[] {
	return splitByDetectedLanguage(text, declared, primary, alt).map((p) => [p.language, p.text]);
}

const DE_ES_CASES: [text: string, expected: ExpectedFragment[]][] = [
	[
		'Kein Problem, ich wiederhole es noch einmal – diesmal etwas runder.',
		[['de', 'Kein Problem, ich wiederhole es noch einmal – diesmal etwas runder.']]
	],
	[
		'Das erste Wort ist el coche – das Auto.',
		[['de', 'Das erste Wort ist '], ['es', 'el coche – '], ['de', 'das Auto.']]
	],
	[
		'Zum Beispiel: el coche es rojo, das Auto ist rot.',
		[['de', 'Zum Beispiel: '], ['es', 'el coche es rojo, '], ['de', 'das Auto ist rot.']]
	],
	[
		'Das zweite Wort ist conducir – fahren.',
		[['de', 'Das zweite Wort ist '], ['es', 'conducir'], ['de', ' – fahren.']]
	],
	[
		'Me gusta conducir, ich fahre gern.',
		[['es', 'Me gusta conducir, '], ['de', 'ich fahre gern.']]
	],
	[
		'Und das dritte Wort ist la gasolina – das Benzin.',
		[['de', 'Und das dritte Wort ist '], ['es', 'la gasolina – '], ['de', 'das Benzin.']]
	],
	[
		'El coche necesita gasolina, das Auto braucht Benzin.',
		[['es', 'El coche necesita gasolina, '], ['de', 'das Auto braucht Benzin.']]
	],
	['Passt das so besser für dich?', [['de', 'Passt das so besser für dich?']]],	[
		'Das Wort ist la biblioteca – die Bibliothek.',
		[['de', 'Das Wort ist '], ['es', 'la biblioteca – '], ['de', 'die Bibliothek.']]
	],
	[
		'Mi casa es tu casa, mein Haus ist dein Haus.',
		[['es', 'Mi casa es tu casa, '], ['de', 'mein Haus ist dein Haus.']]
	],
	['Hablar ist nicht schwer.', [['es', 'Hablar'], ['de', ' ist nicht schwer.']]],
	// Proper noun with a foreign diacritic: the German-majority sentence stays
	// on the primary voice (documented limitation, "El País" case).
	['El País berichtete gestern darüber.', [['de', 'El País berichtete gestern darüber.']]],	[
		'Am dritten Tag fragen wir ¿cómo estás?',
		[['de', 'Am dritten Tag fragen wir '], ['es', '¿cómo estás?']]
	],
	['¿Cómo estás?', [['es', '¿Cómo estás?']]],
	['Hola, ¿qué tal?', [['es', 'Hola, ¿qué tal?']]]
];

const DE_EN_CASES: [text: string, expected: ExpectedFragment[]][] = [
	[
		'Das erste Wort ist the car – das Auto.',
		[['de', 'Das erste Wort ist '], ['en', 'the car – '], ['de', 'das Auto.']]
	],
	[
		'Zum Beispiel: the car is red, das Auto ist rot.',
		[['de', 'Zum Beispiel: '], ['en', 'the car is red, '], ['de', 'das Auto ist rot.']]
	],
	[
		'I like to drive, ich fahre gern.',
		[['en', 'I like to drive, '], ['de', 'ich fahre gern.']]
	],
	[
		'Und das dritte Wort ist to run – laufen.',
		[['de', 'Und das dritte Wort ist '], ['en', 'to run – '], ['de', 'laufen.']]
	],
	['It is late, es ist spät.', [['en', 'It is late, '], ['de', 'es ist spät.']]],
	["I don't know, ich weiß es nicht.", [['en', "I don't know, "], ['de', 'ich weiß es nicht.']]],
	[
		'The dog barks loudly, der Hund bellt laut.',
		[['en', 'The dog barks loudly, '], ['de', 'der Hund bellt laut.']]
	]
];

// Sentences where the LLM declared the alt language for the whole sentence.
const TAGGED_ES_CASES: [text: string, expected: ExpectedFragment[]][] = [
	[
		'Mi casa es tu casa, mein Haus ist dein Haus.',
		[['es', 'Mi casa es tu casa, '], ['de', 'mein Haus ist dein Haus.']]
	],
	['Hablar – sprechen.', [['es', 'Hablar – '], ['de', 'sprechen.']]]
];

const TAGGED_EN_CASES: [text: string, expected: ExpectedFragment[]][] = [
	[
		'I like to drive, ich fahre gern.',
		[['en', 'I like to drive, '], ['de', 'ich fahre gern.']]
	]
];

// Non-German primary languages: the signal tables are generic across the
// {de,en,es} trio, so every pair direction must fragment equally well.
const OTHER_PAIRS: [primary: string, alt: string, cases: [text: string, declared: string, expected: ExpectedFragment[]][]][] = [
	[
		'en',
		'es',
		[
			[
				'The first word is el coche – the car.',
				'en',
				[['en', 'The first word is '], ['es', 'el coche – '], ['en', 'the car.']]
			],
			[
				'The word is la biblioteca – the library.',
				'en',
				[['en', 'The word is '], ['es', 'la biblioteca – '], ['en', 'the library.']]
			],
			[
			'Me gusta conducir, I like to drive.',
			'en',
			// The leading "Me" is an es pronoun colliding with English
			// "me"; the run-opening pronoun extension keeps it Spanish.
			[['es', 'Me gusta conducir, '], ['en', 'I like to drive.']]
			],
			['¿Cómo estás?', 'en', [['es', '¿Cómo estás?']]]
		]
	],
	[
		'en',
		'de',
		[
			[
				'The first word is der Tisch – the table.',
				'en',
				[['en', 'The first word is '], ['de', 'der Tisch – '], ['en', 'the table.']]
			],
			[
				'Das Fenster ist offen, the window is open.',
				'en',
				[['de', 'Das Fenster ist offen, '], ['en', 'the window is open.']]
			],
			[
				'That means schön – nice.',
				'en',
				[['en', 'That means '], ['de', 'schön – '], ['en', 'nice.']]
			],
			['Wie geht es dir?', 'en', [['de', 'Wie geht es dir?']]]
		]
	],
	[
		'es',
		'de',
		[
			[
				'La primera palabra es der Tisch – la mesa.',
				'es',
				[['es', 'La primera palabra es '], ['de', 'der Tisch – '], ['es', 'la mesa.']]
			],
			[
				'Das Fenster ist offen, la ventana está abierta.',
				'es',
				[['de', 'Das Fenster ist offen, '], ['es', 'la ventana está abierta.']]
			]
		]
	],
	[
		'es',
		'en',
		[
			[
				'La primera palabra es the car – el coche.',
				'es',
				[['es', 'La primera palabra es '], ['en', 'the car – '], ['es', 'el coche.']]
			],
			[
				'I like to drive, me gusta conducir.',
				'es',
				[['en', 'I like to drive, '], ['es', 'me gusta conducir.']]
			]
		]
	]
];

test('golden master: reported teacher dialogue de→es stays correctly fragmented', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const [text, expected] of DE_ES_CASES) {
		assert.deepEqual(run(text, 'de', 'de', 'es'), expected, `fragments for: ${text}`);
	}
});

test('golden master: English alt cases stay correctly fragmented', async () => {
	await initLanguageDetector(['de', 'en']);
	for (const [text, expected] of DE_EN_CASES) {
		assert.deepEqual(run(text, 'de', 'de', 'en'), expected, `fragments for: ${text}`);
	}
});

test('golden master: LLM-tagged alt sentences resolve to the same fragments', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const [text, expected] of TAGGED_ES_CASES) {
		assert.deepEqual(run(text, 'es', 'de', 'es'), expected, `fragments for: ${text}`);
	}
	await initLanguageDetector(['de', 'en']);
	for (const [text, expected] of TAGGED_EN_CASES) {
		assert.deepEqual(run(text, 'en', 'de', 'en'), expected, `fragments for: ${text}`);
	}
});

test('golden master: every {de,en,es} pair direction fragments mixed sentences', async () => {
	for (const [primary, alt, cases] of OTHER_PAIRS) {
		await initLanguageDetector([primary, alt]);
		for (const [text, declared, expected] of cases) {
			assert.deepEqual(
				run(text, declared, primary, alt),
				expected,
				`fragments for ${primary}→${alt}: ${text}`
			);
		}
	}
});

// Spanish vocabulary that the calibrated de/es score margin separates on its
// own (measured margins ≥ 0.4 in [de,es]). These words need no list entry:
// they anchor an alt run via marginFavorsAlt() in findAltRuns.
const MARGIN_ANCHORED_ES = [
	'adios',
	'gracias',
	'amor',
	'amores',
	'eres',
	'somos',
	'hermoso',
	'hermosa',
	'feliz',
	'bien',
	'agua',
	'casa',
	'comida',
	'carino',
	'cariño',
	'vida',
	'abrazo',
	'abrazos',
	'querida',
	'querido',
	'corazón',
	'claro',
	'vamos',
	'arena',
	'madre',
	'preciosa',
	'quiero'
];

// Residual vocabulary the margin cannot decide: empty eld scores
// ("hola", "guapa" …) or German-corpus homographs ("besos", "playa").
// These must keep their explicit list entry in ALT_SIGNALS.
const RESIDUAL_ES = [
	'hola',
	'adiós',
	'guapa',
	'guapo',
	'bonito',
	'bonita',
	'lindo',
	'linda',
	'triste',
	'amo',
	'dulce',
	'beso',
	'besos',
	'playa',
	'corazon',
	'noche',
	'soy',
	'muy',
	'sol',
	'mar'
];

test('golden master: margin-anchored Spanish vocabulary flips in German frames', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const word of MARGIN_ANCHORED_ES) {
		assert.deepEqual(
			run(`Und ${word} bedeutet dasselbe.`, 'de', 'de', 'es'),
			[
				['de', 'Und '],
				['es', `${word} `],
				['de', 'bedeutet dasselbe.']
			],
			`margin anchor: ${word}`
		);
	}
});

test('golden master: residual Spanish vocabulary still anchors via lists', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const word of RESIDUAL_ES) {
		assert.deepEqual(
			run(`Und ${word} bedeutet dasselbe.`, 'de', 'de', 'es'),
			[
				['de', 'Und '],
				['es', `${word} `],
				['de', 'bedeutet dasselbe.']
			],
			`residual anchor: ${word}`
		);
	}
});

test('golden master: capitalized sentence-initial vocabulary flips via margin', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const word of ['Amor', 'Sol', 'Arena', 'Gracias', 'Vamos']) {
		assert.deepEqual(
			run(`${word} bedeutet dasselbe.`, 'de', 'de', 'es'),
			[
				['es', `${word} `],
				['de', 'bedeutet dasselbe.']
			],
			`capitalized anchor: ${word}`
		);
	}
});

test('golden master: German vocabulary never flips inside German frames', async () => {
	await initLanguageDetector(['de', 'es']);
	for (const word of [
		'und',
		'vielleicht',
		'Blumentopf',
		'Gartenschlauch',
		'Wanderlust',
		'obviously',
		'subtree',
		'familia',
		'tienes',
		'quieres'
	]) {
		assert.deepEqual(
			run(`Und ${word} bedeutet dasselbe.`, 'de', 'de', 'es'),
			[['de', `Und ${word} bedeutet dasselbe.`]],
			`german anchor: ${word}`
		);
	}
});

test('golden master: residual English words anchor in German frames', async () => {
	await initLanguageDetector(['de', 'en']);
	for (const word of ['hello', 'world', 'funny', 'cat', 'slow', 'darling']) {
		assert.deepEqual(
			run(`Und ${word} bedeutet dasselbe.`, 'de', 'de', 'en'),
			[
				['de', 'Und '],
				['en', `${word} `],
				['de', 'bedeutet dasselbe.']
			],
			`english residual anchor: ${word}`
		);
	}
});

test('golden master: half-sentence guards keep dominant languages intact', async () => {
	await initLanguageDetector(['de', 'es']);
	// German half-sentences stay German even though every word is
	// individually common in the alt language corpus.
	for (const sentence of [
		'ich gehe jetzt einkaufen',
		'das ist der Blumentopf',
		'die Ernte war gut dieses Jahr'
	]) {
		assert.deepEqual(
			run(`${sentence}.`, 'de', 'de', 'es'),
			[['de', `${sentence}.`]],
			`german half sentence: ${sentence}`
		);
	}
	// Spanish half-sentences stay Spanish.
	for (const sentence of [
		'quiero aprender mas contigo',
		'la cosecha de este ano',
		'somos divertidos juntos'
	]) {
		assert.deepEqual(
			run(`${sentence}.`, 'de', 'de', 'es'),
			[['es', `${sentence}.`]],
			`spanish half sentence: ${sentence}`
		);
	}
});
