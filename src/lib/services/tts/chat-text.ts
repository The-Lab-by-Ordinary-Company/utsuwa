import {
	parsePseudoToolCalls,
	parseActionsEnvelope,
	parseXmlSpeakTags,
	parseXmlAttributes,
	findClosingBrace
} from './speech-compiler.ts';

/**
 * Official OmniVoice non-verbal markers (k2-fsa/OmniVoice docs). They are part
 * of the TTS text (rendered as expressive audio) but must never appear in the
 * visible chat bubble.
 */
const NON_VERBAL_MARKERS = [
	'laughter',
	'sigh',
	'confirmation-en',
	'question-en',
	'question-ah',
	'question-oh',
	'question-ei',
	'question-yi',
	'surprise-ah',
	'surprise-oh',
	'surprise-wa',
	'surprise-yo',
	'dissatisfaction-hnn'
];

const NON_VERBAL_RE = new RegExp(`\\[(?:${NON_VERBAL_MARKERS.join('|')})\\]`, 'gi');

// Legacy inline language/gesture markup. We only strip it from the visible
// text; it is never converted into speech segments (speak({...}) is the only
// supported syntax).
const SPEAK_BRACKET_RE = /\[lang:([a-zA-Z\-]{2,8})\]([\s\S]*?)\[\/lang\]/g;
const SPEAK_ANGLE_COLON_RE = /<speak:([a-zA-Z\-]{2,8})>([\s\S]*?)<\/speak>/g;
const SPEAK_ANGLE_EQUALS_RE = /<lang=([a-zA-Z\-]{2,8})>([\s\S]*?)<\/lang>/g;
const SPEAK_ANGLE_CODE_RE = /<lang\s+code=["']([a-zA-Z\-]{2,8})["']>([\s\S]*?)<\/lang>/g;
const GESTURE_ANGLE_COLON_RE = /<gesture:([a-zA-Z\-]+)>/g;
const GESTURE_BRACKET_RE = /\[gesture:([a-zA-Z\-]+)\]/g;

/** Strip non-verbal markers (e.g. [laughter]) from visible text. */
function stripNonVerbalMarkers(text: string): string {
	return text.replace(NON_VERBAL_RE, '');
}

/**
 * Reasoning models (GPT-OSS, DeepSeek-R1 style) occasionally leak their
 * internal monologue into the reply content instead of the reasoning channel.
 * Typical sentences start with planning/self-instruction phrases, are long,
 * and never belong in spoken output. Remove them from the visible text.
 */
const REASONING_SENTENCE_RE =
	/^(User wants:|We need to|So we need to|We should|We have|Should (I|we|probably|give|use|say)|Probably|Thus|Let me|Ensure (each|the)|Might need|Maybe|Perhaps|Given (that|the)|The user (wants|asks|said|says)|I think (the|we|it|I)|I('| a)?ll (just|give|say|use|probably|start)|First,|Second,|Third,|Finally,|This (means|is|would|should)|It('| i)s (a|the|probably|important|better|time|like)|In other words|As a reminder|Make sure|Remember to)/i;

/** Strip reasoning-monologue sentences from the visible chat text. */
export function stripReasoningLeaks(text: string): string {
	const parts = text.split(/(?<=[.!?])\s+/);
	const kept = parts.filter((part) => {
		const trimmed = part.trim();
		// Short fragments are never reasoning; marker-led sentences of any
		// length are internal monologue.
		if (trimmed.length < 25) return true;
		return !REASONING_SENTENCE_RE.test(trimmed);
	});
	return kept.join(' ');
}

/**
 * Diacritics that are characteristic for the supported alternative languages.
 * Used as a lightweight heuristic to tag text sections the model emitted with
 * only closing `</speak>` separators (no opening tag carrying lang).
 */
const ALT_LANG_DIACRITICS: Record<string, RegExp> = {
	es: /[¿¡ñáéíóúü]/i,
	fr: /[çàâäéèêëîïôöûùüœ]/i,
	it: /[àèéìíîòóù]/i,
	pt: /[ãõçáàâéêíóôú]/i,
	de: /[äöüß]/i,
	nl: /[ëïöü]/i,
	pl: /[ąćęłńóśźż]/i,
	tr: /[çğıöşü]/i,
	sv: /[åäö]/i
};

/** True when the text shows clear diacritics of the configured alternative language. */
export function looksLikeAltLanguage(text: string, altLanguage?: string): boolean {
	if (!altLanguage) return false;
	const re = ALT_LANG_DIACRITICS[altLanguage.toLowerCase()];
	if (!re) return false;
	return re.test(text);
}

/**
 * Some models emit section markers as angle brackets around the text
 * (`< Hier ist der Text >`) with empty `< >` separators instead of real XML
 * tags. Strip the brackets; real `<speak ...>` tags (no space after `<`) are
 * left untouched.
 */
export function stripAngleBlocks(text: string): string {
	return text
		.replace(/<\s+([^<>]+?)\s+>/g, '$1')
		.replace(/<\s*>\s*/g, ' ');
}

/** Strip legacy inline language/gesture markup, keeping the inner text. */
export function stripLegacyTags(text: string): string {
	let cleaned = text
		.replace(SPEAK_BRACKET_RE, '$2')
		.replace(SPEAK_ANGLE_COLON_RE, '$2')
		.replace(SPEAK_ANGLE_EQUALS_RE, '$2')
		.replace(SPEAK_ANGLE_CODE_RE, '$2');
	cleaned = cleaned.replace(GESTURE_ANGLE_COLON_RE, '').replace(GESTURE_BRACKET_RE, '');
	return cleaned.replace(/  +/g, ' ').trim();
}

/** Replace complete `{"actions":[...]}` envelopes with their speak texts. */
function inlineActionsSpeakTexts(text: string): string {
	let result = text;
	const openerRe = /\{\s*"actions"\s*:/g;
	let m: RegExpExecArray | null;
	while ((m = openerRe.exec(result)) !== null) {
		const open = m.index;
		const close = findClosingBrace(result, open);
		if (close === null) continue;
		const { calls } = parseActionsEnvelope(result.slice(open, close + 1));
		const inline = calls
			.filter((c) => c.name === 'speak' && typeof c.arguments.text === 'string')
			.map((c) => String(c.arguments.text).trim())
			.filter(Boolean)
			.join(' ');
		result = result.slice(0, open) + inline + result.slice(close + 1);
		openerRe.lastIndex = open + inline.length;
	}
	return result;
}

/** Replace complete XML speech tags (`<speak text="..." />`) with their texts. */
function inlineXmlSpeakTexts(text: string): string {
	let result = text;
	const openRe = /<(speak|gesture|pause)\b/g;
	let m: RegExpExecArray | null;
	while ((m = openRe.exec(result)) !== null) {
		const name = m[1] as 'speak' | 'gesture' | 'pause';
		const gt = result.indexOf('>', m.index + m[0].length);
		if (gt === -1) continue;
		const tagInner = result.slice(m.index + m[0].length, gt);
		const attrs = parseXmlAttributes(tagInner);
		const selfClosing = /\/\s*$/.test(tagInner);
		const hasTextAttr = typeof attrs.text === 'string' && attrs.text.trim().length > 0;
		let tagEnd = gt + 1;
		let inner = '';
		if (!selfClosing && !hasTextAttr && name === 'speak') {
			const close = result.indexOf('</speak>', gt + 1);
			if (close === -1) continue;
			inner = result.slice(gt + 1, close);
			tagEnd = close + '</speak>'.length;
		}
		const inline = name === 'speak' ? (attrs.text ?? inner).replace(/\\"/g, '"') : '';
		result = result.slice(0, m.index) + inline + result.slice(tagEnd);
		openRe.lastIndex = m.index + inline.length;
	}
	// Some models emit only closing </speak> tags as section separators.
	return result.replace(/<\/speak>/g, ' ');
}

/**
 * Remove OmniVoice speech/gesture control markers from visible chat text.
 *
 * - `speak({...})` pseudo-calls: the spoken text is inlined, the syntax removed.
 * - `pause(...)` / `gesture(...)` calls are dropped.
 * - `{"actions":[...]}` JSON envelopes (some models emit them instead of
 *   speak() calls) are replaced by their speak texts.
 * - Legacy inline markup (`[lang:es]...[/lang]`, `<speak:es>...`, ...) is
 *   stripped, keeping the inner text.
 * - Non-verbal markers (`[laughter]`, `[sigh]`, ...) are removed from the
 *   display; they stay in the TTS text because the synthesis needs them.
 */
export function cleanSpeechMarkers(text: string): string {
	const pseudo = parsePseudoToolCalls(text);
	const withEnvelope = inlineActionsSpeakTexts(pseudo.cleanedText);
	const withXml = inlineXmlSpeakTexts(withEnvelope);
	const withLegacy = stripLegacyTags(stripNonVerbalMarkers(withXml));
	return stripReasoningLeaks(stripAngleBlocks(withLegacy));
}

/**
 * Returns true when `text` ends with an incomplete speak/pause/gesture call or
 * an incomplete legacy language tag. Used by the streaming delta cleaner to
 * decide whether it can flush the current chunk or needs to wait for more data.
 *
 * Parentheses and braces are balanced from the last call opener onwards,
 * skipping double-quoted strings, so a ")" or "}" inside the text argument
 * (e.g. `speak({"text":"(hallo"`) does not count as the closing delimiter.
 */
export function hasIncompleteTrailingMarkup(text: string): boolean {
	const trimmed = text.trimEnd();
	// Incomplete call: speak( ... without closing brace/paren
	const callRe = /(speak|pause|gesture)\s*\(/gi;
	let callMatch: RegExpExecArray | null;
	let lastCallStart: number | null = null;
	while ((callMatch = callRe.exec(trimmed)) !== null) {
		lastCallStart = callMatch.index + callMatch[0].length;
	}
	if (lastCallStart !== null) {
		let depth = 1;
		let inString = false;
		for (let i = lastCallStart; i < trimmed.length; i++) {
			const ch = trimmed[i];
			if (ch === '"') inString = !inString;
			else if (!inString && ch === '(') depth++;
			else if (!inString && ch === ')') {
				depth--;
				if (depth === 0) break;
			}
		}
		if (depth > 0) return true;
	}
	// Incomplete <lang ...> opening
	if (/<lang(\s+code=["']?)?$/i.test(trimmed)) return true;
	// Incomplete {"actions":[...] JSON envelope
	if (/\{\s*"actions"\s*:/i.test(trimmed)) {
		let depth = 0;
		for (const ch of trimmed) {
			if (ch === '{') depth++;
			else if (ch === '}') depth--;
		}
		if (depth > 0) return true;
	}
	// Incomplete XML speech tag (<speak text="..." without closing >)
	if (/<(speak|gesture)[a-z]*[^>]*$/.test(trimmed)) return true;
	return false;
}
