// Bound the longest edge so we never ship an enormous base64 image to the
// model. 1568px is Anthropic's recommended vision max and plenty for the others.
export const MAX_EDGE_PX = 1568;

/** Scale dimensions so the longest edge fits maxEdge, preserving aspect ratio. */
export function computeScaledDimensions(w: number, h: number, maxEdge = MAX_EDGE_PX) {
	const longest = Math.max(w, h);
	if (longest <= maxEdge) return { width: w, height: h };
	const scale = maxEdge / longest;
	return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
