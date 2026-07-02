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
			class="ui-dropdown-content z-50 min-w-[12rem] bg-background border border-border rounded-popover p-1.5 shadow-popover outline-none"
			{align}
			{side}
			{sideOffset}
		>
			{@render children()}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	:global(.ui-dropdown-content) {
		animation: ui-dropdown-in 0.16s var(--ease-brand);
	}

	:global(.ui-dropdown-content[data-state='closed']) {
		animation: ui-dropdown-out 0.13s var(--ease-brand) forwards;
	}

	@keyframes ui-dropdown-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes ui-dropdown-out {
		to {
			opacity: 0;
			transform: translateY(-4px) scale(0.97);
		}
	}
</style>
