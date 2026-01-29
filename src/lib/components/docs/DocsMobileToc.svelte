<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { tick } from 'svelte';
	import type { Component } from 'svelte';

	interface Props {
		contentKey?: Component | unknown;
	}

	let { contentKey }: Props = $props();

	let headings = $state<{ id: string; text: string; level: number }[]>([]);
	let open = $state(false);

	$effect(() => {
		void contentKey;

		tick().then(() => {
			const article = document.querySelector('.docs-content');
			if (!article) return;

			const elements = article.querySelectorAll('h2, h3');
			headings = Array.from(elements).map((el) => ({
				id: el.id,
				text: el.textContent || '',
				level: parseInt(el.tagName[1])
			}));
			open = false;
		});
	});

	function handleClick() {
		open = false;
	}
</script>

{#if headings.length > 0}
	<button class="mobile-toc-trigger" onclick={() => (open = true)} aria-label="On this page">
		<Icon name="list" size={16} />
		<span>On This Page</span>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="mobile-toc-overlay" onclick={() => (open = false)} onkeydown={(e) => e.key === 'Escape' && (open = false)}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="mobile-toc-panel" onclick={(e) => e.stopPropagation()}>
				<div class="mobile-toc-header">
					<span>On This Page</span>
					<button class="mobile-toc-close" onclick={() => (open = false)} aria-label="Close">
						&times;
					</button>
				</div>
				<ul class="mobile-toc-list">
					{#each headings as heading}
						<li>
							<a
								href={`#${heading.id}`}
								class="mobile-toc-link"
								class:indent={heading.level === 3}
								onclick={handleClick}
							>
								{heading.text}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
{/if}

<style>
	.mobile-toc-trigger {
		display: none;
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 20;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: var(--docs-surface);
		color: var(--docs-text);
		border: 1px solid var(--docs-border);
		border-radius: 0.5rem;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: background 0.15s;
	}

	.mobile-toc-trigger:hover {
		background: var(--docs-border);
	}

	@media (max-width: 1024px) {
		.mobile-toc-trigger {
			display: inline-flex;
		}
	}

	.mobile-toc-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.mobile-toc-panel {
		width: 100%;
		max-width: 480px;
		max-height: 60vh;
		background: var(--docs-bg);
		border: 1px solid var(--docs-border);
		border-bottom: none;
		border-radius: 0.75rem 0.75rem 0 0;
		overflow-y: auto;
	}

	.mobile-toc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--docs-text);
		border-bottom: 1px solid var(--docs-border);
		position: sticky;
		top: 0;
		background: var(--docs-bg);
	}

	.mobile-toc-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: var(--docs-text-muted);
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.mobile-toc-list {
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;
	}

	.mobile-toc-link {
		display: block;
		padding: 0.5rem 1.25rem;
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s, background 0.15s;
	}

	.mobile-toc-link:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
	}

	.mobile-toc-link.indent {
		padding-left: 2rem;
	}
</style>
