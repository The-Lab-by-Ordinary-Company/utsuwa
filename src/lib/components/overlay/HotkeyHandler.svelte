<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { initializeHotkeys, onHotkeyEvent, isTauri } from '$lib/services/platform';
	import { overlayStore } from '$lib/stores/overlay.svelte';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';

	interface Props {
		onSendMessage?: (text: string) => void;
	}

	let { onSendMessage }: Props = $props();

	onMount(() => {
		if (!browser || !isTauri()) return;

		// Initialize hotkeys with user's configured shortcuts
		initializeHotkeys(settingsStore.hotkeys);

		// Handle push-to-talk
		const unsubPTTStart = onHotkeyEvent('ptt:start', () => {
			if (sttStore.isSupported()) {
				sttStore.startListening((text) => {
					onSendMessage?.(text);
				});
			}
		});

		const unsubPTTStop = onHotkeyEvent('ptt:stop', () => {
			// STT will automatically send on stop if there's a transcript
			sttStore.stopListening();
		});

		// Handle overlay toggle
		const unsubToggle = onHotkeyEvent('overlay:toggle', async () => {
			// Call Tauri command to toggle window visibility
			try {
				const { invoke } = await import('@tauri-apps/api/core');
				await invoke('toggle_overlay');
			} catch (e) {
				console.error('Failed to toggle overlay:', e);
			}
		});

		// Handle focus chat
		const unsubFocus = onHotkeyEvent('chat:focus', () => {
			overlayStore.setChatExpanded(true);
			overlayStore.activate();
		});

		return () => {
			unsubPTTStart();
			unsubPTTStop();
			unsubToggle();
			unsubFocus();
		};
	});
</script>
