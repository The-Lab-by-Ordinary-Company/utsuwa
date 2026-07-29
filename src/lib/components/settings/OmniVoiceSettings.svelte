<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TtsSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import type { ProviderMetadata } from '$lib/services/providers/registry';
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
	import { getFocusableElements, handleModalKeydown } from './tts-modal-a11y';
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
		{ code: 'ar', name: 'Arabic' },
		{ code: 'nl', name: 'Dutch' },
		{ code: 'pl', name: 'Polish' },
		{ code: 'tr', name: 'Turkish' },
		{ code: 'sv', name: 'Swedish' }
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
		ar: 'مرحباً، هذا اختبار لـ OmniVoice.',
		nl: 'Hallo, dit is een test van OmniVoice.',
		pl: 'Cześć, to jest test OmniVoice.',
		tr: 'Merhaba, bu OmniVoice bir testidir.',
		sv: 'Hej, detta är ett test av OmniVoice.'
	};

	const GENDERS = [...OMNI_VOICE_GENDERS];
	const AGES = [...OMNI_VOICE_AGES];
	const PITCHES = [...OMNI_VOICE_PITCHES];
	const ACCENTS = [...OMNI_VOICE_ACCENTS];

	// ── Local UI state ───────────────────────────────────────────────────────

	let previewLoading = $state(false);
	let previewError = $state('');
	let regenerating = $state(false);
	let profileError = $state('');
	let profileInitialized = $state(false);

	let showCloneModal = $state(false);
	let cloneVoiceId = $state('');
	let cloneRefText = $state('');
	let cloneRefAudio: File | null = $state(null);
	let cloneFileName = $state('');
	let cloneLoading = $state(false);
	let cloneError = $state('');
	let cloneModalCard: HTMLDivElement | null = $state(null);
	let clonedVoices = $state<Array<{ id: string; name: string }>>([]);
	let cloneDeleting = $state('');

	let proxyStatus = $state<'connected' | 'connecting' | 'disconnected' | 'checking'>('checking');
	let proxyCheckTimer: ReturnType<typeof setInterval> | undefined;

	// ── Derived voice design ─────────────────────────────────────────────────

	const design = $derived.by<{
		gender: string;
		age: string;
		pitch: string;
		accent: string;
	}>(() => {
		const s = settings.speechSettings;
		const fromInstructions = parseInstructions((s.instructions as string) || '');
		return {
			gender: (s.gender as string) || fromInstructions.gender || DEFAULT_OMNI_VOICE_DESIGN.gender,
			age: (s.age as string) || fromInstructions.age || DEFAULT_OMNI_VOICE_DESIGN.age,
			pitch: (s.pitch as string) || fromInstructions.pitch || DEFAULT_OMNI_VOICE_DESIGN.pitch,
			accent: (s.accent as string) || fromInstructions.accent || DEFAULT_OMNI_VOICE_DESIGN.accent
		};
	});

	const activeVoiceId = $derived.by(() => (settings.speechSettings.activeVoiceId as string) || '');
	const isClone = $derived.by(() => activeVoiceId.startsWith('clone:'));
	const activeLanguage = $derived.by(() => {
		const lang = settings.speechSettings.activeLanguage as string;
		return languages.some((l) => l.code === lang) ? lang : 'en';
	});

	function baseUrl(): string {
		return getTTSBaseUrl('omnivoice', settingsStore.getProviderConfig(provider.id).baseUrl);
	}

	function pickOmniVoicePreset(gender: string): string {
		return gender === 'male' ? 'onyx' : 'alloy';
	}

	const PRESET_ATTRIBUTES: Record<
		string,
		{ gender: string; age: string; pitch: string; accent: string }
	> = {
		alloy: { gender: 'female', age: 'young adult', pitch: 'moderate', accent: 'american' },
		ash: { gender: 'male', age: 'young adult', pitch: 'low', accent: 'american' },
		ballad: { gender: 'male', age: 'middle-aged', pitch: 'low', accent: 'british' },
		cedar: { gender: 'male', age: 'middle-aged', pitch: 'low', accent: 'american' },
		coral: { gender: 'female', age: 'young adult', pitch: 'high', accent: 'australian' },
		echo: { gender: 'male', age: 'middle-aged', pitch: 'moderate', accent: 'american' },
		fable: { gender: 'female', age: 'middle-aged', pitch: 'moderate', accent: 'british' },
		marin: { gender: 'female', age: 'middle-aged', pitch: 'moderate', accent: 'american' },
		nova: { gender: 'female', age: 'young adult', pitch: 'high', accent: 'american' },
		onyx: { gender: 'male', age: 'middle-aged', pitch: 'very low', accent: 'british' },
		sage: { gender: 'female', age: 'elderly', pitch: 'low', accent: 'british' },
		shimmer: { gender: 'female', age: 'young adult', pitch: 'very high', accent: 'american' },
		verse: { gender: 'male', age: 'young adult', pitch: 'moderate', accent: 'british' }
	};

	function handlePresetChange(voiceId: string) {
		const attrs = PRESET_ATTRIBUTES[voiceId];
		const nextGender = attrs?.gender ?? design.gender;
		const nextAge = attrs?.age ?? design.age;
		const nextPitch = attrs?.pitch ?? design.pitch;
		const nextAccent = attrs?.accent ?? design.accent;
		const instructions = buildInstructions(nextGender, nextAge, nextPitch, nextAccent);
		if (attrs) {
			settings.handleTTSInstructionsChange(instructions);
			settings.handleTTSGenderChange(attrs.gender);
			settings.handleTTSAgeChange(attrs.age);
			settings.handleTTSPitchChange(attrs.pitch);
			settings.handleTTSAccentChange(attrs.accent);
		}
		settings.handleTTSVoiceChange(voiceId);
		initializeProfile(voiceId, instructions, (settings.speechSettings.activeLanguage as string) || 'en');
	}

	function parseSpeed(value: string): number | undefined {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}

	function parseNumber(value: string): number | undefined {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}

	function updateDesign(partial: Partial<{ gender: string; age: string; pitch: string; accent: string }>) {
		const next = { ...design, ...partial };
		settings.handleTTSInstructionsChange(
			buildInstructions(next.gender, next.age, next.pitch, next.accent)
		);
		settings.handleTTSGenderChange(next.gender);
		settings.handleTTSAgeChange(next.age);
		settings.handleTTSPitchChange(next.pitch);
		settings.handleTTSAccentChange(next.accent);
		if (!isClone) {
			initializeProfile(
				activeVoiceId || pickOmniVoicePreset(next.gender),
				buildInstructions(next.gender, next.age, next.pitch, next.accent),
				(settings.speechSettings.activeLanguage as string) || 'en'
			);
		}
	}

	// ── Profile initialization & regeneration ────────────────────────────────

	async function initializeProfile(voice: string, instructions: string, language: string) {
		try {
			const res = await fetch(baseUrl() + 'voices/initialize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ voice, instructions, language })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
				profileError = (err as { detail?: string }).detail || `Profile init failed (HTTP ${res.status})`;
			}
		} catch (err) {
			profileError = err instanceof Error ? err.message : 'Profile initialization failed';
		}
	}

	function initializePrimaryProfile() {
		if (isClone) return;
		const voice = activeVoiceId || pickOmniVoicePreset(design.gender);
		const instructions =
			(settings.speechSettings.instructions as string) ||
			buildInstructions(design.gender, design.age, design.pitch, design.accent);
		const language = (settings.speechSettings.activeLanguage as string) || 'en';
		initializeProfile(voice, instructions, language);
	}

	async function regenerateProfile() {
		regenerating = true;
		profileError = '';
		try {
			const voiceId = activeVoiceId || pickOmniVoicePreset(design.gender);
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

	// ── Proxy health & clone list ────────────────────────────────────────────

	async function checkProxyHealth() {
		proxyStatus = 'connecting';
		try {
			const healthUrl = baseUrl().replace(/\/v1\/$/, '') + '/health';
			const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
			proxyStatus = res.ok ? 'connected' : res.status === 503 ? 'connecting' : 'disconnected';
		} catch {
			proxyStatus = 'disconnected';
		}
	}

	function startHealthPolling() {
		proxyStatus = 'checking';
		checkProxyHealth();
		proxyCheckTimer = setInterval(checkProxyHealth, 5000);
	}

	function stopHealthPolling() {
		clearInterval(proxyCheckTimer);
		proxyCheckTimer = undefined;
	}

	async function fetchClonedVoices() {
		try {
			const res = await fetch(baseUrl() + 'voices');
			if (!res.ok) return;
			const data = await res.json();
			clonedVoices = (data.clones || []) as Array<{ id: string; name: string }>;
		} catch (err) {
			clonedVoices = [];
			if (import.meta.env.DEV) {
				console.debug('Clone list fetch failed:', err);
			}
		}
	}

	$effect(() => {
		if (!languages.some((l) => l.code === settings.speechSettings.activeLanguage)) {
			settings.handleTTSLanguageChange('en');
		}
		if (!activeVoiceId && !isClone) {
			settings.handleTTSVoiceChange(pickOmniVoicePreset(design.gender));
		}
		fetchClonedVoices();
		startHealthPolling();
		if (!profileInitialized && !isClone) {
			profileInitialized = true;
			initializePrimaryProfile();
		}
		return () => {
			stopHealthPolling();
		};
	});

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
			const speed = (settings.speechSettings.speed as number) ?? 1;
			if (speed != null) body.speed = speed;
			const ns = (settings.speechSettings.numStep as number) ?? 32;
			if (ns != null) body.num_step = ns;
			const pt = settings.speechSettings.positionTemperature as number;
			if (pt != null) body.position_temperature = pt;
			const ct = settings.speechSettings.classTemperature as number;
			if (ct != null) body.class_temperature = ct;

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

	// ── Clone voice modal ────────────────────────────────────────────────────

	function openCloneModal() {
		cloneVoiceId = '';
		cloneRefText = '';
		cloneRefAudio = null;
		cloneFileName = '';
		cloneError = '';
		showCloneModal = true;
		requestAnimationFrame(() => {
			cloneModalCard?.focus();
		});
	}

	function closeCloneModal() {
		showCloneModal = false;
	}

	function handleCloneModalKeydown(e: KeyboardEvent) {
		if (!cloneModalCard) return;
		handleModalKeydown(
			e,
			getFocusableElements(cloneModalCard),
			document.activeElement,
			closeCloneModal
		);
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
			await fetchClonedVoices();
		} catch (err) {
			cloneError = err instanceof Error ? err.message : 'Clone failed';
		} finally {
			cloneLoading = false;
		}
	}

	// ── Delete clone ─────────────────────────────────────────────────────────

	async function deleteClone(cloneId: string) {
		cloneDeleting = cloneId;
		try {
			await fetch(baseUrl() + 'voices/clone/' + cloneId, { method: 'DELETE' });
			if (activeVoiceId === 'clone:' + cloneId) {
				settings.handleTTSVoiceChange(pickOmniVoicePreset(design.gender));
			}
			await fetchClonedVoices();
		} catch {
			/* ignore */
		}
		cloneDeleting = '';
	}

	function switchToSynthetic() {
		settings.handleTTSVoiceChange(pickOmniVoicePreset(design.gender));
	}

	function switchToClone() {
		const first = clonedVoices[0];
		if (first) {
			settings.handleTTSVoiceChange(first.id);
		} else {
			openCloneModal();
		}
	}
</script>

<svelte:window onkeydown={handleCloneModalKeydown} />

<!-- Proxy card -->
<div class="omnivoice-card">
	<div class="omnivoice-card-label">OmniVoice Proxy</div>
	<div class="omnivoice-proxy-hint">
		<span class="omnivoice-proxy-status">
			{#if proxyStatus === 'connected'}
				<span class="omnivoice-dot omnivoice-dot-ok"></span> Connected
			{:else if proxyStatus === 'connecting'}
				<span class="omnivoice-dot omnivoice-dot-warn"></span> Connecting...
			{:else if proxyStatus === 'disconnected'}
				<span class="omnivoice-dot omnivoice-dot-err"></span> Not reachable
			{:else}
				<span class="omnivoice-dot"></span> Checking...
			{/if}
		</span>
		<span class="omnivoice-proxy-cmd">python tools/omnivoice/omnivoice-proxy.py --device cuda</span>
	</div>
	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-base-url">Base URL</label>
		<input
			id="omnivoice-base-url"
			type="text"
			class="api-key-input"
			placeholder={provider.defaultBaseUrl || 'http://localhost:8881/v1/'}
			value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
			onchange={(e) => settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value })}
		/>
	</div>
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

<!-- Primary voice card -->
<div class="omnivoice-card">
	<div class="omnivoice-card-label">Primary Voice</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-language">Language</label>
		<select
			id="omnivoice-language"
			class="api-key-input"
			value={activeLanguage}
			onchange={(e) => settings.handleTTSLanguageChange(e.currentTarget.value)}
		>
			{#each languages as lang}
				<option value={lang.code}>{lang.name}</option>
			{/each}
		</select>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-preset">Preset Voice</label>
		<select
			id="omnivoice-preset"
			class="api-key-input"
			value={isClone ? '' : activeVoiceId || pickOmniVoicePreset(design.gender)}
			onchange={(e) => handlePresetChange(e.currentTarget.value)}
		>
			<option value="" disabled selected={isClone}>
				{isClone ? 'Current cloned voice' : 'Select a preset...'}
			</option>
			{#each provider.voices ?? [] as voice}
				<option value={voice.id}>{voice.name}</option>
			{/each}
		</select>
	</div>

	<div class="omnivoice-voice-row">
		<span class="omnivoice-design-label" style="width:auto;flex-shrink:0;">Mode</span>
		<label class="omnivoice-radio">
			<input
				type="radio"
				name="ov-mode"
				value="synth"
				checked={!isClone}
				onchange={switchToSynthetic}
			/>
			Synthetic
		</label>
		<label class="omnivoice-radio">
			<input
				type="radio"
				name="ov-mode"
				value="clone"
				checked={isClone}
				onchange={switchToClone}
			/>
			Cloned
		</label>
		<span style="flex:1;"></span>
		<button class="btn btn-sm btn-primary" onclick={handlePreview} disabled={previewLoading}>
			{#if previewLoading}
				<span class="omnivoice-spinner"></span> Testing...
			{:else}
				▶ Test
			{/if}
		</button>
	</div>

	<div class="omnivoice-voice-row">
		<span style="flex:1;"></span>
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

	{#if !isClone}
		<div class="omnivoice-design">
			<div class="omnivoice-design-row">
				<span class="omnivoice-design-label">Gender</span>
				{#each GENDERS as g}
					<label class="omnivoice-radio">
						<input
							type="radio"
							name="ov-gender"
							value={g}
							checked={design.gender === g}
							onchange={() => updateDesign({ gender: g })}
						/>
						{g}
					</label>
				{/each}
			</div>
			<div class="omnivoice-design-row">
				<span class="omnivoice-design-label">Age</span>
				{#each AGES as a}
					<label class="omnivoice-radio">
						<input
							type="radio"
							name="ov-age"
							value={a}
							checked={design.age === a}
							onchange={() => updateDesign({ age: a })}
						/>
						{a}
					</label>
				{/each}
			</div>
			<div class="omnivoice-design-row">
				<span class="omnivoice-design-label">Pitch</span>
				{#each PITCHES as p}
					<label class="omnivoice-radio">
						<input
							type="radio"
							name="ov-pitch"
							value={p}
							checked={design.pitch === p}
							onchange={() => updateDesign({ pitch: p })}
						/>
						{p}
					</label>
				{/each}
			</div>
			<div class="omnivoice-design-row">
				<span class="omnivoice-design-label">Accent</span>
				<select
					class="api-key-input"
					style="flex:1;"
					value={design.accent}
					onchange={(e) => updateDesign({ accent: e.currentTarget.value })}
				>
					{#each ACCENTS as a}
						<option value={a}>{a}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
</div>

<!-- Advanced card -->
<div class="omnivoice-card">
	<div class="omnivoice-card-label">Advanced</div>

	<div class="omnivoice-design">
		<div class="omnivoice-design-row">
			<span class="omnivoice-design-label">Speed</span>
			<input
				type="range"
				min="0.5"
				max="2.0"
				step="0.1"
				class="omnivoice-slider"
				value={(settings.speechSettings.speed as number) ?? 1}
				oninput={(e) => settings.handleTTSSpeedChange(parseSpeed(e.currentTarget.value))}
			/>
			<span class="omnivoice-slider-val">{(settings.speechSettings.speed as number) ?? 1}</span>
		</div>
		<div class="omnivoice-design-row">
			<span class="omnivoice-design-label">Num Step</span>
			<input
				type="range"
				min="4"
				max="64"
				step="1"
				class="omnivoice-slider"
				value={(settings.speechSettings.numStep as number) ?? 32}
				oninput={(e) => settings.handleTTSNumStepChange(parseNumber(e.currentTarget.value))}
			/>
			<span class="omnivoice-slider-val">{(settings.speechSettings.numStep as number) ?? 32}</span>
		</div>
	</div>

	<div class="omnivoice-design-grid-2">
		<div class="omnivoice-advanced-slider">
			<span class="omnivoice-advanced-label">Position Temperature</span>
			<div class="omnivoice-advanced-row">
				<input
					type="range"
					min="0"
					max="2"
					step="0.1"
					class="omnivoice-slider"
					value={(settings.speechSettings.positionTemperature as number) ?? 1}
					oninput={(e) =>
						settings.handleTTSPositionTemperatureChange(parseNumber(e.currentTarget.value))}
				/>
				<span class="omnivoice-slider-val">
					{(settings.speechSettings.positionTemperature as number) ?? 1}
				</span>
			</div>
		</div>
		<div class="omnivoice-advanced-slider">
			<span class="omnivoice-advanced-label">Class Temperature</span>
			<div class="omnivoice-advanced-row">
				<input
					type="range"
					min="0"
					max="2"
					step="0.1"
					class="omnivoice-slider"
					value={(settings.speechSettings.classTemperature as number) ?? 0.2}
					oninput={(e) =>
						settings.handleTTSClassTemperatureChange(parseNumber(e.currentTarget.value))}
				/>
				<span class="omnivoice-slider-val">
					{(settings.speechSettings.classTemperature as number) ?? 0.2}
				</span>
			</div>
		</div>
	</div>
</div>

<!-- Cloned voices card -->
<div class="omnivoice-card">
	<div class="omnivoice-card-label">Cloned Voices</div>

	{#if clonedVoices.length > 0}
		<div class="omnivoice-voice-row">
			<select
				class="omnivoice-clone-select"
				style="flex:1;"
				value={activeVoiceId}
				onchange={(e) => settings.handleTTSVoiceChange(e.currentTarget.value)}
			>
				{#each clonedVoices as v}
					<option value={v.id}>{v.name}</option>
				{/each}
			</select>
			<button class="btn btn-sm btn-secondary" onclick={openCloneModal}>Clone New</button>
			{#if isClone}
				{@const cloneId = activeVoiceId.replace('clone:', '')}
				<button
					class="btn btn-sm btn-danger omnivoice-delete-btn"
					onclick={() => deleteClone(cloneId)}
					disabled={cloneDeleting === cloneId}
				>
					{#if cloneDeleting === cloneId}...{:else}Delete{/if}
				</button>
			{/if}
		</div>
	{:else}
		<div class="omnivoice-voice-row">
			<span class="omnivoice-no-clones">No cloned voices yet.</span>
			<button class="btn btn-sm btn-primary" onclick={openCloneModal}>Clone New Voice</button>
		</div>
	{/if}
</div>

{#if showCloneModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="omnivoice-modal-backdrop"
		onclick={closeCloneModal}
		role="button"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={cloneModalCard}
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
	.omnivoice-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.omnivoice-card-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
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

	.omnivoice-proxy-hint {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-bottom: 0.6rem;
	}

	.omnivoice-proxy-status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.omnivoice-proxy-cmd {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.omnivoice-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
		background: var(--text-tertiary);
		flex-shrink: 0;
	}

	.omnivoice-dot-ok {
		background: var(--color-success);
	}

	.omnivoice-dot-warn {
		background: var(--color-warning);
	}

	.omnivoice-dot-err {
		background: var(--color-error);
	}

	/* ── Voice row ──────────────────────────────────────── */

	.omnivoice-voice-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.omnivoice-voice-row .btn {
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* ── Voice Design ──────────────────────────────────── */

	.omnivoice-design {
		margin-top: 0.4rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-subtle);
	}

	.omnivoice-design-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin-bottom: 0.3rem;
		flex-wrap: wrap;
	}

	.omnivoice-design-row:last-child {
		margin-bottom: 0;
	}

	.omnivoice-design-label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-tertiary);
		width: 3.2em;
		flex-shrink: 0;
		text-align: right;
	}

	.omnivoice-radio {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 0.72rem;
		color: var(--text-secondary);
		cursor: pointer;
		white-space: nowrap;
	}

	.omnivoice-radio input {
		accent-color: var(--accent);
		margin: 0;
	}

	.omnivoice-slider {
		flex: 1;
		height: 4px;
		accent-color: var(--accent);
		cursor: pointer;
	}

	.omnivoice-slider-val {
		font-size: 0.7rem;
		color: var(--text-secondary);
		width: 2.2em;
		text-align: center;
		font-family: var(--font-mono);
	}

	.omnivoice-design-grid-2 {
		margin-top: 0.4rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-subtle);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.omnivoice-advanced-slider {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.omnivoice-advanced-label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-tertiary);
	}

	.omnivoice-advanced-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-width: 0;
	}

	.omnivoice-advanced-row .omnivoice-slider {
		flex: 1;
		min-width: 0;
	}

	/* ── Spinner ────────────────────────────────────────── */

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

	/* ── Error ──────────────────────────────────────────── */

	.omnivoice-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		margin-top: 0.5rem;
		background: var(--color-error-bg, rgba(239, 68, 68, 0.12));
		color: var(--color-error);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		font-size: 0.8rem;
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

	/* ── Cloned voices ──────────────────────────────────── */

	.omnivoice-no-clones {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		flex: 1;
	}

	.omnivoice-clone-select {
		font-size: 0.8rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		padding: 0.5rem 0.75rem;
	}

	.omnivoice-clone-select:focus {
		border-color: var(--accent);
		outline: none;
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	.omnivoice-delete-btn {
		padding: 0.25rem 0.5rem;
	}

	/* ── Modal ──────────────────────────────────────────── */

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
