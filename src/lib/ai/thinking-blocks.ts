/**
 * Removes reasoning blocks (<thinking>, <think>) so they never reach
 * speech or the chat. Stream-safe: a block that is still open (no closing
 * tag yet) is cut from its opener on, so partial reasoning never gets
 * spoken; a stray closing tag keeps only the text after it.
 *
 * Lives in ai/ (not services/tts) because it is a property of the model
 * response format, not of speech synthesis.
 */
export function stripThinkingBlocks(text: string): string {
	let out = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');
	const openers = [...out.matchAll(/<think(?:ing)?>/gi)];
	if (openers.length) {
		out = out.slice(0, openers[openers.length - 1].index);
	}
	const close = out.match(/<\/think(?:ing)?>/i);
	if (close && close.index !== undefined) {
		out = out.slice(close.index + close[0].length);
	}
	return out;
}
