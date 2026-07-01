<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import Icon from './Icon.svelte';

	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		options: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		onValueChange?: (value: string) => void;
		class?: string;
	}

	let {
		options,
		value = $bindable(),
		placeholder = 'Select...',
		disabled = false,
		onValueChange,
		class: className = ''
	}: Props = $props();

	function handleValueChange(v: string | undefined) {
		if (v !== undefined) {
			value = v;
			onValueChange?.(v);
		}
	}

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? placeholder);
</script>

<SelectPrimitive.Root
	type="single"
	{value}
	onValueChange={handleValueChange}
	{disabled}
>
	<SelectPrimitive.Trigger class="select-trigger {className}">
		<span class="select-value" class:placeholder={!value}>{selectedLabel}</span>
		<span class="select-icon">
			<Icon name="chevron-down" size={16} />
		</span>
	</SelectPrimitive.Trigger>

	<SelectPrimitive.Portal>
		<SelectPrimitive.Content class="select-content" sideOffset={4}>
			{#each options as option}
				<SelectPrimitive.Item
					class="select-item"
					value={option.value}
					disabled={option.disabled}
				>
					{option.label}
					{#if option.value === value}
						<span class="select-item-indicator">
							<Icon name="check" size={14} />
						</span>
					{/if}
				</SelectPrimitive.Item>
			{/each}
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
</SelectPrimitive.Root>

<style>
	:global(.select-trigger) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.7rem 0.9rem;
		background: var(--bg-tertiary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		outline: none;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	:global(.select-trigger:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	:global(.select-trigger:focus-visible),
	:global(.select-trigger[data-state='open']) {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	:global(.select-trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.select-value.placeholder) {
		color: var(--text-tertiary);
	}

	:global(.select-icon) {
		display: inline-flex;
		color: var(--text-tertiary);
		transition:
			transform 0.15s ease,
			color 0.15s ease;
	}

	:global(.select-trigger[data-state='open'] .select-icon) {
		transform: rotate(180deg);
		color: var(--accent);
	}

	:global(.select-content) {
		z-index: 100;
		min-width: 12rem;
		max-height: 20rem;
		overflow-y: auto;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		padding: 0.375rem;
		box-shadow: var(--shadow-lg);
		animation: select-in 0.15s ease-out;
	}

	@keyframes select-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.select-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.6rem 0.7rem;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--text-secondary);
		cursor: pointer;
		outline: none;
		transition:
			background 0.1s ease,
			color 0.1s ease;
	}

	:global(.select-item:hover),
	:global(.select-item[data-highlighted]) {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	:global(.select-item[data-state='checked']) {
		background: var(--accent-muted);
		color: var(--accent);
		font-weight: 500;
	}

	:global(.select-item[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.select-item-indicator) {
		display: inline-flex;
		color: var(--accent);
	}
</style>
