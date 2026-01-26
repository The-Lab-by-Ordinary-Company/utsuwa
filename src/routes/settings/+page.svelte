<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/settings/persona', { replaceState: true });
	});
</script>

<div class="redirect">
	<p>Redirecting to settings...</p>
</div>

<style>
	.redirect {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color-neutral-500);
	}
</style>
