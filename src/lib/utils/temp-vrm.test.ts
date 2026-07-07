import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempVrmManager } from './temp-vrm.ts';

function makeFile(name = 'test.vrm'): File {
	return new File(['vrm'], name, { type: 'model/vrm' });
}

test('temp model manager starts inactive', () => {
	const manager = createTempVrmManager();
	const state = manager.getState();
	assert.equal(state.active, false);
	assert.equal(state.url, null);
	assert.equal(state.originalId, null);
});

test('load creates a blob URL and remembers the original active model', async () => {
	const manager = createTempVrmManager();
	const result = await manager.load(makeFile(), 'original-id');

	assert.equal(result.active, true);
	assert.ok(result.url?.startsWith('blob:'));
	assert.equal(result.originalId, 'original-id');
	assert.equal(manager.getState().active, true);
});

test('second load revokes the previous blob URL', async () => {
	const manager = createTempVrmManager();
	const first = await manager.load(makeFile('first.vrm'), 'original-id');
	const second = await manager.load(makeFile('second.vrm'), 'original-id');

	assert.notEqual(first.url, second.url);
	assert.equal(second.active, true);
	assert.equal(manager.getState().active, true);
});

test('restore revokes the temp URL and returns the original model', async () => {
	const manager = createTempVrmManager();
	await manager.load(makeFile(), 'original-id');
	const result = manager.restore(
		[{ id: 'original-id', url: '/models/original.vrm' }],
		[{ id: 'default-id', url: '/models/default.vrm' }]
	);

	assert.equal(result.active, false);
	assert.equal(result.url, '/models/original.vrm');
	assert.equal(result.originalId, 'original-id');
	assert.equal(manager.getState().active, false);
});

test('restore falls back to the first default when the original is missing', async () => {
	const manager = createTempVrmManager();
	await manager.load(makeFile(), 'deleted-id');
	const result = manager.restore(
		[{ id: 'other-id', url: '/models/other.vrm' }],
		[
			{ id: 'default-id', url: '/models/default.vrm' },
			{ id: 'fallback-id', url: '/models/fallback.vrm' }
		]
	);

	assert.equal(result.active, false);
	assert.equal(result.originalId, 'default-id');
	assert.equal(result.url, '/models/default.vrm');
});

test('restore without a prior temp model is a no-op', () => {
	const manager = createTempVrmManager();
	const result = manager.restore(
		[{ id: 'original-id', url: '/models/original.vrm' }],
		[{ id: 'default-id', url: '/models/default.vrm' }]
	);

	assert.equal(result.active, false);
	assert.equal(result.originalId, null);
	assert.equal(result.url, null);
});
