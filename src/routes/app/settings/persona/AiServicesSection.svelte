<script lang="ts">
	import { slideOpen } from '$lib/utils/motion';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import { Icon, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import type { PersonaPageState } from './persona-page.svelte';

	let { page }: { page: PersonaPageState } = $props();
</script>

<!-- AI Services (collapsible) -->
<div class="services-section">
	<button class="services-toggle" onclick={() => page.aiServicesExpanded = !page.aiServicesExpanded}>
		<Icon name="settings" size={16} />
		<span>AI Services</span>
		<Icon name={page.aiServicesExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
	</button>

	{#if page.aiServicesExpanded}
		<div class="services-content" transition:slideOpen>
			<!-- LLM Config -->
			<div class="service-group">
				<div class="service-header">
					<Icon name="brain" size={14} />
					<span>Chat (LLM)</span>
					<button class="service-toggle" class:enabled={page.isLLMEnabled} onclick={page.toggleLLM} aria-label="Toggle chat (LLM)">
						<span class="toggle-track">
							<span class="toggle-thumb"></span>
						</span>
					</button>
				</div>

				{#if page.isLLMEnabled}
					<ProviderDropdown
						type="llm"
						value={page.consciousnessSettings.activeProvider as string}
						onSelect={page.handleLLMProviderChange}
						placeholder="Select LLM provider..."
					/>

					{#if page.consciousnessSettings.activeProvider}
						{@const provider = getLLMProvider(page.consciousnessSettings.activeProvider as string)}

						{#if provider?.requiresApiKey || provider?.custom}
							<div class="api-key-row">
								<input
									type="password"
									class="api-key-input"
									class:error={page.llmFetchError}
									placeholder={provider?.custom ? 'API Key (optional)' : 'API Key'}
									value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
									oninput={(e) => page.handleApiKeyChange(provider.id, e.currentTarget.value, 'llm')}
									onblur={provider?.custom ? undefined : page.handleLLMApiKeyBlur}
								/>
							</div>
						{/if}

						<!-- Base URL for local providers and custom OpenAI-compatible endpoints -->
						{#if provider?.isLocal || provider?.custom}
							{#if page.llmFetchError}
								<p class="provider-note error">
									<Icon name="alert-circle" size={14} />
									{page.llmFetchError}
								</p>
							{/if}
							<div class="api-key-row">
								<input
									type="text"
									class="api-key-input"
									placeholder={provider.custom
										? 'https://api.openai.com/v1/ or your endpoint'
										: provider.defaultBaseUrl || 'http://localhost:11434/v1/'}
									value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
									oninput={(e) => page.handleLLMBaseUrlChange(provider.id, e.currentTarget.value)}
									onblur={provider.custom ? undefined : page.fetchLLMModels}
								/>
							</div>
						{/if}

						<!-- Model: manual entry for custom endpoints, discovered dropdown otherwise -->
						{#if provider?.custom}
							{@const customConfig = settingsStore.getProviderConfig(provider.id)}
							<div class="api-key-row">
								<input
									type="text"
									class="api-key-input"
									placeholder="Model (e.g. gpt-4o-mini, meta-llama/llama-3-70b)"
									value={(page.consciousnessSettings.activeModel as string) ?? ''}
									oninput={(e) => page.handleLLMModelChange(e.currentTarget.value.trim())}
								/>
							</div>
							{#if customConfig.baseUrl}
								<div class="api-key-row">
									<ModelDropdown
										models={page.llmModels}
										value={page.consciousnessSettings.activeModel as string}
										onSelect={page.handleLLMModelChange}
										placeholder="Pick a fetched model..."
										isLoading={page.llmIsLoading}
										onRefresh={page.fetchLLMModels}
										disabled={false}
									/>
								</div>
							{:else}
								<p class="provider-note">Enter a base URL to fetch available models.</p>
							{/if}

							<!-- Advanced Parameters -->
							<details class="llm-advanced-params">
								<summary>Advanced Parameters</summary>
								<div class="llm-param-grid">
									<div class="llm-param-row">
										<label class="llm-param-label" for="llm-temperature">
											Temperature
											<span class="llm-param-value">{((page.consciousnessSettings.temperature as number) ?? 0.7).toFixed(2)}</span>
										</label>
										<input
											id="llm-temperature"
											type="range"
											class="llm-param-slider"
											min="0"
											max="2"
											step="0.05"
											value={(page.consciousnessSettings.temperature as number) ?? 0.7}
											oninput={(e) => page.handleLLMNumberSetting('temperature', Number(e.currentTarget.value))}
										/>
										<p class="provider-note">Controls randomness: 0 = focused, 2 = highly creative.</p>
									</div>

									<div class="llm-param-row">
										<label class="llm-param-label" for="llm-top-p">
											Top P
											<span class="llm-param-value">{((page.consciousnessSettings.topP as number) ?? 1.0).toFixed(2)}</span>
										</label>
										<input
											id="llm-top-p"
											type="range"
											class="llm-param-slider"
											min="0"
											max="1"
											step="0.05"
											value={(page.consciousnessSettings.topP as number) ?? 1.0}
											oninput={(e) => page.handleLLMNumberSetting('topP', Number(e.currentTarget.value))}
										/>
										<p class="provider-note">Nucleus sampling: 1 = disabled.</p>
									</div>

									<div class="llm-param-row">
										<label class="llm-param-label" for="llm-max-tokens">
											Max Tokens
											<span class="llm-param-value">{page.consciousnessSettings.maxTokens ?? '—'}</span>
										</label>
										<input
											id="llm-max-tokens"
											type="number"
											class="api-key-input"
											min="1"
											step="1"
											placeholder="Unlimited"
											value={(page.consciousnessSettings.maxTokens as number) ?? ''}
											oninput={(e) => {
												const val = e.currentTarget.value;
												page.handleLLMNumberSetting('maxTokens', val ? parseInt(val, 10) : undefined);
											}}
										/>
										<p class="provider-note">Hard limit for the number of tokens in the response. Leave empty to use the provider default.</p>
									</div>

									<div class="llm-param-row">
										<label class="llm-param-label" for="llm-presence-penalty">
											Presence Penalty
											<span class="llm-param-value">{((page.consciousnessSettings.presencePenalty as number) ?? 0).toFixed(1)}</span>
										</label>
										<input
											id="llm-presence-penalty"
											type="range"
											class="llm-param-slider"
											min="-2"
											max="2"
											step="0.1"
											value={(page.consciousnessSettings.presencePenalty as number) ?? 0}
											oninput={(e) => page.handleLLMNumberSetting('presencePenalty', Number(e.currentTarget.value))}
										/>
										<p class="provider-note">Reduces repetition of tokens already used.</p>
									</div>

									<div class="llm-param-row">
										<label class="llm-param-label" for="llm-frequency-penalty">
											Frequency Penalty
											<span class="llm-param-value">{((page.consciousnessSettings.frequencyPenalty as number) ?? 0).toFixed(1)}</span>
										</label>
										<input
											id="llm-frequency-penalty"
											type="range"
											class="llm-param-slider"
											min="-2"
											max="2"
											step="0.1"
											value={(page.consciousnessSettings.frequencyPenalty as number) ?? 0}
											oninput={(e) => page.handleLLMNumberSetting('frequencyPenalty', Number(e.currentTarget.value))}
										/>
										<p class="provider-note">Stronger penalty for frequently repeated tokens.</p>
									</div>
								</div>
							</details>
						{:else}
							<ModelDropdown
								models={page.llmModels}
								value={page.consciousnessSettings.activeModel as string}
								onSelect={page.handleLLMModelChange}
								placeholder="Select model..."
								isLoading={page.llmIsLoading}
								onRefresh={page.llmHasApiKey ? page.fetchLLMModels : undefined}
								disabled={!page.llmHasApiKey}
								disabledMessage="Enter API key first"
							/>
						{/if}
					{/if}
				{/if}
			</div>

			<!-- TTS Config -->
			<div class="service-group">
				<div class="service-header">
					<Icon name="mic" size={14} />
					<span>Speech (TTS)</span>
					<button class="service-toggle" class:enabled={page.isTTSEnabled} onclick={page.toggleTTS} aria-label="Toggle speech (TTS)">
						<span class="toggle-track">
							<span class="toggle-thumb"></span>
						</span>
					</button>
				</div>

				{#if page.isTTSEnabled}
					<ProviderDropdown
						type="tts"
						value={page.speechSettings.activeProvider as string}
						onSelect={page.handleTTSProviderChange}
						placeholder="Select TTS provider..."
					/>

					{#if page.speechSettings.activeProvider}
						{@const provider = getTTSProvider(page.speechSettings.activeProvider as string)}
						{#if provider?.requiresApiKey}
							<div class="api-key-row">
								<input
									type="password"
									class="api-key-input"
									class:error={page.ttsFetchError}
									placeholder="API Key"
									value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
									oninput={(e) => page.handleApiKeyChange(provider.id, e.currentTarget.value, 'tts')}
									onblur={page.handleTTSApiKeyBlur}
								/>
							</div>
						{/if}
					{/if}

					{#if page.speechSettings.activeProvider}
						{@const provider = getTTSProvider(page.speechSettings.activeProvider as string)}
						{#if !provider?.isLocal}
							<ModelDropdown
								models={page.ttsModels}
								value={page.speechSettings.activeModel as string}
								onSelect={page.handleTTSModelChange}
								placeholder="Select model..."
								isLoading={page.ttsIsLoading}
								onRefresh={page.ttsHasApiKey ? page.fetchTTSModels : undefined}
								disabled={!page.ttsHasApiKey}
								disabledMessage="Enter API key first"
							/>
						{/if}
					{/if}

					{#if page.speechSettings.activeProvider === 'elevenlabs'}
						<div class="api-key-row">
							<input
								type="text"
								class="api-key-input"
								placeholder="Custom Voice ID (optional)"
								value={settingsStore.elevenLabsVoiceId}
								onchange={(e) => settingsStore.setElevenLabsVoiceId(e.currentTarget.value)}
							/>
						</div>
					{/if}

					{#if page.speechSettings.activeProvider}
						{@const provider = getTTSProvider(page.speechSettings.activeProvider as string)}
						{#if provider?.isLocal}
							<div class="api-key-row">
								<input
									type="text"
									class="api-key-input"
									list="local-tts-voices"
									placeholder="Voice (e.g. af_bella)"
									value={page.speechSettings.activeVoiceId as string ?? ''}
									onchange={(e) => page.handleTTSVoiceChange(e.currentTarget.value)}
								/>
								<datalist id="local-tts-voices">
									{#each provider.voices ?? [] as voice}
										<option value={voice.id}>{voice.name}</option>
									{/each}
								</datalist>
							</div>
							<div class="api-key-row">
								<input
									type="text"
									class="api-key-input"
									placeholder="Model (optional, e.g. kokoro)"
									value={page.speechSettings.activeModel as string ?? ''}
									onchange={(e) => page.handleTTSModelChange(e.currentTarget.value)}
								/>
							</div>
							<div class="api-key-row">
								<input
									type="text"
									class="api-key-input"
									placeholder={provider.defaultBaseUrl || 'http://localhost:8880/v1/'}
									value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
									onchange={(e) => settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value })}
								/>
							</div>
						{/if}
					{/if}
				{/if}
			</div>

			<!-- STT Config -->
			<div class="service-group">
				<div class="service-header">
					<Icon name="mic" size={14} />
					<span>Voice Input (STT)</span>
				</div>
				<p class="stt-hint">Higher quality voice input via Whisper. A local server is used if configured, then Groq, then OpenAI, then the browser's built-in recognition. Required on desktop (which has no built-in recognition).</p>

				<span class="stt-sublabel">Groq API Key</span>
				<div class="api-key-row">
					<input
						type="password"
						class="api-key-input"
						placeholder="Groq API Key"
						value={settingsStore.getProviderConfig('groq-stt').apiKey ?? ''}
						oninput={(e) => {
							settingsStore.setProviderConfig('groq-stt', { apiKey: e.currentTarget.value });
							settingsStore.markProviderAdded('groq-stt');
						}}
					/>
				</div>

				<span class="stt-sublabel">OpenAI API Key (Whisper)</span>
				<div class="api-key-row">
					<input
						type="password"
						class="api-key-input"
						placeholder="OpenAI API Key"
						value={settingsStore.getProviderConfig('openai-stt').apiKey ?? ''}
						oninput={(e) => {
							settingsStore.setProviderConfig('openai-stt', { apiKey: e.currentTarget.value });
							settingsStore.markProviderAdded('openai-stt');
						}}
					/>
				</div>

				<span class="stt-sublabel">Local server (Speaches, faster-whisper-server, whisper.cpp)</span>
				<div class="api-key-row">
					<input
						type="text"
						class="api-key-input"
						placeholder="http://localhost:8000/v1/"
						value={settingsStore.getProviderConfig('local-stt').baseUrl ?? ''}
						oninput={(e) => {
							const v = e.currentTarget.value.trim();
							settingsStore.setProviderConfig('local-stt', { baseUrl: v });
							if (v) settingsStore.markProviderAdded('local-stt');
							else settingsStore.removeProvider('local-stt');
						}}
					/>
				</div>
				<div class="api-key-row">
					<input
						type="text"
						class="api-key-input"
						placeholder="Model (e.g. Systran/faster-whisper-large-v3)"
						value={settingsStore.getProviderConfig('local-stt').modelId ?? ''}
						oninput={(e) => {
							settingsStore.setProviderConfig('local-stt', { modelId: e.currentTarget.value.trim() });
						}}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* AI Services Section */
	.services-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.services-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.services-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.services-toggle span {
		flex: 1;
		text-align: left;
	}

	.services-content {
		padding: 0 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.service-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stt-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
		line-height: 1.4;
	}

	.stt-sublabel {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.service-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.25rem;
	}

	.service-toggle {
		margin-left: auto;
		position: relative;
		width: 40px;
		height: 22px;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.toggle-track {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		transition: background 0.2s ease;
	}

	.service-toggle.enabled .toggle-track {
		background: var(--accent);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: var(--radius-full);
		transition: transform 0.2s ease;
		box-shadow: var(--shadow-xs);
	}

	.service-toggle.enabled .toggle-thumb {
		transform: translateX(18px);
	}

	.api-key-row {
		display: flex;
		gap: 0.5rem;
	}

	.provider-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.provider-note.error {
		color: var(--color-error);
	}

	.api-key-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--text-primary);
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
	}

	.api-key-input::placeholder {
		color: var(--text-tertiary);
	}

	.api-key-input:focus {
		outline: none;
		background: var(--bg-primary);
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	.api-key-input.error {
		border-color: var(--color-error);
		animation: shake 0.4s ease-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-3px); }
		80% { transform: translateX(2px); }
	}

	.llm-advanced-params {
		margin-top: 0.75rem;
		border: 1px solid var(--bg-tertiary);
		border-radius: var(--radius-lg);
		padding: 0.75rem;
		background: var(--bg-primary);
	}

	.llm-advanced-params summary {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		user-select: none;
	}

	.llm-param-grid {
		margin-top: 0.75rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.llm-param-row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.llm-param-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.llm-param-value {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.llm-param-slider {
		width: 100%;
		cursor: pointer;
	}
</style>
