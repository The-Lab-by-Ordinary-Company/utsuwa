<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import {
		LLM_PROVIDERS,
		TTS_PROVIDERS,
		getLLMProvider,
		getTTSProvider,
		type ProviderMetadata
	} from '$lib/services/providers/registry';
	import ProviderIcon from '$lib/components/icons/ProviderIcons.svelte';
	import { Icon } from '$lib/components/ui';

	interface Props {
		type: 'llm' | 'tts';
		value: string | null | undefined;
		onSelect: (providerId: string) => void;
		placeholder?: string;
	}

	let { type, value, onSelect, placeholder = 'Select provider...' }: Props = $props();

	const providers = $derived(type === 'llm' ? LLM_PROVIDERS : TTS_PROVIDERS);
	const getProvider = $derived(type === 'llm' ? getLLMProvider : getTTSProvider);
	const selectedProvider = $derived(value ? getProvider(value) : null);

	// Group providers by category for LLM
	const llmCategories = [
		{ id: 'cloud-commercial', label: 'Cloud Commercial', providers: ['openai', 'anthropic', 'google', 'deepseek', 'mistral', 'xai', 'groq', 'perplexity', 'moonshot', 'together'] },
		{ id: 'cloud-additional', label: 'Cloud Additional', providers: ['cerebras', 'fireworks', 'novita', '302ai', 'comet'] },
		{ id: 'aggregators', label: 'Aggregators', providers: ['openrouter', 'openai-compatible'] },
		{ id: 'local', label: 'Local', providers: ['ollama', 'lmstudio', 'vllm', 'player2'] },
		{ id: 'enterprise', label: 'Enterprise', providers: ['azure', 'cloudflare'] }
	];

	// Group providers by category for TTS
	const ttsCategories = [
		{ id: 'cloud', label: 'Cloud TTS', providers: ['elevenlabs', 'openai-tts', 'azure-speech', 'deepgram', 'alibaba-cosyvoice', 'volcengine', 'comet-tts'] },
		{ id: 'local', label: 'Local / Free', providers: ['web-speech', 'index-tts', 'browser-local', 'app-local'] },
		{ id: 'generic', label: 'Generic', providers: ['openai-compatible-tts', 'player2-tts'] }
	];

	const categories = $derived(type === 'llm' ? llmCategories : ttsCategories);

	function isConfigured(providerId: string): boolean {
		const provider = getProvider(providerId);
		if (provider?.isLocal) return true;
		if (!provider?.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(providerId);
		return !!config.apiKey;
	}

	function getProvidersByCategory(providerIds: string[]): ProviderMetadata[] {
		return providerIds
			.map((id) => getProvider(id))
			.filter((p): p is ProviderMetadata => p !== undefined);
	}

	function handleSelect(providerId: string) {
		onSelect(providerId);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="dropdown-trigger">
		{#if selectedProvider}
			<span class="trigger-icon">
				<ProviderIcon provider={selectedProvider.id} size={18} themed />
			</span>
			<span class="trigger-label">{selectedProvider.name}</span>
		{:else}
			<span class="trigger-placeholder">{placeholder}</span>
		{/if}
		<Icon name="chevron-down" size={14} />
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content class="dropdown-content" align="start" sideOffset={4}>
			<div class="dropdown-scroll">
				{#each categories as category}
					{@const categoryProviders = getProvidersByCategory(category.providers)}
					{#if categoryProviders.length > 0}
						<div class="category-group">
							<div class="category-label">{category.label}</div>
							{#each categoryProviders as provider}
								<DropdownMenu.Item
									class="provider-item {value === provider.id ? 'selected' : ''}"
									onSelect={() => handleSelect(provider.id)}
								>
									<span class="provider-icon">
										<ProviderIcon provider={provider.id} size={16} themed />
									</span>
									<span class="provider-name">{provider.name}</span>
									{#if provider.isLocal}
										<span class="badge local">Local</span>
									{:else if isConfigured(provider.id)}
										<span class="badge configured">
											<Icon name="check" size={10} strokeWidth={3} />
										</span>
									{/if}
								</DropdownMenu.Item>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	:global(.dropdown-trigger) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--text-primary);
		text-align: left;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	:global(.dark .dropdown-trigger) {
		background: linear-gradient(180deg, #1a1a1a 0%, #222222 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	:global(.dropdown-trigger:hover) {
		border-color: rgba(0, 0, 0, 0.2);
	}

	:global(.dark .dropdown-trigger:hover) {
		border-color: rgba(255, 255, 255, 0.15);
	}

	:global(.dropdown-trigger:focus) {
		outline: none;
		border-color: #01B2FF;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			0 0 0 3px rgba(1, 178, 255, 0.2),
			0 0 12px rgba(1, 178, 255, 0.15);
	}

	:global(.dark .dropdown-trigger:focus) {
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			0 0 0 3px rgba(1, 178, 255, 0.25),
			0 0 16px rgba(1, 178, 255, 0.2);
	}

	.trigger-icon {
		display: flex;
		flex-shrink: 0;
	}

	.trigger-label {
		flex: 1;
		font-weight: 500;
	}

	.trigger-placeholder {
		flex: 1;
		color: var(--text-tertiary);
	}

	:global(.dropdown-content) {
		z-index: 1050;
		min-width: 280px;
		max-width: 320px;
		background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-lg);
		padding: 0.5rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
		animation: slideDown 0.15s ease-out;
	}

	:global(.dark .dropdown-content) {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-scroll {
		max-height: 320px;
		overflow-y: auto;
	}

	.category-group {
		margin-bottom: 0.5rem;
	}

	.category-group:last-child {
		margin-bottom: 0;
	}

	.category-label {
		padding: 0.375rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
	}

	:global(.provider-item) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s;
		outline: none;
	}

	:global(.provider-item:hover),
	:global(.provider-item[data-highlighted]) {
		background: linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark .provider-item:hover),
	:global(.dark .provider-item[data-highlighted]) {
		background: linear-gradient(180deg, #333333 0%, #2a2a2a 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	:global(.provider-item.selected) {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.15) 0%, rgba(1, 178, 255, 0.1) 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	:global(.dark .provider-item.selected) {
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.2) 0%, rgba(1, 178, 255, 0.12) 100%);
	}

	.provider-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.provider-name {
		flex: 1;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.badge {
		font-size: 0.5rem;
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-full);
		font-weight: 600;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.badge.local {
		background: linear-gradient(180deg, #66d9ff 0%, #01B2FF 100%);
		color: white;
		box-shadow:
			0 1px 3px rgba(1, 178, 255, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.badge.configured {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
		color: white;
		border-radius: 50%;
		box-shadow:
			0 1px 3px rgba(34, 197, 94, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}
</style>
