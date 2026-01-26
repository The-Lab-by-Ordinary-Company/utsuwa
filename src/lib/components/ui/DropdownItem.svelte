<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		onclick?: () => void;
		href?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		children,
		onclick,
		href,
		disabled = false,
		class: className = ''
	}: Props = $props();

	function handleClick() {
		if (onclick) {
			onclick();
		} else if (href) {
			goto(href);
		}
	}
</script>

<DropdownMenu.Item
	class="flex h-10 select-none items-center gap-3 rounded-button px-3 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-muted focus-visible:outline-none cursor-pointer {className}"
	{disabled}
	onclick={handleClick}
>
	{@render children()}
</DropdownMenu.Item>
