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
