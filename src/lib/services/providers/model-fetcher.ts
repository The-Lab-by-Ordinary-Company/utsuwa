import { isTauri } from '$lib/services/platform';
import { fetchModelsDirect } from './client-models';

export interface ModelInfo {
	id: string;
	name: string;
}

export interface FetchModelsResult {
	models: ModelInfo[];
	error?: string;
	fromCache?: boolean;
}

const FETCH_TIMEOUT_MS = 10000;

export async function fetchProviderModels(
	providerId: string,
	apiKey: string,
	baseUrl?: string
): Promise<FetchModelsResult> {
	// Tauri production builds don't have server routes — fetch directly
	if (isTauri()) {
		return fetchModelsDirect(providerId, apiKey, baseUrl);
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch('/api/providers/models', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ providerId, apiKey, baseUrl }),
			signal: controller.signal
		});

		const data = await response.json();

		if (data.error) {
			return { models: [], error: data.error };
		}

		return { models: data.models };
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return { models: [], error: 'Request timed out' };
		}
		const message = error instanceof Error ? error.message : 'Failed to fetch models';
		return { models: [], error: message };
	} finally {
		clearTimeout(timeout);
	}
}
