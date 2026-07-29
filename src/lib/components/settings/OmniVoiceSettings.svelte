<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TtsSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import type { ProviderMetadata } from '$lib/services/providers/registry';
	import { checkTTSProviderHealth } from '$lib/services/providers/health-check';
	import { getSharedAudioContext } from '$lib/services/tts';
	import { getTTSBaseUrl } from '$lib/services/providers/local-endpoints';
	import {
		buildInstructions,
		parseInstructions,
		DEFAULT_OMNI_VOICE_DESIGN,
		OMNI_VOICE_GENDERS,
		OMNI_VOICE_AGES,
		OMNI_VOICE_PITCHES,
		OMNI_VOICE_ACCENTS
	} from '$lib/stores/ai-services-settings-logic';
	import './ai-services-settings.css';

	let {
		state: settings,
		provider
	}: {
		state: TtsSettingsState;
		provider: ProviderMetadata;
	} = $props();

	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'de', name: 'German' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'it', name: 'Italian' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'ru', name: 'Russian' },
		{ code: 'nl', name: 'Dutch' },
		{ code: 'pl', name: 'Polish' }
	];

	const TEST_PHRASES: Record<string, string> = {
		en: 'Hello, this is a test of OmniVoice text to speech.',
		de: 'Hallo, dies ist ein Test von OmniVoice.',
		es: 'Hola, esta es una prueba de OmniVoice.',
		fr: 'Bonjour, ceci est un test de OmniVoice.',
		it: 'Ciao, questo è un test di OmniVoice.',
		pt: 'Olá, este é um teste do OmniVoice.',
		ja: 'こんにちは、これはOmniVoiceのテストです。',
		ko: '안녕하세요, OmniVoice 테스트입니다.',
		zh: '你好，这是OmniVoice的测试。',
		ru: 'Здравствуйте, это тест OmniVoice.',
		nl: 'Hallo, dit is een test van OmniVoice.',
		pl: 'Cześć, to jest test OmniVoice.'
	};

	const GENDERS = OMNI_VOICE_GENDERS as unknown as string[];
	const AGES = OMNI_VOICE_AGES as unknown as string[];
	const PITCHES = OMNI_VOICE_PITCHES as unknown as string[];
	const ACCENTS = OMNI_VOICE_ACCENTS as unknown as string[];

	// ── Local UI state ───────────────────────────────────────────────────────

	let previewLoading = $state(false);
	let previewError = $state('');
	let regenerating = $state(false);
	let profileError = $state('');

	let showCloneModal = $state(false);
	let cloneVoiceId = $state('');
	let cloneRefText = $state('');
	let cloneRefAudio: File | null = $state(null);
	let cloneFileName = $state('');
	let cloneLoading = $state(false);
	let cloneError = $state('');

	// ── Derived voice design ─────────────────────────────────────────────────

	const design = $derived.by<{ gender: string; age: string; pitch: string; accent: string }>(() => {
		const s = settings.speechSettings;
		const fromInstructions = parseInstructions((s.instructions as string) || '');
		return {
			gender:
				(s.gender as string) || fromInstructions.gender || DEFAULT_OMNI_VOICE_DESIGN.gender,
			age: (s.age as string) || fromInstructions.age || DEFAULT_OMNI_VOICE_DESIGN.age,
			pitch: (s.pitch as string) || fromInstructions.pitch || DEFAULT_OMNI_VOICE_DESIGN.pitch,
			accent:
				(s.accent as string) || fromInstructions.accent || DEFAULT_OMNI_VOICE_DESIGN.accent
		};
	});

	const activeVoiceId = $derived.by(() => (settings.speechSettings.activeVoiceId as string) || '');
	const isClone = $derived.by(() => activeVoiceId.startsWith('clone:'));

	function baseUrl(): string {
		return getTTSBaseUrl('omnivoice', settingsStore.getProviderConfig(provider.id).baseUrl);
	}

	function pickOmniVoicePreset(gender: string): string {
		return gender === 'male' ? 'onyx' : 'alloy';
	}

	function presetAttributes(voiceId: string): {
		gender: string;
		age: string;
		pitch: string;
		accent: string;
	} {
		const maleIds = new Set(['onyx', 'ash', 'echo', 'fable']);
		return {
			gender: maleIds.has(voiceId) ? 'male' : 'female',
			age: 'young adult',
			pitch: 'moderate',
			accent: 'american'
		};
	}

	function updateDesign(partial: Partial<{ gender: string; age: string; pitch: string; accent: string }>) {
		const next = { ...design, ...partial };
		settings.handleTTSInstructionsChange(buildInstructions(next.gender, next.age, next.pitch, next.accent));
		settings.handleTTSGenderChange(next.gender);
		settings.handleTTSAgeChange(next.age);
		settings.handleTTSPitchChange(next.pitch);
		settings.handleTTSAccentChange(next.accent);
		settings.handleTTSVoiceChange(pickOmniVoicePreset(next.gender));
	}

	function handlePresetChange(voiceId: string) {
		settings.handleTTSVoiceChange(voiceId);
		const attrs = presetAttributes(voiceId);
		settings.handleTTSInstructionsChange(
			buildInstructions(attrs.gender, attrs.age, attrs.pitch, attrs.accent)
		);
		settings.handleTTSGenderChange(attrs.gender);
		settings.handleTTSAgeChange(attrs.age);
		settings.handleTTSPitchChange(attrs.pitch);
		settings.handleTTSAccentChange(attrs.accent);
	}

	function parseSpeed(value: string): number | undefined {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}

	function parseNumber(value: string): number | undefined {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}

	// ── Preview ──────────────────────────────────────────────────────────────

	async function handlePreview() {
		previewLoading = true;
		previewError = '';
		try {
			const lang = (settings.speechSettings.activeLanguage as string) || 'en';
			const text = TEST_PHRASES[lang] || TEST_PHRASES.en;
			const instructions = isClone
				? undefined
				: (settings.speechSettings.instructions as string) ||
				  buildInstructions(design.gender, design.age, design.pitch, design.accent);

			const body: Record<string, unknown> = {
				model: 'omnivoice',
				input: text,
				response_format: 'wav'
			};
			if (activeVoiceId) body.voice = activeVoiceId;
			if (instructions) body.instructions = instructions;
			body.speed = (settings.speechSettings.speed as number) ?? 1;
			body.num_step = (settings.speechSettings.numStep as number) ?? 32;
			body.position_temperature = (settings.speechSettings.positionTemperature as number) ?? 1;
			body.class_temperature = (settings.speechSettings.classTemperature as number) ?? 0.2;

			const res = await fetch(baseUrl() + 'audio/speech', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const arrayBuffer = await res.arrayBuffer();
			const ctx = getSharedAudioContext();
			if (ctx.state === 'suspended') await ctx.resume();
			const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
			const source = ctx.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(ctx.destination);
			source.start(0);
		} catch (err) {
			previewError = err instanceof Error ? err.message : 'Preview failed';
		} finally {
			previewLoading = false;
		}
	}

	// ── Profile regeneration ─────────────────────────────────────────────────

	async function regenerateProfile() {
		regenerating = true;
		profileError = '';
		try {
			const voiceId = activeVoiceId || 'alloy';
			const voice = isClone ? voiceId.replace('clone:', '') : voiceId;
			const instructions = isClone
				? undefined
				: (settings.speechSettings.instructions as string) ||
				  buildInstructions(design.gender, design.age, design.pitch, design.accent);
			const language = (settings.speechSettings.activeLanguage as string) || 'en';

			const body: Record<string, unknown> = { voice, language };
			if (instructions) body.instructions = instructions;

			const res = await fetch(baseUrl() + 'voices/profile/reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
				throw new Error(
					(err as { detail?: string }).detail || `Profile reset failed (HTTP ${res.status})`
				);
			}
		} catch (err) {
			profileError = err instanceof Error ? err.message : 'Profile reset failed';
		} finally {
			regenerating = false;
		}
	}

	// ── Clone voice modal ────────────────────────────────────────────────────

	function openCloneModal() {
		cloneVoiceId = '';
		cloneRefText = '';
		cloneRefAudio = null;
		cloneFileName = '';
		cloneError = '';
		showCloneModal = true;
	}

	function closeCloneModal() {
		showCloneModal = false;
	}

	async function handleCloneVoice() {
		cloneError = '';
		if (!cloneVoiceId.trim() || !cloneRefAudio || !cloneRefText.trim()) {
			cloneError = 'Please provide a voice name, reference audio, and reference text.';
			return;
		}
		cloneLoading = true;
		try {
			const formData = new FormData();
			formData.append('voice_id', cloneVoiceId.trim());
			formData.append('ref_audio', cloneRefAudio);
			formData.append('ref_text', cloneRefText.trim());

			const res = await fetch(baseUrl() + 'voices/clone', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
				throw new Error((err as { detail?: string }).detail || `HTTP ${res.status}`);
			}
			settings.handleTTSVoiceChange('clone:' + cloneVoiceId.trim());
			closeCloneModal();
			cloneVoiceId = '';
			cloneRefText = '';
			cloneRefAudio = null;
			cloneFileName = '';
		} catch (err) {
			cloneError = err instanceof Error ? err.message : 'Clone failed';
		} finally {
			cloneLoading = false;
		}
	}
</script>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">OmniVoice Proxy</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-base-url">Base URL</label>
		<input
			id="omnivoice-base-url"
			type="text"
			class="api-key-input"
			placeholder={provider.defaultBaseUrl || 'http://localhost:8881/v1/'}
			value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
			onchange={(e) => {
				settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value });
				checkTTSProviderHealth(provider.id, e.currentTarget.value);
			}}
		/>
	</div>
</div>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">Voice</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-language">Language</label>
		<select
			id="omnivoice-language"
			class="api-key-input"
			value={(settings.speechSettings.activeLanguage as string) ?? 'en'}
			onchange={(e) => settings.handleTTSLanguageChange(e.currentTarget.value)}
		>
			{#each languages as lang}
				<option value={lang.code}>{lang.name}</option>
			{/each}
		</select>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-voice">Preset Voice</label>
		<select
			id="omnivoice-voice"
			class="api-key-input"
			value={(settings.speechSettings.activeVoiceId as string) ?? ''}
			onchange={(e) => handlePresetChange(e.currentTarget.value)}
		>
			<option value="" disabled>Select a voice...</option>
			{#each provider.voices ?? [] as voice}
				<option value={voice.id}>{voice.name}</option>
			{/each}
		</select>
	</div>

	{#if profileError || previewError}
		<div class="omnivoice-error" role="alert">
			{profileError || previewError}
			<button
				class="omnivoice-error-close"
				onclick={() => {
					profileError = '';
					previewError = '';
				}}
				aria-label="Dismiss error">×</button
			>
		</div>
	{/if}

	<div class="omnivoice-field">
		<div class="omnivoice-action-row">
			<button
				class="btn btn-sm btn-primary"
				onclick={handlePreview}
				disabled={previewLoading}
			>
				{#if previewLoading}
					<span class="omnivoice-spinner"></span> Testing...
				{:else}
					▶ Preview
				{/if}
			</button>
			<button
				class="btn btn-sm btn-secondary"
				onclick={regenerateProfile}
				disabled={regenerating || isClone}
				title={isClone ? 'Profile regeneration is only available for synthetic voices' : ''}
			>
				{#if regenerating}
					<span class="omnivoice-spinner"></span> Regenerating...
				{:else}
					↻ Regenerate profile
				{/if}
			</button>
		</div>
	</div>

	{#if isClone}
		<div class="omnivoice-field">
			<div class="omnivoice-clone-hint">
				Active voice: <span class="omnivoice-clone-id">{activeVoiceId}</span>
			</div>
		</div>
	{/if}

	<div class="omnivoice-field">
		<div class="omnivoice-section-subtitle">Voice Design</div>

		<div class="omnivoice-design-row">
			<label class="omnivoice-design-label" for="ov-gender">Gender</label>
			<select
				id="ov-gender"
				class="api-key-input"
				value={design.gender}
				onchange={(e) => updateDesign({ gender: e.currentTarget.value })}
			>
				{#each GENDERS as g}
					<option value={g}>{g}</option>
				{/each}
			</select>
		</div>

		<div class="omnivoice-design-row">
			<label class="omnivoice-design-label" for="ov-age">Age</label>
			<select
				id="ov-age"
				class="api-key-input"
				value={design.age}
				onchange={(e) => updateDesign({ age: e.currentTarget.value })}
			>
				{#each AGES as a}
					<option value={a}>{a}</option>
				{/each}
			</select>
		</div>

		<div class="omnivoice-design-row">
			<label class="omnivoice-design-label" for="ov-pitch">Pitch</label>
			<select
				id="ov-pitch"
				class="api-key-input"
				value={design.pitch}
				onchange={(e) => updateDesign({ pitch: e.currentTarget.value })}
			>
				{#each PITCHES as p}
					<option value={p}>{p}</option>
				{/each}
			</select>
		</div>

		<div class="omnivoice-design-row">
			<label class="omnivoice-design-label" for="ov-accent">Accent</label>
			<select
				id="ov-accent"
				class="api-key-input"
				value={design.accent}
				onchange={(e) => updateDesign({ accent: e.currentTarget.value })}
			>
				{#each ACCENTS as a}
					<option value={a}>{a}</option>
				{/each}
			</select>
		</div>

		<div class="omnivoice-instructions">
			{buildInstructions(design.gender, design.age, design.pitch, design.accent)}
		</div>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-speed">
			Speed <span class="omnivoice-value">{(settings.speechSettings.speed as number) ?? 1}</span>
		</label>
		<input
			id="omnivoice-speed"
			type="range"
			min="0.5"
			max="2.0"
			step="0.1"
			class="omnivoice-slider"
			value={(settings.speechSettings.speed as number) ?? 1}
			oninput={(e) => settings.handleTTSSpeedChange(parseSpeed(e.currentTarget.value))}
		/>
	</div>
</div>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">Advanced</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="ov-num-step">
			Num Steps <span class="omnivoice-value">{(settings.speechSettings.numStep as number) ?? 32}</span>
		</label>
		<input
			id="ov-num-step"
			type="range"
			min="4"
			max="64"
			step="1"
			class="omnivoice-slider"
			value={(settings.speechSettings.numStep as number) ?? 32}
			oninput={(e) => settings.handleTTSNumStepChange(parseNumber(e.currentTarget.value))}
		/>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="ov-position-temp">
			Position Temperature
			<span class="omnivoice-value">
				{(settings.speechSettings.positionTemperature as number) ?? 1}
			</span>
		</label>
		<input
			id="ov-position-temp"
			type="range"
			min="0"
			max="2"
			step="0.1"
			class="omnivoice-slider"
			value={(settings.speechSettings.positionTemperature as number) ?? 1}
			oninput={(e) => settings.handleTTSPositionTemperatureChange(parseNumber(e.currentTarget.value))}
		/>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="ov-class-temp">
			Class Temperature
			<span class="omnivoice-value">
				{(settings.speechSettings.classTemperature as number) ?? 0.2}
			</span>
		</label>
		<input
			id="ov-class-temp"
			type="range"
			min="0"
			max="2"
			step="0.1"
			class="omnivoice-slider"
			value={(settings.speechSettings.classTemperature as number) ?? 0.2}
			oninput={(e) => settings.handleTTSClassTemperatureChange(parseNumber(e.currentTarget.value))}
		/>
	</div>
</div>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">Cloned Voices</div>
	<div class="omnivoice-field">
		<button class="btn btn-sm btn-secondary" onclick={openCloneModal}>
			Clone New Voice
		</button>
	</div>
</div>

{#if showCloneModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="omnivoice-modal-backdrop" onclick={closeCloneModal} role="button" tabindex="-1">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="omnivoice-modal-card"
			role="dialog"
			aria-modal="true"
			aria-labelledby="clone-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 id="clone-modal-title" class="omnivoice-modal-title">Clone New Voice</h3>

			<div class="omnivoice-modal-field">
				<label class="omnivoice-modal-label" for="clone-audio">Reference Audio (3–10s)</label>
				<div class="omnivoice-file-row">
					<label class="btn btn-sm btn-secondary" for="clone-audio">
						{cloneFileName || 'Choose file...'}
					</label>
					<input
						type="file"
						accept="audio/*"
						id="clone-audio"
						class="omnivoice-hidden-input"
						onchange={(e) => {
							cloneRefAudio = e.currentTarget.files?.[0] ?? null;
							cloneFileName = cloneRefAudio?.name ?? '';
						}}
					/>
					{#if cloneFileName}
						<span class="omnivoice-file-name">{cloneFileName}</span>
					{/if}
				</div>
			</div>

			<div class="omnivoice-modal-field">
				<label class="omnivoice-modal-label" for="clone-name">Voice Name</label>
				<input
					type="text"
					id="clone-name"
					class="api-key-input"
					placeholder="e.g. my_voice"
					bind:value={cloneVoiceId}
				/>
			</div>

			<div class="omnivoice-modal-field">
				<label class="omnivoice-modal-label" for="clone-text">Reference Text</label>
				<textarea
					id="clone-text"
					class="api-key-input omnivoice-clone-textarea"
					placeholder="Write the sentence you have recorded in the audio file"
					rows="4"
					bind:value={cloneRefText}
				></textarea>
			</div>

			{#if cloneError}
				<p class="omnivoice-modal-error">{cloneError}</p>
			{/if}

			<div class="omnivoice-modal-actions">
				<button class="btn btn-sm btn-secondary" onclick={closeCloneModal}>Cancel</button>
				<button
					class="btn btn-sm btn-primary"
					onclick={handleCloneVoice}
					disabled={cloneLoading}
				>
					{cloneLoading ? 'Cloning...' : 'Clone Voice'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.omnivoice-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle, color-mix(in srgb, var(--text-secondary) 12%, transparent));
		border-radius: var(--radius-lg);
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.omnivoice-section-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
		margin-bottom: 0.6rem;
	}

	.omnivoice-section-subtitle {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.4rem;
	}

	.omnivoice-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.6rem;
	}

	.omnivoice-field:last-child {
		margin-bottom: 0;
	}

	.omnivoice-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.omnivoice-value {
		font-family: var(--font-mono);
		color: var(--text-tertiary);
	}

	.omnivoice-slider {
		width: 100%;
		height: 4px;
		accent-color: var(--accent);
		cursor: pointer;
		background: transparent;
	}

	.omnivoice-action-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.omnivoice-design-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.omnivoice-design-row:last-child {
		margin-bottom: 0;
	}

	.omnivoice-design-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		width: 4rem;
		flex-shrink: 0;
	}

	.omnivoice-instructions {
		font-size: 0.75rem;
		font-style: italic;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
	}

	.omnivoice-clone-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.omnivoice-clone-id {
		font-family: var(--font-mono);
		color: var(--text-tertiary);
	}

	.omnivoice-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-error-bg, rgba(239, 68, 68, 0.12));
		color: var(--color-error);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.omnivoice-error-close {
		background: transparent;
		border: none;
		color: inherit;
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 0.2rem;
	}

	.omnivoice-spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: ov-spin 0.6s linear infinite;
		vertical-align: middle;
		margin-right: 0.25rem;
	}

	@keyframes ov-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.omnivoice-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.omnivoice-modal-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 1.25rem;
		min-width: 360px;
		max-width: 90vw;
	}

	.omnivoice-modal-title {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.omnivoice-modal-field {
		margin-bottom: 0.75rem;
	}

	.omnivoice-modal-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		margin-bottom: 0.3rem;
	}

	.omnivoice-modal-error {
		color: var(--color-error);
		font-size: 0.8rem;
		margin: 0.25rem 0;
	}

	.omnivoice-modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.omnivoice-clone-textarea {
		resize: vertical;
		min-height: 5em;
		width: 100%;
		font-family: inherit;
	}

	.omnivoice-file-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.omnivoice-file-name {
		font-size: 0.75rem;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.omnivoice-hidden-input {
		display: none;
	}
</style>
