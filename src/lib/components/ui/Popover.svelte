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
		<PopoverPrimitive.Content
			class="z-50 max-w-xs bg-background border border-border rounded-popover p-4 shadow-popover outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
			{align}
			{side}
			{sideOffset}
		>
			{@render children()}
		</PopoverPrimitive.Content>
	</PopoverPrimitive.Portal>
</PopoverPrimitive.Root>
