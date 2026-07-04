<script lang="ts">
	import VrmScene from '$lib/components/vrm/VrmScene.svelte';
	import { pop } from '$lib/utils/motion';
	import BottomChatBar from '$lib/components/chat/BottomChatBar.svelte';
	import SpeechBubble from '$lib/components/chat/SpeechBubble.svelte';
	import FloatingChatIcon from '$lib/components/overlay/FloatingChatIcon.svelte';
	import FloatingMicButton from '$lib/components/overlay/FloatingMicButton.svelte';
	import HotkeyHandler from '$lib/components/overlay/HotkeyHandler.svelte';
	import CompanionStatus from '$lib/components/ui/CompanionStatus.svelte';
	import CameraSettingsPanel from '$lib/components/ui/CameraSettingsPanel.svelte';
	import FloatingStatIndicators from '$lib/components/ui/FloatingStatIndicators.svelte';
	import { EventScene } from '$lib/components/events';
	import { Icon } from '$lib/components/ui';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { sttStore } from '$lib/stores/stt.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { overlayStore } from '$lib/stores/overlay.svelte';
	import { isTauri, startDragging } from '$lib/services/platform';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import { streamChatDirect } from '$lib/services/chat/client-chat';
	import { processCompanionTurn } from '$lib/services/chat/companion-turn';
	import { eventsApi } from '$lib/engine/events';
	import { completionMarkers } from '$lib/engine/event-completion';
	import type { TTSProvider } from '$lib/types';
	import type { EventDefinition } from '$lib/types/events';
	import type { StateUpdates } from '$lib/types/character';

	import { buildSystemPrompt, type PromptContext } from '$lib/ai/prompt-builder';
	import {
		retrieveRelevantContext,
		hydrateWorkingMemory,
		backfillEmbeddings,
		getEmbeddingBackfillStatus
	} from '$lib/engine/memory';
	import { initEmbeddingModel } from '$lib/services/embeddings';
	import { debugEventsStore } from '$lib/stores/debugEvents.svelte';

	let latestResponse = $state('');
	let isTyping = $state(false);
	let activeEvent = $state<EventDefinition | null>(null);
	let showCamera = $state(false);
	let positionLocked = $state(false);

	const chatExpanded = $derived(overlayStore.chatExpanded);

	// --- Overlay window sizing & lock ---
	const SIZE_KEY = 'utsuwa-overlay-size';
	const LOCK_KEY = 'utsuwa-overlay-locked';

	// Restore lock preference and last window size
	$effect(() => {
		positionLocked = localStorage.getItem(LOCK_KEY) === 'true';
		if (!isTauri()) return;
		const saved = localStorage.getItem(SIZE_KEY);
		if (saved) {
			(async () => {
				try {
					const { w, h } = JSON.parse(saved);
					const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
					await getCurrentWindow().setSize(new LogicalSize(w, h));
				} catch (e) {
					console.error('Failed to restore overlay size:', e);
				}
			})();
		}
	});

	function toggleLock() {
		positionLocked = !positionLocked;
		localStorage.setItem(LOCK_KEY, String(positionLocked));
	}

	// Corner-tab drag resize. Pointer deltas are in logical px, same unit as
	// Tauri's LogicalSize, so the math is direct.
	let resizing = false;
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
	let lastRequested = { w: 0, h: 0 };
	let resizeRaf = 0;

	function onResizeStart(e: PointerEvent) {
		if (!isTauri()) return;
		e.preventDefault();
		e.stopPropagation();
		resizing = true;
		resizeStart = { x: e.screenX, y: e.screenY, w: window.innerWidth, h: window.innerHeight };
		window.addEventListener('pointermove', onResizeMove);
		window.addEventListener('pointerup', onResizeEnd, { once: true });
	}

	function onResizeMove(e: PointerEvent) {
		if (!resizing) return;
		lastRequested = {
			w: Math.min(900, Math.max(280, resizeStart.w + (e.screenX - resizeStart.x))),
			h: Math.min(1400, Math.max(380, resizeStart.h + (e.screenY - resizeStart.y)))
		};
		// Coalesce to one setSize per frame
		if (resizeRaf) return;
		resizeRaf = requestAnimationFrame(async () => {
			resizeRaf = 0;
			try {
				const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
				await getCurrentWindow().setSize(new LogicalSize(lastRequested.w, lastRequested.h));
			} catch (e) {
				console.error('Failed to resize overlay:', e);
			}
		});
	}

	function onResizeEnd() {
		resizing = false;
		window.removeEventListener('pointermove', onResizeMove);
		if (lastRequested.w > 0) {
			localStorage.setItem(SIZE_KEY, JSON.stringify(lastRequested));
		}
	}

	// Hydrate working memory on start
	$effect(() => {
		(async () => {
			try {
				await hydrateWorkingMemory();
			} catch (e) {
				console.error('Failed to hydrate working memory:', e);
			}
		})();
	});

	// Initialize embedding model and backfill facts without embeddings
	$effect(() => {
		initEmbeddingModel().then(async (ready) => {
			if (ready) {
				const status = await getEmbeddingBackfillStatus();
				if (status.withoutEmbeddings > 0) {
					await backfillEmbeddings();
				}
			}
		}).catch((e) => {
			console.error('Failed to initialize embedding model:', e);
		});
	});

	// Debug events (from developer tools)
	$effect(() => {
		const debugEvent = debugEventsStore.consume();
		if (debugEvent) {
			activeEvent = debugEvent;
		}
	});

	// Handle drag for Tauri window
	function handleDragStart(e: MouseEvent) {
		if (isTauri() && !positionLocked && !resizing) {
			startDragging();
		}
	}

	// Exit overlay and return to main window
	async function exitToMain() {
		if (!isTauri()) return;
		try {
			const { getCurrentWindow, getAllWindows } = await import('@tauri-apps/api/window');

			const windows = await getAllWindows();
			const mainWindow = windows.find(w => w.label === 'main');

			if (!mainWindow) {
				// Main window was closed — don't hide overlay or user loses the app
				console.error('Main window not found, cannot exit overlay');
				return;
			}

			await mainWindow.show();
			await mainWindow.setFocus();

			const overlay = getCurrentWindow();
			await overlay.hide();
		} catch (e) {
			console.error('Failed to exit overlay:', e);
		}
	}


	async function buildCompanionSystemPrompt(userMessage: string): Promise<string> {
		const state = characterStore.state;
		const persona = personaStore.activeCard;
		const memories = await retrieveRelevantContext(userMessage);

		const context: PromptContext = {
			persona,
			state,
			memories,
			userMessage,
			systemTime: new Date()
		};

		return buildSystemPrompt(context);
	}

	async function handleSend(content: string) {
		if (!content.trim() || chatStore.isLoading) return;

		if (!modulesStore.isModuleEnabled('consciousness')) {
			chatStore.setError('Chat is disabled. Enable it in Settings > Character > AI Services.');
			return;
		}

		chatStore.addMessage('user', content);
		chatStore.setLoading(true);
		chatStore.setError(null);
		isTyping = true;
		latestResponse = '';

		// Collapse chat after sending
		overlayStore.setChatExpanded(false);

		characterStore.updateStreak();
		characterStore.updateDaysKnown();

		try {
			const consciousnessSettings = modulesStore.getModuleSettings('consciousness');
			const provider = consciousnessSettings.activeProvider as string;
			const model = consciousnessSettings.activeModel as string;

			if (!provider) {
				throw new Error('Please configure a provider in Settings > Modules > Consciousness');
			}

			const systemPrompt = await buildCompanionSystemPrompt(content);
			const providerConfig = settingsStore.getProviderConfig(provider);
			const apiKey = providerConfig.apiKey;
			const providerMeta = getLLMProvider(provider);

			if (providerMeta?.requiresApiKey && !apiKey) {
				throw new Error(`Please configure API key for ${providerMeta.name} in Settings > Providers`);
			}

			chatStore.addMessage('assistant', '');
			let fullContent = '';
			const selectedModel = model || providerMeta?.models?.[0]?.id || '';

			const shouldUseDirectChat = isTauri() || !!providerMeta?.isLocal;

			if (shouldUseDirectChat) {
				// Tauri and local providers call provider APIs directly.
				await new Promise<void>((resolve, reject) => {
					streamChatDirect(
						{
							messages: chatStore.messages.slice(0, -1).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
							provider: provider as import('$lib/types').LLMProvider,
							model: selectedModel,
							apiKey: apiKey || undefined,
							baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
							systemPrompt
						},
						(text) => { fullContent += text; chatStore.updateLastMessage(fullContent); },
						(error) => reject(new Error(error)),
						() => resolve()
					);
				});
			} else {
				// Cloud providers in web builds use the SvelteKit server route.
				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						messages: chatStore.messages.slice(0, -1).filter((m) => m.content).map((m) => ({ role: m.role, content: m.content })),
						provider,
						model: selectedModel,
						apiKey: apiKey || 'not-needed',
						baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
						systemPrompt
					})
				});

				if (!response.ok) {
					const errBody = await response.json().catch(() => null);
					throw new Error(errBody?.error || 'Failed to get response');
				}

				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				if (!reader) throw new Error('No response body');

				const processLine = (line: string) => {
					if (line.startsWith('0:')) {
						const text = JSON.parse(line.slice(2));
						fullContent += text;
						chatStore.updateLastMessage(fullContent);
					} else if (line.startsWith('e:')) {
						const { error } = JSON.parse(line.slice(2));
						throw new Error(error);
					}
				};

				// Buffer partial lines so a delta split across network chunks doesn't break JSON.parse
				let streamBuffer = '';
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					streamBuffer += decoder.decode(value, { stream: true });
					const lines = streamBuffer.split('\n');
					streamBuffer = lines.pop() || '';
					for (const line of lines) {
						processLine(line);
					}
				}
				streamBuffer += decoder.decode();
				if (streamBuffer) processLine(streamBuffer);
			}

			isTyping = false;
			const turn = await processCompanionTurn({
				userMessage: content,
				companionResponse: fullContent,
				llm: {
					provider,
					model: selectedModel,
					apiKey: apiKey || undefined,
					baseURL: providerConfig.baseUrl || providerMeta?.defaultBaseUrl,
					hasImages: false
				},
				debug: import.meta.env.DEV
			});
			const cleanedResponse = turn.dialogue;
			if (turn.triggeredEvent) activeEvent = turn.triggeredEvent;
			chatStore.updateLastMessage(cleanedResponse);
			latestResponse = cleanedResponse;

			if (cleanedResponse) {
				vrmStore.startTalking(cleanedResponse);
			}

			// TTS
			const speechState = modulesStore.getModuleState('speech');
			const speechSettings = modulesStore.getModuleSettings('speech');
			if (speechState?.enabled && cleanedResponse) {
				const ttsProvider = speechSettings.activeProvider as TTSProvider;
				const ttsConfig = settingsStore.getProviderConfig(ttsProvider);
				const ttsMeta = getTTSProvider(ttsProvider);

				ttsStore.speak(cleanedResponse, {
					provider: ttsProvider,
					apiKey: ttsConfig.apiKey,
					voiceId: speechSettings.activeVoiceId as string || ttsConfig.voiceId,
					model: speechSettings.activeModel as string || ttsConfig.modelId,
					baseUrl: ttsConfig.baseUrl || ttsMeta?.defaultBaseUrl,
					speed: speechSettings.speed as number ?? 1
				});
			}
		} catch (err) {
			chatStore.setError(err instanceof Error ? err.message : 'Unknown error');
			isTyping = false;
		} finally {
			chatStore.setLoading(false);
		}
	}

	function handleBubbleHide() {
		latestResponse = '';
	}

	function handleCharacterClick() {
		overlayStore.activate();
	}

	function handleEventComplete(choiceIndex?: number, stateChanges?: Partial<StateUpdates>) {
		if (!activeEvent) return;
		const event = $state.snapshot(activeEvent);
		if (stateChanges) {
			characterStore.applyUpdates(stateChanges as StateUpdates);
		} else if (event.stateChanges) {
			characterStore.applyUpdates(event.stateChanges);
		}
		eventsApi.recordCompletedEvent(
			event, choiceIndex,
			choiceIndex !== undefined ? `Choice ${choiceIndex + 1}` : undefined
		).then(() => {
			for (const marker of completionMarkers(event, choiceIndex)) {
				characterStore.markEventCompleted(marker);
			}
		})
		.catch((e) => console.error('Failed to record event:', e));
		activeEvent = null;
	}

	function handleEventClose() {
		activeEvent = null;
	}
</script>

<div class="overlay-container">
	<!-- VRM Scene (fills the overlay) - locked to prevent rotation when dragging -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="scene-container" onmousedown={handleDragStart}>
		<VrmScene overlay={true} locked={true} />
	</div>

	<!-- Hover chrome: soft frame + corner resize tab -->
	<div class="overlay-frame"></div>
	{#if isTauri()}
		<div
			class="resize-tab"
			onpointerdown={onResizeStart}
			role="separator"
			aria-label="Resize overlay"
			title="Drag to resize"
		></div>
	{/if}

	<!-- Control rail (revealed on hover) -->
	<div class="overlay-rail">
		<button class="rail-btn" onclick={exitToMain} aria-label="Exit to main app" title="Back to app">
			<Icon name="x" size={15} />
		</button>
		<button
			class="rail-btn"
			class:rail-btn-active={showCamera}
			onclick={() => (showCamera = !showCamera)}
			aria-label="Camera settings"
			title="Camera"
		>
			<Icon name="video" size={15} />
		</button>
		<button
			class="rail-btn"
			class:rail-btn-active={positionLocked}
			onclick={toggleLock}
			aria-label={positionLocked ? 'Unlock position' : 'Lock position'}
			title={positionLocked ? 'Position locked' : 'Lock position'}
		>
			<Icon name={positionLocked ? 'lock' : 'lock-open'} size={15} />
		</button>
	</div>

	{#if showCamera}
		<div class="overlay-camera-anchor">
			<CameraSettingsPanel profile="overlay" onclose={() => (showCamera = false)} />
		</div>
	{/if}

	<!-- Speech Bubble: docked as a dialog box — the window moves around, so a
	     head-tracking bubble is unreadable in overlay mode -->
	<SpeechBubble
		message={latestResponse}
		isTyping={isTyping}
		onHide={handleBubbleHide}
		docked
	/>

	<!-- Floating stat change indicators -->
	<FloatingStatIndicators />

	<!-- Bottom controls (status + mic + chat icon) -->
	<div class="chat-controls">
		<CompanionStatus overlay={true} />
		{#if !chatExpanded}
			<FloatingMicButton onTranscript={handleSend} />
		{/if}
		<FloatingChatIcon />
	</div>

	<!-- Expandable Chat Bar -->
	{#if chatExpanded}
		<div class="chat-bar-container" out:pop={{ base: 'translateX(-50%)', y: 10, duration: 180 }}>
			<BottomChatBar onSend={handleSend} disabled={chatStore.isLoading} overlay />
		</div>
	{/if}

	<!-- Error toasts -->
	{#if chatStore.error}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="error-toast" out:pop={{ base: 'translateX(-50%)', y: 8, duration: 180 }} onclick={() => chatStore.setError(null)}>
			<span>{chatStore.error}</span>
		</div>
	{/if}
	{#if sttStore.error}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="error-toast error-toast--stt" out:pop={{ base: 'translateX(-50%)', y: 8, duration: 180 }} onclick={() => sttStore.clearError()}>
			<span>{sttStore.error}</span>
		</div>
	{/if}

	<!-- Event Scene Overlay -->
	{#if activeEvent?.scene}
		<EventScene
			scene={activeEvent.scene}
			eventName={activeEvent.name}
			eventType={activeEvent.type}
			companionName={personaStore.activeCard.name}
			overlay={true}
			onComplete={handleEventComplete}
			onClose={handleEventClose}
		/>
	{/if}

	<!-- Global hotkey handler (Tauri only) -->
	<HotkeyHandler onSendMessage={handleSend} />
</div>

<style>
	.overlay-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: transparent;
	}

	.scene-container {
		position: absolute;
		inset: 0;
		cursor: grab;
	}

	.scene-container:active {
		cursor: grabbing;
	}

	/* Soft boundary stroke so the invisible window edges are discoverable.
	   Double stroke (light outer, dark inner) stays visible on any desktop. */
	.overlay-frame {
		position: fixed;
		inset: 5px;
		border-radius: 22px;
		pointer-events: none;
		z-index: 45;
		box-shadow:
			0 0 0 1.5px rgba(255, 255, 255, 0.3),
			inset 0 0 0 1.5px rgba(0, 0, 0, 0.18);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.overlay-container:hover .overlay-frame {
		opacity: 1;
	}

	/* Corner grab tab for resizing */
	.resize-tab {
		position: fixed;
		right: 8px;
		bottom: 8px;
		width: 26px;
		height: 26px;
		z-index: 55;
		cursor: nwse-resize;
		border-radius: 8px 4px 16px 4px;
		background: color-mix(in srgb, var(--bg-tertiary) 65%, transparent);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
		opacity: 0;
		transition: opacity 0.2s ease, background 0.15s ease;
	}

	.resize-tab::before {
		content: '';
		position: absolute;
		right: 6px;
		bottom: 6px;
		width: 10px;
		height: 10px;
		border-right: 2px solid var(--text-secondary);
		border-bottom: 2px solid var(--text-secondary);
		border-radius: 0 0 3px 0;
	}

	.overlay-container:hover .resize-tab {
		opacity: 0.75;
	}

	.resize-tab:hover {
		opacity: 1;
		background: var(--bg-tertiary);
	}

	/* Control rail: exit / camera / lock, revealed on hover */
	.overlay-rail {
		position: fixed;
		top: 0.875rem;
		right: 0.875rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.rail-btn {
		width: 32px;
		height: 32px;
		border: none;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-sm);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease,
			box-shadow 0.15s ease, transform 0.15s ease;
	}

	.overlay-container:hover .rail-btn {
		opacity: 0.6;
		pointer-events: auto;
	}

	.rail-btn:hover {
		opacity: 1;
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		box-shadow: var(--shadow-md);
		transform: scale(1.1);
	}

	/* Active states (camera panel open, position locked) stay visible */
	.rail-btn-active,
	.overlay-container:hover .rail-btn-active {
		opacity: 1;
		pointer-events: auto;
		color: var(--accent);
	}

	.overlay-camera-anchor {
		position: fixed;
		top: 0.875rem;
		right: 3.5rem;
		z-index: 60;
	}

	.chat-controls {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
	}

	.chat-bar-container {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		padding: 0 1rem;
		z-index: 35;
		animation: slideUp 0.2s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.error-toast {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.5rem 0.875rem;
		background: var(--color-error);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		color: #fff;
		font-size: 0.75rem;
		max-width: calc(100% - 2rem);
		text-align: center;
		cursor: pointer;
		z-index: 50;
		animation: slideUpShake 0.5s ease-out;
		box-shadow: var(--shadow-lg);
	}

	/* STT errors stack above chat errors instead of sharing the same slot */
	.error-toast--stt {
		bottom: 8.5rem;
	}

	@keyframes slideUpShake {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(8px);
		}
		30% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
		45% {
			transform: translateX(calc(-50% + 6px)) translateY(0);
		}
		60% {
			transform: translateX(calc(-50% - 5px)) translateY(0);
		}
		75% {
			transform: translateX(calc(-50% + 3px)) translateY(0);
		}
		90% {
			transform: translateX(calc(-50% - 2px)) translateY(0);
		}
		100% {
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
