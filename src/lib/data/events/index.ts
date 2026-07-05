import { milestoneEvents } from './milestones';
import { randomEvents } from './random';
import { romanticEvents } from './romantic';
import { timeBasedEvents } from './time-based';
import type { EventDefinition } from '$lib/types/events';

// Dispatched directly by the turn pipeline on a stage demotion, deliberately
// not part of allEvents (see strain.ts).
export { relationshipStrainEvent } from './strain';

// All events combined
export const allEvents: EventDefinition[] = [
	...milestoneEvents,
	...randomEvents,
	...romanticEvents,
	...timeBasedEvents
];
