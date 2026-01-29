<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { Component } from 'svelte';

	interface Props {
		contentKey?: Component | unknown;
		slug?: string;
	}

	let { contentKey, slug }: Props = $props();

	let headings = $state<{ id: string; text: string; level: number }[]>([]);
	let activeId = $state('');

	const editUrl = $derived(
		slug
			? `https://github.com/dyascj/utsuwa/edit/main/src/content/docs/${slug}.md`
			: undefined
	);

	function getActiveHeading(elements: Element[]) {
		const offset = 100;
		for (let i = elements.length - 1; i >= 0; i--) {
			const rect = elements[i].getBoundingClientRect();
			if (rect.top <= offset) {
				return elements[i].id;
			}
		}
		return elements.length > 0 ? elements[0].id : '';
	}

	$effect(() => {
		void contentKey;

		let elements: Element[] = [];

		function onScroll() {
			activeId = getActiveHeading(elements);
		}

		tick().then(() => {
			const article = document.querySelector('.docs-content');
			if (!article) return;

			elements = Array.from(article.querySelectorAll('h2, h3'));
			headings = elements.map((el) => ({
				id: el.id,
				text: el.textContent || '',
				level: parseInt(el.tagName[1])
			}));

			activeId = getActiveHeading(elements);
			window.addEventListener('scroll', onScroll, { passive: true });
		});

		return () => {
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<aside class="toc">
	{#if headings.length > 0}
		<nav>
			<p class="toc-title">On this page</p>
			<ul class="toc-list">
				{#each headings as heading}
					<li>
						<a
							href={`#${heading.id}`}
							class="toc-link"
							class:active={activeId === heading.id}
							class:indent={heading.level === 3}
						>
							{heading.text}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}

	<div class="community">
		<p class="toc-title">Community</p>
		<ul class="community-list">
			{#if editUrl}
				<li>
					<a href={editUrl} target="_blank" rel="noopener noreferrer" class="community-link">
						<Icon name="pencil" size={14} />
						<span>Edit this page</span>
					</a>
				</li>
			{/if}
			<li>
				<a href="https://github.com/dyascj/utsuwa" target="_blank" rel="noopener noreferrer" class="community-link">
					<Icon name="star" size={14} />
					<span>Star on GitHub</span>
				</a>
			</li>
		</ul>
	</div>
</aside>

<style>
	.toc {
		width: 18rem;
		min-width: 18rem;
		max-height: calc(100vh - 3.5rem);
		position: sticky;
		top: 3.5rem;
		align-self: flex-start;
		overflow-y: auto;
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.toc-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--docs-text);
		margin: 0 0 0.75rem;
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-link {
		display: block;
		padding: 0.25rem 0;
		font-size: 0.75rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s;
	}

	.toc-link:hover {
		color: var(--docs-text);
	}

	.toc-link.active {
		color: var(--docs-accent);
		font-weight: 500;
	}

	.toc-link.indent {
		padding-left: 0.75rem;
	}

	.community {
		border-top: 1px solid var(--docs-border);
		padding-top: 1rem;
	}

	.community-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.community-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0;
		font-size: 0.75rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s;
	}

	.community-link:hover {
		color: var(--docs-text);
	}

	@media (max-width: 1024px) {
		.toc {
			display: none;
		}
	}
</style>
