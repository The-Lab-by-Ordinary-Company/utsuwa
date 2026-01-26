import { milestoneEvents } from './milestones';
import { randomEvents } from './random';
import { romanticEvents } from './romantic';
import { timeBasedEvents } from './time-based';
import type { EventDefinition } from '$lib/types/events';

// All events combined
export const allEvents: EventDefinition[] = [
	...milestoneEvents,
	...randomEvents,
	...romanticEvents,
	...timeBasedEvents
];
