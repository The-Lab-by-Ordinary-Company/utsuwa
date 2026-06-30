<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
	let visibleCount = $state(60);

	// Lightbox
	let selected = $state<Item | null>(null);
	let selectedFullUrl = $state<string | null>(null);
	let flipped = $state(false);

	let sentinel = $state<HTMLDivElement>();
	let observer: IntersectionObserver | null = null;

	// Stable, scattered tilt (no random, so it doesn't jiggle on rerender).
	const ROTATIONS = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

	onMount(async () => {
		const records = await listKeepsakes();
		const result: Item[] = [];
		for (const r of records) {
			if (r.thumb) {
				result.push({ ...r, url: r.thumb, isBlobUrl: false });
			} else {
				const url = await getKeepsakeImageUrl(r.id);
				if (url) result.push({ ...r, url, isBlobUrl: true });
			}
		}
		items = result;
		loading = false;
	});

	// Windowed reveal: render 60 at a time, bumping as the sentinel scrolls in.
	$effect(() => {
		if (!sentinel) return;
		observer?.disconnect();
		observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting && visibleCount < items.length) {
				visibleCount = Math.min(visibleCount + 60, items.length);
			}
		});
		observer.observe(sentinel);
		return () => observer?.disconnect();
	});

	onDestroy(() => {
		observer?.disconnect();
		items.forEach((i) => i.isBlobUrl && URL.revokeObjectURL(i.url));
		if (selectedFullUrl && !selected?.isBlobUrl) URL.revokeObjectURL(selectedFullUrl);
	});

	function groupLabel(ms: number): string {
		const week = 7 * 24 * 60 * 60 * 1000;
		if (Date.now() - ms < week) return 'This week';
		return new Date(ms).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	const sections = $derived.by(() => {
		const visible = items.slice(0, visibleCount);
		const groups: { label: string; items: Item[] }[] = [];
		for (const it of visible) {
			const label = groupLabel(it.createdAt);
			const last = groups[groups.length - 1];
			if (last && last.label === label) last.items.push(it);
			else groups.push({ label, items: [it] });
		}
		return groups;
	});

	function shortDate(ms: number): string {
		return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
	function fullDate(ms: number): string {
		return new Date(ms).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function openLightbox(item: Item) {
		selected = item;
		flipped = false;
		selectedFullUrl = item.isBlobUrl ? item.url : await getKeepsakeImageUrl(item.id);
	}
	function closeLightbox() {
		if (selectedFullUrl && !selected?.isBlobUrl) URL.revokeObjectURL(selectedFullUrl);
		selected = null;
		selectedFullUrl = null;
		flipped = false;
	}

	async function forget(id: string) {
		const item = items.find((i) => i.id === id);
		if (item?.isBlobUrl) URL.revokeObjectURL(item.url);
		items = items.filter((i) => i.id !== id);
		await forgetKeepsakeImage(id);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (selected) closeLightbox();
		else onClose();
	}
	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
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
				{#each sections as section (section.label)}
					<div class="section-label">{section.label}</div>
					<div class="section-photos">
						{#each section.items as item, i (item.id)}
							<div class="polaroid" style="--rot: {ROTATIONS[i % ROTATIONS.length]}deg">
								<div class="pin"></div>
								<button class="photo-btn" onclick={() => openLightbox(item)} aria-label="View photo">
									<img src={item.url} alt="" loading="lazy" />
								</button>
								<div class="caption">{shortDate(item.createdAt)}</div>
								<button class="forget-btn" aria-label="Forget this" onclick={() => forget(item.id)}>
									<Icon name="x" size={12} />
								</button>
							</div>
						{/each}
					</div>
				{/each}
				{#if visibleCount < items.length}
					<div class="sentinel" bind:this={sentinel}></div>
				{/if}
			</div>
		{/if}
	</div>
</div>

{#if selected}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
	<div
		class="lightbox"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeLightbox();
		}}
		role="dialog"
		aria-modal="true"
		aria-label="Photo"
		tabindex="-1"
	>
		<button class="lb-close" onclick={closeLightbox} aria-label="Close">
			<Icon name="x" size={18} />
		</button>
		<button class="flip-card" class:flipped onclick={() => (flipped = !flipped)} aria-label="Flip photo">
			<div class="flip-inner">
				<div class="flip-front">
					{#if selectedFullUrl}<img src={selectedFullUrl} alt="" />{/if}
				</div>
				<div class="flip-back">
					<div class="back-content">
						<div class="back-date">{fullDate(selected.createdAt)}</div>
						{#if selected.note}
							<p class="back-note">“{selected.note}”</p>
						{:else}
							<p class="back-empty">She hasn't said much about this one… yet.</p>
						{/if}
					</div>
				</div>
			</div>
		</button>
		<div class="lb-hint">Click the photo to flip it over</div>
	</div>
{/if}

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
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem 1.75rem;
		overflow-y: auto;
	}

	.section-label {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #5a4528;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
		margin: 0.75rem 0 0.25rem;
		padding-left: 0.25rem;
	}

	.section-photos {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem 1rem;
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

	.photo-btn {
		display: block;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		line-height: 0;
		border-radius: 2px;
	}

	.photo-btn img {
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
		z-index: 1;
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

	.sentinel {
		height: 1px;
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

	/* Lightbox */
	.lightbox {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.78);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 1100;
		padding: 2rem;
		animation: fadeIn 0.2s ease-out;
	}

	.lb-close {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		width: 38px;
		height: 38px;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.lb-close:hover {
		transform: scale(1.1);
		background: rgba(255, 255, 255, 0.25);
	}

	.flip-card {
		width: min(82vw, 520px);
		height: min(72vh, 520px);
		perspective: 1400px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.flip-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.55s cubic-bezier(0.4, 0.15, 0.2, 1);
	}

	.flip-card.flipped .flip-inner {
		transform: rotateY(180deg);
	}

	.flip-front,
	.flip-back {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.flip-front {
		background: #111;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.flip-front img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.flip-back {
		transform: rotateY(180deg);
		background: linear-gradient(180deg, #fffdf6 0%, #f3ead4 100%);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		padding: 2rem;
	}

	.back-content {
		text-align: center;
		max-width: 90%;
	}

	.back-date {
		font-size: 0.85rem;
		font-weight: 700;
		color: #8a6d3b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1.25rem;
	}

	.back-note {
		font-size: 1.15rem;
		line-height: 1.6;
		color: #4a3a22;
		font-style: italic;
		margin: 0;
	}

	.back-empty {
		font-size: 1rem;
		color: #9a8455;
		font-style: italic;
		margin: 0;
	}

	.lb-hint {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.flip-inner {
			transition: none;
		}
	}
</style>
