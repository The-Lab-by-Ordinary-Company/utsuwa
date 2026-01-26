<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import type { AppMode } from '$lib/types/character';

	import WelcomeStep from './steps/WelcomeStep.svelte';
	import CharacterStep from './steps/CharacterStep.svelte';
	import AvatarStep from './steps/AvatarStep.svelte';
	import ServicesStep from './steps/ServicesStep.svelte';
	import ModeStep from './steps/ModeStep.svelte';
	import CompleteStep from './steps/CompleteStep.svelte';

	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();

	type Step = 'welcome' | 'character' | 'avatar' | 'services' | 'mode' | 'complete';

	const steps: Step[] = ['welcome', 'character', 'avatar', 'services', 'mode', 'complete'];

	let currentStep = $state<Step>('welcome');
	let direction = $state<'forward' | 'back'>('forward');

	// Form state
	let characterName = $state('Utsuwa');
	let systemPrompt = $state('You are a helpful, but rage-baity assistant named Utsuwa. You speak like a snarky anime girl.');
	let appMode = $state<AppMode>('dating_sim');

	const currentStepIndex = $derived(steps.indexOf(currentStep));

	function goNext() {
		const nextIndex = currentStepIndex + 1;
		if (nextIndex < steps.length) {
			direction = 'forward';

			// Save data when leaving certain steps
			if (currentStep === 'character') {
				characterStore.updatePersona({ name: characterName.trim() || 'Utsuwa', systemPrompt });
			}
			if (currentStep === 'mode') {
				characterStore.setAppMode(appMode);
			}

			currentStep = steps[nextIndex];
		}
	}

	function goBack() {
		const prevIndex = currentStepIndex - 1;
		if (prevIndex >= 0) {
			direction = 'back';
			currentStep = steps[prevIndex];
		}
	}

	function handleComplete() {
		// Mark onboarding complete (sets lastInteraction to prevent re-showing)
		characterStore.markOnboardingComplete();
		onComplete();
	}
</script>

<div class="modal-overlay">
	<div class="modal-container">
		<!-- Progress dots -->
		<div class="progress-dots">
			{#each steps as step, i}
				<div
					class="dot"
					class:active={i === currentStepIndex}
					class:completed={i < currentStepIndex}
				></div>
			{/each}
		</div>

		<!-- Step content -->
		<div class="step-wrapper" class:slide-forward={direction === 'forward'} class:slide-back={direction === 'back'}>
			{#if currentStep === 'welcome'}
				<WelcomeStep onNext={goNext} />
			{:else if currentStep === 'character'}
				<CharacterStep
					name={characterName}
					{systemPrompt}
					onNameChange={(v) => characterName = v}
					onSystemPromptChange={(v) => systemPrompt = v}
					onNext={goNext}
					onBack={goBack}
				/>
			{:else if currentStep === 'avatar'}
				<AvatarStep onNext={goNext} onBack={goBack} />
			{:else if currentStep === 'services'}
				<ServicesStep onNext={goNext} onBack={goBack} />
			{:else if currentStep === 'mode'}
				<ModeStep
					mode={appMode}
					onModeChange={(m) => appMode = m}
					onNext={goNext}
					onBack={goBack}
				/>
			{:else if currentStep === 'complete'}
				<CompleteStep characterName={characterName} onComplete={handleComplete} />
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-container {
		position: relative;
		background: var(--glass-bg-solid);
		border: 1px solid var(--glass-border);
		border-radius: 1.25rem;
		max-width: 420px;
		width: 100%;
		max-height: 85vh;
		overflow: hidden;
		animation: slideUp 0.25s ease-out;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.progress-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-neutral-300);
		transition: all 0.2s;
	}

	.dot.active {
		background: var(--accent);
		transform: scale(1.25);
	}

	.dot.completed {
		background: var(--ctp-green);
	}

	.step-wrapper {
		overflow-y: auto;
		max-height: calc(85vh - 3rem);
	}

	.step-wrapper.slide-forward {
		animation: slideInRight 0.2s ease-out;
	}

	.step-wrapper.slide-back {
		animation: slideInLeft 0.2s ease-out;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
