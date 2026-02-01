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
		<!-- Progress dots (hidden on complete step) -->
		{#if currentStep !== 'complete'}
			<div class="progress-dots">
				{#each steps as step, i}
					<div
						class="dot"
						class:active={i === currentStepIndex}
						class:completed={i < currentStepIndex}
					></div>
				{/each}
			</div>
		{/if}

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
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-container {
		position: relative;
		background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid rgba(255, 255, 255, 0.8);
		border-radius: var(--radius-xl);
		max-width: 440px;
		width: 100%;
		max-height: 85vh;
		overflow: hidden;
		animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .modal-container {
		background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.progress-dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 1.5rem 1.5rem 0.5rem;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		background: linear-gradient(180deg, #e8e8e8 0%, #c8c8c8 100%);
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.7),
			0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.dot.active {
		width: 32px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			0 0 16px rgba(1, 178, 255, 0.5),
			0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.dot.completed {
		background: linear-gradient(180deg, #a0a0a0 0%, #808080 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 1px 2px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .dot {
		background: linear-gradient(180deg, #404040 0%, #2a2a2a 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.4);
	}

	:global(.dark) .dot.active {
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 20px rgba(1, 178, 255, 0.6),
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .dot.completed {
		background: linear-gradient(180deg, #606060 0%, #404040 100%);
	}

	.step-wrapper {
		overflow-y: auto;
		max-height: calc(85vh - 3.5rem);
	}

	.step-wrapper.slide-forward {
		animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.step-wrapper.slide-back {
		animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(16px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-16px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
