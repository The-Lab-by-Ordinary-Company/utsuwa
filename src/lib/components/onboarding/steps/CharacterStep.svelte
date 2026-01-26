<script lang="ts">
	import { Icon } from '$lib/components/ui';

	interface Props {
		name: string;
		systemPrompt: string;
		onNameChange: (name: string) => void;
		onSystemPromptChange: (prompt: string) => void;
		onNext: () => void;
		onBack: () => void;
	}

	let { name, systemPrompt, onNameChange, onSystemPromptChange, onNext, onBack }: Props = $props();

	const isValid = $derived(name.trim().length > 0);
</script>

<div class="step-content">
	<div class="step-header">
		<Icon name="user" size={24} />
		<h2 class="title">Name Your Companion</h2>
		<p class="subtitle">Give your AI companion a name and personality</p>
	</div>

	<div class="form-group">
		<label for="name" class="label">Name</label>
		<input
			id="name"
			type="text"
			class="input"
			value={name}
			oninput={(e) => onNameChange(e.currentTarget.value)}
			placeholder="Enter a name..."
		/>
	</div>

	<div class="form-group">
		<label for="personality" class="label">Core Personality</label>
		<textarea
			id="personality"
			class="textarea"
			value={systemPrompt}
			oninput={(e) => onSystemPromptChange(e.currentTarget.value)}
			placeholder="Describe their personality, speaking style, background..."
			rows="5"
		></textarea>
		<span class="hint">This shapes how your companion talks and behaves</span>
	</div>

	<div class="actions">
		<button class="back-btn" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			Back
		</button>
		<button class="next-btn" onclick={onNext} disabled={!isValid}>
			Next
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

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-neutral-700);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.input {
		padding: 0.625rem 0.875rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-neutral-900);
		transition: border-color 0.15s;
	}

	.input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.textarea {
		padding: 0.625rem 0.875rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.8rem;
		color: var(--color-neutral-900);
		font-family: inherit;
		resize: vertical;
		min-height: 90px;
		line-height: 1.5;
		transition: border-color 0.15s;
	}

	.textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.hint {
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

	.next-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.next-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
