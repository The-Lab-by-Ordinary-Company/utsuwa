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
		<div class="header-icon">
			<Icon name="heart" size={24} />
			<div class="header-icon-shine"></div>
		</div>
		<h2 class="title">Choose Your Mode</h2>
		<p class="subtitle">Pick how you want to interact with your companion</p>
	</div>

	<div class="mode-cards">
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
		padding: 1.5rem;
		gap: 1.25rem;
	}

	.step-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.header-icon {
		position: relative;
		width: 56px;
		height: 56px;
		background: linear-gradient(180deg, #ff8fab 0%, #ff6b9d 40%, #e63973 100%);
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow:
			0 6px 20px rgba(255, 107, 157, 0.4),
			0 3px 8px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 2px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.header-icon-shine {
		position: absolute;
		top: 3px;
		left: 15%;
		right: 15%;
		height: 40%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.75rem 0.75rem 50% 50%;
		pointer-events: none;
	}

	.title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.mode-cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.mode-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 2px solid rgba(0, 0, 0, 0.08);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.mode-card:hover {
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.mode-card.selected {
		border-color: #01B2FF;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.08) 0%, rgba(1, 178, 255, 0.12) 100%);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.2),
			0 0 20px rgba(1, 178, 255, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .mode-card {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .mode-card:hover {
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .mode-card.selected {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.12) 0%, rgba(1, 178, 255, 0.08) 100%);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.25),
			0 0 24px rgba(1, 178, 255, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.mode-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		background: linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%);
		border-radius: 50%;
		color: var(--text-tertiary);
		transition: all 0.2s;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .mode-icon {
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.mode-card.selected .mode-icon {
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		color: white;
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.mode-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.mode-description {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.mode-features {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.5rem;
		width: 100%;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #01B2FF;
	}

	.feature.disabled {
		color: var(--text-tertiary);
	}

	.selected-badge {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-full);
		box-shadow:
			0 2px 6px rgba(1, 178, 255, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.mode-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.back-btn:hover {
		background: linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.back-btn:active {
		transform: translateY(0);
		background: linear-gradient(180deg, #e8e8e8 0%, #e0e0e0 100%);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .back-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .back-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
	}

	.next-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%);
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.35),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.next-btn:hover {
		background: linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%);
		transform: translateY(-2px);
		box-shadow:
			0 6px 18px rgba(1, 178, 255, 0.45),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.next-btn:active {
		transform: translateY(0);
		background: linear-gradient(180deg, #0099dd 0%, #0088cc 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}
</style>
