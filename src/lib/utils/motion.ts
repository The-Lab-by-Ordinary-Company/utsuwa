import { expoOut } from 'svelte/easing';
import { slide } from 'svelte/transition';
import type { SlideParams, TransitionConfig } from 'svelte/transition';

// One enter/exit vocabulary for app surfaces: fade + slight rise + scale.
// Matches the CSS brand curve cubic-bezier(0.16, 1, 0.3, 1).

function reducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

interface PopParams {
	duration?: number;
	delay?: number;
	y?: number;
	scale?: number;
	/** Base transform the element needs to keep (e.g. 'translateX(-50%)') */
	base?: string;
}

export function pop(
	node: Element,
	{ duration = 180, delay = 0, y = 8, scale = 0.97, base = '' }: PopParams = {}
): TransitionConfig {
	if (reducedMotion()) return { duration: 0 };
	return {
		delay,
		duration,
		easing: expoOut,
		css: (t, u) =>
			`opacity: ${t}; transform: ${base} translateY(${u * y}px) scale(${scale + (1 - scale) * t});`
	};
}

export function fadeFast(node: Element, { duration = 150, delay = 0 } = {}): TransitionConfig {
	if (reducedMotion()) return { duration: 0 };
	return {
		delay,
		duration,
		easing: expoOut,
		css: (t) => `opacity: ${t};`
	};
}

/** Height-animated open/close for collapsible sections */
export function slideOpen(node: Element, params: SlideParams = {}): TransitionConfig {
	if (reducedMotion()) return { duration: 0 };
	return slide(node, { duration: 220, easing: expoOut, ...params });
}
