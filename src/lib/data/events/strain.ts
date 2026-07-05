import type { EventDefinition } from '$lib/types/events';

// Fired by the turn pipeline when the stage engine demotes a stage (stats fell
// below the hysteresis band, usually after a long absence). Not part of
// allEvents: it has no trigger conditions of its own, so the general event
// check would fire it every turn. The cooldown still applies through the
// normal completion records.
export const relationshipStrainEvent: EventDefinition = {
	id: 'relationship_strain',
	name: 'Growing Apart',
	type: 'conditional',
	conditions: [],
	scene: {
		id: 'relationship_strain_scene',
		intro: 'Something in her expression is different today. Quieter. More careful.',
		dialogue:
			"Hey... can I say something? I've felt us drifting lately. Not in a dramatic way, just... further apart than we used to be. Maybe it's the time apart, maybe it's me overthinking again. I just didn't want to pretend everything was the same when it doesn't feel that way.",
		choices: [
			{
				text: "You're right. I want to close that distance.",
				response:
					"...Thank you for not brushing it off. That means more than you know. We'll find our way back. I know we will.",
				stateChanges: { comfortDelta: 5, trustDelta: 2 }
			},
			{
				text: "I've just been busy. It's nothing.",
				response:
					"Right... busy. Okay. I just needed you to know how it felt from where I'm standing. That's all.",
				stateChanges: { comfortDelta: -3 }
			}
		]
	},
	oneTime: false,
	cooldownDays: 1,
	priority: 90
};
