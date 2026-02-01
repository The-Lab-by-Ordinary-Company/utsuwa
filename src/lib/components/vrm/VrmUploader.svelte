<script lang="ts">
	import { Icon } from '$lib/components/ui';

	interface Props {
		onUpload: (file: File) => void;
	}

	let { onUpload }: Props = $props();
	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const file = e.dataTransfer?.files[0];
		if (file && file.name.endsWith('.vrm')) {
			onUpload(file);
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file && file.name.endsWith('.vrm')) {
			onUpload(file);
		}
		// Reset input
		input.value = '';
	}

	function handleClick() {
		fileInput?.click();
	}
</script>

<div
	class="uploader"
	class:dragging={isDragging}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
	<input
		type="file"
		accept=".vrm"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none;"
	/>

	<div class="icon">
		<Icon name="upload" size={32} strokeWidth={1.5} />
	</div>
	<span class="label">Upload VRM</span>
	<span class="hint">Drag & drop or click to browse</span>
</div>

<style>
	.uploader {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		aspect-ratio: 1;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 248, 248, 0.6) 100%);
		border: 2px dashed rgba(0, 0, 0, 0.15);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .uploader {
		background: linear-gradient(180deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.6) 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.uploader:hover {
		border-color: #01B2FF;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.12) 0%, rgba(1, 178, 255, 0.06) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.6),
			0 0 16px rgba(1, 178, 255, 0.15);
	}

	:global(.dark) .uploader:hover {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.18) 0%, rgba(1, 178, 255, 0.1) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 0 20px rgba(1, 178, 255, 0.25);
	}

	.uploader.dragging {
		border-color: #01B2FF;
		border-style: solid;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.2) 0%, rgba(1, 178, 255, 0.12) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			0 0 24px rgba(1, 178, 255, 0.3);
		transform: scale(1.02);
	}

	:global(.dark) .uploader.dragging {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.25) 0%, rgba(1, 178, 255, 0.15) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 0 30px rgba(1, 178, 255, 0.4);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%);
		border-radius: 50%;
		color: var(--text-tertiary);
		transition: all 0.2s;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .icon {
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.uploader:hover .icon,
	.uploader.dragging .icon {
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		color: white;
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.uploader:hover .hint,
	.uploader.dragging .hint {
		color: #01B2FF;
	}
</style>
