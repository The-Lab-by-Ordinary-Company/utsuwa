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
		padding: 0.625rem 0.75rem;
		background: var(--color-neutral-50);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--color-neutral-900);
		text-align: left;
	}

	:global(.dropdown-trigger:hover) {
		border-color: var(--color-neutral-400);
	}

	:global(.dropdown-trigger:focus) {
		outline: none;
		border-color: var(--color-ring);
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
		color: var(--color-neutral-500);
	}

	:global(.dropdown-content) {
		z-index: 1050;
		min-width: 280px;
		max-width: 320px;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 0.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		animation: slideDown 0.15s ease-out;
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
		color: var(--color-neutral-400);
	}

	:global(.provider-item) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.1s;
		outline: none;
	}

	:global(.provider-item:hover),
	:global(.provider-item[data-highlighted]) {
		background: var(--color-neutral-100);
	}

	:global(.provider-item.selected) {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
	}

	.provider-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		color: var(--color-neutral-600);
	}

	.provider-name {
		flex: 1;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-neutral-700);
	}

	.badge {
		font-size: 0.5rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-weight: 600;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.badge.local {
		background: color-mix(in srgb, var(--color-info) 20%, transparent);
		color: var(--color-info);
	}

	.badge.configured {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: color-mix(in srgb, var(--color-success) 20%, transparent);
		color: var(--color-success);
		border-radius: 50%;
	}
</style>
