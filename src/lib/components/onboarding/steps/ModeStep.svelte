<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import type { AppMode } from '$lib/types/character';

	interface Props {
		mode: AppMode;
		onModeChange: (mode: AppMode) => void;
		onNext: () => void;
		onBack: () => void;
	}

	let { mode, onModeChange, onNext, onBack }: Props = $props();
</script>

<div class="step-content">
	<div class="step-header">
		<Icon name="heart" size={24} />
		<h2 class="title">Choose Your Mode</h2>
		<p class="subtitle">Pick how you want to interact with your companion</p>
	</div>

	<div class="mode-cards">
		<button
			class="mode-card"
			class:selected={mode === 'companion'}
			onclick={() => onModeChange('companion')}
		>
			<div class="mode-icon">
				<Icon name="sparkles" size={24} />
			</div>
			<h3 class="mode-title">Companion Mode</h3>
			<p class="mode-description">A helpful AI assistant focused on conversation and utility</p>

			<div class="mode-features">
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Mood tracking</span>
				</div>
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Energy system</span>
				</div>
				<div class="feature disabled">
					<Icon name="x" size={14} />
					<span>Relationship stats</span>
				</div>
				<div class="feature disabled">
					<Icon name="x" size={14} />
					<span>Events & milestones</span>
				</div>
				<div class="feature disabled">
					<Icon name="x" size={14} />
					<span>Stage progression</span>
				</div>
			</div>

			{#if mode === 'companion'}
				<div class="selected-badge">
					<Icon name="check" size={14} />
					Selected
				</div>
			{/if}
		</button>

		<button
			class="mode-card"
			class:selected={mode === 'dating_sim'}
			onclick={() => onModeChange('dating_sim')}
		>
			<div class="mode-icon dating">
				<Icon name="heart" size={24} />
			</div>
			<h3 class="mode-title">Dating Sim Mode</h3>
			<p class="mode-description">Full relationship experience with progression and events</p>

			<div class="mode-features">
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Mood tracking</span>
				</div>
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Energy system</span>
				</div>
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Relationship stats</span>
				</div>
				<div class="feature">
					<Icon name="check" size={14} />
					<span>Events & milestones</span>
				</div>
				<div class="feature">
					<Icon name="check" size={14} />
					<span>8 relationship stages</span>
				</div>
			</div>

			{#if mode === 'dating_sim'}
				<div class="selected-badge">
					<Icon name="check" size={14} />
					Selected
				</div>
			{/if}
		</button>
	</div>

	<p class="mode-note">
		<Icon name="info" size={14} />
		You can change this later in settings
	</p>

	<div class="actions">
		<button class="back-btn" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			Back
		</button>
		<button class="next-btn" onclick={onNext}>
			Finish Setup
			<Icon name="chevron-right" size={16} />
		</button>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		gap: 1rem;
	}

	.step-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		color: var(--accent);
	}

	.title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-neutral-900);
		margin: 0;
	}

	.subtitle {
		font-size: 0.8rem;
		color: var(--color-neutral-600);
		margin: 0;
	}

	.mode-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (max-width: 500px) {
		.mode-cards {
			grid-template-columns: 1fr;
		}
	}

	.mode-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.875rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.mode-card:hover {
		border-color: var(--color-neutral-300);
	}

	.mode-card.selected {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.mode-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-radius: 50%;
		color: var(--accent);
	}

	.mode-icon.dating {
		background: color-mix(in srgb, var(--ctp-pink) 15%, transparent);
		color: var(--ctp-pink);
	}

	.mode-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-neutral-900);
		margin: 0;
	}

	.mode-description {
		font-size: 0.75rem;
		color: var(--color-neutral-600);
		margin: 0;
		line-height: 1.4;
	}

	.mode-features {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.375rem;
		width: 100%;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		color: var(--ctp-green);
	}

	.feature.disabled {
		color: var(--color-neutral-400);
	}

	.selected-badge {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--accent-foreground);
		background: var(--accent);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
	}

	.mode-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.7rem;
		color: var(--color-neutral-500);
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.25rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-neutral-700);
		cursor: pointer;
		transition: all 0.15s;
	}

	.back-btn:hover {
		background: var(--color-neutral-200);
	}

	.next-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1.25rem;
		background: var(--accent);
		color: var(--accent-foreground);
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.next-btn:hover {
		filter: brightness(1.1);
	}
</style>
