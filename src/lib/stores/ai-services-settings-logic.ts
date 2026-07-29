import type { ModelInfo } from '$lib/services/providers/use-model-fetch';
import type { ProviderMetadata } from '$lib/services/providers/registry';
import type { ProviderConfig } from '$lib/types';

/**
 * Pure helpers for the LLM/TTS/STT settings UI.
 * Kept separate from the Svelte-runes state so they can be unit-tested
 * without a Svelte compiler.
 */

/**
 * Returns the model id that should be considered selected.
 * If the current selection exists in the available list it is preserved;
 * otherwise the first available model is selected.
 */
export function selectDefaultModel(
	models: ModelInfo[],
	currentModel: string | undefined
): string | undefined {
	if (!models.length) return currentModel;
	const modelExists = currentModel && models.some((m) => m.id === currentModel);
	return modelExists ? currentModel : models[0].id;
}

/**
 * Determines whether a provider is ready to have its models fetched.
 * - Custom endpoints need a base URL.
 * - Local providers are always ready.
 * - Cloud providers need an API key.
 */
export function isProviderReadyForFetch(
	provider: ProviderMetadata,
	config: ProviderConfig
): boolean {
	if (provider.custom) {
		return !!config.baseUrl;
	}
	if (provider.isLocal || !provider.requiresApiKey) {
		return true;
	}
	return !!config.apiKey;
}

/**
 * Builds a stable signature for the current provider + endpoint combination.
 * Used to avoid redundant fetches when the effect re-runs with the same values.
 */
export function createFetchSignature(providerId: string, baseUrl: string | undefined): string {
	return `${providerId}:${baseUrl ?? ''}`;
}

// ── OmniVoice voice design helpers ───────────────────────────────────────────

export const OMNI_VOICE_GENDERS = ['male', 'female'] as const;
export type OmniVoiceGender = (typeof OMNI_VOICE_GENDERS)[number];

export const OMNI_VOICE_AGES = ['child', 'teenager', 'young adult', 'middle-aged', 'elderly'] as const;
export type OmniVoiceAge = (typeof OMNI_VOICE_AGES)[number];

export const OMNI_VOICE_PITCHES = ['very low', 'low', 'moderate', 'high', 'very high'] as const;
export type OmniVoicePitch = (typeof OMNI_VOICE_PITCHES)[number];

export const OMNI_VOICE_ACCENTS = ['american', 'british', 'australian', 'indian', 'neutral'] as const;
export type OmniVoiceAccent = (typeof OMNI_VOICE_ACCENTS)[number];

export interface OmniVoiceDesign {
	gender: OmniVoiceGender;
	age: OmniVoiceAge;
	pitch: OmniVoicePitch;
	accent: OmniVoiceAccent;
}

export const DEFAULT_OMNI_VOICE_DESIGN: OmniVoiceDesign = {
	gender: 'female',
	age: 'young adult',
	pitch: 'moderate',
	accent: 'american'
};

/**
 * Builds the OmniVoice instruction string from voice design attributes.
 * Example: "female, young adult, moderate pitch, american accent".
 */
export function buildInstructions(
	gender: string,
	age: string,
	pitch: string,
	accent: string
): string {
	const accentPart = accent && accent !== 'neutral' ? `, ${accent} accent` : '';
	return `${gender}, ${age}, ${pitch} pitch${accentPart}`;
}

/**
 * Parses a previously stored instruction string back into design attributes.
 * Missing or unrecognised parts fall back to the default design.
 */
export function parseInstructions(instructions: string): OmniVoiceDesign {
	const i = instructions.toLowerCase();

	let gender: OmniVoiceGender = DEFAULT_OMNI_VOICE_DESIGN.gender;
	// Check female first so the substring "male" inside "female" is not picked.
	if (i.includes('female')) {
		gender = 'female';
	} else if (i.includes('male')) {
		gender = 'male';
	}

	let pitch: OmniVoicePitch = DEFAULT_OMNI_VOICE_DESIGN.pitch;
	for (const p of [...OMNI_VOICE_PITCHES].sort((a, b) => b.length - a.length)) {
		if (i.includes(p)) {
			pitch = p;
			break;
		}
	}

	let age: OmniVoiceAge = DEFAULT_OMNI_VOICE_DESIGN.age;
	for (const a of OMNI_VOICE_AGES) {
		if (i.includes(a)) {
			age = a;
			break;
		}
	}

	let accent: OmniVoiceAccent = DEFAULT_OMNI_VOICE_DESIGN.accent;
	const accentMatch = i.match(/(\w+)\s+accent/);
	if (accentMatch) {
		const parsedAccent = accentMatch[1];
		if (OMNI_VOICE_ACCENTS.includes(parsedAccent as OmniVoiceAccent)) {
			accent = parsedAccent as OmniVoiceAccent;
		}
	}

	return { gender, age, pitch, accent };
}
