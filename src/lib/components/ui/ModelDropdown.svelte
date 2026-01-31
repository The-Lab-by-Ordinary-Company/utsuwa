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

	const isDisabled = $derived(disabled || isLoading);

	const selectedModel = $derived(models.find((m) => m.id === value));
</script>

<div class="model-dropdown-wrapper">
	<DropdownMenu.Root>
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
				<div class="model-dropdown-scroll">
					{#each models as model (model.id)}
						<DropdownMenu.Item
							class="model-item {value === model.id ? 'selected' : ''}"
							onSelect={() => onSelect(model.id)}
						>
							<span class="model-name">{model.name}</span>
							{#if value === model.id}
								<span class="check-icon">
									<Icon name="check" size={14} strokeWidth={2.5} />
								</span>
							{/if}
						</DropdownMenu.Item>
					{/each}
					{#if models.length === 0 && !isLoading}
						<div class="no-models">No models available</div>
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
		padding: 0.625rem 0.75rem;
		background: var(--color-neutral-50);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--color-neutral-900);
		text-align: left;
	}

	:global(.model-dropdown-trigger:hover:not(:disabled)) {
		border-color: var(--color-neutral-400);
	}

	:global(.model-dropdown-trigger:focus) {
		outline: none;
		border-color: var(--accent);
	}

	:global(.model-dropdown-trigger:disabled) {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.trigger-label {
		flex: 1;
		font-weight: 500;
	}

	.trigger-placeholder {
		flex: 1;
		color: var(--color-neutral-500);
	}

	.trigger-loading {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-neutral-500);
	}

	.loading-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--color-neutral-300);
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
		padding: 0 0.625rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		color: var(--color-neutral-600);
		cursor: pointer;
		transition: all 0.15s;
	}

	.refresh-btn:hover {
		background: var(--color-neutral-200);
		color: var(--color-neutral-800);
	}

	:global(.model-dropdown-content) {
		z-index: 1050;
		min-width: 200px;
		max-width: 300px;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 0.375rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		animation: modelSlideDown 0.15s ease-out;
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
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.1s;
		outline: none;
	}

	:global(.model-item:hover),
	:global(.model-item[data-highlighted]) {
		background: var(--color-neutral-100);
	}

	:global(.model-item.selected) {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
	}

	.model-name {
		flex: 1;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-neutral-700);
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
		color: var(--color-neutral-500);
	}
</style>
