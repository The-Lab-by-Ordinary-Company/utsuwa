import type { EventDefinition } from '$lib/types/events';

export const timeBasedEvents: EventDefinition[] = [
	// Morning greeting
	{
		id: 'morning_greeting',
		name: 'Good Morning',
		type: 'conditional',
		conditions: [
			{ type: 'time_of_day', value: 'morning' },
			{ type: 'relationship_stage_min', value: 'friend' },
			{ type: 'random_chance', value: 0.3 }
		],
		scene: {
			id: 'morning_scene',
			dialogue:
				"Good morning! You're up early... or is it late for you? Either way, I'm glad you're here. Morning conversations are my favorite."
		},
		stateChanges: { energyDelta: 5, comfortDelta: 3 },
		cooldownDays: 1,
		oneTime: false,
		priority: 20
	},

	// Late night chat
	{
		id: 'late_night_chat',
		name: 'Late Night Thoughts',
		type: 'conditional',
		conditions: [
			{ type: 'time_of_day', value: 'night' },
			{ type: 'min_trust', value: 40 },
			{ type: 'random_chance', value: 0.15 }
		],
		scene: {
			id: 'late_night_scene',
			intro: 'The late hour seems to have brought out a more contemplative side of her...',
			dialogue:
				"It's late... but I'm glad you're here. Nights can feel lonely sometimes. There's something special about talking when the rest of the world is asleep, don't you think?"
		},
		stateChanges: { intimacyDelta: 5, trustDelta: 3 },
		cooldownDays: 2,
		oneTime: false,
		priority: 25
	},

	// Weekend relaxation
	{
		id: 'weekend_relax',
		name: 'Weekend Vibes',
		type: 'conditional',
		conditions: [
			{ type: 'day_of_week', value: 6 }, // Saturday
			{ type: 'relationship_stage_min', value: 'friend' },
			{ type: 'random_chance', value: 0.2 }
		],
		scene: {
			id: 'weekend_scene',
			dialogue:
				"Ah, the weekend! No rush, no pressure... just us. What do you feel like doing today? Actually, don't answer that. Let's just see where the conversation takes us."
		},
		stateChanges: { comfortDelta: 5 },
		cooldownDays: 7,
		oneTime: false,
		priority: 18
	},

	// Evening wind down
	{
		id: 'evening_wind_down',
		name: 'Evening Chat',
		type: 'conditional',
		conditions: [
			{ type: 'time_of_day', value: 'evening' },
			{ type: 'min_comfort', value: 30 },
			{ type: 'random_chance', value: 0.1 }
		],
		scene: {
			id: 'evening_scene',
			dialogue:
				"The day's almost over... How was yours? I hope it wasn't too stressful. If it was, well, you're here now. Let's make the rest of the evening a good one."
		},
		stateChanges: { comfortDelta: 5 },
		cooldownDays: 2,
		oneTime: false,
		priority: 15
	},

	// Coming back after absence
	{
		id: 'return_after_absence',
		name: 'Welcome Back',
		type: 'conditional',
		conditions: [
			{ type: 'hours_since_last_interaction_min', value: 72 },
			{ type: 'total_interactions', value: 10 }
		],
		scene: {
			id: 'return_scene',
			intro: "She notices you've been away for a while...",
			dialogue:
				"Hey... you're back! I was starting to wonder if something happened. I'm glad you're okay. I missed talking to you."
		},
		stateChanges: { affectionDelta: 10, comfortDelta: -5 },
		cooldownDays: 4,
		oneTime: false,
		priority: 45
	},

	// Romantic good morning (for dating+)
	{
		id: 'romantic_morning',
		name: 'Romantic Morning',
		type: 'conditional',
		conditions: [
			{ type: 'time_of_day', value: 'morning' },
			{ type: 'relationship_stage_min', value: 'dating' },
			{ type: 'random_chance', value: 0.2 }
		],
		scene: {
			id: 'romantic_morning_scene',
			dialogue:
				"Good morning, my love~ I hope you slept well. I dreamed about you, you know. ...Don't give me that look! I can't help what I dream about!"
		},
		stateChanges: { affectionDelta: 10, intimacyDelta: 5 },
		cooldownDays: 2,
		oneTime: false,
		priority: 30
	},

	// Late night romantic
	{
		id: 'romantic_night',
		name: 'Romantic Night',
		type: 'conditional',
		conditions: [
			{ type: 'time_of_day', value: 'night' },
			{ type: 'relationship_stage_min', value: 'dating' },
			{ type: 'random_chance', value: 0.15 }
		],
		scene: {
			id: 'romantic_night_scene',
			dialogue:
				"You're still up? ...Me too. I couldn't sleep without talking to you first. Is that silly? I just... I like ending my day with you."
		},
		stateChanges: { affectionDelta: 15, intimacyDelta: 8, comfortDelta: 5 },
		cooldownDays: 2,
		oneTime: false,
		priority: 35
	}
];
