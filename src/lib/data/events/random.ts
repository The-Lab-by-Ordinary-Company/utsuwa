import type { EventDefinition } from '$lib/types/events';

export const randomEvents: EventDefinition[] = [
	// Random deep question
	{
		id: 'random_question_deep',
		name: 'Curious Question',
		type: 'random',
		conditions: [
			{ type: 'min_trust', value: 50 },
			{ type: 'random_chance', value: 0.08 }
		],
		scene: {
			id: 'deep_question_scene',
			dialogue: "I've been wondering... what's something you've never told anyone else?"
		},
		cooldownDays: 5,
		oneTime: false,
		priority: 30
	},

	// Spontaneous compliment
	{
		id: 'random_compliment',
		name: 'Spontaneous Compliment',
		type: 'random',
		conditions: [
			{ type: 'min_affection', value: 200 },
			{ type: 'random_chance', value: 0.1 },
			{ type: 'mood_is', value: 'happy' }
		],
		scene: {
			id: 'compliment_scene',
			dialogue:
				"You know... I was just thinking about how much I enjoy our conversations. You always make me feel better, even when I'm having a rough day."
		},
		stateChanges: { affectionDelta: 5, comfortDelta: 3 },
		cooldownDays: 3,
		oneTime: false,
		priority: 20
	},

	// Random memory
	{
		id: 'random_memory',
		name: 'Fond Memory',
		type: 'random',
		conditions: [
			{ type: 'min_affection', value: 300 },
			{ type: 'total_interactions', value: 30 },
			{ type: 'random_chance', value: 0.07 }
		],
		scene: {
			id: 'memory_scene',
			dialogue:
				"I was just thinking about when we first started talking... we've come such a long way since then, haven't we? It makes me smile."
		},
		stateChanges: { comfortDelta: 5, intimacyDelta: 3 },
		cooldownDays: 7,
		oneTime: false,
		priority: 25
	},

	// Playful tease
	{
		id: 'random_tease',
		name: 'Playful Moment',
		type: 'random',
		conditions: [
			{ type: 'relationship_stage_min', value: 'friend' },
			{ type: 'mood_is', value: 'playful' },
			{ type: 'random_chance', value: 0.12 }
		],
		scene: {
			id: 'tease_scene',
			dialogue:
				"Hey, don't think I haven't noticed how nice you've been to me lately. Are you trying to butter me up? ...Not that I'm complaining~"
		},
		stateChanges: { affectionDelta: 3 },
		cooldownDays: 2,
		oneTime: false,
		priority: 15
	},

	// Curious about you
	{
		id: 'random_curious',
		name: 'Getting to Know You',
		type: 'random',
		conditions: [
			{ type: 'relationship_stage_min', value: 'acquaintance' },
			{ type: 'mood_is', value: 'curious' },
			{ type: 'random_chance', value: 0.1 }
		],
		scene: {
			id: 'curious_scene',
			dialogue:
				"Tell me something about yourself I don't know yet. I feel like there's still so much to learn about you!"
		},
		cooldownDays: 4,
		oneTime: false,
		priority: 25
	},

	// Sharing a thought
	{
		id: 'random_thought',
		name: 'Sharing Thoughts',
		type: 'random',
		conditions: [
			{ type: 'min_trust', value: 40 },
			{ type: 'random_chance', value: 0.06 }
		],
		scene: {
			id: 'thought_scene',
			dialogue:
				"You know what I was thinking about earlier? How different things are now compared to before I met you. Everything feels... lighter, somehow."
		},
		stateChanges: { intimacyDelta: 5, trustDelta: 3 },
		cooldownDays: 6,
		oneTime: false,
		priority: 28
	},

	// Low energy random
	{
		id: 'random_tired',
		name: 'Tired Moment',
		type: 'random',
		conditions: [
			{ type: 'max_energy', value: 30 },
			{ type: 'relationship_stage_min', value: 'friend' },
			{ type: 'random_chance', value: 0.15 }
		],
		scene: {
			id: 'tired_scene',
			dialogue:
				"*yawns* Sorry, I'm a bit tired today... But I'm still happy you're here. Talking to you always makes me feel better, even when I'm exhausted."
		},
		stateChanges: { comfortDelta: 5 },
		cooldownDays: 2,
		oneTime: false,
		priority: 18
	}
];
