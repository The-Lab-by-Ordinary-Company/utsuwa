<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		content: string;
		children: Snippet;
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
		delayDuration?: number;
	}

	let {
		content,
		children,
		side = 'top',
		sideOffset = 8,
		delayDuration = 300
	}: Props = $props();
</script>

<TooltipPrimitive.Provider {delayDuration}>
	<TooltipPrimitive.Root>
		<TooltipPrimitive.Trigger class="outline-none inline-flex">
			{@render children()}
		</TooltipPrimitive.Trigger>

		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				class="z-50 max-w-xs px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-button shadow-popover animate-in fade-in-0 zoom-in-95"
				{side}
				{sideOffset}
			>
				{content}
				<TooltipPrimitive.Arrow class="fill-foreground" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
