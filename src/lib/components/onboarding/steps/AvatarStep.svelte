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
		<div class="header-icon">
			<Icon name="user" size={24} />
			<div class="header-icon-shine"></div>
		</div>
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
		background: linear-gradient(180deg, #66d9ff 0%, #01B2FF 40%, #0099dd 100%);
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow:
			0 6px 20px rgba(1, 178, 255, 0.4),
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
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
		opacity: 0.8;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.model-card:hover {
		opacity: 1;
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.model-card.active {
		border-color: #01B2FF;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%);
		opacity: 1;
		box-shadow:
			0 4px 16px rgba(1, 178, 255, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	:global(.dark) .model-card {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .model-card:hover {
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.model-card.active .model-name {
		color: white;
	}

	.model-card.active .default-badge {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.model-card.active .model-preview {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.model-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: var(--bg-tertiary);
		border-radius: var(--radius-sm);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
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
		background: white;
		color: #01B2FF;
		border-radius: 50%;
	}

	.model-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.default-badge {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-tertiary);
		background: var(--bg-tertiary);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-xs);
	}

	.upload-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 248, 248, 0.4) 100%);
		border: 2px dashed rgba(0, 0, 0, 0.15);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
		min-height: 120px;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.upload-card:hover {
		border-color: #01B2FF;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.12) 0%, rgba(1, 178, 255, 0.06) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.6),
			0 0 12px rgba(1, 178, 255, 0.15);
	}

	:global(.dark) .upload-card {
		background: linear-gradient(180deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.4) 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .upload-card:hover {
		border-color: #01B2FF;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.15) 0%, rgba(1, 178, 255, 0.08) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 0 16px rgba(1, 178, 255, 0.25);
	}

	.upload-icon {
		color: var(--text-tertiary);
		transition: all 0.2s;
	}

	.upload-card:hover .upload-icon {
		color: #01B2FF;
	}

	.upload-text {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		transition: all 0.2s;
	}

	.upload-card:hover .upload-text {
		color: #01B2FF;
	}

	.uploader-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.uploader-container {
		background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid rgba(255, 255, 255, 0.8);
		border-radius: var(--radius-xl);
		max-width: 400px;
		width: 90%;
		overflow: hidden;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .uploader-container {
		background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.uploader-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%);
	}

	:global(.dark) .uploader-header {
		border-bottom-color: rgba(255, 255, 255, 0.08);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
	}

	.uploader-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all 0.2s;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .close-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.close-btn:hover {
		background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
		color: var(--text-primary);
	}

	:global(.dark) .close-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
		color: var(--text-primary);
	}

	.uploader-container :global(.uploader) {
		margin: 1rem;
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
