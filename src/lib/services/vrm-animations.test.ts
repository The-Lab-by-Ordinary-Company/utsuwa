import test from 'node:test';
import assert from 'node:assert/strict';

import { loadVrmAnimation, clearVrmAnimationCache } from './vrm-animations.ts';

// A stand-in for a parsed VRMAnimation; the cache never inspects it.
function fakeAnimation(tag: string) {
	return { tag } as never;
}

test('fetches once and reuses the result for repeat calls', async () => {
	clearVrmAnimationCache();
	let calls = 0;
	const fetcher = async (url: string) => {
		calls++;
		return fakeAnimation(url);
	};

	const a = await loadVrmAnimation('/animations/idle.vrma', fetcher);
	const b = await loadVrmAnimation('/animations/idle.vrma', fetcher);
	const c = await loadVrmAnimation('/animations/idle.vrma', fetcher);

	assert.equal(calls, 1, 'the idle loop must not refetch the same file');
	assert.equal(a, b);
	assert.equal(b, c);
});

test('concurrent callers share one in-flight request', async () => {
	clearVrmAnimationCache();
	let calls = 0;
	let release!: (v: unknown) => void;
	const gate = new Promise((r) => (release = r));
	const fetcher = async (url: string) => {
		calls++;
		await gate;
		return fakeAnimation(url);
	};

	const all = Promise.all([
		loadVrmAnimation('/animations/idle_2.vrma', fetcher),
		loadVrmAnimation('/animations/idle_2.vrma', fetcher),
		loadVrmAnimation('/animations/idle_2.vrma', fetcher)
	]);
	release(null);
	const [x, y, z] = await all;

	assert.equal(calls, 1, 'a cycle firing mid-load must not start a second fetch');
	assert.equal(x, y);
	assert.equal(y, z);
});

test('caches per URL, so the five idle files stay distinct', async () => {
	clearVrmAnimationCache();
	const seen: string[] = [];
	const fetcher = async (url: string) => {
		seen.push(url);
		return fakeAnimation(url);
	};

	const urls = [
		'/animations/idle.vrma',
		'/animations/idle_2.vrma',
		'/animations/idle_3.vrma',
		'/animations/idle_4.vrma',
		'/animations/idle_5.vrma'
	];
	for (const u of urls) await loadVrmAnimation(u, fetcher);
	for (const u of urls) await loadVrmAnimation(u, fetcher);

	assert.deepEqual(seen, urls, 'each file fetched exactly once, in order');
});

test('a failed load is evicted so the next call retries', async () => {
	clearVrmAnimationCache();
	let calls = 0;
	const fetcher = async (url: string) => {
		calls++;
		if (calls === 1) throw new Error('network down');
		return fakeAnimation(url);
	};

	await assert.rejects(() => loadVrmAnimation('/animations/idle.vrma', fetcher), /network down/);
	// A transient failure must not poison the cache for the rest of the session.
	const ok = await loadVrmAnimation('/animations/idle.vrma', fetcher);

	assert.equal(calls, 2);
	assert.ok(ok);
});

test('a rejected entry does not surface as an unhandled rejection', async () => {
	clearVrmAnimationCache();
	const fetcher = async () => {
		throw new Error('boom');
	};

	// Call without awaiting, the way a fire-and-forget cycle would.
	const p = loadVrmAnimation('/animations/idle_3.vrma', fetcher);
	p.catch(() => {});
	await assert.rejects(() => p, /boom/);

	// Give any stray unhandled rejection a tick to surface.
	await new Promise((r) => setImmediate(r));
});

test('clearVrmAnimationCache forces a refetch', async () => {
	clearVrmAnimationCache();
	let calls = 0;
	const fetcher = async (url: string) => {
		calls++;
		return fakeAnimation(url);
	};

	await loadVrmAnimation('/animations/idle.vrma', fetcher);
	clearVrmAnimationCache();
	await loadVrmAnimation('/animations/idle.vrma', fetcher);

	assert.equal(calls, 2);
});
