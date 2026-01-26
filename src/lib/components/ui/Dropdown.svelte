<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
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
		align = 'end',
		side = 'bottom',
		sideOffset = 8
	}: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="outline-none select-none">
		{@render trigger()}
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="z-50 min-w-[12rem] bg-background border border-border rounded-popover p-1.5 shadow-popover outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
			{align}
			{side}
			{sideOffset}
		>
			{@render children()}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
