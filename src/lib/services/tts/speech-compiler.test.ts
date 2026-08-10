import test from 'node:test';
import assert from 'node:assert/strict';
import {
	validateCalls,
	splitLongSegments,
	mergeSegments,
	resolveLanguage,
	compileSegments,
	compile,
	compileFromText,
	parsePseudoToolCalls,
	scanPseudoToolCalls,
	type ToolCall
} from './speech-compiler.ts';

// ── validateCalls ──────────────────────────────────────────

test('validateCalls passes through valid speak calls', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello', lang: 'en' } },
		{ name: 'speak', arguments: { text: 'World' } }
	];
	const result = validateCalls(input, 'de');
	assert.equal(result.length, 2);
	assert.equal(result[0].arguments.text, 'Hello');
	assert.equal(result[0].arguments.lang, 'en');
	assert.equal(result[1].arguments.lang, 'de'); // filled from primaryLanguage
});

test('validateCalls clamps pause ms', () => {
	const result = validateCalls([{ name: 'pause', arguments: { ms: 50 } }], 'de');
	assert.equal(result[0].arguments.ms, 100);
	const result2 = validateCalls([{ name: 'pause', arguments: { ms: 10000 } }], 'de');
	assert.equal(result2[0].arguments.ms, 5000);
});

test('validateCalls discards unknown gesture types', () => {
	const result = validateCalls([{ name: 'gesture', arguments: { type: 'cry' } }], 'de');
	assert.equal(result.length, 0);
});

test('validateCalls passes valid gesture types', () => {
	const result = validateCalls([{ name: 'gesture', arguments: { type: 'smile' } }], 'de');
	assert.equal(result.length, 1);
	assert.equal(result[0].arguments.type, 'smile');
});

test('validateCalls discards unknown tool names', () => {
	const result = validateCalls([{ name: 'dance', arguments: {} }], 'de');
	assert.equal(result.length, 0);
});

test('validateCalls handles empty text in speak', () => {
	const result = validateCalls([{ name: 'speak', arguments: { text: '', lang: 'fr' } }], 'de');
	assert.equal(result[0].arguments.text, '');
});

// ── splitLongSegments ─────────────────────────────────────

test('splitLongSegments splits a speak with 4 sentences', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello! How are you? I am fine. Thanks for asking.', lang: 'en' } }
	];
	const result = splitLongSegments(input);
	assert.equal(result.length, 4);
	assert.equal(result[0].arguments.text, 'Hello!');
	assert.equal(result[0].arguments.lang, 'en');
});

test('splitLongSegments leaves a single sentence untouched', () => {
	const input: ToolCall[] = [{ name: 'speak', arguments: { text: 'Hello.', lang: 'en' } }];
	const result = splitLongSegments(input);
	assert.equal(result.length, 1);
});

test('splitLongSegments leaves two sentences untouched (compiler threshold)', () => {
	const input: ToolCall[] = [{ name: 'speak', arguments: { text: 'Hello. How are you?', lang: 'en' } }];
	const result = splitLongSegments(input);
	assert.equal(result.length, 1);
});

test('splitLongSegments preserves non-speak calls', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'A. B. C. D.', lang: 'en' } },
		{ name: 'pause', arguments: { ms: 200 } }
	];
	const result = splitLongSegments(input);
	assert.ok(result.length >= 4);
	assert.equal(result[result.length - 1].name, 'pause');
});

test('splitLongSegments preserves trailing text without terminator', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello! How are you? I am fine. Thanks for asking and goodbye', lang: 'en' } }
	];
	const result = splitLongSegments(input);
	// 3 sentences with terminators + 1 trailing fragment = 4 segments
	assert.equal(result.length, 4);
	assert.equal(result[3].arguments.text, 'Thanks for asking and goodbye');
});



test('splitLongSegments splits Japanese sentences on 。', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'こんにちは。元気ですか？私は元気です。', lang: 'ja' } }
	];
	const result = splitLongSegments(input);
	assert.equal(result.length, 3);
	assert.equal(result[0].arguments.text, 'こんにちは。');
	assert.equal(result[1].arguments.text, '元気ですか？');
	assert.equal(result[2].arguments.text, '私は元気です。');
});

test('splitLongSegments splits Chinese sentences on 。！？', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: '你好！今天怎么样？我很好。', lang: 'zh' } }
	];
	const result = splitLongSegments(input);
	assert.equal(result.length, 3);
	assert.equal(result[0].arguments.text, '你好！');
	assert.equal(result[1].arguments.text, '今天怎么样？');
	assert.equal(result[2].arguments.text, '我很好。');
});
// ── mergeSegments ─────────────────────────────────────────

test('mergeSegments merges consecutive same-language calls', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello', lang: 'en' } },
		{ name: 'speak', arguments: { text: 'world', lang: 'en' } }
	];
	const result = mergeSegments(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].arguments.text, 'Hello world');
});

test('mergeSegments does not merge across language boundaries', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hallo', lang: 'de' } },
		{ name: 'speak', arguments: { text: 'Hola', lang: 'es' } },
		{ name: 'speak', arguments: { text: 'Welt', lang: 'de' } }
	];
	const result = mergeSegments(input);
	assert.equal(result.length, 3);
});

test('mergeSegments does not merge when combined exceeds 15 words', () => {
	const first = Array.from({ length: 10 }, (_, i) => `word${i}`).join(' ');
	const second = Array.from({ length: 10 }, (_, i) => `extra${i}`).join(' ');
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: first, lang: 'en' } },
		{ name: 'speak', arguments: { text: second, lang: 'en' } }
	];
	const result = mergeSegments(input);
	assert.equal(result.length, 2); // 20 words total — too many
});

test('mergeSegments does not merge pause or gesture between speaks', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hi', lang: 'en' } },
		{ name: 'pause', arguments: { ms: 200 } },
		{ name: 'speak', arguments: { text: 'there', lang: 'en' } }
	];
	const result = mergeSegments(input);
	assert.equal(result.length, 3);
});

test('mergeSegments does not mutate the original calls', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello', lang: 'en' } },
		{ name: 'speak', arguments: { text: 'world', lang: 'en' } }
	];
	const originalText = input[0].arguments.text;
	mergeSegments(input);
	assert.equal(input[0].arguments.text, originalText);
});

// ── resolveLanguage ───────────────────────────────────────

test('resolveLanguage fills undefined lang with primaryLanguage', () => {
	const input: ToolCall[] = [{ name: 'speak', arguments: { text: 'Hello' } }];
	const result = resolveLanguage(input, 'de');
	assert.equal(result[0].arguments.lang, 'de');
});

test('resolveLanguage preserves explicit lang', () => {
	const input: ToolCall[] = [{ name: 'speak', arguments: { text: 'Hola', lang: 'es' } }];
	const result = resolveLanguage(input, 'de');
	assert.equal(result[0].arguments.lang, 'es');
});

// ── compileSegments ───────────────────────────────────────

test('compileSegments maps speak to CompiledSegment', () => {
	const input: ToolCall[] = [{ name: 'speak', arguments: { text: 'Hello', lang: 'en' } }];
	const result = compileSegments(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].type, 'speak');
	assert.equal(result[0].text, 'Hello');
	assert.equal(result[0].language, 'en');
});

test('compileSegments maps pause to CompiledSegment', () => {
	const result = compileSegments([{ name: 'pause', arguments: { ms: 500 } }]);
	assert.equal(result[0].type, 'pause');
	assert.equal(result[0].durationMs, 500);
});

test('compileSegments maps gesture to CompiledSegment', () => {
	const result = compileSegments([{ name: 'gesture', arguments: { type: 'wave' } }]);
	assert.equal(result[0].type, 'gesture');
	assert.equal(result[0].gestureType, 'wave');
	assert.equal(result[0].durationMs, 1500);
});

// ── compile (full pipeline) ────────────────────────────────

test('compile runs the full pipeline', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hello', lang: 'en' } },
		{ name: 'pause', arguments: { ms: 200 } },
		{ name: 'speak', arguments: { text: 'World', lang: 'en' } }
	];
	const result = compile(input, 'de');
	// pause between speaks prevents merge → 3 segments
	assert.equal(result.segments.length, 3);
	assert.equal(result.segments[0].type, 'speak');
	assert.equal(result.segments[0].text, 'Hello');
	assert.equal(result.segments[1].type, 'pause');
	assert.equal(result.segments[2].type, 'speak');
	assert.equal(result.segments[2].text, 'World');
});

test('compile handles empty input gracefully', () => {
	const result = compile([], 'de');
	assert.equal(result.segments.length, 0);
});

// ── compileFromText (fallback) ─────────────────────────────

test('compileFromText creates single speak segment from plain text', () => {
	const result = compileFromText('Hello world.', 'en');
	assert.equal(result.segments.length, 1);
	assert.equal(result.segments[0].type, 'speak');
	assert.equal(result.segments[0].text, 'Hello world.');
	assert.equal(result.segments[0].language, 'en');
});

test('compileFromText handles empty text gracefully', () => {
	const result = compileFromText('', 'de');
	assert.equal(result.segments.length, 0);
});

// ── Regression tests ──────────────────────────────────────

test('regression: Spanish teacher scenario — separate language segments kept separate', () => {
	const input: ToolCall[] = [
		{ name: 'speak', arguments: { text: 'Hallo heißt auf spanisch', lang: 'de' } },
		{ name: 'speak', arguments: { text: 'Hola', lang: 'es' } },
		{ name: 'speak', arguments: { text: 'Das bedeutet Begrüßung.', lang: 'de' } }
	];
	const result = compile(input, 'de');
	assert.equal(result.segments.length, 3);
	assert.equal(result.segments[0].language, 'de');
	assert.equal(result.segments[1].language, 'es');
	assert.equal(result.segments[2].language, 'de');
});

// ── parsePseudoToolCalls (fallback for models without tool support) ─

test('parsePseudoToolCalls extracts speak calls and inlines text', () => {
	const text = 'Hello speak({"text":"world"}) there';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].name, 'speak');
	assert.equal(parsed.calls[0].arguments.text, 'world');
	assert.equal(parsed.cleanedText, 'Hello world there');
});

test('parsePseudoToolCalls returns empty calls and original text when no calls found', () => {
	const text = 'Hello world';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 0);
	assert.equal(parsed.cleanedText, 'Hello world');
});

test('parsePseudoToolCalls handles pause and gesture calls', () => {
	const text = 'Hello pause({"ms":300}) gesture({"type":"smile"}) world';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 2);
	assert.equal(parsed.calls[0].name, 'pause');
	assert.equal(parsed.calls[1].name, 'gesture');
	assert.equal(parsed.cleanedText, 'Hello world');
});

test('parsePseudoToolCalls understands JavaScript-style object literals', () => {
	const text = 'Hola speak({ lang: "es", text: "¿Cómo estás?" }) mundo';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].name, 'speak');
	assert.equal(parsed.calls[0].arguments.lang, 'es');
	assert.equal(parsed.calls[0].arguments.text, '¿Cómo estás?');
	assert.equal(parsed.cleanedText, 'Hola ¿Cómo estás? mundo');
});

test('parsePseudoToolCalls handles spaced calls and single quotes', () => {
	const text = "Hi speak({ lang: 'en', text: 'Hello' }) there";
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, 'Hello');
	assert.equal(parsed.cleanedText, 'Hi Hello there');
});

test('parsePseudoToolCalls handles text containing a closing brace', () => {
	const text = 'Hola speak({ lang: "es", text: "¡Hola! :-)" }) adios';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, '¡Hola! :-)');
	assert.equal(parsed.cleanedText, 'Hola ¡Hola! :-) adios');
});

test('parsePseudoToolCalls returns chunks preserving prose/call order', () => {
	const text = 'Hello speak({ text: "world" }) how are you?';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.chunks.length, 3);
	assert.equal(parsed.chunks[0].type, 'prose');
	assert.equal(parsed.chunks[0].text, 'Hello');
	assert.equal(parsed.chunks[1].type, 'call');
	assert.equal(parsed.chunks[1].call?.name, 'speak');
	assert.equal(parsed.chunks[2].type, 'prose');
	assert.equal(parsed.chunks[2].text, 'how are you?');
});


test('parsePseudoToolCalls keeps single quotes inside double-quoted strings', () => {
	const text = `speak({ text: "Das spanische Wort 'perro' bedeutet Hund." })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "Das spanische Wort 'perro' bedeutet Hund.");
	assert.equal(parsed.cleanedText, "Das spanische Wort 'perro' bedeutet Hund.");
});

test('parsePseudoToolCalls handles apostrophes in single-quoted strings', () => {
	// German/Spanish output with apostrophes would previously break the brace
	// scan at the first quote, dropping the whole call.
	const text = `speak({ text: 'Das Partizip von 'kochen' ist 'cocinado'' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "Das Partizip von 'kochen' ist 'cocinado'");
});

test('parsePseudoToolCalls handles a trailing apostrophe in single-quoted text', () => {
	const text = `speak({ text: 'l'osso' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "l'osso");
});

test('parsePseudoToolCalls handles the smoke-test reply with apostrophes', () => {
	// A full vocabulary-training reply in one JS-style call.
	const text = `speak({ text: 'Das spanische Wort für das Partizip von 'kochen' ist 'cocinado'. El participio de 'cocinar' es 'cocinado'.' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(
		parsed.calls[0].arguments.text,
		"Das spanische Wort für das Partizip von 'kochen' ist 'cocinado'. El participio de 'cocinar' es 'cocinado'."
	);
});

test('parsePseudoToolCalls keeps the lang field with apostrophes in the text', () => {
	const text = `speak({ lang: 'es', text: 'El participio de 'cocinar' es 'cocinado'' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.lang, 'es');
	assert.equal(parsed.calls[0].arguments.text, "El participio de 'cocinar' es 'cocinado'");
});


// ── scanPseudoToolCalls ───────────────────────────────────

test('scanPseudoToolCalls returns absolute positions for every complete call', () => {
	const input = 'Hello speak({"text":"world","lang":"en"}) pause({"ms":300})';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 2);
	assert.equal(result[0].name, 'speak');
	assert.equal(result[0].args.text, 'world');
	assert.equal(result[0].startIndex, 6);
	assert.ok(result[0].afterIndex > result[0].startIndex);
	assert.equal(result[1].name, 'pause');
	assert.equal(result[1].args.ms, 300);
});

test('scanPseudoToolCalls skips incomplete calls', () => {
	const input = 'speak({"text":"hello"}) speak({"text":"world"';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].args.text, 'hello');
});

test('scanPseudoToolCalls ignores calls with non-object arguments', () => {
	const input = 'speak("plain text") speak({"text":"ok"})';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].args.text, 'ok');
});

// ── parsePseudoToolCalls (fallback for models without tool support) ─

test('parsePseudoToolCalls extracts speak calls and inlines text', () => {
	const text = 'Hello speak({"text":"world"}) there';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].name, 'speak');
	assert.equal(parsed.calls[0].arguments.text, 'world');
	assert.equal(parsed.cleanedText, 'Hello world there');
});

test('parsePseudoToolCalls returns empty calls and original text when no calls found', () => {
	const text = 'Hello world';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 0);
	assert.equal(parsed.cleanedText, 'Hello world');
});

test('parsePseudoToolCalls handles pause and gesture calls', () => {
	const text = 'Hello pause({"ms":300}) gesture({"type":"smile"}) world';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 2);
	assert.equal(parsed.calls[0].name, 'pause');
	assert.equal(parsed.calls[1].name, 'gesture');
	assert.equal(parsed.cleanedText, 'Hello world');
});

test('parsePseudoToolCalls understands JavaScript-style object literals', () => {
	const text = 'Hola speak({ lang: "es", text: "¿Cómo estás?" }) mundo';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].name, 'speak');
	assert.equal(parsed.calls[0].arguments.lang, 'es');
	assert.equal(parsed.calls[0].arguments.text, '¿Cómo estás?');
	assert.equal(parsed.cleanedText, 'Hola ¿Cómo estás? mundo');
});

test('parsePseudoToolCalls handles spaced calls and single quotes', () => {
	const text = "Hi speak({ lang: 'en', text: 'Hello' }) there";
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, 'Hello');
	assert.equal(parsed.cleanedText, 'Hi Hello there');
});

test('parsePseudoToolCalls handles text containing a closing brace', () => {
	const text = 'Hola speak({ lang: "es", text: "¡Hola! :-)" }) adios';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, '¡Hola! :-)');
	assert.equal(parsed.cleanedText, 'Hola ¡Hola! :-) adios');
});

test('parsePseudoToolCalls returns chunks preserving prose/call order', () => {
	const text = 'Hello speak({ text: "world" }) how are you?';
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.chunks.length, 3);
	assert.equal(parsed.chunks[0].type, 'prose');
	assert.equal(parsed.chunks[0].text, 'Hello');
	assert.equal(parsed.chunks[1].type, 'call');
	assert.equal(parsed.chunks[1].call?.name, 'speak');
	assert.equal(parsed.chunks[2].type, 'prose');
	assert.equal(parsed.chunks[2].text, 'how are you?');
});


test('parsePseudoToolCalls keeps single quotes inside double-quoted strings', () => {
	const text = `speak({ text: "Das spanische Wort 'perro' bedeutet Hund." })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "Das spanische Wort 'perro' bedeutet Hund.");
	assert.equal(parsed.cleanedText, "Das spanische Wort 'perro' bedeutet Hund.");
});

test('parsePseudoToolCalls handles apostrophes in single-quoted strings', () => {
	// German/Spanish output with apostrophes would previously break the brace
	// scan at the first quote, dropping the whole call.
	const text = `speak({ text: 'Das Partizip von 'kochen' ist 'cocinado'' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "Das Partizip von 'kochen' ist 'cocinado'");
});

test('parsePseudoToolCalls handles a trailing apostrophe in single-quoted text', () => {
	const text = `speak({ text: 'l'osso' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.text, "l'osso");
});

test('parsePseudoToolCalls handles the smoke-test reply with apostrophes', () => {
	// A full vocabulary-training reply in one JS-style call.
	const text = `speak({ text: 'Das spanische Wort für das Partizip von 'kochen' ist 'cocinado'. El participio de 'cocinar' es 'cocinado'.' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(
		parsed.calls[0].arguments.text,
		"Das spanische Wort für das Partizip von 'kochen' ist 'cocinado'. El participio de 'cocinar' es 'cocinado'."
	);
});

test('parsePseudoToolCalls keeps the lang field with apostrophes in the text', () => {
	const text = `speak({ lang: 'es', text: 'El participio de 'cocinar' es 'cocinado'' })`;
	const parsed = parsePseudoToolCalls(text);
	assert.equal(parsed.calls.length, 1);
	assert.equal(parsed.calls[0].arguments.lang, 'es');
	assert.equal(parsed.calls[0].arguments.text, "El participio de 'cocinar' es 'cocinado'");
});


// ── scanPseudoToolCalls ───────────────────────────────────

test('scanPseudoToolCalls returns absolute positions for every complete call', () => {
	const input = 'Hello speak({"text":"world","lang":"en"}) pause({"ms":300})';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 2);
	assert.equal(result[0].name, 'speak');
	assert.equal(result[0].args.text, 'world');
	assert.equal(result[0].startIndex, 6);
	assert.ok(result[0].afterIndex > result[0].startIndex);
	assert.equal(result[1].name, 'pause');
	assert.equal(result[1].args.ms, 300);
});

test('scanPseudoToolCalls skips incomplete calls', () => {
	const input = 'speak({"text":"hello"}) speak({"text":"world"';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].args.text, 'hello');
});

test('scanPseudoToolCalls ignores calls with non-object arguments', () => {
	const input = 'speak("plain text") speak({"text":"ok"})';
	const result = scanPseudoToolCalls(input);
	assert.equal(result.length, 1);
	assert.equal(result[0].args.text, 'ok');
});

