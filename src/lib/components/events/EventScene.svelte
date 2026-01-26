<script lang="ts">
	import type { Scene, SceneChoice, EventType } from '$lib/types/events';
	import type { StateUpdates } from '$lib/types/character';
	import { Icon } from '$lib/components/ui';
	import ChoiceDialog from './ChoiceDialog.svelte';

	interface Props {
		scene: Scene;
		eventName?: string;
		eventType?: EventType;
		companionName?: string;
		onComplete: (choiceIndex?: number, stateChanges?: Partial<StateUpdates>) => void;
		onClose: () => void;
	}

	let { scene, eventName, eventType, companionName = 'Companion', onComplete, onClose }: Props = $props();

	// Get icon based on event type
	const eventIcon = $derived.by(() => {
		switch (eventType) {
			case 'milestone': return 'sparkles';
			case 'anniversary': return 'calendar';
			case 'conditional': return 'heart';
			case 'scheduled': return 'clock';
			case 'random': return 'shuffle';
			default: return 'sparkles';
		}
	});

	let phase = $state<'intro' | 'dialogue' | 'choices' | 'response' | 'outro'>('intro');
	let selectedChoice = $state<SceneChoice | null>(null);
	let selectedChoiceIndex = $state<number | null>(null);

	// Skip intro if not present
	$effect(() => {
		if (phase === 'intro' && !scene.intro) {
			phase = 'dialogue';
		}
	});

	function advance() {
		switch (phase) {
			case 'intro':
				phase = 'dialogue';
				break;
			case 'dialogue':
				if (scene.choices && scene.choices.length > 0) {
					phase = 'choices';
				} else if (scene.outro) {
					phase = 'outro';
				} else {
					completeScene();
				}
				break;
			case 'response':
				if (scene.outro) {
					phase = 'outro';
				} else {
					completeScene();
				}
				break;
			case 'outro':
				completeScene();
				break;
		}
	}

	function handleChoice(index: number) {
		if (!scene.choices) return;

		selectedChoice = scene.choices[index];
		selectedChoiceIndex = index;
		phase = 'response';
	}

	function completeScene() {
		if (selectedChoice) {
			onComplete(selectedChoiceIndex ?? undefined, selectedChoice.stateChanges);
		} else {
			onComplete();
		}
	}
</script>

<div class="scene-overlay" onclick={advance} role="button" tabindex="0" onkeypress={(e) => e.key === 'Enter' && advance()}>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="scene-container" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && onClose()} role="dialog" aria-modal="true" tabindex="-1">
		<!-- Header with event title -->
		{#if eventName}
			<div class="scene-header">
				<div class="event-title">
					<Icon name={eventIcon} size={18} />
					<span>{eventName}</span>
				</div>
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<Icon name="x" size={16} />
				</button>
			</div>
		{:else}
			<button class="close-btn floating" onclick={onClose} aria-label="Close">
				<Icon name="x" size={16} />
			</button>
		{/if}

		<div class="scene-content">
			<!-- Intro phase -->
			{#if phase === 'intro' && scene.intro}
				<div class="scene-intro">
					<p class="intro-text">{scene.intro}</p>
					<button class="continue-btn" onclick={advance}>Continue</button>
				</div>
			{/if}

			<!-- Dialogue phase -->
			{#if phase === 'dialogue' && scene.dialogue}
				<div class="scene-dialogue">
					<div class="speaker-name">{companionName}</div>
					<p class="dialogue-text">"{scene.dialogue}"</p>
					{#if !scene.choices || scene.choices.length === 0}
						<button class="continue-btn" onclick={advance}>Continue</button>
					{/if}
				</div>
			{/if}

			<!-- Choices phase -->
			{#if phase === 'choices' && scene.choices}
				<div class="scene-choices">
					<div class="speaker-name">{companionName}</div>
					<p class="dialogue-text">"{scene.dialogue}"</p>
					<ChoiceDialog choices={scene.choices} onSelect={handleChoice} />
				</div>
			{/if}

			<!-- Response phase (after choice) -->
			{#if phase === 'response' && selectedChoice}
				<div class="scene-response">
					<div class="your-choice">
						<span class="choice-label">You said:</span>
						<p class="choice-text">"{selectedChoice.text}"</p>
					</div>
					<div class="speaker-name">{companionName}</div>
					<p class="dialogue-text">"{selectedChoice.response}"</p>
					<button class="continue-btn" onclick={advance}>Continue</button>
				</div>
			{/if}

			<!-- Outro phase -->
			{#if phase === 'outro' && scene.outro}
				<div class="scene-outro">
					<p class="outro-text">{scene.outro}</p>
					<button class="continue-btn" onclick={advance}>Finish</button>
				</div>
			{/if}

			<!-- Click to continue hint -->
			{#if phase !== 'choices'}
				<div class="hint">Click anywhere to continue</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.scene-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.scene-container {
		position: relative;
		background: var(--glass-bg-solid);
		border: 1px solid var(--glass-border);
		border-radius: 1.25rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow: hidden;
		animation: slideUp 0.3s ease-out;
		box-shadow:
			0 4px 24px color-mix(in srgb, var(--accent) 15%, transparent),
			0 0 0 1px color-mix(in srgb, var(--ctp-base) 50%, transparent) inset;
	}

	:global(.dark) .scene-container {
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.5),
			0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent) inset;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px) scale(0.98);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	/* Header */
	.scene-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--ctp-pink) 15%, transparent);
		background: color-mix(in srgb, var(--ctp-pink) 5%, transparent);
	}

	:global(.dark) .scene-header {
		background: color-mix(in srgb, var(--ctp-pink) 12%, transparent);
		border-color: color-mix(in srgb, var(--ctp-pink) 20%, transparent);
	}

	.event-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--ctp-pink);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: var(--color-neutral-200);
		border: none;
		border-radius: 0.5rem;
		color: var(--ctp-overlay1);
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: var(--color-neutral-300);
		color: var(--ctp-text);
	}

	.close-btn.floating {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
	}

	/* Content */
	.scene-content {
		padding: 1.5rem;
		overflow-y: auto;
		max-height: calc(80vh - 60px);
	}

	.intro-text,
	.outro-text {
		font-style: italic;
		color: var(--ctp-overlay1);
		text-align: center;
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.speaker-name {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--ctp-pink);
		font-weight: 600;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
		padding: 0.25rem 0.625rem;
		background: color-mix(in srgb, var(--ctp-pink) 10%, transparent);
		border-radius: 1rem;
	}

	:global(.dark) .speaker-name {
		background: color-mix(in srgb, var(--ctp-pink) 20%, transparent);
	}

	.dialogue-text {
		color: var(--ctp-text);
		font-size: 1rem;
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.your-choice {
		background: color-mix(in srgb, var(--ctp-mauve) 8%, transparent);
		border-left: 3px solid var(--ctp-mauve);
		padding: 0.75rem 1rem;
		margin-bottom: 1.25rem;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	:global(.dark) .your-choice {
		background: color-mix(in srgb, var(--ctp-mauve) 12%, transparent);
	}

	.choice-label {
		font-size: 0.7rem;
		color: var(--ctp-overlay1);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.choice-text {
		color: var(--ctp-text);
		margin: 0.25rem 0 0;
	}

	.continue-btn {
		display: block;
		width: 100%;
		padding: 0.75rem;
		background: var(--accent);
		border: none;
		border-radius: 0.625rem;
		color: var(--accent-foreground);
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.continue-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.continue-btn:active {
		transform: translateY(0);
	}

	.hint {
		text-align: center;
		color: var(--ctp-overlay0);
		font-size: 0.7rem;
		margin-top: 1rem;
	}
</style>
