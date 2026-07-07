// Minimal shape needed by restore(). This intentionally uses `Pick`-like
// naming (VrmModelRef) so it is not confused with the full VrmModel type
// exported by the store, while still accepting any object with id + url.
export interface VrmModelRef {
	id: string;
	url: string;
}

export interface TempVrmState {
	url: string | null;
	originalId: string | null;
	active: boolean;
}

/**
 * Manages an in-memory temporary VRM preview.
 *
 * The temporary model is never persisted. Loading creates a blob URL from the
 * provided file; restoring revokes that URL and returns the previously active
 * model (or the first default as a fallback).
 */
export function createTempVrmManager() {
	let state: TempVrmState = { url: null, originalId: null, active: false };

	function load(file: File, currentActiveModelId: string | null): TempVrmState {
		// Revoke any previous temp URL to avoid leaking blob URLs.
		if (state.url) {
			URL.revokeObjectURL(state.url);
		}

		// Remember the originally active model only on the first temp load.
		if (!state.originalId) {
			state.originalId = currentActiveModelId;
		}

		// Use the File directly instead of copying it into a new Blob.
		try {
			state.url = URL.createObjectURL(file);
		} catch (e) {
			state.url = null;
			state.active = false;
			throw new Error(`Failed to create object URL for temporary VRM: ${e}`);
		}
		state.active = true;

		return { ...state };
	}

	function restore(models: VrmModelRef[], defaultModels: VrmModelRef[]): TempVrmState {
		if (state.url) {
			URL.revokeObjectURL(state.url);
			state.url = null;
		}

		let restoredId: string | null = null;
		let restoredUrl: string | null = null;

		if (state.originalId) {
			const original = models.find((m) => m.id === state.originalId);
			if (original) {
				restoredId = original.id;
				restoredUrl = original.url;
			} else if (defaultModels.length > 0) {
				// Fallback to default if the original was deleted in the meantime.
				restoredId = defaultModels[0].id;
				restoredUrl = defaultModels[0].url;
			}
			state.originalId = null;
		}

		state.active = false;
		return { ...state, originalId: restoredId, url: restoredUrl };
	}

	function getState(): TempVrmState {
		return { ...state };
	}

	return { load, restore, getState };
}
