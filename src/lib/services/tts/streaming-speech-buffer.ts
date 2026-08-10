import type { SpeechSegment } from '../voice-orchestrator.ts';
import {
	scanPseudoToolCalls,
	parseJsonArgs,
	parseActionsEnvelope,
	parseXmlSpeakTags,
	findLastTagOpener,
	splitLongSegments,
	findClosingBrace,
	type ToolCall
} from './speech-compiler.ts';
import { parseToolCall } from './tool-definitions.ts';
import { stripReasoningLeaks, looksLikeAltLanguage, stripAngleBlocks } from './chat-text.ts';
import { splitIntoSegments, stripSpeechArtifacts, stripForSpeech, hasStateBlockFragment } from '../../utils/sentences.ts';

export interface StreamingSpeechBufferOptions {
	defaultLanguage?: string;
	/** Configured alternative language; plaintext sections with its diacritics are tagged accordingly. */
	altLanguage?: string;
	streaming?: boolean;
	onSegment: (segment: SpeechSegment) => void;
}

/** Word cap for merging adjacent same-language segments (mirrors the compiler). */
const MAX_MERGE_WORDS = 15;

function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Offset just past the last complete `{"actions":[...]}` envelope in `text`. */
function findEnvelopeEnd(text: string): number {
	const openerRe = /\{\s*"actions"\s*:/g;
	let end = 0;
	let m: RegExpExecArray | null;
	while ((m = openerRe.exec(text)) !== null) {
		const close = findClosingBrace(text, m.index);
		if (close !== null) end = close + 1;
	}
	return end;
}

/** True when the last `{"actions"` opener has no matching closing brace yet. */
function hasIncompleteActionsEnvelope(text: string): boolean {
	const openerRe = /\{\s*"actions"\s*:/g;
	let lastOpen = -1;
	let m: RegExpExecArray | null;
	while ((m = openerRe.exec(text)) !== null) lastOpen = m.index;
	if (lastOpen === -1) return false;
	return findClosingBrace(text, lastOpen) === null;
}

/** True when the text ends inside an unfinished `<speak`/`<gesture` tag. */
function hasIncompleteXmlTag(text: string): boolean {
	const trimmed = text.trimEnd();
	const lastOpen = findLastTagOpener(trimmed);
	if (!lastOpen) return false;
	// Incomplete when the tag has no closing '>' yet, or an open <speak> has
	// no text attribute and no matching </speak>.
	const gt = trimmed.indexOf('>', lastOpen.index);
	if (gt === -1) return true;
	const tagInner = trimmed.slice(lastOpen.index + lastOpen.tag.length, gt);
	// Angle-bracket sections like "< Hier ist der Text >" are NOT tags: only
	// real tag names (speak/gesture/pause prefixes) count as markup.
	if (!/^(spea?k|ges|pau)/i.test(tagInner.trimStart())) return false;
	const selfClosing = /\/\s*$/.test(tagInner);
	if (selfClosing) return false;
	// <speak text="..." without `/>` is complete: the text sits in the attribute.
	const hasTextAttr = /(?:^|\s)text\s*=\s*["']/.test(tagInner);
	if (hasTextAttr) return false;
	if (trimmed.slice(lastOpen.index).startsWith('<gesture')) return false;
	return trimmed.indexOf('</speak>', gt + 1) === -1;
}

/**
 * Buffers streaming LLM text and emits SpeechSegments as soon as complete
 * sentences are available. A flush timer ensures trailing text without a
 * sentence terminator is still emitted after a short timeout.
 *
 * For OmniVoice the buffer also recognises language-marked tool calls of the
 * form `speak({"text":"...","lang":"xx"})`. Complete calls are emitted
 * immediately; incomplete call syntax suppresses the plaintext flush timer so
 * raw syntax is never spoken.
 */
export class StreamingSpeechBuffer {
	private buffer = '';
	private emittedLength = 0;
	// Tracks depth of curly braces so JSON state-update blocks that span
	// multiple streaming chunks are held back from TTS until fully received.
	private jsonDepth = 0;
	private flushTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly FLUSH_TIMEOUT_MS = 1500;
	private readonly options: StreamingSpeechBufferOptions;

	constructor(options: StreamingSpeechBufferOptions) {
		this.options = options;
	}

	feed(chunk: string): void {
		// Track curly-brace depth across chunks so we never emit text that is
		// inside an open JSON state-update block.
		for (const ch of chunk) {
			if (ch === '{') this.jsonDepth++;
			else if (ch === '}') this.jsonDepth--;
		}
		this.buffer += chunk;

		// Markup mode takes precedence: once we see speak(/pause(/gesture(
		// calls we only emit complete markup and never fall back to sentence-based
		// plaintext emission, which would speak raw syntax.
		if (this.tryEmitLanguageCalls()) {
			this.compact();
			this.clearFlushTimer();
			return;
		}

		this.tryEmit();
		this.compact();
		this.armFlushTimer();
	}

	flush(): void {
		this.tryEmitLanguageCalls();
		let remaining = this.buffer.slice(this.emittedLength).trim();

		// Remove any complete actions envelopes left over (e.g. empty ones with
		// no speak actions) so their JSON is never spoken.
		remaining = parseActionsEnvelope(remaining).cleanedText;

		// Only speak remaining plaintext if it does not contain raw or incomplete
		// markup syntax. Anything that looks like a call or tag has already been
		// handled; leftover fragments are discarded.
		if (remaining && !this.hasIncompleteMarkup(remaining)) {
			const { cleaned } = stripForSpeech(remaining);
			for (const seg of this.tagAltLanguage(
				splitIntoSegments(
					stripAngleBlocks(stripReasoningLeaks(cleaned.trim().replace(/<\/speak>/g, ' '))),
					this.options.defaultLanguage
				)
			)) {
				// State-block fragments (e.g. a JSON block the model wrote
				// without outer braces) must never be spoken.
				if (hasStateBlockFragment(seg.text)) continue;
				this.options.onSegment(seg);
			}
		}

		// Only mark the whole buffer as processed when no incomplete markup
		// remains. If raw syntax is left, later chunks may complete it; at
		// end-of-stream the buffer is discarded anyway.
		if (!this.hasIncompleteMarkup(this.buffer.slice(this.emittedLength))) {
			this.emittedLength = this.buffer.length;
		}

		this.jsonDepth = 0;
		this.clearFlushTimer();
	}

	reset(): void {
		this.buffer = '';
		this.emittedLength = 0;
		this.jsonDepth = 0;
		this.clearFlushTimer();
	}

	/**
	 * Trim the already-processed prefix from the buffer. This keeps the buffer
	 * size bounded during long OmniVoice streams, so parsePseudoToolCalls() does
	 * not re-scan text that has already been emitted.
	 */
	private compact(): void {
		if (this.emittedLength <= 0) return;
		this.buffer = this.buffer.slice(this.emittedLength);
		this.emittedLength = 0;
	}

	private tryEmit(): void {
		this.clearFlushTimer();

		let unprocessed = this.buffer.slice(this.emittedLength);
		while (unprocessed.length > 0) {
			const before = this.emittedLength;
			this.tryEmitBlock(unprocessed);
			if (this.emittedLength === before) break; // no sentence boundary found
			unprocessed = this.buffer.slice(this.emittedLength);
		}

		if (this.emittedLength < this.buffer.length) {
			this.armFlushTimer();
		}
	}

	private armFlushTimer(): void {
		if (this.flushTimer) return;
		this.flushTimer = setTimeout(() => {
			this.flushTimer = null;
			this.flush();
		}, this.FLUSH_TIMEOUT_MS);
	}

	private clearFlushTimer(): void {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
	}

	private emit(block: string): void {
		const { cleaned } = stripForSpeech(block);
		for (const seg of this.tagAltLanguage(splitIntoSegments(
			stripAngleBlocks(stripReasoningLeaks(cleaned.replace(/<\/speak>/g, ' '))),
			this.options.defaultLanguage
		))) {
			// State-block fragments must never be spoken, even when they reach
			// the plaintext path with a sentence boundary.
			if (hasStateBlockFragment(seg.text)) continue;
			this.options.onSegment(seg);
		}
	}

	/** Tag plaintext segments whose diacritics match the alternative language. */
	private tagAltLanguage(segments: SpeechSegment[]): SpeechSegment[] {
		const alt = this.options.altLanguage;
		if (!alt) return segments;
		return segments.map((seg) =>
			looksLikeAltLanguage(seg.text, alt) ? { ...seg, language: alt } : seg
		);
	}

	private tryEmitBlock(text: string): void {
		// While we are inside an open JSON state-update block, do not emit anything
		// that follows the opening brace. Content before the brace is still safe to
		// emit (e.g. a completed sentence before a state-update block starts).
		if (this.jsonDepth > 0) {
			const braceIndex = text.indexOf('{');
			if (braceIndex <= 0) return;
			text = text.slice(0, braceIndex);
		}

		// Strip any completed JSON state-update block(s) from the current tail.
		// Use the non-trimming variant so trailing whitespace is preserved for the
		// next streaming chunk. Angle-bracket sections (< Text >) are unwrapped
		// here, before sentence splitting would cut them apart.
		let { cleaned } = stripSpeechArtifacts(text);
		cleaned = stripAngleBlocks(cleaned);
		if (cleaned !== text) {
			this.buffer = this.buffer.slice(0, this.emittedLength) + cleaned;
			text = cleaned;
		}

		const paraBreak = text.indexOf('\n\n');
		if (paraBreak > 0) {
			const block = text.slice(0, paraBreak);
			if (block.trim()) {
				this.emit(block);
				this.emittedLength += paraBreak + 2;
			}
			return;
		}

		const singleBreak = text.indexOf('\n');
		if (singleBreak > 0) {
			const block = text.slice(0, singleBreak);
			if (block.trim()) {
				this.emit(block);
				this.emittedLength += singleBreak + 1;
			}
			return;
		}

		// Emit up to the first sentence boundary so TTS can start immediately.
		const sentenceEnd = /([.!?…。！？])\s*/;
		const m = sentenceEnd.exec(text);
		if (!m) return;

		const firstEnd = m.index + m[0].length;
		const block = text.slice(0, firstEnd);
		if (block.trim()) {
			this.emit(block);
			this.emittedLength += firstEnd;
		}
	}

	/**
	 * Scans the unprocessed buffer for complete OmniVoice-style tool calls
	 * (`speak(...)`, `pause(...)`, `gesture(...)`). Emits each complete speak
	 * call as a SpeechSegment, emits plaintext that precedes a complete call,
	 * and advances `emittedLength` past consumed content.
	 *
	 * Returns `true` when the buffer is in tool-call mode, i.e. when at least
	 * one complete call was emitted or an incomplete call opening remains. In
	 * that mode the caller must not fall back to plaintext sentence emission.
	 */
	private tryEmitLanguageCalls(): boolean {
		const unprocessed = this.buffer.slice(this.emittedLength);
		const scanned = scanPseudoToolCalls(unprocessed);

		// Segments are collected per group: plaintext blocks and individual
		// speak() calls each form a group. Parts of a long call are never merged
		// with each other (the split exists so the first sentence starts early),
		// but adjacent groups with the same language are merged when the combined
		// text stays small, so isolated short words are synthesised as longer,
		// more stable input.
		const groups: SpeechSegment[][] = [];

		let consumed = 0;
		for (const call of scanned) {
			const before = unprocessed.slice(consumed, call.startIndex).trim();
			if (before) {
				groups.push(this.segmentsFromPlaintext(before));
			}
			if (call.name === 'speak') {
				groups.push(this.segmentsFromToolCall(call.rawArgsStr));
			}
			consumed = call.afterIndex;
		}

		// Some models emit a {"actions":[{"function":"speak","args":{...}}]}
		// JSON envelope instead of speak() pseudo-calls. Parse complete
		// envelopes; an incomplete envelope holds the buffer in markup mode so
		// the raw JSON is never spoken.
		let markupEnd = consumed;
		let envelopeIncomplete = false;
		const envelope = parseActionsEnvelope(unprocessed.slice(consumed));
		if (envelope.calls.length > 0) {
			// Prose around the envelope is spoken as plaintext segments; the
			// envelope's speak actions follow as their own groups.
			const prose = envelope.cleanedText;
			if (prose.trim()) {
				groups.push(this.segmentsFromPlaintext(prose));
			}
			for (const call of envelope.calls) {
				const validated = parseToolCall(call);
				if (validated) {
					groups.push(this.segmentsFromParsedToolCall(validated));
				}
			}
			// Re-scan for the envelope's end offset in the buffer so prose that
			// follows the envelope is left for the next pass.
			const envelopeEnd = findEnvelopeEnd(unprocessed.slice(consumed));
			markupEnd = consumed + envelopeEnd;
		} else if (hasIncompleteActionsEnvelope(unprocessed.slice(consumed))) {
			envelopeIncomplete = true;
		}

		// Some models emit XML-style tags (<speak text="..." lang="es" />,
		// <gesture type="smile" />) instead of speak() pseudo-calls. Parse
		// complete tags; an incomplete tag holds the buffer in markup mode so
		// the raw XML is never spoken.
		let xmlIncomplete = false;
		const xml = parseXmlSpeakTags(unprocessed.slice(markupEnd));
		if (xml.calls.length > 0) {
			const prose = xml.cleanedText;
			if (prose.trim()) {
				groups.push(this.segmentsFromPlaintext(prose));
			}
			for (const call of xml.calls) {
				const validated = parseToolCall(call);
				if (validated) {
					groups.push(this.segmentsFromParsedToolCall(validated));
				}
			}
			markupEnd = markupEnd + xml.endOffset;
		} else if (xml.incomplete || hasIncompleteXmlTag(unprocessed.slice(markupEnd))) {
			xmlIncomplete = true;
		}

		this.emittedLength += markupEnd;
		this.emitMergedGroups(groups);

		const remaining = this.buffer.slice(this.emittedLength);
		const hasIncompletePattern =
			/(?:speak|pause|gesture)\s*\(/.test(remaining) ||
			hasIncompleteActionsEnvelope(remaining) ||
			hasIncompleteXmlTag(remaining);

		return (
			scanned.length > 0 ||
			markupEnd > consumed ||
			envelopeIncomplete ||
			xmlIncomplete ||
			hasIncompletePattern
		);
	}

	/** Split plaintext into sentence segments with the default language. */
	private segmentsFromPlaintext(block: string): SpeechSegment[] {
		const { cleaned } = stripForSpeech(block);
		return this.tagAltLanguage(
			splitIntoSegments(
				stripAngleBlocks(stripReasoningLeaks(cleaned.replace(/<\/speak>/g, ' '))),
				this.options.defaultLanguage
			)
		).filter((seg) => !hasStateBlockFragment(seg.text));
	}

	/** Parse a complete speak() call into one or more segments. */
	private segmentsFromToolCall(argsStr: string): SpeechSegment[] {
		const args = parseJsonArgs(argsStr);
		const parsed = parseToolCall({ name: 'speak', arguments: args });
		if (!parsed || parsed.name !== 'speak') return [];
		return this.segmentsFromParsedToolCall(parsed);
	}

	/**
	 * Convert a validated speak() tool call into one or more segments. Long
	 * calls are split at sentence boundaries so the first sentence can be
	 * synthesised immediately.
	 */
	private segmentsFromParsedToolCall(parsed: ToolCall): SpeechSegment[] {
		if (parsed.name !== 'speak') return [];
		const { text: rawText, lang } = parsed.arguments as { text?: string; lang?: string };
		const text = (rawText ?? '').trim();
		if (!text) return [];
		const language = lang || this.options.defaultLanguage || 'de';

		const split = splitLongSegments([{ name: 'speak', arguments: { text, lang: language } }]);
		return split
			.map((call) => ({ text: String(call.arguments.text ?? '').trim(), language }))
			.filter((seg) => seg.text.length > 0);
	}

	/**
	 * Emit all segments of one emission pass. Adjacent groups (plaintext blocks
	 * and speak() calls) with the same language are merged at their boundary up
	 * to MAX_MERGE_WORDS; segments within a group are never merged.
	 */
	private emitMergedGroups(groups: SpeechSegment[][]): void {
		const out: SpeechSegment[] = [];
		for (const group of groups) {
			if (group.length === 0) continue;

			let first: SpeechSegment | null = group[0];
			const prev = out.length > 0 ? out[out.length - 1] : null;
			if (prev && prev.language === first.language) {
				const combined = prev.text + ' ' + first.text;
				if (wordCount(combined) <= MAX_MERGE_WORDS) {
					out[out.length - 1] = { ...prev, text: combined.trim() };
					first = null;
				}
			}
			if (first) out.push(first);
			for (let i = 1; i < group.length; i++) out.push(group[i]);
		}
		for (const seg of out) this.options.onSegment(seg);
	}

	private hasIncompleteMarkup(text: string): boolean {
		return (
			/(?:speak|pause|gesture)\s*\(/.test(text) ||
			hasIncompleteActionsEnvelope(text) ||
			hasIncompleteXmlTag(text)
		);
	}
}
