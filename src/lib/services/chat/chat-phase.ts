/** What the companion is actually doing while a turn is in flight. */
export type ThinkingPhase = 'remembering' | 'seeing' | 'thinking';

const LABELS: Record<ThinkingPhase, string> = {
	remembering: 'Remembering...',
	seeing: 'Looking at your photo...',
	thinking: 'Thinking...'
};

export function phaseLabel(phase: ThinkingPhase): string {
	return LABELS[phase];
}
