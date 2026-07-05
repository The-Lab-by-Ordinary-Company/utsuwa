<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { Icon } from '$lib/components/ui';

	interface Model {
		id: string;
		name: string;
	}

	interface Props {
		models: Model[];
		value: string | null | undefined;
		onSelect: (modelId: string) => void;
		placeholder?: string;
		isLoading?: boolean;
		onRefresh?: () => void;
		disabled?: boolean;
		disabledMessage?: string;
	}

	let {
		models,
		value,
		onSelect,
		placeholder = 'Select model...',
		isLoading = false,
		onRefresh,
		disabled = false,
		disabledMessage = 'Enter API key first'
	}: Props = $props();

	let searchQuery = $state('');
	let open = $state(false);

	const isDisabled = $derived(disabled || isLoading);

	const selectedModel = $derived(models.find((m) => m.id === value));

	// Always include the currently selected model, even if it doesn't match the filter
	const filteredModels = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return models;
		const filtered = models.filter(
			(m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
		);
		if (selectedModel && !filtered.some((m) => m.id === selectedModel.id)) {
			return [selectedModel, ...filtered];
		}
		return filtered;
	});

	function handleSelect(modelId: string) {
		searchQuery = '';
		onSelect(modelId);
	}

	// Clear the search filter when the dropdown closes so reopening starts fresh.
	$effect(() => {
		if (!open) searchQuery = '';
	});
</script>

<div class="model-dropdown-wrapper">
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger class="model-dropdown-trigger" disabled={isDisabled}>
			{#if isLoading}
				<span class="trigger-loading">
					<span class="loading-spinner"></span>
					Fetching models...
				</span>
			{:else if disabled}
				<span class="trigger-placeholder">{disabledMessage}</span>
			{:else if selectedModel}
				<span class="trigger-label">{selectedModel.name}</span>
			{:else}
				<span class="trigger-placeholder">{placeholder}</span>
			{/if}
			{#if !isLoading}
				<Icon name="chevron-down" size={14} />
			{/if}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content class="model-dropdown-content" align="start" sideOffset={4}>
				<div class="search-row">
					<Icon name="search" size={14} />
					<input
						type="text"
						class="search-input"
						placeholder="Search models..."
						bind:value={searchQuery}
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => e.stopPropagation()}
					/>
					{#if searchQuery}
						<button class="search-clear" onclick={() => (searchQuery = '')}>
							<Icon name="x" size={12} />
						</button>
					{/if}
				</div>
				<div class="model-dropdown-scroll">
					{#each filteredModels as model (model.id)}
						<DropdownMenu.Item
							class="model-item {value === model.id ? 'selected' : ''}"
							onSelect={() => handleSelect(model.id)}
						>
							<span class="model-name">{model.name}</span>
							{#if value === model.id}
								<span class="check-icon">
									<Icon name="check" size={14} strokeWidth={2.5} />
								</span>
							{/if}
						</DropdownMenu.Item>
					{/each}
					{#if filteredModels.length === 0 && !isLoading}
						<div class="no-models">No models found</div>
					{/if}
				</div>
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>

	{#if onRefresh && !isLoading}
		<button class="refresh-btn" onclick={onRefresh} title="Refresh models">
			<Icon name="refresh-cw" size={14} />
		</button>
	{/if}
</div>

<style>
	.model-dropdown-wrapper {
		display: flex;
		gap: 0.375rem;
		align-items: stretch;
	}

	:global(.model-dropdown-trigger) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 0.75rem 1rem;
		background: var(--bg-tertiary);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--text-primary);
		text-align: left;
	}

	:global(.model-dropdown-trigger:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	:global(.model-dropdown-trigger:focus),
	:global(.model-dropdown-trigger[data-state='open']) {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	:global(.model-dropdown-trigger:disabled) {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.trigger-label {
		flex: 1;
		font-weight: 500;
	}

	.trigger-placeholder {
		flex: 1;
		color: var(--text-tertiary);
	}

	.trigger-loading {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-tertiary);
	}

	.loading-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--border-light);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.75rem;
		background: var(--bg-tertiary);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
	}

	.refresh-btn:hover {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		color: var(--text-primary);
	}

	.refresh-btn:active {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	.refresh-btn:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	:global(.model-dropdown-content) {
		z-index: 1050;
		min-width: 200px;
		max-width: 300px;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		padding: 0.375rem;
		box-shadow: var(--shadow-lg);
		animation: modelSlideDown 0.16s var(--ease-brand);
	}

	@keyframes modelSlideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.search-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		margin-bottom: 0.25rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.search-row :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--text-primary);
	}

	.search-input::placeholder {
		color: var(--text-tertiary);
	}

	.search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}

	.search-clear:hover {
		color: var(--text-primary);
	}

	:global(.model-dropdown-content[data-state='closed']) {
		animation: modelSlideUp 0.13s var(--ease-brand) forwards;
	}

	@keyframes modelSlideUp {
		to {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	.model-dropdown-scroll {
		max-height: 280px;
		overflow-y: auto;
	}

	:global(.model-item) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		outline: none;
	}

	:global(.model-item:hover),
	:global(.model-item[data-highlighted]) {
		background: var(--bg-secondary);
	}

	:global(.model-item.selected) {
		background: var(--accent-muted);
	}

	.model-name {
		flex: 1;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.check-icon {
		display: flex;
		align-items: center;
		color: var(--accent);
	}

	.no-models {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}
</style>
