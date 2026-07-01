<script lang="ts">
	import { goto } from '$app/navigation';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { Dropdown, DropdownItem, DropdownSeparator, Icon } from '$lib/components/ui';
	import { localPath } from '$lib/config/links';

	const activeModel = $derived(vrmStore.getActiveModel());
</script>

<header class="header">
	<div class="header-left">
		<a href={localPath('app')} class="logo-link">
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
				<DropdownItem onclick={() => goto(localPath('app', '/settings/vrm'))}>
					<Icon name="user" size={16} />
					Change Avatar
				</DropdownItem>
				<DropdownItem onclick={() => goto(localPath('app', '/settings/relationship'))}>
					<Icon name="heart" size={16} />
					Relationship
				</DropdownItem>
				<DropdownItem onclick={() => goto(localPath('app', '/settings'))}>
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
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-subtle);
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
		padding: 0.375rem 0.875rem 0.375rem 0.5rem;
		border-radius: var(--radius-full);
		border: 1px solid transparent;
		background: transparent;
		transition: background 0.15s ease-out, border-color 0.15s ease-out;
	}

	.logo-link:hover {
		background: var(--bg-secondary);
	}

	.logo {
		color: var(--accent);
	}

	.logo-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
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
		border-radius: var(--radius-full);
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out;
	}

	.avatar-btn:hover {
		background: var(--bg-secondary);
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		overflow: hidden;
		border: 1px solid var(--border-light);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chevron {
		color: var(--text-tertiary);
		transition: transform 0.15s ease-out;
	}

	:global([data-state='open']) .chevron {
		transform: rotate(180deg);
	}

	:global([data-state='open']) .avatar-btn {
		background: var(--bg-secondary);
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
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
		color: var(--text-primary);
	}

	.model-type {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
</style>
