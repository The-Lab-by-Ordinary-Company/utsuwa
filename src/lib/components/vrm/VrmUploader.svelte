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
		gap: 0.5rem;
		aspect-ratio: 1;
		background: var(--ctp-surface0);
		border: 2px dashed var(--ctp-overlay0);
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.uploader:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	:global(.dark) .uploader:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.uploader.dragging {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	:global(.dark) .uploader.dragging {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
	}

	.icon {
		color: var(--ctp-overlay0);
		transition: color 0.15s;
	}

	.uploader:hover .icon,
	.uploader.dragging .icon {
		color: var(--accent);
	}

	.label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ctp-text);
	}

	.hint {
		font-size: 0.75rem;
		color: var(--ctp-subtext0);
	}
</style>
