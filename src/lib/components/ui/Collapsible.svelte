<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		trigger: Snippet<[{ open: boolean }]>;
		children: Snippet;
		disabled?: boolean;
		class?: string;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		trigger,
		children,
		disabled = false,
		class: className = ''
	}: Props = $props();

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		onOpenChange?.(isOpen);
	}
</script>

<CollapsiblePrimitive.Root
	{open}
	onOpenChange={handleOpenChange}
	{disabled}
	class="w-full {className}"
>
	<CollapsiblePrimitive.Trigger class="flex w-full outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-button">
		{@render trigger({ open })}
	</CollapsiblePrimitive.Trigger>

	<CollapsiblePrimitive.Content class="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
		{@render children()}
	</CollapsiblePrimitive.Content>
</CollapsiblePrimitive.Root>

<style>
	@keyframes collapsible-down {
		from {
			height: 0;
			opacity: 0;
		}
		to {
			height: var(--bits-collapsible-content-height);
			opacity: 1;
		}
	}

	@keyframes collapsible-up {
		from {
			height: var(--bits-collapsible-content-height);
			opacity: 1;
		}
		to {
			height: 0;
			opacity: 0;
		}
	}

	:global(.animate-collapsible-down) {
		animation: collapsible-down 0.2s ease-out;
	}

	:global(.animate-collapsible-up) {
		animation: collapsible-up 0.2s ease-out;
	}
</style>
