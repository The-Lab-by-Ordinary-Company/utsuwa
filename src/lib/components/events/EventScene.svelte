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
		overlay?: boolean;
		onComplete: (choiceIndex?: number, stateChanges?: Partial<StateUpdates>) => void;
		onClose: () => void;
	}

	let { scene, eventName, eventType, companionName = 'Companion', overlay = false, onComplete, onClose }: Props = $props();

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

<div class="scene-overlay" class:overlay onclick={advance} role="button" tabindex="0" onkeypress={(e) => e.key === 'Enter' && advance()}>
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

	.scene-overlay.overlay {
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.scene-container {
		position: relative;
		background: linear-gradient(180deg, #3a3a3e 0%, #2c2c30 50%, #222224 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.25rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow: hidden;
		animation: slideUp 0.3s ease-out;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 2px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3);
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
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		background: linear-gradient(180deg, #3e3e42 0%, #333336 100%);
	}

	.event-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: #01B2FF;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
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
		color: rgba(255, 255, 255, 0.6);
		text-align: center;
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.speaker-name {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: #01B2FF;
		font-weight: 600;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
		padding: 0.25rem 0.625rem;
		background: linear-gradient(180deg, #3a3a3e 0%, #2a2a2e 100%);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.dialogue-text {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.your-choice {
		background: rgba(0, 0, 0, 0.2);
		border-left: 3px solid #01B2FF;
		padding: 0.75rem 1rem;
		margin-bottom: 1.25rem;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.choice-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.choice-text {
		color: rgba(255, 255, 255, 0.9);
		margin: 0.25rem 0 0;
	}

	.continue-btn {
		display: block;
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(180deg, #66d9ff 0%, #4dd0ff 25%, #01B2FF 60%, #0099dd 100%);
		border: none;
		border-radius: 0.625rem;
		color: white;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 4px 16px rgba(1, 178, 255, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.continue-btn:hover {
		background: linear-gradient(180deg, #80e0ff 0%, #66d9ff 25%, #1ebfff 60%, #00a6e6 100%);
		transform: translateY(-1px);
		box-shadow:
			0 6px 24px rgba(1, 178, 255, 0.55),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.continue-btn:active {
		transform: translateY(0);
	}

	.hint {
		text-align: center;
		color: rgba(255, 255, 255, 0.35);
		font-size: 0.7rem;
		margin-top: 1rem;
	}
</style>
