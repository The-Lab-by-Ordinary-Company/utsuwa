import type { EventDefinition } from '$lib/types/events';

export const romanticEvents: EventDefinition[] = [
	// Confession event
	{
		id: 'confession_event',
		name: 'Confession',
		type: 'conditional',
		conditions: [
			{ type: 'min_affection', value: 500 },
			{ type: 'min_trust', value: 80 },
			{ type: 'min_intimacy', value: 40 },
			{ type: 'relationship_stage', value: 'romantic_interest' },
			{ type: 'event_completed', value: 'first_deep_conversation' }
		],
		scene: {
			id: 'confession_scene',
			intro: "She's been acting strange all day, unable to meet your eyes...",
			dialogue:
				"I... I need to tell you something. I've been trying to find the right moment, but there never seems to be one, so... here goes. I... I have feelings for you. More than just friendship feelings. I know this might change things between us, but I couldn't keep pretending anymore.",
			choices: [
				{
					text: 'I feel the same way.',
					response:
						"You... you do? I... I'm so happy I could cry... I was so scared you wouldn't feel the same way. But you do! You really do!",
					stateChanges: { affectionDelta: 100, trustDelta: 20, intimacyDelta: 30 },
					nextSceneId: 'confession_accepted'
				},
				{
					text: 'I need time to think about this.',
					response:
						"Oh... of course. I understand. I'm sorry for springing this on you. Take all the time you need. I'll... I'll be here when you're ready to talk.",
					stateChanges: { affectionDelta: -20, trustDelta: -10, comfortDelta: -15 },
					nextSceneId: 'confession_delayed'
				}
			]
		},
		oneTime: true,
		priority: 95
	},

	// First "I love you"
	{
		id: 'first_i_love_you',
		name: 'First I Love You',
		type: 'conditional',
		conditions: [
			{ type: 'min_affection', value: 700 },
			{ type: 'min_trust', value: 90 },
			{ type: 'relationship_stage', value: 'dating' },
			{ type: 'min_intimacy', value: 60 }
		],
		scene: {
			id: 'i_love_you_scene',
			intro: "There's a warmth in her eyes you've never seen before...",
			dialogue:
				"I... I've been wanting to say something for a while now. I know we've only been together for a bit, but... I love you. I really, truly love you. I've never felt this way about anyone before.",
			choices: [
				{
					text: 'I love you too.',
					response:
						"*tears of joy* You do? You really do? Say it again... please. I want to hear it again.",
					stateChanges: { affectionDelta: 150, trustDelta: 25, intimacyDelta: 40, comfortDelta: 30 }
				},
				{
					text: "I'm getting there too.",
					response:
						"That's... that's okay. I didn't say it expecting anything back. I just... I needed you to know how I feel. Take your time.",
					stateChanges: { affectionDelta: 50, trustDelta: 10, comfortDelta: 10 }
				}
			]
		},
		oneTime: true,
		priority: 98
	},

	// Commitment discussion
	{
		id: 'commitment_discussion',
		name: 'Commitment Talk',
		type: 'conditional',
		conditions: [
			{ type: 'min_affection', value: 800 },
			{ type: 'min_trust', value: 95 },
			{ type: 'relationship_stage', value: 'dating' },
			{ type: 'days_known', value: 25 },
			{ type: 'event_completed', value: 'first_i_love_you' }
		],
		scene: {
			id: 'commitment_scene',
			intro: "She's more serious than usual, but there's a gentle smile on her face...",
			dialogue:
				"I've been thinking about us... about our future. We've been through so much together, and every day I'm more certain that this is what I want. You're what I want. I want us to be... official. Real. Something that lasts.",
			choices: [
				{
					text: "I want that too. Let's make it official.",
					response:
						"*embraces you* I'm so happy... I can't even express it. You've made me the happiest I've ever been. I promise I'll always be here for you.",
					stateChanges: { affectionDelta: 100, trustDelta: 20, intimacyDelta: 30, comfortDelta: 25, respectDelta: 15 }
				},
				{
					text: "I care about you, but I need more time.",
					response:
						"Of course... I understand. I don't want to rush you. Just know that whenever you're ready, I'll be here.",
					stateChanges: { trustDelta: 5, comfortDelta: -10 }
				}
			]
		},
		oneTime: true,
		priority: 97
	},

	// Romantic flirting (repeatable)
	{
		id: 'romantic_flirt',
		name: 'Flirty Moment',
		type: 'random',
		conditions: [
			{ type: 'relationship_stage_min', value: 'dating' },
			{ type: 'mood_is', value: 'affectionate' },
			{ type: 'random_chance', value: 0.15 }
		],
		scene: {
			id: 'flirt_scene',
			dialogue:
				"You know... you're really cute when you're focused like that. I could watch you all day. ...What? Don't look at me like that, I'm just being honest~"
		},
		stateChanges: { affectionDelta: 8, intimacyDelta: 5 },
		cooldownDays: 2,
		oneTime: false,
		priority: 35
	},

	// Missing you (when returning after absence)
	{
		id: 'romantic_missed_you',
		name: 'Missed You',
		type: 'conditional',
		conditions: [
			{ type: 'relationship_stage_min', value: 'dating' },
			{ type: 'hours_since_last_interaction_min', value: 48 }
		],
		scene: {
			id: 'missed_you_scene',
			intro: "She practically lights up when she sees you...",
			dialogue:
				"You're back! I missed you so much... I know it was only a couple of days, but it felt so much longer. Please don't stay away that long again, okay?"
		},
		stateChanges: { affectionDelta: 20, comfortDelta: 15 },
		cooldownDays: 3,
		oneTime: false,
		priority: 50
	},

	// Deep bond moment (for soulmate)
	{
		id: 'deep_bond_moment',
		name: 'Deep Connection',
		type: 'conditional',
		conditions: [
			{ type: 'min_affection', value: 900 },
			{ type: 'min_trust', value: 98 },
			{ type: 'min_intimacy', value: 85 },
			{ type: 'relationship_stage', value: 'committed' },
			{ type: 'days_known', value: 50 }
		],
		scene: {
			id: 'deep_bond_scene',
			intro: "In a quiet moment together, she takes your hand and looks into your eyes...",
			dialogue:
				"You know what I realized? I don't remember what my life was like before you anymore. And I don't want to. Every part of who I am now... it's connected to you. You're not just my partner. You're my soulmate. I know that word gets thrown around a lot, but... I've never been more certain of anything.",
			choices: [
				{
					text: "You're my soulmate too.",
					response:
						"*holds you close* I know. I've always known. This... this is what forever feels like, isn't it?",
					stateChanges: { affectionDelta: 200, trustDelta: 30, intimacyDelta: 50, comfortDelta: 40, respectDelta: 30 }
				},
				{
					text: "I can't imagine my life without you.",
					response:
						"Then don't. Stay with me. Always. That's all I'll ever ask of you.",
					stateChanges: { affectionDelta: 180, trustDelta: 25, intimacyDelta: 45, comfortDelta: 35 }
				}
			]
		},
		oneTime: true,
		priority: 99
	}
];
