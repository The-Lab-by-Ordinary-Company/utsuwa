import test from 'node:test';
import assert from 'node:assert/strict';

import { StreamingSpeechBuffer } from './streaming-speech-buffer.ts';

function createBuffer() {
	const segments: { text: string; language?: string }[] = [];
	const buffer = new StreamingSpeechBuffer({
		defaultLanguage: 'en',
		onSegment: (seg) => segments.push(seg)
	});
	return { buffer, segments };
}

test('emits a complete sentence immediately', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello world.');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello world.');
});

test('emits multiple sentences from one chunk', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('First sentence. Second sentence.');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, 'First sentence.');
	assert.equal(segments[1].text, 'Second sentence.');
});

test('buffers partial sentences until a terminator arrives', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello ');
	assert.equal(segments.length, 0);
	buffer.feed('world.');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello world.');
});

test('flushes remaining text without a terminator', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('No terminator here');
	assert.equal(segments.length, 0);
	buffer.flush();
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'No terminator here');
});

test('splits at paragraph breaks', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Paragraph one.\n\nParagraph two.');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, 'Paragraph one.');
	assert.equal(segments[1].text, 'Paragraph two.');
});

test('does not emit while inside an open JSON block', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Hello. {"mood_change":');
	assert.equal(segments.length, 1);
	assert.equal(segments[0].text, 'Hello.');
	buffer.feed('{"emotion":"happy"}} Goodbye.');
	assert.equal(segments.length, 2);
	assert.equal(segments[1].text, 'Goodbye.');
});

test('reset clears pending text', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('Pending');
	buffer.reset();
	buffer.flush();
	assert.equal(segments.length, 0);
});

test('skips segments containing only punctuation and whitespace', () => {
	const { buffer, segments } = createBuffer();
	buffer.feed('   ');
	buffer.flush();
	assert.equal(segments.length, 0);
});

// OmniVoice-style language-marked tool calls -------------------------------

function createLanguageBuffer(defaultLanguage = 'de') {
	const segments: { text: string; language?: string }[] = [];
	const buffer = new StreamingSpeechBuffer({
		defaultLanguage,
		onSegment: (seg) => segments.push(seg)
	});
	return { buffer, segments };
}

test('emits a complete speak call immediately', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hallo","lang":"de"})');
	assert.deepEqual(segments, [{ text: 'Hallo', language: 'de' }]);
});

test('emits a speak call split across multiple chunks only when complete', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hall');
	assert.equal(segments.length, 0);
	buffer.feed('o","lang":"de"})');
	assert.deepEqual(segments, [{ text: 'Hallo', language: 'de' }]);
});

test('does not emit completed language calls twice when more chunks arrive', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hallo","lang":"de"})');
	assert.equal(segments.length, 1);
	buffer.feed(' speak({"text":"Welt","lang":"de"})');
	assert.equal(segments.length, 2);
	assert.deepEqual(segments, [
		{ text: 'Hallo', language: 'de' },
		{ text: 'Welt', language: 'de' }
	]);
});

test('flush does not emit completed language calls twice', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"hola","lang":"es"})');
	buffer.flush();
	assert.deepEqual(segments, [{ text: 'hola', language: 'es' }]);
});

test('preserves language switches within one sentence as separate segments', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Auf Spanisch sagt man ","lang":"de"})');
	buffer.feed(' speak({"text":"por favor,","lang":"es"})');
	buffer.feed(' speak({"text":" bitte.","lang":"de"})');

	assert.deepEqual(segments, [
		{ text: 'Auf Spanisch sagt man', language: 'de' },
		{ text: 'por favor,', language: 'es' },
		{ text: 'bitte.', language: 'de' }
	]);
});

test('keeps explicit language codes unchanged', () => {
	const { buffer, segments } = createLanguageBuffer('en');
	buffer.feed('speak({"text":"Hola","lang":"es"})');
	buffer.feed(' speak({"text":"Hello","lang":"en"})');
	buffer.feed(' speak({"text":"Bonjour","lang":"fr"})');

	assert.deepEqual(segments, [
		{ text: 'Hola', language: 'es' },
		{ text: 'Hello', language: 'en' },
		{ text: 'Bonjour', language: 'fr' }
	]);
});

test('never speaks raw or incomplete speak syntax', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hallo"');
	assert.equal(segments.length, 0);

	buffer.feed(',"lang":"de"})');
	assert.deepEqual(segments, [{ text: 'Hallo', language: 'de' }]);
});

test('does not speak incomplete tool calls on explicit flush', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hal');
	buffer.flush();
	assert.equal(segments.length, 0);
});

test('plaintext before a speak call is still emitted', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('Hello world. speak({"text":"Hola","lang":"es"})');
	assert.deepEqual(segments, [
		{ text: 'Hello world.', language: 'de' },
		{ text: 'Hola', language: 'es' }
	]);
});

test('emits Japanese sentences without whitespace after 。', () => {
	const { buffer, segments } = createLanguageBuffer('ja');
	buffer.feed('こんにちは。元気ですか。');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, 'こんにちは。');
	assert.equal(segments[1].text, '元気ですか。');
});

test('emits Chinese sentences without whitespace after 。', () => {
	const { buffer, segments } = createLanguageBuffer('zh');
	buffer.feed('你好。今天怎么样？');
	assert.equal(segments.length, 2);
	assert.equal(segments[0].text, '你好。');
	assert.equal(segments[1].text, '今天怎么样？');
});

test('normalizes uppercase language codes in speak calls', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hola","lang":"ES"})');
	assert.deepEqual(segments, [{ text: 'Hola', language: 'es' }]);
});

// Long speak() calls are split so synthesis of the first sentence starts
// immediately instead of waiting for the whole call to stream. ------------

test('splits a long speak call at sentence boundaries', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed(
		'speak({"text":"Erste Erklärung. Zweiter Satz. Dritter Satz. Vierter Satz.","lang":"de"})'
	);
	assert.deepEqual(segments, [
		{ text: 'Erste Erklärung.', language: 'de' },
		{ text: 'Zweiter Satz.', language: 'de' },
		{ text: 'Dritter Satz.', language: 'de' },
		{ text: 'Vierter Satz.', language: 'de' }
	]);
});

test('keeps short speak calls unsplit', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"Hallo. Wie geht es dir?","lang":"de"})');
	assert.deepEqual(segments, [{ text: 'Hallo. Wie geht es dir?', language: 'de' }]);
});

test('split long calls keep their language on every part', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed('speak({"text":"Uno. Dos. Tres. Cuatro.","lang":"es"})');
	assert.deepEqual(segments, [
		{ text: 'Uno.', language: 'es' },
		{ text: 'Dos.', language: 'es' },
		{ text: 'Tres.', language: 'es' },
		{ text: 'Cuatro.', language: 'es' }
	]);
});

test('split long call preserves trailing text without terminator', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"A. B. C. D. und noch ein Nachsatz","lang":"de"})');
	assert.equal(segments.length, 5);
	assert.equal(segments[4].text, 'und noch ein Nachsatz');
});

// Same-pass merging of adjacent same-language segments. --------------------

test('merges consecutive same-language speak calls from one chunk', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed(
		'speak({"text":"el oído","lang":"es"}) speak({"text":"el verbo ir","lang":"es"})'
	);
	assert.deepEqual(segments, [{ text: 'el oído el verbo ir', language: 'es' }]);
});

test('does not merge same-language calls arriving in separate chunks', () => {
	// Merging across chunks would delay the first word's synthesis.
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('speak({"text":"el oído","lang":"es"})');
	assert.equal(segments.length, 1);
	buffer.feed(' speak({"text":"el verbo ir","lang":"es"})');
	assert.deepEqual(segments, [
		{ text: 'el oído', language: 'es' },
		{ text: 'el verbo ir', language: 'es' }
	]);
});

test('does not merge more than 15 words', () => {
	const { buffer, segments } = createLanguageBuffer();
	const first = Array.from({ length: 10 }, (_, i) => `palabra${i}`).join(' ');
	const second = Array.from({ length: 10 }, (_, i) => `extra${i}`).join(' ');
	buffer.feed(`speak({"text":"${first}","lang":"es"}) speak({"text":"${second}","lang":"es"})`);
	assert.equal(segments.length, 2);
});

test('never merges the sentences of a split long call', () => {
	// The long-call split exists for early start; merging the parts back would
	// delay the first sentence behind the whole synthesis.
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed(
		'speak({"text":"Uno. Dos. Tres. Cuatro.","lang":"es"})'
	);
	assert.deepEqual(segments, [
		{ text: 'Uno.', language: 'es' },
		{ text: 'Dos.', language: 'es' },
		{ text: 'Tres.', language: 'es' },
		{ text: 'Cuatro.', language: 'es' }
	]);
});

test('merges plaintext prose with a following same-language call', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed('Das ist gut. speak({"text":"wirklich","lang":"de"})');
	assert.deepEqual(segments, [{ text: 'Das ist gut. wirklich', language: 'de' }]);
});

// JSON actions envelopes (some models emit them instead of speak() calls). ---

test('emits the speak actions of a complete JSON envelope', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'{"actions":[{"function":"gesture","args":{"type":"smile"}},{"function":"speak","args":{"text":"Hallo!","lang":"de"}},{"function":"speak","args":{"text":"¡Hola!","lang":"es"}}]}'
	);
	assert.deepEqual(segments, [
		{ text: 'Hallo!', language: 'de' },
		{ text: '¡Hola!', language: 'es' }
	]);
});

test('never speaks an incomplete actions envelope', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('{"actions":[{"function":"speak","args":{"text":"Hallo!');
	assert.equal(segments.length, 0);
	buffer.flush();
	assert.equal(segments.length, 0);
});

test('emits an envelope spread across chunks only when complete', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('{"actions":[{"function":"speak","args":{"text":"Hallo!');
	assert.equal(segments.length, 0);
	buffer.feed('","lang":"de"}}]}');
	assert.deepEqual(segments, [{ text: 'Hallo!', language: 'de' }]);
});

test('speaks prose before a complete envelope and keeps languages separate', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'Einleitung. {"actions":[{"function":"speak","args":{"text":"El participio","lang":"es"}}]}'
	);
	assert.deepEqual(segments, [
		{ text: 'Einleitung.', language: 'de' },
		{ text: 'El participio', language: 'es' }
	]);
});

// XML-style speak/gesture tags. ----------------------------------------------

test('emits the speak texts of self-closing XML tags with languages', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'<speak text="Hallo! Wie geht es dir?" /> <speak lang="es" text="¡Hola! ¿Cómo estás?" />'
	);
	assert.deepEqual(segments, [
		{ text: 'Hallo! Wie geht es dir?', language: 'de' },
		{ text: '¡Hola! ¿Cómo estás?', language: 'es' }
	]);
});

test('never speaks an incomplete XML tag', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('<speak text="Hallo!');
	assert.equal(segments.length, 0);
	buffer.flush();
	assert.equal(segments.length, 0);
});

test('emits an open/close XML tag spread across chunks only when complete', () => {
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('<speak lang="es">Hola, ¿c');
	assert.equal(segments.length, 0);
	buffer.feed('ómo estás?</speak>');
	assert.deepEqual(segments, [{ text: 'Hola, ¿cómo estás?', language: 'es' }]);
});

test('never speaks the incomplete tail of an XML tag while streaming', () => {
	// A complete tag followed by a partial tag: only the complete tag's text
	// may be emitted; the raw `<gesture` tail must stay held.
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('<speak text="Klar."/> <gesture');
	assert.deepEqual(segments, [{ text: 'Klar.', language: 'de' }]);
	buffer.feed(' type="smile"/>');
	assert.deepEqual(segments, [{ text: 'Klar.', language: 'de' }]);
});

test('never speaks a bare < at the end of a streaming chunk', () => {
	// A chunk can end with a lone `<` (the tag letters arrive next); it must
	// be held as markup, not spoken.
	const { buffer, segments } = createLanguageBuffer();
	buffer.feed('<speak lang="es" text="Hola." /> <');
	assert.deepEqual(segments, [{ text: 'Hola.', language: 'es' }]);
	buffer.feed('speak lang="de" text="Hallo." />');
	assert.deepEqual(segments, [
		{ text: 'Hola.', language: 'es' },
		{ text: 'Hallo.', language: 'de' }
	]);
});

test('emits <speak text="..."> tags opened without self-closing', () => {
	// The model sometimes opens the tag with a plain `>` and no </speak>;
	// the text is complete inside the attribute.
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'<speak text="Hallo! Wie geht es dir?"> <pause ms=300/> <speak lang="es" text="¡Hola! ¿Cómo estás?">'
	);
	assert.deepEqual(segments, [
		{ text: 'Hallo! Wie geht es dir?', language: 'de' },
		{ text: '¡Hola! ¿Cómo estás?', language: 'es' }
	]);
});

test('sections separated by bare </speak> tags are tagged by diacritics', () => {
	// Some models emit only closing tags as section separators; the sections
	// are plaintext and get their language from the alt-language heuristic.
	const segments: { text: string; language?: string }[] = [];
	const b = new StreamingSpeechBuffer({
		defaultLanguage: 'de',
		altLanguage: 'es',
		onSegment: (seg) => segments.push(seg)
	});
	b.feed(
		'Hier ist die Konjugation.</speak> Präsens: ich gehe – du gehst.</speak> ' +
			'Aquí tienes la conjugación.</speak> Presente: yo voy – tú vas. ¡Perfecto!'
	);
	b.flush();
	assert.deepEqual(segments, [
		{ text: 'Hier ist die Konjugation.', language: 'de' },
		{ text: 'Präsens: ich gehe – du gehst.', language: 'de' },
		{ text: 'Aquí tienes la conjugación.', language: 'es' },
		{ text: 'Presente: yo voy – tú vas.', language: 'es' },
		{ text: '¡Perfecto!', language: 'es' }
	]);
});

test('bare </speak> tags are never spoken', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed('Hallo.</speak> Welt.');
	buffer.flush();
	assert.deepEqual(segments, [
		{ text: 'Hallo.', language: 'de' },
		{ text: 'Welt.', language: 'de' }
	]);
});

test('angle-bracket < text > sections are spoken without the brackets and tagged', () => {
	const segments: { text: string; language?: string }[] = [];
	const b = new StreamingSpeechBuffer({
		defaultLanguage: 'de',
		altLanguage: 'es',
		onSegment: (seg) => segments.push(seg)
	});
	b.feed(
		'< Hier ist die Konjugation. > < > < Aquí tienes la conjugación. > < > < Presente: yo voy, tú vas. ¡Perfecto! >'
	);
	b.flush();
	assert.deepEqual(segments, [
		{ text: 'Hier ist die Konjugation.', language: 'de' },
		{ text: 'Aquí tienes la conjugación.', language: 'es' },
		{ text: 'Presente: yo voy, tú vas.', language: 'es' },
		{ text: '¡Perfecto!', language: 'es' }
	]);
});

// State-block fragments must never be spoken. -------------------------------

test('never speaks a state block that arrives without outer braces', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'speak({"text":"Hallo! Wie geht es dir?","lang":"de"})\n' +
			'{"mood_change": {"emotion": "happy", "intensity_delta": 0}, "energy_delta": 0, "new_memory": null}'
	);
	assert.deepEqual(segments, [{ text: 'Hallo! Wie geht es dir?', language: 'de' }]);
});

test('never speaks state-key fragments left over from block stripping', () => {
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed(
		'"mood_change": {"emotion": "happy", "intensity_delta": 0}, "energy_delta": 0, "new_memory": null'
	);
	buffer.flush();
	assert.deepEqual(segments, []);
});

test('never speaks state fragments that reach the plaintext path with a sentence boundary', () => {
	// A fragment ending with a period would be emitted via the plaintext path;
	// it must still be filtered.
	const { buffer, segments } = createLanguageBuffer('de');
	buffer.feed('"mood_change": {"emotion": "happy"}. Weiterer Text.');
	assert.deepEqual(segments, [{ text: 'Weiterer Text.', language: 'de' }]);
});
