/**
 * Remove characters that do not contribute to spoken content: emoji, whitespace,
 * and punctuation. Useful for deciding whether a segment contains anything
 * worth synthesising.
 */
export function getSpeakableText(text: string | undefined | null): string {
	if (!text) return '';
	return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\s\p{P}]/gu, '').trim();
}
