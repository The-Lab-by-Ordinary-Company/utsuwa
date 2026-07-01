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
		background: var(--bg-secondary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
		box-shadow: var(--shadow-sm);
	}

	.vrm-card:hover {
		transform: translateY(-1px);
		border-color: var(--accent);
		box-shadow: var(--shadow-glow);
	}

	.vrm-card.active {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted), var(--shadow-sm);
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
		background: var(--bg-tertiary);
		overflow: hidden;
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
		color: var(--text-tertiary);
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
		color: #fff;
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
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
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge {
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.02em;
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
		background: var(--color-error);
		border: none;
		border-radius: var(--radius-full);
		color: #fff;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s, box-shadow 0.15s, transform 0.1s;
		box-shadow: var(--shadow-sm);
	}

	.vrm-card:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		box-shadow: var(--shadow-md);
	}

	.delete-btn:active {
		transform: scale(0.94);
	}
</style>
