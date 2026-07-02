<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { vrmStore } from '$lib/stores/vrm.svelte';

	interface Props {
		characterName: string;
		onComplete: () => void;
	}

	let { characterName, onComplete }: Props = $props();

	const activeModel = $derived(vrmStore.models.find((m) => m.id === vrmStore.activeModelId));
</script>

<div class="ob-step ob-step--center">
	<div class="avatar">
		{#if activeModel?.previewUrl}
			<img src={activeModel.previewUrl} alt={activeModel.name} />
		{:else}
			<div class="avatar-fallback">
				<Icon name="user" size={40} />
			</div>
		{/if}
	</div>

	<div class="ob-head">
		<h2 class="ob-title">Meet {characterName}</h2>
		<p class="ob-subtitle">Your companion is ready — say hello whenever you like.</p>
	</div>

	<button class="btn btn-primary btn-lg btn-block" onclick={onComplete}>
		Start chatting
		<Icon name="arrow-right" size={16} />
	</button>
</div>

<style>
	.avatar {
		width: 104px;
		height: 104px;
		border-radius: var(--radius-xl);
		overflow: hidden;
		background: var(--bg-secondary);
		box-shadow: var(--shadow-md);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
	}
</style>
