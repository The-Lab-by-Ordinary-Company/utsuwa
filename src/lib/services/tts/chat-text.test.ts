import test from 'node:test';
import assert from 'node:assert/strict';
import {
	cleanSpeechMarkers,
	stripReasoningLeaks,
	looksLikeAltLanguage,
	stripAngleBlocks,
	hasIncompleteTrailingMarkup
} from './chat-text.ts';

// ── cleanSpeechMarkers ─────────────────────────────────────

test('cleanSpeechMarkers removes angle speak tags keeping inner text', () => {
	const result = cleanSpeechMarkers('Hola <speak:es>¿Cómo estás?</speak> bien');
	assert.equal(result, 'Hola ¿Cómo estás? bien');
});

test('cleanSpeechMarkers removes bracket lang tags keeping inner text', () => {
	const result = cleanSpeechMarkers('Hallo [lang:es]¡Hola![/lang] Welt');
	assert.equal(result, 'Hallo ¡Hola! Welt');
});

test('cleanSpeechMarkers removes lang equals tags and gesture markers', () => {
	const result = cleanSpeechMarkers('Hi <lang=fr>Salut</lang> <gesture:wave> there');
	assert.equal(result, 'Hi Salut there');
});

test('cleanSpeechMarkers removes angle-code lang tags keeping inner text', () => {
	const result = cleanSpeechMarkers(
		'Das spanische Wort für Hahn ist <lang code="es">gallo</lang>.'
	);
	assert.equal(result, 'Das spanische Wort für Hahn ist gallo.');
});

test('cleanSpeechMarkers returns plain text unchanged when no markers', () => {
	const result = cleanSpeechMarkers('Hello world');
	assert.equal(result, 'Hello world');
});

test('cleanSpeechMarkers removes pseudo-tool-call syntax', () => {
	const result = cleanSpeechMarkers('Hola speak({ lang: "es", text: "¿Cómo estás?" }) amigo');
	assert.equal(result, 'Hola ¿Cómo estás? amigo');
});

test('cleanSpeechMarkers removes gesture pseudo-tool-call', () => {
	const result = cleanSpeechMarkers('Hello gesture({ type: "smile" }) there');
	assert.equal(result, 'Hello there');
});

test('cleanSpeechMarkers strips inline tags even when no pseudo-tool-calls exist', () => {
	const result = cleanSpeechMarkers('Hola [lang:es]mundo[/lang]');
	assert.equal(result, 'Hola mundo');
});

// ── non-verbal markers ─────────────────────────────────────

test('cleanSpeechMarkers removes non-verbal markers from the display', () => {
	const result = cleanSpeechMarkers('speak({ text: "[laughter] Das war lustig!" })');
	assert.equal(result, 'Das war lustig!');
});

test('cleanSpeechMarkers removes all official non-verbal marker variants', () => {
	const result = cleanSpeechMarkers(
		'[laughter] [sigh] [confirmation-en] [question-ah] [surprise-wa] [dissatisfaction-hnn] Text'
	);
	assert.equal(result, 'Text');
});

test('cleanSpeechMarkers keeps ordinary bracketed words', () => {
	// Only the official marker list is stripped; user content stays intact.
	const result = cleanSpeechMarkers('Das ist [wichtig] zu wissen');
	assert.equal(result, 'Das ist [wichtig] zu wissen');
});

// ── strip-only contract ────────────────────────────────────
// Legacy tags must never become language-aware speech segments; the TTS
// fallback relies on stripLegacyTags producing clean primary-language text.

test('cleanSpeechMarkers removes legacy tags but keeps the inner text', () => {
	const result = cleanSpeechMarkers('Erkläre <lang=es>el coche</lang> bitte');
	assert.equal(result, 'Erkläre el coche bitte');
});

// ── reasoning leaks ───────────────────────────────────────

test('stripReasoningLeaks removes leaked reasoning monologue', () => {
	const text =
		'User wants: "bitte nochmal wiederholen" (please repeat again). So we need to repeat the conjugation of "ir" as before. Should give same content but concise. Hier ist die Konjugation: Ich gehe, du gehst, er geht.';
	const result = stripReasoningLeaks(text);
	assert.equal(result, 'Hier ist die Konjugation: Ich gehe, du gehst, er geht.');
});

test('stripReasoningLeaks keeps short marker sentences', () => {
	// "We need help." is short — never reasoning.
	const result = stripReasoningLeaks('We need help. Das ist normal.');
	assert.equal(result, 'We need help. Das ist normal.');
});

test('cleanSpeechMarkers strips reasoning leaks around speak texts', () => {
	const result = cleanSpeechMarkers(
		'Should give same content as earlier but maybe concise. speak({ text: "Hallo!" })'
	);
	assert.equal(result, 'Hallo!');
});

// ── alternative-language diacritics heuristic ──────────────

test('looksLikeAltLanguage detects Spanish diacritics', () => {
	assert.equal(looksLikeAltLanguage('¿Cómo estás?', 'es'), true);
	assert.equal(looksLikeAltLanguage('yo voy, tú vas, él va', 'es'), true);
	assert.equal(looksLikeAltLanguage('Ich gehe, du gehst, er geht', 'es'), false);
	assert.equal(looksLikeAltLanguage('Ich gehe', undefined), false);
	assert.equal(looksLikeAltLanguage('Hallo', 'unknown-lang'), false);
});

test('cleanSpeechMarkers removes bare closing speak tags', () => {
	const result = cleanSpeechMarkers('Hallo.</speak> Wie geht es?</speak>');
	assert.equal(result, 'Hallo. Wie geht es?');
});

// ── angle-bracket section markers ──────────────────────────

test('stripAngleBlocks unwraps < text > sections and drops < > separators', () => {
	const result = stripAngleBlocks(
		'< Hier ist ein Satz. > < > < Aquí está una oración. >'
	);
	assert.equal(result, 'Hier ist ein Satz.  Aquí está una oración.');
});

test('stripAngleBlocks leaves real XML speak tags untouched', () => {
	const result = stripAngleBlocks('<speak text="Hallo">');
	assert.equal(result, '<speak text="Hallo">');
});

test('cleanSpeechMarkers unwraps angle-bracket sections', () => {
	const result = cleanSpeechMarkers('< Hallo Welt! > < > < ¡Hola mundo! >');
	assert.equal(result, 'Hallo Welt! ¡Hola mundo!');
});

// ── JSON actions envelopes ─────────────────────────────────

test('cleanSpeechMarkers removes actions envelopes keeping the speak texts', () => {
	const result = cleanSpeechMarkers(
		'{"actions":[{"function":"speak","args":{"text":"Hallo!","lang":"de"}},{"function":"speak","args":{"text":"¡Hola!","lang":"es"}}]}'
	);
	assert.equal(result, 'Hallo! ¡Hola!');
});

test('cleanSpeechMarkers keeps prose around an envelope', () => {
	const result = cleanSpeechMarkers(
		'Vorher. {"actions":[{"function":"speak","args":{"text":"Hallo","lang":"de"}}]} Nachher.'
	);
	assert.equal(result, 'Vorher. Hallo Nachher.');
});

// ── XML-style speak tags ──────────────────────────────────

test('cleanSpeechMarkers replaces XML speak tags with their texts', () => {
	const result = cleanSpeechMarkers(
		'<speak text="Hallo!" /> <gesture type="smile" /> <speak lang="es" text="¡Hola!" />'
	);
	assert.equal(result, 'Hallo! ¡Hola!');
});

test('cleanSpeechMarkers inlines XML open/close tags and unescapes quotes', () => {
	const result = cleanSpeechMarkers(
		'<speak lang="es">Un adjetivo es \\"enojado\\"</speak>.'
	);
	assert.equal(result, 'Un adjetivo es "enojado".');
});

// ── hasIncompleteTrailingMarkup ───────────────────────────

test('hasIncompleteTrailingMarkup flags an unfinished speak call', () => {
	assert.equal(hasIncompleteTrailingMarkup('Hallo speak({"text":"Hallo'), true);
});

test('hasIncompleteTrailingMarkup ignores a closing paren inside the text', () => {
	// Regression: ")" inside the text argument used to close the call early,
	// letting raw incomplete syntax through to the chat bubble.
	assert.equal(hasIncompleteTrailingMarkup('speak({"text":"hallo) und'), true);
	assert.equal(hasIncompleteTrailingMarkup('speak({"text":"(hallo"'), true);
});

test('hasIncompleteTrailingMarkup passes complete calls and plain text', () => {
	assert.equal(hasIncompleteTrailingMarkup('speak({"text":"Hallo"})'), false);
	assert.equal(hasIncompleteTrailingMarkup('Hallo Welt.'), false);
	assert.equal(hasIncompleteTrailingMarkup(''), false);
});

test('hasIncompleteTrailingMarkup flags unfinished lang, actions and XML tags', () => {
	assert.equal(hasIncompleteTrailingMarkup('<lang'), true);
	assert.equal(hasIncompleteTrailingMarkup('{"actions":[{"function":"speak","args":{'), true);
	assert.equal(hasIncompleteTrailingMarkup('<speak text="Hallo'), true);
});
