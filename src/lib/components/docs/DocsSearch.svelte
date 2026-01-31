<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Props {
		id?: string;
	}

	let { id = 'docs-search' }: Props = $props();

	let query = $state('');
	let results = $state<Array<{ url: string; title: string; excerpt: string }>>([]);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let selectedIndex = $state(0);
	let pagefind = $state<any>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let containerEl = $state<HTMLDivElement | null>(null);

	async function loadPagefind() {
		if (pagefind) return pagefind;
		try {
			// Dynamic path to avoid Vite trying to resolve at build time
			const pagefindPath = '/pagefind/pagefind.js';
			pagefind = await import(/* @vite-ignore */ pagefindPath);
			await pagefind.init();
			return pagefind;
		} catch {
			return null;
		}
	}

	async function search(q: string) {
		if (!q.trim()) {
			results = [];
			return;
		}

		const pf = await loadPagefind();
		if (!pf) {
			results = [];
			return;
		}

		const searchResults = await pf.search(q);
		const items = await Promise.all(
			searchResults.results.slice(0, 8).map(async (r: any) => {
				const data = await r.data();
				return {
					url: data.url,
					title: data.meta?.title || data.url,
					excerpt: data.excerpt || ''
				};
			})
		);
		results = items;
		selectedIndex = 0;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		query = target.value;
		isOpen = true;
		search(query);
	}

	function handleFocus() {
		isOpen = true;
		if (query) search(query);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				e.preventDefault();
				if (results[selectedIndex]) {
					navigateTo(results[selectedIndex].url);
				}
				break;
			case 'Escape':
				e.preventDefault();
				close();
				break;
		}
	}

	function navigateTo(url: string) {
		close();
		// Strip .html extension - Pagefind indexes HTML files but SvelteKit uses clean URLs
		const cleanUrl = url.replace(/\.html$/, '');
		goto(cleanUrl);
	}

	function close() {
		isOpen = false;
		query = '';
		results = [];
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) {
			close();
		}
	}

	export function focus() {
		inputEl?.focus();
	}

	$effect(() => {
		if (browser && isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	const showDropdown = $derived(isOpen && (query.trim().length > 0 || isLoading));
	const isDev = $derived(browser && window.location.hostname === 'localhost');
</script>

<div class="search-container" bind:this={containerEl}>
	<div class="search-input-wrapper">
		<Icon name="search" size={14} />
		<input
			bind:this={inputEl}
			{id}
			type="text"
			placeholder="Search docs..."
			value={query}
			oninput={handleInput}
			onfocus={handleFocus}
			onkeydown={handleKeydown}
			autocomplete="off"
		/>
		<kbd class="shortcut">
			<span class="shortcut-key">{browser && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>
			<span class="shortcut-key">K</span>
		</kbd>
	</div>

	{#if showDropdown}
		<div class="search-dropdown">
			{#if isDev && !pagefind}
				<div class="search-message">Search available in production build</div>
			{:else if isLoading}
				<div class="search-message">Loading...</div>
			{:else if results.length === 0 && query.trim()}
				<div class="search-message">No results for "{query}"</div>
			{:else}
				<ul class="search-results">
					{#each results as result, i}
						<li>
							<button
								type="button"
								class="search-result"
								class:selected={i === selectedIndex}
								onclick={() => navigateTo(result.url)}
							>
								<span class="result-title">{result.title}</span>
								{#if result.excerpt}
									<span class="result-excerpt">{@html result.excerpt}</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
		width: 100%;
		max-width: 280px;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: 0.5rem;
		color: var(--docs-text-muted);
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.search-input-wrapper:focus-within {
		border-color: var(--docs-accent);
		box-shadow: 0 0 0 2px rgba(239, 74, 91, 0.1);
	}

	input {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		outline: none;
		font-size: 0.8125rem;
		color: var(--docs-text);
	}

	input::placeholder {
		color: var(--docs-text-muted);
	}

	.shortcut {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.shortcut-key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.25rem;
		background: var(--docs-bg);
		border: 1px solid var(--docs-border);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 500;
		color: var(--docs-text-muted);
	}

	.search-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: 0.5rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		z-index: 100;
	}

	.search-message {
		padding: 1rem;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
	}

	.search-results {
		list-style: none;
		padding: 0.375rem;
		margin: 0;
		max-height: 400px;
		overflow-y: auto;
	}

	.search-result {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: none;
		border: none;
		border-radius: 0.375rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s;
	}

	.search-result:hover,
	.search-result.selected {
		background: var(--docs-bg);
	}

	.result-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--docs-text);
	}

	.result-excerpt {
		font-size: 0.75rem;
		color: var(--docs-text-muted);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	:global(.search-result mark) {
		background: rgba(239, 74, 91, 0.2);
		color: var(--docs-accent);
		border-radius: 0.125rem;
		padding: 0 0.125rem;
	}

	@media (max-width: 768px) {
		.search-container {
			max-width: 100%;
		}

		.shortcut {
			display: none;
		}
	}
</style>
