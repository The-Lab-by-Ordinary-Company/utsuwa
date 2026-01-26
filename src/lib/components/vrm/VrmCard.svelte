<script lang="ts">
	import type { VrmModel } from '$lib/stores/vrm.svelte';
	import { Icon } from '$lib/components/ui';

	interface Props {
		model: VrmModel;
		isActive: boolean;
		onSelect: () => void;
		onDelete?: () => void;
	}

	let { model, isActive, onSelect, onDelete }: Props = $props();
</script>

<div class="vrm-card" class:active={isActive}>
	<button class="card-content" onclick={onSelect}>
		<div class="preview">
			{#if model.previewUrl}
				<img src={model.previewUrl} alt={model.name} />
			{:else}
				<div class="preview-placeholder">
					<Icon name="user" size={32} strokeWidth={1.5} />
				</div>
			{/if}
			{#if isActive}
				<div class="active-badge">
					<Icon name="check" size={14} strokeWidth={3} />
				</div>
			{/if}
		</div>
		<div class="info">
			<span class="name">{model.name}</span>
			{#if model.isDefault}
				<span class="badge">Default</span>
			{/if}
		</div>
	</button>

	{#if !model.isDefault && onDelete}
		<button class="delete-btn" onclick={onDelete} title="Delete model">
			<Icon name="trash" size={16} />
		</button>
	{/if}
</div>

<style>
	.vrm-card {
		position: relative;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 1rem;
		overflow: hidden;
		transition: all 0.15s;
	}

	:global(.dark) .vrm-card {
		background: var(--color-neutral-800);
		border-color: var(--color-neutral-700);
	}

	.vrm-card:hover {
		border-color: var(--color-neutral-300);
	}

	:global(.dark) .vrm-card:hover {
		border-color: var(--color-neutral-600);
	}

	.vrm-card.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	:global(.dark) .vrm-card.active {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
	}

	.preview {
		position: relative;
		aspect-ratio: 1;
		background: var(--color-neutral-200);
		overflow: hidden;
	}

	:global(.dark) .preview {
		background: var(--color-neutral-700);
	}

	.preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: var(--color-neutral-400);
	}

	.active-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 50%;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem;
	}

	.name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-neutral-800);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .name {
		color: var(--color-neutral-200);
	}

	.badge {
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
		border-radius: 0.25rem;
		text-transform: uppercase;
	}

	:global(.dark) .badge {
		background: color-mix(in srgb, var(--accent) 20%, transparent);
	}

	.delete-btn {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--color-error) 90%, transparent);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.vrm-card:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background: var(--color-error);
	}
</style>
