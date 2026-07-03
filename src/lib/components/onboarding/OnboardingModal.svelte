<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { DEFAULT_SYSTEM_PROMPT, type AppMode } from '$lib/types/character';
	import { pop, fadeFast } from '$lib/utils/motion';

	import './onboarding.css';
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
	let systemPrompt = $state(DEFAULT_SYSTEM_PROMPT);
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

<!-- First-run onboarding is not dismissible by backdrop click: an accidental
     click there used to permanently complete onboarding and skip the persona
     save. Completion happens only via the final step's button. -->
<div class="modal-overlay" out:fadeFast={{ duration: 200 }}>
	<div class="modal-container" out:pop={{ duration: 220, y: 12 }}>
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

		<!-- Step content. Keyed so the slide animation replays on every step
		     change, not just when the direction class flips. -->
		<div class="step-wrapper">
			{#key currentStep}
			<div class="step-slide" class:slide-forward={direction === 'forward'} class:slide-back={direction === 'back'}>
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
			{/key}
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(28, 43, 51, 0.28);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
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
		background: var(--bg-primary);
		border-radius: var(--radius-xl);
		max-width: 440px;
		width: 100%;
		max-height: 85vh;
		overflow: hidden;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.98);
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
		gap: 6px;
		padding: 1.75rem 1.5rem 0;
		position: relative;
		z-index: 1;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--border-light);
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.dot.active {
		width: 22px;
		background: var(--accent);
	}

	.dot.completed {
		background: var(--accent);
	}

	.step-wrapper {
		overflow-y: auto;
		max-height: calc(85vh - 3rem);
	}

	.step-slide.slide-forward {
		animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.step-slide.slide-back {
		animation: slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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
