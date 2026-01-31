/**
 * Shared utilities for model fetching.
 */

import { fetchProviderModels, type ModelInfo } from './model-fetcher';
import { settingsStore } from '$lib/stores/settings.svelte';

export type { ModelInfo };

/**
 * Creates a debounced version of a function.
 * Useful for delaying API calls until user stops typing.
 */
export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, delay);
	};
}

export interface FetchModelsOptions {
	providerId: string;
	apiKey: string;
	baseUrl?: string;
	isLocal?: boolean;
	getCurrentProviderId: () => string | undefined;
	onStart: () => void;
	onSuccess: (models: ModelInfo[]) => void;
	onError: () => void;
	onEmpty: () => void;
	onStale: () => void;
}

/**
 * Fetches models from a provider API with proper error handling and race condition prevention.
 */
export async function fetchModels(options: FetchModelsOptions): Promise<void> {
	const {
		providerId,
		apiKey,
		baseUrl,
		isLocal,
		getCurrentProviderId,
		onStart,
		onSuccess,
		onError,
		onEmpty,
		onStale
	} = options;

	if (!providerId || isLocal || !apiKey) return;

	onStart();

	const result = await fetchProviderModels(providerId, apiKey, baseUrl);

	// Provider changed during fetch - discard stale results
	if (getCurrentProviderId() !== providerId) {
		onStale();
		return;
	}

	if (result.error) {
		onError();
	} else if (result.models.length > 0) {
		settingsStore.setCachedModels(providerId, result.models);
		onSuccess(result.models);
	} else {
		onEmpty();
	}
}

/**
 * Checks for cached models and returns them if valid.
 */
export function getCachedModelsForProvider(providerId: string): ModelInfo[] | null {
	const cached = settingsStore.getCachedModels(providerId);
	return cached && cached.length > 0 ? cached : null;
}
