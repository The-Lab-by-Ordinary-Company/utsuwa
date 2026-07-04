// Turns raw provider failures into short, readable messages. A misconfigured
// base URL usually points at a website, so the failure body is a full HTML
// page — never show that to the user.

const HTML_MARKERS = ['<!doctype', '<html', '<head>', '<body'];
const MAX_ERROR_LENGTH = 240;

export function looksLikeHtml(text: string | null | undefined): boolean {
	if (!text) return false;
	const head = text.slice(0, 500).trim().toLowerCase();
	return HTML_MARKERS.some((marker) => head.includes(marker));
}

export function htmlEndpointError(baseURL?: string): string {
	const at = baseURL ? ` at ${baseURL}` : '';
	return `The endpoint${at} returned a web page instead of an API response. Double-check the base URL (for OpenAI it's https://api.openai.com/v1/).`;
}

/** Collapse HTML dumps and cap length so an error can't flood the UI. */
export function sanitizeProviderError(message: string, baseURL?: string): string {
	if (looksLikeHtml(message)) return htmlEndpointError(baseURL);
	if (message.length > MAX_ERROR_LENGTH) return `${message.slice(0, MAX_ERROR_LENGTH)}…`;
	return message;
}
