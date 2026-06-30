<script lang="ts">
	import { onMount } from 'svelte';
	import { Icon } from '$lib/components/ui';
	import {
		listKeepsakes,
		getKeepsakeImageUrl,
		forgetKeepsakeImage,
		type KeepsakeRecord
	} from '$lib/services/storage/keepsakes';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	type Item = KeepsakeRecord & { url: string; isBlobUrl: boolean };
	let items = $state<Item[]>([]);
	let loading = $state(true);

	// Stable, scattered tilt per photo (no random, so it doesn't jiggle on rerender).
	const ROTATIONS = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

	onMount(async () => {
		const records = await listKeepsakes();
		const result: Item[] = [];
		for (const r of records) {
			if (r.thumb) {
				// instant: render from the inline thumbnail, no blob load
				result.push({ ...r, url: r.thumb, isBlobUrl: false });
			} else {
				// legacy keepsakes without a thumbnail: fall back to the full blob
				const url = await getKeepsakeImageUrl(r.id);
				if (url) result.push({ ...r, url, isBlobUrl: true });
			}
		}
		items = result;
		loading = false;
	});

	function formatDate(ms: number): string {
		return new Date(ms).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function forget(id: string) {
		const item = items.find((i) => i.id === id);
		if (item?.isBlobUrl) URL.revokeObjectURL(item.url);
		items = items.filter((i) => i.id !== id);
		await forgetKeepsakeImage(id);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	$effect(() => () => items.forEach((i) => i.isBlobUrl && URL.revokeObjectURL(i.url)));
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
<div
	class="board-overlay"
	onclick={handleOverlayClick}
	role="dialog"
	aria-modal="true"
	aria-label="Photoboard"
	tabindex="-1"
>
	<div class="board">
		<div class="board-header">
			<h2>
				Things you've shown her{#if items.length}<span class="count">{items.length}</span>{/if}
			</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<Icon name="x" size={16} />
			</button>
		</div>

		{#if loading}
			<div class="board-empty"><span>Loading…</span></div>
		{:else if items.length === 0}
			<div class="board-empty">
				<Icon name="camera" size={40} />
				<p>Nothing on the board yet.</p>
				<span>Show her a photo and she'll keep it here.</span>
			</div>
		{:else}
			<div class="board-wall">
				{#each items as item, i (item.id)}
					<div class="polaroid" style="--rot: {ROTATIONS[i % ROTATIONS.length]}deg">
						<div class="pin"></div>
						<img src={item.url} alt="" />
						<div class="caption">{formatDate(item.createdAt)}</div>
						<button class="forget-btn" aria-label="Forget this" onclick={() => forget(item.id)}>
							<Icon name="x" size={12} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.board-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.board {
		position: relative;
		width: min(820px, 100%);
		max-height: 86vh;
		display: flex;
		flex-direction: column;
		border-radius: 22px;
		/* warm corkboard */
		background:
			radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.05) 0 2px, transparent 3px),
			radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.05) 0 2px, transparent 3px),
			linear-gradient(180deg, #d6b483 0%, #c79c66 100%);
		background-size:
			26px 26px,
			32px 32px,
			100% 100%;
		border: 1px solid rgba(0, 0, 0, 0.15);
		box-shadow:
			0 24px 70px rgba(0, 0, 0, 0.35),
			inset 0 2px 0 rgba(255, 255, 255, 0.35),
			inset 0 -3px 8px rgba(0, 0, 0, 0.15);
		animation: pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes pop {
		from {
			transform: scale(0.94);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.12);
	}

	.board-header h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: #43321c;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: rgba(67, 50, 28, 0.18);
		color: #43321c;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 50%;
		background: linear-gradient(180deg, #fff 0%, #eee 100%);
		color: #5a4528;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.close-btn:hover {
		transform: scale(1.08);
	}

	.board-wall {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem 1rem;
		padding: 1.75rem;
		overflow-y: auto;
		justify-content: center;
	}

	.polaroid {
		position: relative;
		padding: 8px 8px 26px;
		background: #fff;
		border-radius: 4px;
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.2);
		transform: rotate(var(--rot));
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.polaroid:hover {
		transform: rotate(0deg) scale(1.06) translateY(-4px);
		z-index: 2;
	}

	.polaroid img {
		display: block;
		width: 150px;
		height: 150px;
		object-fit: cover;
		border-radius: 2px;
		background: #eee;
	}

	.pin {
		position: absolute;
		top: -7px;
		left: 50%;
		transform: translateX(-50%);
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e23b3b 70%);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.35),
			inset 0 1px 1px rgba(255, 255, 255, 0.6);
	}

	.caption {
		margin-top: 8px;
		text-align: center;
		font-size: 0.72rem;
		font-weight: 600;
		color: #6a5436;
		letter-spacing: 0.02em;
	}

	.forget-btn {
		position: absolute;
		top: -7px;
		right: -7px;
		width: 20px;
		height: 20px;
		border: 2px solid white;
		border-radius: 50%;
		background: #ff5a5a;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		opacity: 0;
		transform: scale(0.4);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		transition:
			opacity 0.16s ease,
			transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.polaroid:hover .forget-btn {
		opacity: 1;
		transform: scale(1);
	}

	.forget-btn:hover {
		transform: scale(1.18);
	}

	.board-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 4rem 2rem;
		color: #6a5436;
		text-align: center;
	}

	.board-empty p {
		margin: 0.5rem 0 0;
		font-weight: 700;
		font-size: 1rem;
	}

	.board-empty span {
		font-size: 0.85rem;
		opacity: 0.8;
	}
</style>
