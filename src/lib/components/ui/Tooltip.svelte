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
			<TooltipPrimitive.Content class="ui-tooltip-content" {side} {sideOffset}>
				{content}
				<TooltipPrimitive.Arrow class="fill-foreground" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>

<style>
	:global(.ui-tooltip-content) {
		z-index: 50;
		max-width: 20rem;
		padding: 0.4rem 0.7rem;
		background: var(--text-primary);
		color: var(--bg-primary);
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.4;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		animation: tooltip-in 0.16s var(--ease-brand);
	}

	:global(.ui-tooltip-content[data-state='closed']) {
		animation: tooltip-out 0.1s var(--ease-brand) forwards;
	}

	@keyframes tooltip-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes tooltip-out {
		to {
			opacity: 0;
			transform: scale(0.96);
		}
	}
</style>
