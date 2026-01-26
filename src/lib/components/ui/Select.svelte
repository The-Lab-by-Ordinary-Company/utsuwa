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
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: var(--color-neutral-50);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.625rem;
		color: var(--color-neutral-900);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease-out;
		outline: none;
	}

	:global(.select-trigger:hover:not(:disabled)) {
		border-color: var(--color-neutral-300);
	}

	:global(.select-trigger:focus-visible) {
		border-color: var(--color-primary-400);
	}

	:global(.select-trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.dark .select-trigger) {
		background: var(--color-neutral-900);
		border-color: var(--color-neutral-700);
		color: var(--color-neutral-100);
	}

	:global(.dark .select-trigger:hover:not(:disabled)) {
		border-color: var(--color-neutral-600);
	}

	:global(.select-value.placeholder) {
		color: var(--color-neutral-500);
	}

	:global(.select-icon) {
		color: var(--color-neutral-500);
		transition: transform 0.15s ease-out;
	}

	:global(.select-trigger[data-state='open'] .select-icon) {
		transform: rotate(180deg);
	}

	:global(.select-content) {
		z-index: 100;
		min-width: 12rem;
		max-height: 20rem;
		overflow-y: auto;
		background: var(--color-neutral-50);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.625rem;
		padding: 0.375rem;
		box-shadow:
			0 10px 38px -10px rgba(0, 0, 0, 0.15),
			0 10px 20px -15px rgba(0, 0, 0, 0.1);
		animation: select-in 0.15s ease-out;
	}

	:global(.dark .select-content) {
		background: var(--color-neutral-900);
		border-color: var(--color-neutral-700);
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
		padding: 0.625rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-neutral-700);
		cursor: pointer;
		outline: none;
		transition: background 0.1s ease-out;
	}

	:global(.select-item:hover),
	:global(.select-item[data-highlighted]) {
		background: var(--color-neutral-100);
	}

	:global(.select-item[data-state='checked']) {
		font-weight: 500;
		color: var(--color-neutral-900);
	}

	:global(.select-item[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.dark .select-item) {
		color: var(--color-neutral-300);
	}

	:global(.dark .select-item:hover),
	:global(.dark .select-item[data-highlighted]) {
		background: var(--color-neutral-800);
	}

	:global(.dark .select-item[data-state='checked']) {
		color: var(--color-neutral-100);
	}

	:global(.select-item-indicator) {
		color: var(--color-primary-500);
	}
</style>
