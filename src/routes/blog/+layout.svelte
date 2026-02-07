<script lang="ts">
	import DocsHeader from '$lib/components/docs/DocsHeader.svelte';
	import { lightVars, darkVars, resolveTheme, applyVars } from '$lib/config/docs-theme';
	import { browser } from '$app/environment';

	let { children } = $props();
	let blogEl = $state<HTMLDivElement | null>(null);

	function updateTheme() {
		if (!blogEl) return;
		applyVars(blogEl, resolveTheme() === 'dark' ? darkVars : lightVars);
	}

	$effect(() => {
		if (!blogEl || !browser) return;

		updateTheme();

		const onStorage = () => updateTheme();
		window.addEventListener('storage', onStorage);

		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', updateTheme);

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-docs-theme', 'class']
		});

		return () => {
			window.removeEventListener('storage', onStorage);
			mql.removeEventListener('change', updateTheme);
			observer.disconnect();
		};
	});
</script>

<div class="docs" bind:this={blogEl}>
	<DocsHeader hideSearch />
	<main class="blog-main" data-pagefind-body>
		{@render children()}
	</main>
</div>

<style>
	.docs {
		min-height: 100vh;
		background: var(--docs-bg);
		color: var(--docs-text);
		font-family: 'M PLUS Rounded 1c', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.blog-main {
		max-width: 64rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	@media (max-width: 768px) {
		.blog-main {
			padding: 1.5rem 1rem;
		}
	}
</style>
