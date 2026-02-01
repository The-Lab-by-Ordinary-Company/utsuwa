<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { FactCategory } from '$lib/types/memory';
	import {
		getFactsWithEmbeddings,
		buildGraph,
		filterGraph,
		getConnectedNodes,
		categoryColors,
		type GraphData,
		type GraphNode,
		type GraphFilters
	} from '$lib/services/memory-graph';

	let container: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let graph: any = null;
	let graphData = $state<GraphData>({ nodes: [], links: [] });
	let fullGraphData = $state<GraphData>({ nodes: [], links: [] });
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedNode = $state<GraphNode | null>(null);
	let hoveredNode = $state<GraphNode | null>(null);
	let isDarkMode = $state(true);

	// Filter state
	let showUser = $state(true);
	let showRelationship = $state(true);
	let showSharedExperience = $state(true);
	const similarityThreshold = 0.5; // Fixed threshold

	// Detect dark mode
	function checkDarkMode() {
		if (browser) {
			isDarkMode = document.documentElement.classList.contains('dark');
		}
	}

	// Derived filters
	let filters = $derived<GraphFilters>({
		categories: new Set<FactCategory>(
			[
				showUser && 'user',
				showRelationship && 'relationship',
				showSharedExperience && 'shared_experience'
			].filter(Boolean) as FactCategory[]
		),
		minSimilarity: similarityThreshold
	});

	// Update graph when filters change
	$effect(() => {
		if (fullGraphData.nodes.length > 0) {
			graphData = filterGraph(fullGraphData, filters);
			updateGraphData();
		}
	});

	// Update graph data (triggers physics recalculation)
	function updateGraphData() {
		if (!graph) return;

		graph.graphData({
			nodes: graphData.nodes.map((node) => ({ ...node })),
			links: graphData.links.map((link) => ({ ...link }))
		});

		applyStyles();
	}

	// Apply visual styles without resetting physics
	function applyStyles() {
		if (!graph) return;

		checkDarkMode();

		const connectedToSelected = selectedNode
			? getConnectedNodes(graphData, selectedNode.id)
			: null;

		// Colors that work in both modes
		const baseLinkColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
		const highlightLinkColor = isDarkMode ? 'rgba(1, 178, 255, 0.8)' : 'rgba(0, 153, 221, 0.8)';
		const dimmedLinkColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
		const dimmedNodeColor = isDarkMode ? '#333' : '#ddd';

		graph
			.nodeColor((node: GraphNode) => {
				if (selectedNode) {
					if (node.id === selectedNode.id) return categoryColors[node.category];
					if (connectedToSelected?.has(node.id)) return categoryColors[node.category];
					return dimmedNodeColor;
				}
				return categoryColors[node.category];
			})
			.linkColor((link: { source: GraphNode | number; target: GraphNode | number }) => {
				if (!selectedNode) return baseLinkColor;

				// Check if this link connects to the selected node
				const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
				const targetId = typeof link.target === 'object' ? link.target.id : link.target;

				if (sourceId === selectedNode.id || targetId === selectedNode.id) {
					return highlightLinkColor;
				}
				return dimmedLinkColor;
			})
			.linkWidth((link: { source: GraphNode | number; target: GraphNode | number }) => {
				if (!selectedNode) return 1;

				const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
				const targetId = typeof link.target === 'object' ? link.target.id : link.target;

				if (sourceId === selectedNode.id || targetId === selectedNode.id) {
					return 2;
				}
				return 0.5;
			})
			.linkDirectionalParticleColor(() => isDarkMode ? '#01B2FF' : '#0099dd');
	}

	function handleNodeClick(node: GraphNode) {
		if (selectedNode?.id === node.id) {
			selectedNode = null;
		} else {
			selectedNode = node;
		}
		applyStyles();
	}

	function handleBackgroundClick() {
		selectedNode = null;
		applyStyles();
	}

	function resetView() {
		if (graph) {
			graph.zoomToFit(400, 50);
			selectedNode = null;
			applyStyles();
		}
	}

	async function initGraph() {
		if (!browser) return;

		try {
			loading = true;
			error = null;

			// Load facts
			const facts = await getFactsWithEmbeddings();

			if (facts.length === 0) {
				error = 'No memories with embeddings found. Chat more to build memories!';
				loading = false;
				return;
			}

			// Build graph
			fullGraphData = buildGraph(facts, 0); // Build with threshold 0, filter later
			graphData = filterGraph(fullGraphData, filters);

			// Initialize force-graph
			const ForceGraph = (await import('force-graph')).default;

			checkDarkMode();

			graph = new ForceGraph(container)
				.backgroundColor('transparent')
				// Small nodes like the example
				.nodeRelSize(1)
				.nodeVal(1)
				.nodeId('id')
				.linkSource('source')
				.linkTarget('target')
				// Animated particles flowing along links
				.linkDirectionalParticles(2)
				.linkDirectionalParticleSpeed(0.005)
				.linkDirectionalParticleWidth(1.5)
				// Dynamic physics like the example
				.d3AlphaDecay(0.02)
				.d3VelocityDecay(0.3)
				.warmupTicks(0)
				.cooldownTicks(Infinity)
				// Interactions
				.onNodeClick((node) => handleNodeClick(node as GraphNode))
				.onNodeHover((node) => {
					hoveredNode = node as GraphNode | null;
					container.style.cursor = node ? 'pointer' : 'grab';
				})
				.onBackgroundClick(() => handleBackgroundClick());

			updateGraphData();

			// Fit to view after a short delay
			setTimeout(() => {
				graph?.zoomToFit(400, 50);
			}, 500);

			loading = false;
		} catch (e) {
			console.error('Failed to initialize memory graph:', e);
			error = 'Failed to load memory graph';
			loading = false;
		}
	}

	onMount(() => {
		initGraph();
	});

	onDestroy(() => {
		if (graph) {
			graph._destructor?.();
		}
	});

	// Handle resize
	$effect(() => {
		if (!browser) return;

		const handleResize = () => {
			if (graph && container) {
				graph.width(container.clientWidth).height(container.clientHeight);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Watch for theme changes
	$effect(() => {
		if (!browser) return;

		const observer = new MutationObserver(() => {
			const wasDark = isDarkMode;
			checkDarkMode();
			if (wasDark !== isDarkMode && graph) {
				applyStyles();
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	});
</script>

<div class="memory-graph">
	<!-- Controls -->
	<div class="controls">
		<div class="filter-group">
			<span class="filter-label">Categories</span>
			<div class="category-toggles">
				<label class="category-toggle" style="--cat-color: {categoryColors.user}">
					<input type="checkbox" bind:checked={showUser} />
					<span class="toggle-dot"></span>
					<span>User</span>
				</label>
				<label class="category-toggle" style="--cat-color: {categoryColors.relationship}">
					<input type="checkbox" bind:checked={showRelationship} />
					<span class="toggle-dot"></span>
					<span>Relationship</span>
				</label>
				<label class="category-toggle" style="--cat-color: {categoryColors.shared_experience}">
					<input type="checkbox" bind:checked={showSharedExperience} />
					<span class="toggle-dot"></span>
					<span>Shared</span>
				</label>
			</div>
		</div>

		<button class="reset-btn" onclick={resetView}>Reset View</button>
	</div>

	<!-- Graph container -->
	<div class="graph-container" bind:this={container}>
		{#if loading}
			<div class="loading">
				<div class="spinner"></div>
				<span>Loading memories...</span>
			</div>
		{/if}

		{#if error}
			<div class="error-message">
				<span>{error}</span>
			</div>
		{/if}
	</div>

	<!-- Tooltip -->
	{#if hoveredNode}
		<div class="tooltip">
			<div class="tooltip-category" style="color: {categoryColors[hoveredNode.category]}">
				{hoveredNode.category.replace('_', ' ')}
			</div>
			<div class="tooltip-content">{hoveredNode.content}</div>
			<div class="tooltip-meta">
				Importance: {hoveredNode.importance} · Referenced: {hoveredNode.referenceCount}x
			</div>
		</div>
	{/if}

	<!-- Selected node detail -->
	{#if selectedNode}
		<div class="selected-detail">
			<div class="detail-header">
				<span class="detail-category" style="background: {categoryColors[selectedNode.category]}">
					{selectedNode.category.replace('_', ' ')}
				</span>
				<button class="close-btn" onclick={() => (selectedNode = null)}>×</button>
			</div>
			<div class="detail-content">{selectedNode.content}</div>
			<div class="detail-meta">
				<div>Importance: {selectedNode.importance}</div>
				<div>Referenced: {selectedNode.referenceCount}x</div>
				<div>Created: {new Date(selectedNode.createdAt).toLocaleDateString()}</div>
			</div>
		</div>
	{/if}

	<!-- Stats -->
	<div class="stats">
		{graphData.nodes.length} memories · {graphData.links.length} connections
	</div>
</div>

<style>
	.memory-graph {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--bg-primary);
		overflow: hidden;
	}

	.controls {
		position: absolute;
		top: 1rem;
		left: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: 0.75rem;
		padding: 1rem;
		z-index: 10;
		min-width: 200px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.category-toggles {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.category-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.category-toggle input {
		display: none;
	}

	.toggle-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--bg-tertiary);
		border: 2px solid var(--cat-color);
		transition: all 0.15s;
	}

	.category-toggle input:checked + .toggle-dot {
		background: var(--cat-color);
	}

	.reset-btn {
		padding: 0.5rem 0.75rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-light);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.reset-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.graph-container {
		width: 100%;
		height: 100%;
	}

	.loading,
	.error-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-light);
		border-top-color: #01b2ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.tooltip {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		max-width: 400px;
		z-index: 20;
		pointer-events: none;
	}

	.tooltip-category {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.tooltip-content {
		font-size: 0.875rem;
		color: var(--text-primary);
		line-height: 1.4;
		margin-bottom: 0.5rem;
	}

	.tooltip-meta {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.selected-detail {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: 0.75rem;
		padding: 1rem;
		max-width: 300px;
		z-index: 10;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.detail-category {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		color: white;
	}

	.close-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: none;
		border-radius: 50%;
		color: var(--text-secondary);
		font-size: 1rem;
		cursor: pointer;
	}

	.close-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.detail-content {
		font-size: 0.875rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin-bottom: 0.75rem;
	}

	.detail-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.stats {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
	}
</style>
