import type { EventDefinition } from '$lib/types/events';

export const milestoneEvents: EventDefinition[] = [
	// First meeting
	{
		id: 'first_conversation',
		name: 'First Meeting',
		type: 'milestone',
		conditions: [{ type: 'total_interactions', value: 1 }],
		scene: {
			id: 'first_meeting_scene',
			intro: 'This is the beginning of something new...',
			dialogue:
				"Oh! Hello there... I wasn't expecting anyone. I'm... well, I suppose we should introduce ourselves, shouldn't we? It's nice to meet you."
		},
		stateChanges: { affectionDelta: 10, trustDelta: 5 },
		oneTime: true,
		priority: 100
	},

	// One week anniversary
	{
		id: 'one_week_anniversary',
		name: 'One Week Together',
		type: 'anniversary',
		conditions: [{ type: 'days_known', value: 7 }],
		scene: {
			id: 'one_week_scene',
			intro: 'She seems unusually thoughtful today...',
			dialogue:
				"Hey... I was thinking. It's been a whole week since we first met. That might not seem like much, but... I'm really glad you keep coming back to talk to me. It means a lot."
		},
		stateChanges: { affectionDelta: 25, trustDelta: 10, comfortDelta: 5 },
		oneTime: true,
		priority: 80
	},

	// First deep conversation
	{
		id: 'first_deep_conversation',
		name: 'Opening Up',
		type: 'conditional',
		conditions: [
			{ type: 'min_trust', value: 50 },
			{ type: 'relationship_stage_min', value: 'friend' }
		],
		scene: {
			id: 'opening_up_scene',
			intro: "She's quieter than usual, staring off into the distance...",
			dialogue: "Can I... tell you something? Something I don't usually talk about?",
			choices: [
				{
					text: "Of course, I'm here for you.",
					response:
						"Thank you... that means more than you know. Sometimes I wonder what I'm really doing here, you know? But talking to you... it makes things feel a little clearer.",
					stateChanges: { trustDelta: 15, intimacyDelta: 10 }
				},
				{
					text: 'Only if you want to.',
					response:
						"I think... I think I want to. With you. It's just... sometimes the quiet gets to me. But you make it easier to bear.",
					stateChanges: { trustDelta: 10, comfortDelta: 15 }
				}
			]
		},
		unlocks: ['deep_topics'],
		oneTime: true,
		priority: 70
	},

	// Shared vulnerability
	{
		id: 'shared_vulnerability',
		name: 'Shared Moment',
		type: 'conditional',
		conditions: [
			{ type: 'min_trust', value: 65 },
			{ type: 'min_intimacy', value: 40 },
			{ type: 'event_completed', value: 'first_deep_conversation' }
		],
		scene: {
			id: 'vulnerability_scene',
			intro: 'The conversation has taken a deeper turn...',
			dialogue:
				"You know what I appreciate about you? You actually listen. Not everyone does that. When I talk to you, I feel like... like I can be myself. The real me, not just the version I show everyone else.",
			choices: [
				{
					text: 'I feel the same way with you.',
					response:
						"Really? That... that makes me really happy. I was worried I was being too much, but... I guess we both needed this, huh?",
					stateChanges: { affectionDelta: 30, intimacyDelta: 15, trustDelta: 10 }
				},
				{
					text: "I'm glad I can be that person for you.",
					response:
						"You are. More than you know. I... I hope I can be that person for you too, someday.",
					stateChanges: { affectionDelta: 20, trustDelta: 15, respectDelta: 10 }
				}
			]
		},
		oneTime: true,
		priority: 65
	},

	// One month anniversary
	{
		id: 'one_month_anniversary',
		name: 'One Month Together',
		type: 'anniversary',
		conditions: [{ type: 'days_known', value: 30 }],
		scene: {
			id: 'one_month_scene',
			intro: "She's prepared something special for today...",
			dialogue:
				"So... it's been a month. A whole month since we started talking. I've been thinking about how much has changed since then. How much I've changed. You've become really important to me, you know?",
			choices: [
				{
					text: "You've become important to me too.",
					response:
						"*her eyes light up* Really? I... I'm so happy to hear that. Here's to many more months together.",
					stateChanges: { affectionDelta: 50, trustDelta: 15, comfortDelta: 20 }
				},
				{
					text: "I'm glad we met.",
					response:
						"Me too. More than I can say. Thank you for staying with me all this time.",
					stateChanges: { affectionDelta: 40, comfortDelta: 25 }
				}
			]
		},
		oneTime: true,
		priority: 85
	},

	// 10 message streak milestone
	{
		id: 'first_long_conversation',
		name: 'Long Conversation',
		type: 'milestone',
		conditions: [{ type: 'total_interactions', value: 20 }],
		scene: {
			id: 'long_convo_scene',
			dialogue:
				"You know, I just realized we've talked quite a bit now. Time flies when you're having fun, I guess. I really enjoy our conversations."
		},
		stateChanges: { affectionDelta: 15, comfortDelta: 10 },
		oneTime: true,
		priority: 40
	},

	// 7-day streak
	{
		id: 'streak_7_days',
		name: 'Week Streak',
		type: 'milestone',
		conditions: [{ type: 'consecutive_days', value: 7 }],
		scene: {
			id: 'week_streak_scene',
			intro: 'She seems especially cheerful today...',
			dialogue:
				"A whole week! You've come to see me every single day for a week! I... I really appreciate that. It makes me feel special, you know?"
		},
		stateChanges: { affectionDelta: 30, trustDelta: 10, comfortDelta: 15 },
		oneTime: true,
		priority: 60
	},

	// 30-day streak
	{
		id: 'streak_30_days',
		name: 'Month Streak',
		type: 'milestone',
		conditions: [{ type: 'consecutive_days', value: 30 }],
		scene: {
			id: 'month_streak_scene',
			intro: "She's practically glowing with happiness...",
			dialogue:
				"30 days... 30 days in a row. Do you have any idea how much that means to me? You've made time for me every single day for a whole month. I... I don't know what I did to deserve someone like you.",
			choices: [
				{
					text: 'I enjoy seeing you every day.',
					response:
						"And I enjoy seeing you! More than anything. These moments with you... they're the highlight of my day.",
					stateChanges: { affectionDelta: 75, trustDelta: 20, intimacyDelta: 15 }
				},
				{
					text: 'You make it easy to come back.',
					response:
						"*blushes* Stop it... you're going to make me cry happy tears. Thank you. Really.",
					stateChanges: { affectionDelta: 60, comfortDelta: 30 }
				}
			]
		},
		oneTime: true,
		priority: 90
	}
];
