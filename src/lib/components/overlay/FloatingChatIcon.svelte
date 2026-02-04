<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { overlayStore } from '$lib/stores/overlay.svelte';

	const isExpanded = $derived(overlayStore.chatExpanded);

	function handleClick() {
		overlayStore.toggleChat();
	}
</script>

<button
	class="floating-chat-icon"
	class:expanded={isExpanded}
	onclick={handleClick}
	aria-label={isExpanded ? 'Collapse chat' : 'Open chat'}
	title={isExpanded ? 'Collapse chat' : 'Open chat'}
>
	<span class="icon-inner">
		{#if isExpanded}
			<Icon name="x" size={20} />
		{:else}
			<Icon name="message-circle" size={20} />
		{/if}
	</span>
	<span class="btn-shine"></span>
</button>

<style>
	.floating-chat-icon {
		width: 48px;
		height: 48px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
		overflow: hidden;

		background: linear-gradient(
			180deg,
			#66d9ff 0%,
			#4dd0ff 25%,
			#01B2FF 60%,
			#0099dd 100%
		);
		color: white;
		box-shadow:
			0 4px 16px rgba(1, 178, 255, 0.45),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1);
	}

	.floating-chat-icon:hover {
		background: linear-gradient(
			180deg,
			#80e0ff 0%,
			#66d9ff 25%,
			#1ebfff 60%,
			#00a6e6 100%
		);
		transform: translateY(-2px);
		box-shadow:
			0 6px 24px rgba(1, 178, 255, 0.55),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 0 -1px 0 rgba(0, 0, 0, 0.1);
	}

	.floating-chat-icon:active {
		transform: translateY(0) scale(0.96);
		background: linear-gradient(
			180deg,
			#01B2FF 0%,
			#0099dd 50%,
			#0088cc 100%
		);
	}

	.floating-chat-icon.expanded {
		background: linear-gradient(
			180deg,
			#ffffff 0%,
			#f0f0f2 50%,
			#e8e8ea 100%
		);
		color: var(--text-primary, #1a1a1a);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .floating-chat-icon.expanded {
		background: linear-gradient(
			180deg,
			#3a3a3e 0%,
			#2e2e32 50%,
			#262628 100%
		);
		color: var(--text-primary, #fafafa);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
	}

	.icon-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-shine {
		position: absolute;
		top: 0;
		left: 0;
		right: 50%;
		height: 50%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.4) 0%,
			rgba(255, 255, 255, 0) 100%
		);
		border-radius: 50% 50% 0 0;
		pointer-events: none;
	}
</style>
