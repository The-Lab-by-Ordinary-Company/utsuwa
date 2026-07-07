import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempVrmStoreIntegration, type TempVrmStoreState } from './temp-vrm-store.ts';

function makeFile(name = 'test.vrm'): File {
	return new File(['vrm'], name, { type: 'model/vrm' });
}

function createState(overrides: Partial<TempVrmStoreState> = {}): TempVrmStoreState {
	return {
		modelUrl: '/models/default.vrm',
		activeModelId: 'default-id',
		availableExpressions: ['neutral'],
		tempModelActive: false,
		tempModelLoading: false,
		tempModelLoadError: false,
		...overrides
	};
}

test('load switches to the temporary model and marks uploading', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState({ activeModelId: 'original-id' });

	integration.load(state, makeFile('preview.vrm'));

	assert.equal(state.tempModelActive, true);
	assert.equal(state.tempModelLoading, true);
	assert.equal(state.tempModelLoadError, false);
	assert.equal(state.activeModelId, null);
	assert.equal(state.availableExpressions.length, 0);
	assert.ok(state.modelUrl?.startsWith('blob:'));
});

test('restore returns the original model and clears temp state', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState({ activeModelId: 'original-id' });
	integration.load(state, makeFile());

	integration.restore(
		state,
		[{ id: 'original-id', url: '/models/original.vrm' }],
		[{ id: 'default-id', url: '/models/default.vrm' }]
	);

	assert.equal(state.tempModelActive, false);
	assert.equal(state.tempModelLoading, false);
	assert.equal(state.tempModelLoadError, false);
	assert.equal(state.activeModelId, 'original-id');
	assert.equal(state.modelUrl, '/models/original.vrm');
});

test('restore is a no-op when no temp model is active', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState();

	integration.restore(
		state,
		[{ id: 'original-id', url: '/models/original.vrm' }],
		[{ id: 'default-id', url: '/models/default.vrm' }]
	);

	assert.equal(state.tempModelActive, false);
	assert.equal(state.activeModelId, 'default-id');
	assert.equal(state.modelUrl, '/models/default.vrm');
});

test('originalId is frozen after the first load', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState({ activeModelId: 'first-id' });
	integration.load(state, makeFile('first.vrm'));

	// Simulate the user switching to another model before loading a second temp file.
	state.activeModelId = 'second-id';
	integration.load(state, makeFile('second.vrm'));

	integration.restore(
		state,
		[
			{ id: 'first-id', url: '/models/first.vrm' },
			{ id: 'second-id', url: '/models/second.vrm' }
		],
		[{ id: 'default-id', url: '/models/default.vrm' }]
	);

	assert.equal(state.activeModelId, 'first-id');
	assert.equal(state.modelUrl, '/models/first.vrm');
});

test('restore falls back to the first default when the original is missing', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState({ activeModelId: 'deleted-id' });
	integration.load(state, makeFile());

	integration.restore(state, [], [
		{ id: 'fallback-id', url: '/models/fallback.vrm' }
	]);

	assert.equal(state.activeModelId, 'fallback-id');
	assert.equal(state.modelUrl, '/models/fallback.vrm');
	assert.equal(state.tempModelActive, false);
	assert.equal(state.tempModelLoading, false);
	assert.equal(state.tempModelLoadError, false);
});

test('restore clears the model when original and defaults are missing', () => {
	const integration = createTempVrmStoreIntegration();
	const state = createState({ activeModelId: 'original-id' });
	integration.load(state, makeFile());

	integration.restore(state, [], []);

	assert.equal(state.activeModelId, null);
	assert.equal(state.modelUrl, null);
	assert.equal(state.tempModelActive, false);
	assert.equal(state.tempModelLoading, false);
	assert.equal(state.tempModelLoadError, false);
});

test('onLoadingFinished resets uploading only while a temp model is active', () => {
	const integration = createTempVrmStoreIntegration();
	const active = createState({ tempModelActive: true, tempModelLoading: true });
	const inactive = createState({ tempModelActive: false, tempModelLoading: true });

	integration.onLoadingFinished(active);
	integration.onLoadingFinished(inactive);

	assert.equal(active.tempModelLoading, false);
	assert.equal(inactive.tempModelLoading, true);
});

test('onError flags temp-load failures only during an active upload', () => {
	const integration = createTempVrmStoreIntegration();
	const duringUpload = createState({
		tempModelActive: true,
		tempModelLoading: true
	});
	const activeButNotUploading = createState({
		tempModelActive: true,
		tempModelLoading: false
	});
	const notActive = createState({
		tempModelActive: false,
		tempModelLoading: true
	});

	integration.onError(duringUpload);
	integration.onError(activeButNotUploading);
	integration.onError(notActive);

	assert.equal(duringUpload.tempModelLoadError, true);
	assert.equal(duringUpload.tempModelLoading, false);
	assert.equal(activeButNotUploading.tempModelLoadError, false);
	assert.equal(activeButNotUploading.tempModelLoading, false);
	assert.equal(notActive.tempModelLoadError, false);
	assert.equal(notActive.tempModelLoading, true);
});

test('canSave returns false while a temp model is active', () => {
	const integration = createTempVrmStoreIntegration();
	const active = createState({ tempModelActive: true });
	const inactive = createState({ tempModelActive: false });

	assert.equal(integration.canSave(active), false);
	assert.equal(integration.canSave(inactive), true);
});
