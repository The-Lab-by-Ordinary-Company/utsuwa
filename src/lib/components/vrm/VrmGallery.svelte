<script lang="ts">
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import VrmCard from './VrmCard.svelte';
	import VrmUploader from './VrmUploader.svelte';

	async function handleUpload(file: File) {
		await vrmStore.addModel(file);
	}

	async function handleDelete(id: string) {
		await vrmStore.removeModel(id);
	}

	function handleSelect(id: string) {
		vrmStore.setActiveModel(id);
	}
</script>

<div class="gallery">
	<VrmUploader onUpload={handleUpload} />

	{#each vrmStore.models as model (model.id)}
		<VrmCard
			{model}
			isActive={model.id === vrmStore.activeModelId}
			onSelect={() => handleSelect(model.id)}
			onDelete={model.isDefault ? undefined : () => handleDelete(model.id)}
		/>
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
	}
</style>
