import type { RelationshipStage } from '$lib/types/character';

// Data-driven tap reactions for photo mode. Touching the character picks a
// reaction from this table keyed on (zone, relationship tier): early stages
// get startled and flustered, romantic stages get the warmer set with a
// bigger physics nudge, and Companion Mode stays on a single friendly tier.
// Tuning tone is a table edit, not a code change, and this file is the single
// knob for any future content-rating pass.
//
// Expressions are listed as candidates in preference order; the applier picks
// the first one the loaded model actually has, so unusual VRMs degrade
// gracefully instead of erroring.

export type TouchZone = 'head' | 'face' | 'shoulder' | 'torso' | 'hip';
export type ReactionTier = 'companion' | 'early' | 'warm' | 'romantic';

export const TOUCH_ZONES: readonly TouchZone[] = ['head', 'face', 'shoulder', 'torso', 'hip'];
export const REACTION_TIERS: readonly ReactionTier[] = ['companion', 'early', 'warm', 'romantic'];

export interface ReactionSpec {
	// Expression candidates in preference order (VRM preset names)
	expressions: string[];
	// Expression weight 0..1
	weight: number;
	// Spring-impulse magnitude 0..1 (scaled by the applier)
	impulse: number;
}

export function stageTier(stage: RelationshipStage): ReactionTier {
	switch (stage) {
		case 'companion':
			return 'companion';
		case 'stranger':
		case 'acquaintance':
			return 'early';
		case 'friend':
		case 'close_friend':
			return 'warm';
		default:
			return 'romantic';
	}
}

const TABLE: Record<ReactionTier, Record<TouchZone, ReactionSpec>> = {
	companion: {
		head: { expressions: ['happy', 'relaxed'], weight: 0.7, impulse: 0.35 },
		face: { expressions: ['surprised', 'happy'], weight: 0.6, impulse: 0.3 },
		shoulder: { expressions: ['happy', 'neutral'], weight: 0.5, impulse: 0.3 },
		torso: { expressions: ['surprised', 'happy'], weight: 0.6, impulse: 0.35 },
		hip: { expressions: ['surprised', 'neutral'], weight: 0.6, impulse: 0.3 }
	},
	early: {
		head: { expressions: ['surprised', 'shy'], weight: 0.6, impulse: 0.35 },
		face: { expressions: ['surprised', 'shy'], weight: 0.75, impulse: 0.3 },
		shoulder: { expressions: ['surprised', 'neutral'], weight: 0.5, impulse: 0.3 },
		torso: { expressions: ['surprised', 'angry', 'sad'], weight: 0.85, impulse: 0.4 },
		hip: { expressions: ['angry', 'surprised', 'sad'], weight: 0.9, impulse: 0.4 }
	},
	warm: {
		head: { expressions: ['happy', 'relaxed'], weight: 0.7, impulse: 0.4 },
		face: { expressions: ['shy', 'happy', 'surprised'], weight: 0.7, impulse: 0.35 },
		shoulder: { expressions: ['happy', 'relaxed'], weight: 0.6, impulse: 0.35 },
		torso: { expressions: ['shy', 'surprised'], weight: 0.75, impulse: 0.4 },
		hip: { expressions: ['surprised', 'shy', 'angry'], weight: 0.8, impulse: 0.45 }
	},
	romantic: {
		head: { expressions: ['happy', 'relaxed', 'shy'], weight: 0.8, impulse: 0.5 },
		face: { expressions: ['shy', 'happy'], weight: 0.85, impulse: 0.45 },
		shoulder: { expressions: ['relaxed', 'happy', 'shy'], weight: 0.7, impulse: 0.45 },
		torso: { expressions: ['shy', 'happy'], weight: 0.9, impulse: 0.55 },
		hip: { expressions: ['shy', 'happy', 'relaxed'], weight: 0.95, impulse: 0.6 }
	}
};

// Repeat taps within the cooldown escalate the reaction one step per tap,
// capped so the physics never runs away.
const ESCALATION_WEIGHT_STEP = 0.08;
const ESCALATION_IMPULSE_STEP = 0.12;

export function pickReaction(zone: TouchZone, tier: ReactionTier, repeatCount: number): ReactionSpec {
	const base = TABLE[tier][zone];
	const steps = Math.min(Math.max(repeatCount, 0), 3);
	return {
		expressions: base.expressions,
		weight: Math.min(1, base.weight + steps * ESCALATION_WEIGHT_STEP),
		impulse: Math.min(1, base.impulse + steps * ESCALATION_IMPULSE_STEP)
	};
}
