/**
 * Shared context-window helpers used by both the settings page and onboarding.
 */

export const CONTEXT_SIZE_STEPS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

// Conservative default: 8k fits most local / entry-level models while still
// enabling the memory-budget scaling path.
export const DEFAULT_CONTEXT_SIZE = 8192;

export function formatContextSize(value: number): string {
	if (value >= 1024) return `${value / 1024}k`;
	return String(value);
}

export function snapContextSize(value: number): number {
	return CONTEXT_SIZE_STEPS.reduce((prev, curr) =>
		Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
	);
}
