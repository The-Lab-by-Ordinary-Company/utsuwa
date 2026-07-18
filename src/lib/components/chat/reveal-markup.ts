/**
 * Wrap every word of a rendered-markdown HTML string in a reveal span so the
 * chat window can stagger-fade words in without breaking inline markup.
 *
 * Only ever fed the output of renderMarkdown (escaped text plus bare
 * strong/em/code tags), so a simple tag/text tokenizer is enough; no DOM
 * parsing and safe to run under node --test.
 */
export function wrapWordsInHtml(html: string): { html: string; wordCount: number } {
	let out = '';
	let wordIndex = 0;

	// Split into tag tokens and text runs; tags pass through untouched
	const tokens = html.split(/(<[^>]+>)/);
	for (const token of tokens) {
		if (token === '') continue;
		if (token.startsWith('<')) {
			out += token;
			continue;
		}
		// Text run: alternate whitespace and word segments, keep whitespace as-is
		for (const segment of token.split(/(\s+)/)) {
			if (segment === '') continue;
			if (/^\s+$/.test(segment)) {
				out += segment;
			} else {
				out += `<span class="reveal-word" style="--word-index:${wordIndex}">${segment}</span>`;
				wordIndex++;
			}
		}
	}

	return { html: out, wordCount: wordIndex };
}
