<script lang="ts">
	import type { SceneChoice } from '$lib/types/events';

	interface Props {
		choices: SceneChoice[];
		onSelect: (index: number) => void;
	}

	let { choices, onSelect }: Props = $props();
</script>

<div class="choices-container">
	{#each choices as choice, index}
		<button
			class="choice-btn"
			onclick={() => onSelect(index)}
			style="animation-delay: {index * 0.1}s"
		>
			<span class="choice-number">{index + 1}</span>
			<span class="choice-text">{choice.text}</span>
		</button>
	{/each}
</div>

<style>
	.choices-container {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.choice-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		text-align: left;
		color: var(--text-primary);
		cursor: pointer;
		transition: background 0.15s, transform 0.15s;
		animation: slideIn 0.3s ease-out backwards;
	}

	@keyframes slideIn {
		from {
			transform: translateX(-10px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.choice-btn:hover {
		background: var(--accent-muted);
		transform: translateX(3px);
	}

	.choice-btn:active {
		transform: translateX(3px) scale(0.98);
	}

	.choice-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--accent-muted);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
		color: var(--accent);
	}

	.choice-text {
		flex: 1;
		line-height: 1.5;
		font-size: 0.9rem;
	}
</style>
