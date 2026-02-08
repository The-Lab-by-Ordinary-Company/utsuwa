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
		background: linear-gradient(180deg, #3a3a3e 0%, #2e2e32 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		text-align: left;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: all 0.2s;
		animation: slideIn 0.3s ease-out backwards;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
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
		background: linear-gradient(180deg, #444448 0%, #383838 100%);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateX(3px);
	}

	.choice-btn:active {
		transform: translateX(3px) scale(0.98);
		background: linear-gradient(180deg, #3a3a3e 0%, #2e2e32 100%);
	}

	.choice-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: linear-gradient(180deg, #4dd0ff, #01B2FF);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
		color: white;
		box-shadow: 0 2px 6px rgba(1, 178, 255, 0.4);
	}

	.choice-text {
		flex: 1;
		line-height: 1.5;
		font-size: 0.9rem;
	}
</style>
