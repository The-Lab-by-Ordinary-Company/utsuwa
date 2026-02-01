<script lang="ts">
	import { goto } from '$app/navigation';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { Dropdown, DropdownItem, DropdownSeparator, Icon } from '$lib/components/ui';

	const activeModel = $derived(vrmStore.getActiveModel());
</script>

<header class="header">
	<div class="header-left">
		<a href="/" class="logo-link">
			<div class="logo">
				<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="6" fill="none" opacity="0.3"/>
					<circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="4" fill="none" opacity="0.6"/>
					<circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.8"/>
				</svg>
			</div>
			<span class="logo-text">Utsuwa</span>
		</a>
	</div>

	<div class="header-right">
		<Dropdown align="end" side="bottom" sideOffset={8}>
			{#snippet trigger()}
				<div class="avatar-btn">
					<div class="avatar">
						{#if activeModel?.previewUrl}
							<img src={activeModel.previewUrl} alt={activeModel.name} />
						{:else}
							<Icon name="user" size={20} />
						{/if}
					</div>
					<span class="chevron">
						<Icon name="chevron-down" size={14} />
					</span>
				</div>
			{/snippet}

			{#snippet children()}
				<!-- Model Info -->
				<div class="dropdown-header">
					<span class="model-name">{activeModel?.name || 'No model'}</span>
					<span class="model-type">{activeModel?.isDefault ? 'Default' : 'Custom'}</span>
				</div>

				<DropdownSeparator />

				<!-- Menu Items -->
				<DropdownItem onclick={() => goto('/settings/vrm')}>
					<Icon name="user" size={16} />
					Change Avatar
				</DropdownItem>
				<DropdownItem onclick={() => goto('/settings/relationship')}>
					<Icon name="heart" size={16} />
					Relationship
				</DropdownItem>
				<DropdownItem onclick={() => goto('/settings')}>
					<Icon name="settings" size={16} />
					Settings
				</DropdownItem>
			{/snippet}
		</Dropdown>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		position: relative;
		z-index: 50;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
	}

	.logo {
		color: var(--color-primary-500);
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 600;
		background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem 0.375rem 0.375rem;
		border-radius: 2rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		cursor: pointer;
		transition: all 0.15s ease-out;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .avatar-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.avatar-btn:hover {
		border-color: #01B2FF;
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.12),
			0 0 0 2px rgba(1, 178, 255, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .avatar-btn:hover {
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 0 0 2px rgba(1, 178, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .avatar {
		background: linear-gradient(180deg, #444444 0%, #333333 100%);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chevron {
		color: var(--color-neutral-500);
		transition: transform 0.15s ease-out;
	}

	:global([data-state='open']) .chevron {
		transform: rotate(180deg);
	}

	.dropdown-header {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
	}

	.model-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-neutral-800);
	}

	.model-type {
		font-size: 0.75rem;
		color: var(--color-neutral-500);
	}
</style>
