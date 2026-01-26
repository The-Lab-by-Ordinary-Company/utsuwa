<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import VrmUploader from '$lib/components/vrm/VrmUploader.svelte';

	interface Props {
		onNext: () => void;
		onBack: () => void;
	}

	let { onNext, onBack }: Props = $props();

	let showUploader = $state(false);

	async function handleUpload(file: File) {
		await vrmStore.addModel(file);
		showUploader = false;
	}

	function selectModel(id: string) {
		vrmStore.setActiveModel(id);
	}
</script>

<div class="step-content">
	<div class="step-header">
		<Icon name="user" size={24} />
		<h2 class="title">Choose Your Avatar</h2>
		<p class="subtitle">Select a VRM model or upload your own</p>
	</div>

	<div class="gallery">
		{#each vrmStore.models as model (model.id)}
			<button
				class="model-card"
				class:active={model.id === vrmStore.activeModelId}
				onclick={() => selectModel(model.id)}
			>
				<div class="model-preview">
					{#if model.previewUrl}
						<img src={model.previewUrl} alt={model.name} />
					{:else}
						<Icon name="user" size={32} />
					{/if}
					{#if model.id === vrmStore.activeModelId}
						<div class="active-badge">
							<Icon name="check" size={14} strokeWidth={3} />
						</div>
					{/if}
				</div>
				<span class="model-name">{model.name}</span>
				{#if model.isDefault}
					<span class="default-badge">Default</span>
				{/if}
			</button>
		{/each}

		<button class="upload-card" onclick={() => showUploader = true}>
			<div class="upload-icon">
				<Icon name="upload" size={24} />
			</div>
			<span class="upload-text">Upload VRM</span>
		</button>
	</div>

	{#if showUploader}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="uploader-overlay" onclick={() => showUploader = false}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="uploader-container" onclick={(e) => e.stopPropagation()}>
				<div class="uploader-header">
					<h3>Upload VRM Model</h3>
					<button class="close-btn" onclick={() => showUploader = false}>
						<Icon name="x" size={18} />
					</button>
				</div>
				<VrmUploader onUpload={handleUpload} />
			</div>
		</div>
	{/if}

	<div class="actions">
		<button class="back-btn" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			Back
		</button>
		<button class="next-btn" onclick={onNext}>
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

	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.75rem;
	}

	.model-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.model-card:hover {
		border-color: var(--color-neutral-300);
	}

	.model-card.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.model-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: var(--color-neutral-200);
		border-radius: 0.5rem;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-neutral-400);
	}

	.model-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.active-badge {
		position: absolute;
		top: 0.375rem;
		right: 0.375rem;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 50%;
	}

	.model-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-neutral-700);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.default-badge {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-neutral-500);
		background: var(--color-neutral-200);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.upload-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: transparent;
		border: 2px dashed var(--color-neutral-300);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 120px;
	}

	.upload-card:hover {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.upload-icon {
		color: var(--color-neutral-400);
	}

	.upload-card:hover .upload-icon {
		color: var(--accent);
	}

	.upload-text {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-neutral-500);
	}

	.uploader-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.uploader-container {
		background: var(--color-background);
		border-radius: 1rem;
		max-width: 400px;
		width: 90%;
		overflow: hidden;
	}

	.uploader-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-neutral-200);
	}

	.uploader-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-neutral-900);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		color: var(--color-neutral-600);
		cursor: pointer;
		border-radius: 0.375rem;
	}

	.close-btn:hover {
		background: var(--color-neutral-100);
	}

	.uploader-container :global(.uploader) {
		margin: 1rem;
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
