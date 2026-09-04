<script lang="ts">
	import { setupThemeWatcher } from '$lib/config/docs-theme';
	import { browser } from '$app/environment';
	import SiteNav from '$lib/components/marketing/SiteNav.svelte';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let blogEl = $state<HTMLDivElement | null>(null);

	// Sync with the shared colorMode/.dark toggle (same as the docs). Still needed
	// here so the blog surface gets its --docs-* variables applied.
	$effect(() => setupThemeWatcher(() => blogEl, browser));
</script>

<div class="docs blog-site grain" bind:this={blogEl}>
	<SiteNav />

	<main class="blog-main" data-pagefind-body>
		{@render children()}
	</main>

	<SiteFooter />
</div>

<style>
	.blog-site {
		min-height: 100vh;
		background: var(--bg-page);
		color: var(--docs-text);
		font-family: var(--font-sans);
	}

	/* The wider editorial canvas matches the shared nav/footer shell. */
	.blog-main {
		max-width: 83rem;
		margin: 0 auto;
		padding: clamp(4rem, 8vw, 6.5rem) 1.5rem clamp(6rem, 10vw, 9rem);
	}

	@media (max-width: 768px) {
		.blog-main {
			padding: 3rem 1rem 5rem;
		}
	}
</style>
