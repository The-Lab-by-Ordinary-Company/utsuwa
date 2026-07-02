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

	/* Main content. Top padding matches the hero rhythm on the landing and
	   download pages so every marketing page starts at the same height. */
	.blog-main {
		max-width: 64rem;
		margin: 0 auto;
		padding: clamp(3rem, 8vw, 5rem) 1.5rem clamp(4rem, 8vw, 6rem);
	}

	@media (max-width: 768px) {
		.blog-main {
			padding: 2.5rem 1rem 3rem;
		}
	}
</style>
