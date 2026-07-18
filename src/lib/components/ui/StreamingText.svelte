<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		text: string;
		/** Per-word cadence; <= 0 renders instantly. */
		speedMs?: number;
		onComplete?: () => void;
	}

	let { text, speedMs = 60, onComplete }: Props = $props();

	const reducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	// Whitespace kept as segments so spacing renders exactly as written;
	// words carry their index, whitespace carries -1
	const segments = $derived.by(() => {
		let wordIndex = 0;
		return text
			.split(/(\s+)/)
			.filter((s) => s !== '')
			.map((s) => ({ text: s, index: /^\s+$/.test(s) ? -1 : wordIndex++ }));
	});
	const wordCount = $derived(segments.filter((s) => s.index >= 0).length);

	let shown = $state(0);

	const instant = $derived(speedMs <= 0 || reducedMotion);
	const revealing = $derived(!instant && shown < wordCount);

	$effect(() => {
		// Re-run (and reset) whenever the message changes
		const _text = text;
		if (instant) {
			shown = wordCount;
			onComplete?.();
			return;
		}
		shown = 0;
		const timer = setInterval(() => {
			shown += 1;
			if (shown >= wordCount) {
				clearInterval(timer);
				onComplete?.();
			}
		}, speedMs);
		return () => clearInterval(timer);
	});
</script>

<span class="streaming-text">
	{#each segments as segment, i (i)}
		{#if segment.index < 0}{segment.text}{:else}
			<span class="word" class:shown={instant || segment.index < shown}>{segment.text}</span>
		{/if}
	{/each}
	{#if revealing}<span class="caret" aria-hidden="true"></span>{/if}
</span>

<style>
	.streaming-text {
		white-space: pre-wrap;
	}

	.word {
		opacity: 0;
	}

	.word.shown {
		opacity: 1;
		transition: opacity 0.24s ease-out;
	}

	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 2px;
		vertical-align: text-bottom;
		background: var(--text-secondary);
		animation: caret-blink 1s steps(2, start) infinite;
	}

	@keyframes caret-blink {
		to {
			visibility: hidden;
		}
	}
</style>
