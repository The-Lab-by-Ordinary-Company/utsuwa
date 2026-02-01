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
		padding: 0.75rem 1rem;
		background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--text-primary);
		text-align: left;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	:global(.dark .model-dropdown-trigger) {
		background: linear-gradient(180deg, #1a1a1a 0%, #222222 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	:global(.model-dropdown-trigger:hover:not(:disabled)) {
		border-color: rgba(0, 0, 0, 0.2);
	}

	:global(.dark .model-dropdown-trigger:hover:not(:disabled)) {
		border-color: rgba(255, 255, 255, 0.15);
	}

	:global(.model-dropdown-trigger:focus) {
		outline: none;
		border-color: #01B2FF;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			0 0 0 3px rgba(1, 178, 255, 0.2),
			0 0 12px rgba(1, 178, 255, 0.15);
	}

	:global(.dark .model-dropdown-trigger:focus) {
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			0 0 0 3px rgba(1, 178, 255, 0.25),
			0 0 16px rgba(1, 178, 255, 0.2);
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
		border-top-color: #01B2FF;
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
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .refresh-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.refresh-btn:hover {
		background: linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .refresh-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
	}

	.refresh-btn:active {
		transform: translateY(0);
		background: linear-gradient(180deg, #e8e8e8 0%, #e0e0e0 100%);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.model-dropdown-content) {
		z-index: 1050;
		min-width: 200px;
		max-width: 300px;
		background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-lg);
		padding: 0.375rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
		animation: modelSlideDown 0.15s ease-out;
	}

	:global(.dark .model-dropdown-content) {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s;
		outline: none;
	}

	:global(.model-item:hover),
	:global(.model-item[data-highlighted]) {
		background: linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark .model-item:hover),
	:global(.dark .model-item[data-highlighted]) {
		background: linear-gradient(180deg, #333333 0%, #2a2a2a 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	:global(.model-item.selected) {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.15) 0%, rgba(1, 178, 255, 0.1) 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	:global(.dark .model-item.selected) {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.2) 0%, rgba(1, 178, 255, 0.12) 100%);
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
		color: #01B2FF;
	}

	.no-models {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}
</style>
