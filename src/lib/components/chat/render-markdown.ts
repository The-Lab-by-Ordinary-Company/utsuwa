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

	html = html
		.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/\b_(?!\s)([^_]*(?:_[^_]+)*)_(?<!\s)\b/g, '<em>$1</em>');

	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

	return html;
}
