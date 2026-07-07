import { createTempVrmManager, type VrmModelRef } from './temp-vrm.ts';

export interface TempVrmStoreState {
	modelUrl: string | null;
	activeModelId: string | null;
	availableExpressions: string[];
	tempModelActive: boolean;
	tempModelLoading: boolean;
	tempModelLoadError: boolean;
}

/**
 * Bridges the temporary-VRM manager and the reactive VRM store.
 *
 * All state mutations are applied to the supplied {@link TempVrmStoreState}
 * object so the caller can back the fields with Svelte runes, plain values,
 * or test doubles without this module knowing the difference.
 */
export function createTempVrmStoreIntegration() {
	const manager = createTempVrmManager();

	function load(state: TempVrmStoreState, file: File): void {
		const result = manager.load(file, state.activeModelId);
		state.modelUrl = result.url;
		state.activeModelId = null;
		state.availableExpressions = [];
		state.tempModelActive = result.active;
		state.tempModelLoading = true;
		state.tempModelLoadError = false;
	}

	function restore(
		state: TempVrmStoreState,
		models: VrmModelRef[],
		defaultModels: VrmModelRef[]
	): void {
		// No-op if no temporary model is currently active. This prevents
		// accidental restore calls from clearing the real avatar.
		if (!state.tempModelActive) return;

		const result = manager.restore(models, defaultModels);
		if (result.originalId) {
			state.activeModelId = result.originalId;
			state.modelUrl = result.url;
		} else {
			// Defensive fallback: if neither original nor defaults are available,
			// clear the temp model state so the scene does not stay stuck.
			state.activeModelId = null;
			state.modelUrl = null;
		}
		state.tempModelActive = result.active;
		state.tempModelLoading = false;
		state.tempModelLoadError = false;
	}

	/**
	 * Called when the VRM engine finishes parsing (or fails) a model load.
	 * Only resets the loading flag while a temp model is active so normal
	 * avatar loads are not affected.
	 */
	function onLoadingFinished(state: TempVrmStoreState): void {
		if (state.tempModelActive) {
			state.tempModelLoading = false;
		}
	}

	/**
	 * Marks a temp-load failure so the UI can restore the original avatar.
	 * Only touches state while a temp model is active.
	 */
	function onError(state: TempVrmStoreState): void {
		if (!state.tempModelActive) return;
		if (state.tempModelLoading) {
			state.tempModelLoadError = true;
		}
		state.tempModelLoading = false;
	}

	/** Persisting the active model ID is not meaningful while previewing. */
	function canSave(state: TempVrmStoreState): boolean {
		return !state.tempModelActive;
	}

	return { load, restore, onLoadingFinished, onError, canSave };
}
