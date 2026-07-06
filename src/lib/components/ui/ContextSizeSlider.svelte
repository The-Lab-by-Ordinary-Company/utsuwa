<script lang="ts">
	import {
		CONTEXT_SIZE_STEPS,
		DEFAULT_CONTEXT_SIZE,
		formatContextSize,
		snapContextSize
	} from '$lib/utils/context-window';

	interface Props {
		contextSize: number | undefined;
		onChange: (value: number | undefined) => void;
		toggleClass?: string;
		id?: string;
		note?: string;
	}

	let {
		contextSize,
		onChange,
		toggleClass = 'service-toggle',
		id = 'llm-context-size-toggle',
		note = 'When enabled, memory injection and chat history are scaled to fit the selected model\'s context window.'
	}: Props = $props();

	const enabled = $derived(contextSize !== undefined && contextSize > 0);

	function handleToggle() {
		onChange(enabled ? undefined : DEFAULT_CONTEXT_SIZE);
	}

	function handleSliderInput(e: Event) {
		const index = Number((e.target as HTMLInputElement).value);
		onChange(CONTEXT_SIZE_STEPS[index]);
	}
</script>

<div class="context-size-row">
	<label class="context-size-label" for={id}>
		Context Window
		{#if enabled}
			<span class="context-size-value">{formatContextSize(snapContextSize(contextSize as number))}</span>
		{:else}
			<span class="context-size-value">Default</span>
		{/if}
	</label>
	<button
		{id}
		class={toggleClass}
		class:enabled
		onclick={handleToggle}
		aria-label="Toggle context window scaling"
	>
		<span class="toggle-track">
			<span class="toggle-thumb"></span>
		</span>
	</button>
</div>
{#if enabled}
	<div class="context-size-slider-row">
		<input
			type="range"
			class="context-size-slider"
			min="0"
			max={CONTEXT_SIZE_STEPS.length - 1}
			step="1"
			value={CONTEXT_SIZE_STEPS.indexOf(snapContextSize(contextSize as number))}
			oninput={handleSliderInput}
		/>
		<div class="context-size-ticks">
			{#each CONTEXT_SIZE_STEPS as step}
				<span>{formatContextSize(step)}</span>
			{/each}
		</div>
	</div>
{/if}
<p class="provider-note">{note}</p>

<style>
	.context-size-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.context-size-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.context-size-value {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.context-size-slider-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.context-size-slider {
		width: 100%;
		cursor: pointer;
	}

	.context-size-ticks {
		display: flex;
		justify-content: space-between;
		font-size: 0.65rem;
		color: var(--text-tertiary);
		padding: 0 0.25rem;
	}
</style>
