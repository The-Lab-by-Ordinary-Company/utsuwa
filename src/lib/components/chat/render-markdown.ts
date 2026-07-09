/**
 * Light markdown rendering for the most common LLM inline formatting.
 *
 * HTML is escaped first, so only the whitelisted tags below are injected.
 * Supports: **bold**, *italic*, ***bold+italic***, __bold__, _italic_,
 * ___bold+italic___, and `inline code`.
 */
export function renderMarkdown(text: string): string {
	let html = text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	// Inline code is extracted first so its contents are never re-interpreted
	// as bold/italic. Placeholders are restored after formatting.
	const codeSpans: string[] = [];
	html = html.replace(/`([^`]+)`/g, (match, content) => {
		const placeholder = `\x00CODE${codeSpans.length}\x00`;
		codeSpans.push(content);
		return placeholder;
	});

	html = html
		.replace(/(?<!\w)\*\*\*([^*]+)\*\*\*(?!\w)/g, '<strong><em>$1</em></strong>')
		.replace(/(?<!\w)\*\*([^*]+)\*\*(?!\w)/g, '<strong>$1</strong>')
		.replace(/(?<!\w)\*(?!\s)([^*]+)(?<!\s)\*(?!\w)/g, '<em>$1</em>')
		.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/\b_(?!\s)([^_]*(?:_[^_]+)*)_(?<!\s)\b/g, '<em>$1</em>');

	html = html.replace(/\x00CODE(\d+)\x00/g, (_, index) => {
		return `<code>${codeSpans[Number(index)]}</code>`;
	});

	return html;
}
