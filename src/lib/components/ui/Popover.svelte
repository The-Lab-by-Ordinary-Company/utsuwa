<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		trigger: Snippet;
		children: Snippet;
		align?: 'start' | 'center' | 'end';
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
	}

	let {
		trigger,
		children,
		align = 'start',
		side = 'bottom',
		sideOffset = 8
	}: Props = $props();
</script>

<PopoverPrimitive.Root>
	<PopoverPrimitive.Trigger class="outline-none select-none inline-flex">
		{@render trigger()}
	</PopoverPrimitive.Trigger>

	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content class="popover-content" {align} {side} {sideOffset}>
			{@render children()}
		</PopoverPrimitive.Content>
	</PopoverPrimitive.Portal>
</PopoverPrimitive.Root>

<style>
	:global(.popover-content) {
		z-index: 50;
		max-width: 20rem;
		padding: 1rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		outline: none;
		animation: popover-in 0.16s var(--ease-brand);
	}

	:global(.popover-content[data-state='closed']) {
		animation: popover-out 0.13s var(--ease-brand) forwards;
	}

	@keyframes popover-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes popover-out {
		to {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
	}
</style>
