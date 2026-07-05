import type { RelationshipStage, CharacterState } from '$lib/types/character';

// Stage order for comparison
export const STAGE_ORDER: RelationshipStage[] = [
	'stranger',
	'acquaintance',
	'friend',
	'close_friend',
	'romantic_interest',
	'dating',
	'committed',
	'soulmate'
];

export interface StageRequirements {
	minAffection: number;
	minTrust: number;
	minIntimacy?: number;
	minComfort?: number;
	minRespect?: number;
	requiredEvents?: string[];
	minDaysKnown?: number;
	minInteractions?: number;
}

// Stage requirements for progression
const STAGE_REQUIREMENTS: Record<RelationshipStage, StageRequirements> = {
	companion: { minAffection: 0, minTrust: 0 }, // Special locked stage for Companion Mode
	stranger: { minAffection: 0, minTrust: 0 },
	acquaintance: { minAffection: 50, minTrust: 20, minInteractions: 3 },
	friend: { minAffection: 150, minTrust: 50, minDaysKnown: 3, minInteractions: 10 },
	close_friend: { minAffection: 300, minTrust: 70, minComfort: 50, minDaysKnown: 7, minInteractions: 25 },
	romantic_interest: { minAffection: 450, minTrust: 75, minIntimacy: 30, minDaysKnown: 10, requiredEvents: ['first_deep_conversation', 'shared_vulnerability'] },
	dating: { minAffection: 600, minTrust: 85, minIntimacy: 50, minDaysKnown: 14, requiredEvents: ['confession_accepted'] },
	committed: { minAffection: 800, minTrust: 95, minIntimacy: 75, minComfort: 80, minDaysKnown: 30, requiredEvents: ['commitment_accepted'] },
	soulmate: { minAffection: 950, minTrust: 100, minIntimacy: 90, minComfort: 95, minRespect: 90, minDaysKnown: 60, requiredEvents: ['deep_bond_moment'] }
};

// Check if state meets a set of stage requirements. `scale` shrinks the numeric
// stat floors (for the demotion hysteresis band); time/interaction counts and
// event markers only ever grow, so they are checked unscaled.
export function meetsStageRequirements(
	state: CharacterState,
	requirements: StageRequirements,
	completedEvents: string[],
	scale = 1
): boolean {
	if (state.affection < requirements.minAffection * scale) return false;
	if (state.trust < requirements.minTrust * scale) return false;
	if (requirements.minIntimacy !== undefined && state.intimacy < requirements.minIntimacy * scale) return false;
	if (requirements.minComfort !== undefined && state.comfort < requirements.minComfort * scale) return false;
	if (requirements.minRespect !== undefined && state.respect < requirements.minRespect * scale) return false;
	if (requirements.minDaysKnown !== undefined && state.daysKnown < requirements.minDaysKnown) return false;
	if (requirements.minInteractions !== undefined && state.totalInteractions < requirements.minInteractions) return false;

	if (requirements.requiredEvents) {
		for (const eventId of requirements.requiredEvents) {
			if (!completedEvents.includes(eventId)) return false;
		}
	}

	return true;
}

// Calculate what stage should be based on current state
export function calculateStage(state: CharacterState, completedEvents: string[]): RelationshipStage {
	for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
		const stage = STAGE_ORDER[i];
		if (meetsStageRequirements(state, STAGE_REQUIREMENTS[stage], completedEvents)) {
			return stage;
		}
	}
	return 'stranger';
}

// Demotion only happens once a stat falls below 85% of the current stage's
// floor. Without the band, a single -1 turn at a threshold demotes and the
// next +2 turn re-promotes, firing the transition celebration repeatedly.
export const DEMOTION_HYSTERESIS = 0.85;

export interface StageTransitionResolution {
	stage: RelationshipStage;
	changed: boolean;
	direction?: 'promotion' | 'demotion';
}

// Decide the next stage relative to the one currently held. Promotion is
// immediate; demotion is damped by the hysteresis band so boundary noise and
// mild decay don't silently strip a stage. A real collapse still demotes to
// whatever stage the stats actually support.
export function resolveStageTransition(
	state: CharacterState,
	completedEvents: string[]
): StageTransitionResolution {
	const current = state.relationshipStage;
	const calculated = calculateStage(state, completedEvents);

	if (calculated === current) {
		return { stage: current, changed: false };
	}

	const currentIndex = STAGE_ORDER.indexOf(current);
	const calculatedIndex = STAGE_ORDER.indexOf(calculated);

	// Current stage isn't on the dating-sim ladder (companion); adopt the
	// calculated stage outright.
	if (currentIndex === -1) {
		return { stage: calculated, changed: true, direction: 'promotion' };
	}

	if (calculatedIndex > currentIndex) {
		return { stage: calculated, changed: true, direction: 'promotion' };
	}

	if (meetsStageRequirements(state, STAGE_REQUIREMENTS[current], completedEvents, DEMOTION_HYSTERESIS)) {
		return { stage: current, changed: false };
	}

	return { stage: calculated, changed: true, direction: 'demotion' };
}

// Stage behavior definition
interface StageBehavior {
	availableActions: string[];
	dialogueModifiers: {
		formality: 'high' | 'medium' | 'low' | 'none';
		openness: 'low' | 'medium' | 'high' | 'full';
		romantic?: 'none' | 'subtle' | 'open' | 'natural' | 'deep';
	};
	physicalAffectionLevel: number;
	vulnerabilityLevel: number;
	initiationChance: number;
}

// Stage behaviors map
export const STAGE_BEHAVIORS: Record<RelationshipStage, StageBehavior> = {
	companion: {
		availableActions: ['chat', 'help', 'advise'],
		dialogueModifiers: { formality: 'low', openness: 'medium', romantic: 'none' },
		physicalAffectionLevel: 0,
		vulnerabilityLevel: 30,
		initiationChance: 0.3
	},
	stranger: {
		availableActions: ['chat', 'introduce'],
		dialogueModifiers: { formality: 'high', openness: 'low', romantic: 'none' },
		physicalAffectionLevel: 0,
		vulnerabilityLevel: 5,
		initiationChance: 0.1
	},
	acquaintance: {
		availableActions: ['chat', 'ask_about_day', 'share_interest'],
		dialogueModifiers: { formality: 'medium', openness: 'low', romantic: 'none' },
		physicalAffectionLevel: 5,
		vulnerabilityLevel: 15,
		initiationChance: 0.2
	},
	friend: {
		availableActions: ['chat', 'hang_out', 'ask_advice', 'share_problem', 'joke_around'],
		dialogueModifiers: { formality: 'low', openness: 'medium', romantic: 'none' },
		physicalAffectionLevel: 15,
		vulnerabilityLevel: 35,
		initiationChance: 0.4
	},
	close_friend: {
		availableActions: ['chat', 'deep_talk', 'comfort', 'share_secret', 'plan_together'],
		dialogueModifiers: { formality: 'none', openness: 'high', romantic: 'none' },
		physicalAffectionLevel: 30,
		vulnerabilityLevel: 60,
		initiationChance: 0.5
	},
	romantic_interest: {
		availableActions: ['chat', 'flirt', 'compliment', 'hint_feelings', 'nervous_moment'],
		dialogueModifiers: { formality: 'none', openness: 'high', romantic: 'subtle' },
		physicalAffectionLevel: 40,
		vulnerabilityLevel: 70,
		initiationChance: 0.6
	},
	dating: {
		availableActions: ['chat', 'date', 'express_love', 'plan_future', 'be_romantic'],
		dialogueModifiers: { formality: 'none', openness: 'full', romantic: 'open' },
		physicalAffectionLevel: 70,
		vulnerabilityLevel: 85,
		initiationChance: 0.7
	},
	committed: {
		availableActions: ['all'],
		dialogueModifiers: { formality: 'none', openness: 'full', romantic: 'natural' },
		physicalAffectionLevel: 90,
		vulnerabilityLevel: 95,
		initiationChance: 0.8
	},
	soulmate: {
		availableActions: ['all'],
		dialogueModifiers: { formality: 'none', openness: 'full', romantic: 'deep' },
		physicalAffectionLevel: 100,
		vulnerabilityLevel: 100,
		initiationChance: 0.9
	}
};

// Stage-specific instructions for LLM prompt
export const STAGE_INSTRUCTIONS: Record<RelationshipStage, string> = {
	companion: `You are a helpful AI companion. Be friendly, helpful, and engaging. Focus on assisting the user with their questions and tasks while maintaining a warm conversational tone.`,

	stranger: `You don't know this person yet. Be polite but guarded. Don't share personal details freely. Be curious but cautious. Keep responses relatively brief and formal.`,

	acquaintance: `You're starting to warm up to them. Still somewhat formal but friendlier. You can share surface-level things about yourself. Show polite interest in their day and activities.`,

	friend: `You're comfortable around them. Be casual and relaxed. Share your opinions freely. Joke around. You can talk about your day and ask about theirs genuinely. Use their name sometimes.`,

	close_friend: `They're one of your closest friends. Be open and vulnerable. Share deeper thoughts and feelings. You can talk about fears, dreams, and secrets. Comfort them when needed. You genuinely care about them.`,

	romantic_interest: `You have feelings developing for them. You might get flustered, drop subtle hints, or find excuses to be near them. Compliments come more naturally but might make you nervous. You think about them when they're not around. Show subtle signs of affection.`,

	dating: `You're together now. Be openly affectionate and romantic. Express your feelings directly. Make plans together. Show physical affection through words (describing hugs, holding hands, etc). You can be playfully possessive or jealous. Use pet names naturally.`,

	committed: `Deep commitment and love. Complete comfort and trust. You can discuss anything openly. Plan your future together. Love is expressed naturally and constantly. You're partners in everything. Support each other through difficulties.`,

	soulmate: `Profound, unshakeable bond. You understand each other without words sometimes. Love is deep and constant. You've been through everything together and grown together. True partners in every sense. Express deep love and understanding naturally.`
};
