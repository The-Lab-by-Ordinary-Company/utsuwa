<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL, GITHUB_REPO, GITHUB_RELEASES } from '$lib/config/site';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ProviderIcons from '$lib/components/icons/ProviderIcons.svelte';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { sectionUrl } from '$lib/config/links';

	let { data }: { data: PageData } = $props();

	// Theme toggle (shares the app/docs colorMode + .dark mechanism).
	const themeIcon = $derived(getIconName());
	const themeLabel = $derived(getLabel());

	// Hero video. Starts off so SSR/first paint shows the lightweight poster
	// (keeps LCP fast), then swaps to the looping clip on the client once we
	// know motion is allowed. Reduced-motion users keep the still poster.
	let allowVideo = $state(false);
	let videoReady = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		allowVideo = !mq.matches;
		const sync = () => (allowVideo = !mq.matches);
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	// Scroll-reveal action. Fires once when an element enters the viewport,
	// staggered by an optional delay. Bails out to "always visible" when the
	// user prefers reduced motion or IntersectionObserver isn't around.
	function reveal(node: HTMLElement, delay = 0) {
		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('revealed');
			return;
		}
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			node.classList.add('revealed');
			return;
		}
		node.style.setProperty('--reveal-delay', `${delay}ms`);
		const obs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						node.classList.add('revealed');
						obs.unobserve(node);
					}
				}
			},
			{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
		);
		obs.observe(node);
		return { destroy: () => obs.disconnect() };
	}

	// Pinned feature showcase: the visual column stays put while the copy
	// scrolls; each step flips the active screenshot as it crosses the middle
	// of the viewport.
	let activeFeature = $state(0);

	function trackStep(node: HTMLElement, index: number) {
		if (typeof IntersectionObserver === 'undefined') return;
		const obs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeFeature = index;
				}
			},
			// Collapse the observer root to a line through the viewport's middle.
			{ rootMargin: '-50% 0px -50% 0px', threshold: 0 }
		);
		obs.observe(node);
		return { destroy: () => obs.disconnect() };
	}

	const features = [
		{
			num: '01',
			eyebrow: 'Presence',
			title: 'A real 3D body, not a chat box.',
			body: "Drop in any VRM model and watch it come to life. Replies appear as 3D speech bubbles that follow your companion's head as it moves, breathes, and looks around.",
			chips: ['Idle animation', 'Auto-blink', 'Speech lip-sync', 'Head-tracked bubbles'],
			img: '/landing-page/utsuwa-thumbnail.png',
			alt: 'Utsuwa desktop app with a 3D VRM avatar companion and chat interface'
		},
		{
			num: '02',
			eyebrow: 'Memory',
			title: 'She actually remembers.',
			body: 'Local AI embeddings weave your conversations into a web of memories she can recall by meaning, not keywords. Affection, trust, and mood shift over time across eight relationship stages — from Stranger to Soulmate.',
			chips: ['Semantic recall', 'On-device embeddings', '8 relationship stages', 'Mood & trust'],
			img: '/landing-page/memory-graph.png',
			alt: 'Semantic memory graph showing AI companion relationship and conversation history'
		},
		{
			num: '03',
			eyebrow: 'Control',
			title: 'You own every part of it.',
			body: 'Run a frontier model or keep it fully offline with Ollama and LM Studio. Mix and match your chat, voice input, and text-to-speech providers — all on your own API keys, with nothing routed through us.',
			chips: ['Frontier or local', 'Your API keys', 'Swap voices', 'No middleman'],
			img: '/landing-page/ai-services.png',
			alt: 'Settings panel showing LLM provider options including OpenAI, Anthropic, and Ollama'
		}
	];

	// Bento layout: a flagship hero tile, a few wide tiles, and small tiles for
	// rhythm. Index-aligned with `bento` below.
	const bentoLayout = ['hero', 'wide', '', '', 'wide', 'wide'];
	function bentoGridClass(i: number) {
		const size = bentoLayout[i];
		if (size === 'hero') return 'md:col-span-2 lg:col-span-2 lg:row-span-2';
		if (size === 'wide') return 'md:col-span-2 lg:col-span-2';
		return '';
	}

	// Every provider we actually support today — keep this honest.
	// `icon` maps to the keys in ProviderIcons' PROVIDER_ICONS map; `wm` is a
	// wide wordmark (light = for light mode, dark = for dark mode). Providers
	// without a wordmark fall back to the monochrome glyph mark.
	const WM = '/brand-assets/providers';
	const providers: {
		name: string;
		icon: string;
		wm: { light: string; dark: string } | null;
	}[] = [
		{ name: 'OpenAI', icon: 'openai', wm: { light: `${WM}/openai-wordmark-light.svg`, dark: `${WM}/openai-wordmark-dark.svg` } },
		{ name: 'Anthropic', icon: 'anthropic', wm: { light: `${WM}/anthropic-wordmark-light.svg`, dark: `${WM}/anthropic-wordmark-dark.svg` } },
		{ name: 'Google Gemini', icon: 'google', wm: { light: `${WM}/gemini-wordmark-light.svg`, dark: `${WM}/gemini-wordmark-dark.svg` } },
		{ name: 'DeepSeek', icon: 'deepseek', wm: { light: `${WM}/deepseek-wordmark-light.svg`, dark: `${WM}/deepseek-wordmark-dark.svg` } },
		{ name: 'xAI Grok', icon: 'xai', wm: { light: `${WM}/grok-wordmark-light.svg`, dark: `${WM}/grok-wordmark-dark.svg` } },
		{ name: 'Ollama', icon: 'ollama', wm: null },
		{ name: 'LM Studio', icon: 'lmstudio', wm: null },
		{ name: 'Groq Whisper', icon: 'groq', wm: { light: `${WM}/groq-wordmark-light.svg`, dark: `${WM}/groq-wordmark-dark.svg` } },
		{ name: 'ElevenLabs', icon: 'elevenlabs', wm: null }
	];

	const bento = [
		{
			icon: 'monitor',
			title: 'Desktop overlay',
			body: 'Pin your companion on top of everything with a transparent background, draggable anywhere, summoned by a global hotkey.'
		},
		{
			icon: 'mic',
			title: 'Talk, out loud',
			body: 'Speak with Groq Whisper or the Web Speech API and hear replies back through ElevenLabs or OpenAI voices.'
		},
		{
			icon: 'lock',
			title: 'Stays on your machine',
			body: 'Everything lives in IndexedDB on your device. No account, no cloud sync, no telemetry. Export and import whenever you want.'
		},
		{
			icon: 'sparkles',
			title: 'Alive, not idle',
			body: 'Idle motion, automatic blinking, mood-driven expressions and lip-sync that actually tracks what she is saying.'
		},
		{
			icon: 'code',
			title: 'Yours to fork',
			body: 'MIT licensed and built on SvelteKit, Three.js and Tauri. Self-host it, rip it apart, send a PR.'
		},
		{
			icon: 'layers',
			title: 'Desktop and web',
			body: 'A native macOS app for the full experience, plus a web build that runs in any modern browser. Same companion, same save file.'
		}
	];
</script>

<svelte:head>
	<title>Utsuwa — Open-Source AI Companion with 3D VRM Avatars</title>
	<meta
		name="description"
		content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and support for OpenAI, Anthropic, Google, and local LLMs. Desktop app and web. Self-hosted, privacy-first."
	/>
	<link rel="canonical" href={SITE_URL} />

	<!-- Hero poster doubles as the LCP element; fetch it ahead of the video -->
	<link rel="preload" as="image" href="/landing-page/hero-poster.jpg" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Utsuwa — Open-Source AI Companion with 3D VRM Avatars" />
	<meta property="og:description" content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and support for OpenAI, Anthropic, Google, and local LLMs. Desktop app and web. Self-hosted, privacy-first." />
	<meta property="og:image" content={`${SITE_URL}/brand-assets/og-image.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:site_name" content="Utsuwa" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Utsuwa — Open-Source AI Companion with 3D VRM Avatars" />
	<meta name="twitter:description" content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and support for OpenAI, Anthropic, Google, and local LLMs." />
	<meta name="twitter:image" content={`${SITE_URL}/brand-assets/og-image.png`} />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Utsuwa',
		description: 'Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and multi-provider LLM support.',
		url: SITE_URL,
		applicationCategory: 'DesktopApplication',
		operatingSystem: 'macOS, Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		license: 'https://opensource.org/licenses/MIT',
		author: {
			'@type': 'Organization',
			name: 'Ordinary Company Group LLC',
			url: SITE_URL
		}
	})}</script>`}
</svelte:head>

<div class="page-root overflow-x-clip">
<main>
	<!-- Hero -->
	<section class="hero relative min-h-screen flex flex-col bg-[var(--bg-primary)]">
		<!-- Hybrid hero video: full-bleed up top, masked so it dissolves into the page below -->
		<div class="hero-video-wrap pointer-events-none" aria-hidden="true">
			{#if allowVideo}
				<video
					class="hero-video"
					class:is-ready={videoReady}
					poster="/landing-page/hero-poster.jpg"
					autoplay
					muted
					loop
					playsinline
					preload="auto"
					onplaying={() => (videoReady = true)}
				>
					<source src="/landing-page/hero-loop.webm" type="video/webm" />
					<source src="/landing-page/hero-loop.mp4" type="video/mp4" />
				</video>
			{:else}
				<img
					class="hero-video is-ready"
					src="/landing-page/hero-poster.jpg"
					alt=""
					width="1920"
					height="996"
				/>
			{/if}
			<div class="hero-video-scrim"></div>
		</div>

		<!-- Nav -->
		<nav class="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
			<a href="/" class="flex items-center">
				<img src="/brand-assets/logo.svg" alt="Utsuwa" class="nav-logo" />
			</a>

			<div class="hidden md:flex items-center gap-6 text-sm text-white/80">
				<a href="#features" class="hover:text-white transition-colors">Features</a>
				<a href={sectionUrl('docs')} class="hover:text-white transition-colors">Docs</a>
				<a href="/blog" class="hover:text-white transition-colors">Blog</a>
				<a
					href={GITHUB_REPO}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-white transition-colors"
				>
					GitHub
				</a>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={cycleTheme}
					class="nav-theme-btn"
					aria-label={`Theme: ${themeLabel}`}
					title={themeLabel}
				>
					<Icon name={themeIcon} size={16} />
				</button>
				<a
					href={sectionUrl('app')}
					class="btn-primary text-xs font-semibold px-4 py-2 rounded-full"
				>
					Try Live
				</a>
			</div>
		</nav>

		<!-- Hero content -->
		<div class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
			<h1 class="sr-only">Utsuwa — Open-Source AI Companion with 3D VRM Avatars</h1>

			<!-- Eyebrow pill -->
			<div use:reveal class="reveal hero-pill mb-7" >
				<span class="hero-pill-dot"></span>
				Open source &middot; MIT &middot; Self-hosted
			</div>

			<!-- Logo -->
			<img
				use:reveal={80}
				src="/brand-assets/logo.svg"
				alt="Utsuwa — AI companion app"
				class="reveal hero-logo mb-6"
			/>

			<!-- Subtitle -->
			<p use:reveal={160} class="reveal text-lg md:text-xl text-white/85 text-center text-pretty max-w-2xl mb-8">
				A vessel for AI to live in. Load a 3D avatar, give it a brain, and talk to a companion that
				speaks, listens, and remembers — entirely on your own machine.
			</p>

			<!-- CTA buttons -->
			<div use:reveal={240} class="reveal flex flex-wrap items-center justify-center gap-3 mb-12">
				<a href={sectionUrl('app')} class="btn-primary text-sm font-bold px-6 py-3 rounded-full">
					Try Live
				</a>
				<a
					href={GITHUB_RELEASES}
					target="_blank"
					rel="noopener noreferrer"
					class="btn-on-media text-sm font-bold px-6 py-3 rounded-full"
				>
					Download
				</a>
				<a
					href={sectionUrl('docs')}
					class="btn-on-media text-sm font-medium px-6 py-3 rounded-full"
				>
					Docs
				</a>
			</div>

		</div>

		<!-- Bottom fade: video dissolves cleanly into the page background (light + dark) -->
		<div class="hero-fade" aria-hidden="true"></div>
	</section>

	<!-- Provider strip -->
	<section
		class="bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] py-20 md:py-28 overflow-hidden"
	>
		<div class="max-w-5xl mx-auto px-6 text-center mb-12 md:mb-14">
			<p use:reveal class="reveal eyebrow justify-center mb-5">Bring your own brain</p>
			<h2
				use:reveal={60}
				class="reveal text-2xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
				style="font-family: var(--font-sans);"
			>
				Plug in any model. Use your own keys.
			</h2>
		</div>

		<!-- Logo marquee: two identical groups; the duplicate is hidden from AT so
		     the track loops seamlessly without reading providers twice. -->
		<div use:reveal={120} class="reveal provider-marquee">
			<div class="provider-marquee-track">
				<div class="provider-marquee-group">
					{#each providers as provider}
						<span class="provider-logo" role="img" aria-label={provider.name} title={provider.name}>
							{#if provider.wm}
								<img class="provider-wordmark wm-light" src={provider.wm.light} alt="" loading="lazy" />
								<img class="provider-wordmark wm-dark" src={provider.wm.dark} alt="" loading="lazy" />
							{:else}
								<ProviderIcons provider={provider.icon} size={30} themed />
							{/if}
						</span>
					{/each}
				</div>
				<div class="provider-marquee-group" aria-hidden="true">
					{#each providers as provider}
						<span class="provider-logo">
							{#if provider.wm}
								<img class="provider-wordmark wm-light" src={provider.wm.light} alt="" loading="lazy" />
								<img class="provider-wordmark wm-dark" src={provider.wm.dark} alt="" loading="lazy" />
							{:else}
								<ProviderIcons provider={provider.icon} size={30} themed />
							{/if}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Features: pinned visual, scrolling copy -->
	<section id="features" class="bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="grid lg:grid-cols-2 gap-12 lg:gap-20">
				<!-- Pinned visual (lg+): screenshots cross-fade as you scroll the copy -->
				<div class="hidden lg:block">
					<div class="feature-sticky">
						<div class="surface-card rounded-2xl p-4 overflow-hidden">
							<div class="feature-visual">
								{#each features as f, i}
									<img
										src={f.img}
										alt={f.alt}
										loading="lazy"
										class="img-outline rounded-lg"
										class:is-active={activeFeature === i}
									/>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Scrolling steps -->
				<div>
					{#each features as f, i}
						<div class="feature-step" class:is-active={activeFeature === i} use:trackStep={i}>
							<!-- Inline visual on small screens (no sticky) -->
							<div
								class="lg:hidden w-full surface-card rounded-2xl p-4 mb-7 aspect-[16/10] flex items-center justify-center overflow-hidden"
							>
								<img
									src={f.img}
									alt={f.alt}
									loading="lazy"
									class="img-outline w-full h-full object-contain rounded-lg"
								/>
							</div>

							<p class="eyebrow mb-5"><span class="eyebrow-num">{f.num}</span> {f.eyebrow}</p>
							<h2
								class="text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] mb-4 tracking-tight text-balance"
								style="font-family: var(--font-sans);"
							>
								{f.title}
							</h2>
							<p class="text-lg text-[var(--text-secondary)] leading-relaxed text-pretty mb-6 max-w-lg">
								{f.body}
							</p>
							<div class="flex flex-wrap gap-2">
								{#each f.chips as chip}
									<span class="feature-chip">{chip}</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Everything in the vessel — bento -->
	<section class="bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] py-24 md:py-32">
		<div class="max-w-7xl mx-auto px-6">
			<div class="text-center mb-16 md:mb-20">
				<p use:reveal class="reveal eyebrow justify-center mb-5">The whole kit</p>
				<h2
					use:reveal={60}
					class="reveal text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
					style="font-family: var(--font-sans);"
				>
					Everything packed into the vessel.
				</h2>
			</div>

			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 lg:auto-rows-[minmax(190px,1fr)]"
			>
				{#each bento as item, i}
					<div
						use:reveal={(i % 3) * 90}
						class="reveal bento-tile {bentoGridClass(i)}"
						class:bento-tile--hero={bentoLayout[i] === 'hero'}
						class:bento-tile--wide={bentoLayout[i] === 'wide'}
					>
						<div class="bento-icon">
							<Icon name={item.icon} size={bentoLayout[i] === 'hero' ? 26 : 22} class="text-white" />
						</div>
						<div class="bento-text">
							<h3 class="bento-title">{item.title}</h3>
							<p class="bento-body">{item.body}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Latest Updates (Blog) -->
	{#if data.posts.length > 0}
		<section class="bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] py-24 md:py-32">
			<div class="max-w-7xl mx-auto px-6">
				<div use:reveal class="reveal flex items-end justify-between mb-12 md:mb-16">
					<h2
						class="text-3xl md:text-4xl font-semibold text-[var(--text-primary)] tracking-tight"
						style="font-family: var(--font-sans);"
					>
						Latest updates
					</h2>
					<a
						href="/blog"
						class="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors hidden sm:inline-flex items-center gap-1"
					>
						View all
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</a>
				</div>

				<div class="grid md:grid-cols-3 gap-6 lg:gap-8">
					{#each data.posts as post, i}
						<a use:reveal={(i % 3) * 90} href="/blog/{post.slug}" class="reveal blog-card group">
							<div class="blog-card-image">
								<img src={post.image} alt={post.title} loading="lazy" />
							</div>
							<div class="blog-card-body">
								<div class="flex items-center gap-1.5 text-xs font-medium">
									<time datetime={post.date} class="text-[var(--accent)]">
										{formatDate(post.date)}
									</time>
									<span class="text-[var(--text-tertiary)]">&middot;</span>
									<span class="text-[var(--text-secondary)]">CJ Dyas</span>
								</div>
								<h3
									class="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors tracking-tight"
								>
									{post.title}
								</h3>
								<p class="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
									{post.description}
								</p>
							</div>
						</a>
					{/each}
				</div>

				<div class="mt-8 text-center sm:hidden">
					<a
						href="/blog"
						class="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors inline-flex items-center gap-1"
					>
						View all posts
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</a>
				</div>
			</div>
		</section>
	{/if}

	</main>

	<!-- Footer -->
	<footer class="bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] pt-20 md:pt-24 overflow-hidden">
		<div class="max-w-7xl mx-auto px-6 mb-24 md:mb-32">
			<div
				class="flex flex-col md:flex-row justify-between items-start gap-16 md:gap-12"
			>
				<!-- Logo -->
				<div class="shrink-0">
					<img src="/brand-assets/logo.svg" alt="Utsuwa" class="footer-brand-logo-light" />
				</div>

				<!-- Link columns -->
				<div class="flex flex-wrap gap-12 sm:gap-24 lg:gap-32">
					<div class="flex flex-col gap-4 min-w-[120px]">
						<h3 class="text-xs font-semibold text-[var(--text-tertiary)] mb-1">Project</h3>
						<a
							href={GITHUB_REPO}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
							>GitHub</a
						>
						<a
							href={GITHUB_RELEASES}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
							>Releases</a
						>
						<a
							href={sectionUrl('docs')}
							class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
							>Docs</a
						>
						<a
							href="/blog"
							class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
							>Blog</a
						>
					</div>

					<div class="flex flex-col gap-4 min-w-[120px]">
						<h3 class="text-xs font-semibold text-[var(--text-tertiary)] mb-1">Legal</h3>
						<a
							href={`${GITHUB_REPO}/blob/main/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
							>MIT License</a
						>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] relative z-10">
			<div
				class="max-w-7xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0"
			>
				<div
					class="text-[11px] text-[var(--text-tertiary)] font-medium tracking-tight order-2 md:order-1"
				>
					&copy; 2026 Ordinary Company Group LLC. Open source under MIT.
				</div>
				<div class="flex items-center gap-5 order-1 md:order-2">
					<a
						href={GITHUB_REPO}
						target="_blank"
						rel="noopener noreferrer"
						class="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
						aria-label="GitHub"
					>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"
							><path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/></svg
						>
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	.page-root {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Nav logo — inverted to white so it reads over the hero video */
	.nav-logo {
		height: 1.125rem;
		width: auto;
		filter: brightness(0) invert(1);
	}

	/* Theme toggle in the hero nav (flat, translucent — sits on the video) */
	.nav-theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.28);
		cursor: pointer;
		transition:
			transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.nav-theme-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.45);
		transform: translateY(-1px);
	}

	.nav-theme-btn:active {
		transform: translateY(0) scale(0.96);
	}

	.hero-logo {
		width: min(80vw, 500px);
		height: auto;
		/* White over the video; a whisper of shadow keeps it legible on bright frames */
		filter: brightness(0) invert(1) drop-shadow(0 1px 6px rgba(0, 0, 0, 0.18));
	}

	/* Full-bleed hero video: fills the whole hero, below the content. The
	   bottom blend is handled by .hero-fade so it can stay theme-aware. */
	.hero-video-wrap {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hero-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 32%;
		opacity: 0;
		transform: scale(1.04);
		transition: opacity 1.1s ease, transform 18s ease-out;
		will-change: opacity, transform;
	}

	.hero-video.is-ready {
		opacity: 1;
		transform: scale(1);
	}

	/* Neutral legibility scrim — keeps the white nav + copy readable without
	   tinting the frame. */
	.hero-video-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.34) 0%,
			rgba(0, 0, 0, 0.08) 24%,
			transparent 46%,
			rgba(0, 0, 0, 0.12) 100%
		);
	}

	/* Bottom fade: the video dissolves straight into the page background so it
	   melts into the next section. Token-driven, so dark mode just works. */
	.hero-fade {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: clamp(200px, 34vh, 440px);
		pointer-events: none;
		background: linear-gradient(
			to top,
			var(--bg-primary) 0%,
			var(--bg-primary) 6%,
			transparent 62%
		);
	}

	/* Eyebrow pill on the hero video (flat, translucent) */
	.hero-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.28);
	}

	.hero-pill-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: #fff;
		animation: pulseDot 2.4s ease-in-out infinite;
	}

	@keyframes pulseDot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	/* Section eyebrow (editorial label) */
	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.eyebrow-num {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--accent);
		padding: 0.15rem 0.45rem;
		border-radius: var(--radius-xs);
		background: var(--accent-subtle);
	}

	/* Feature callout chips (flat, accent-tinted) */
	.feature-chip {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--accent);
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-full);
		background: var(--accent-subtle);
	}

	/* Provider logo marquee */
	.provider-marquee {
		position: relative;
		width: 100%;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%);
		mask-image: linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%);
	}

	.provider-marquee-track {
		display: flex;
		width: max-content;
		animation: providerMarquee 38s linear infinite;
	}

	.provider-marquee:hover .provider-marquee-track {
		animation-play-state: paused;
	}

	.provider-marquee-group {
		display: flex;
		align-items: center;
		gap: 3rem;
		padding-right: 3rem;
	}

	@keyframes providerMarquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	/* Provider logos: wide wordmarks where available, monochrome glyph marks
	   (themed prop -> currentColor) for the rest. */
	.provider-logo {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		transition: color 0.3s ease, opacity 0.3s ease;
	}

	.provider-logo:hover {
		color: var(--text-primary);
	}

	/* Wide wordmark images — swap light/dark with the theme class. */
	.provider-wordmark {
		height: 26px;
		width: auto;
		display: block;
	}

	.wm-dark {
		display: none;
	}

	:global(.dark) .wm-light {
		display: none;
	}

	:global(.dark) .wm-dark {
		display: block;
	}

	/* Pinned feature showcase: visual sticks, copy scrolls, active step lights up */
	.feature-sticky {
		position: sticky;
		top: 6rem;
	}

	.feature-visual {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 10;
	}

	.feature-visual img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		opacity: 0;
		transform: scale(0.98);
		transition:
			opacity 0.6s ease,
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.feature-visual img.is-active {
		opacity: 1;
		transform: scale(1);
	}

	.feature-step {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* Space the stacked callouts apart on mobile (desktop uses the pinned 76vh steps) */
	.feature-step:not(:last-child) {
		margin-bottom: 4.5rem;
	}

	@media (min-width: 1024px) {
		.feature-step {
			min-height: 76vh;
			justify-content: center;
			opacity: 0.32;
			transition: opacity 0.45s ease;
		}

		.feature-step:not(:last-child) {
			margin-bottom: 0;
		}

		.feature-step.is-active {
			opacity: 1;
		}
	}

	/* Flat surface card — the base for framed visuals */
	.surface-card {
		background: var(--bg-primary);
		box-shadow: var(--shadow-md);
	}

	/* Bento tiles (flat) */
	.bento-tile {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		padding: 1.6rem;
		border-radius: var(--radius-xl);
		background: var(--bg-primary);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.bento-tile:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.bento-title {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin-bottom: 0.4rem;
	}

	.bento-body {
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--text-secondary);
		text-wrap: pretty;
	}

	/* Flagship tile: bigger, copy pinned to the bottom. */
	.bento-tile--hero {
		gap: 1.5rem;
	}

	.bento-tile--hero .bento-text {
		margin-top: auto;
	}

	.bento-tile--hero .bento-title {
		font-size: 1.5rem;
		margin-bottom: 0.55rem;
	}

	.bento-tile--hero .bento-body {
		font-size: 1rem;
		max-width: 34ch;
	}

	.bento-tile--hero .bento-icon {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: var(--radius-lg);
	}

	/* Wide tile: icon and copy sit side by side to use the extra width. */
	.bento-tile--wide {
		flex-direction: row;
		align-items: flex-start;
		gap: 1.25rem;
	}

	/* Flat accent icon tile inside bento */
	.bento-icon {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-md);
		background: var(--accent);
	}

	/* Subtle image outline for depth */
	.img-outline {
		outline: 1px solid var(--border-subtle);
		outline-offset: -1px;
	}

	/* Scroll-reveal */
	.reveal {
		opacity: 0;
		transform: translateY(26px);
		transition:
			opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: var(--reveal-delay, 0ms);
	}

	/* `.revealed` is toggled by the reveal action at runtime, so mark it global
	   to stop Svelte pruning this rule as "unused". */
	.reveal:global(.revealed) {
		opacity: 1;
		transform: none;
	}

	/* Primary CTA — solid accent pill */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: var(--accent);
		border: 1px solid transparent;
		box-shadow: var(--shadow-sm);
		transition:
			background 0.2s ease,
			transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.2s ease;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn-primary:active {
		transform: translateY(0) scale(0.98);
	}

	/* Ghost CTA over the hero video (flat, translucent white) */
	.btn-on-media {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.4);
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.btn-on-media:hover {
		background: rgba(255, 255, 255, 0.16);
		border-color: rgba(255, 255, 255, 0.6);
		transform: translateY(-1px);
	}

	.btn-on-media:active {
		transform: translateY(0) scale(0.98);
	}

	.footer-brand-logo-light {
		height: 1.25rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.6;
	}

	/* Blog cards (flat) */
	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--bg-primary);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	.blog-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.blog-card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--bg-tertiary);
		margin: 0.5rem 0.5rem 0;
		border-radius: var(--radius-md);
	}

	.blog-card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--radius-md);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.blog-card:hover .blog-card-image img {
		transform: scale(1.05);
	}

	.blog-card-body {
		padding: 1rem 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
		position: relative;
		z-index: 2;
	}

	/* Dark mode only needs asset treatments — the surfaces, text, borders and
	   shadows above are all token-driven and swap automatically under .dark. */
	:global(.dark) .footer-brand-logo-light {
		filter: brightness(0) invert(1);
		opacity: 0.6;
	}

	/* Respect reduced motion across the whole page */
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.hero-pill-dot {
			animation: none;
		}

		.hero-video {
			transition: none;
			transform: none;
		}

		.feature-visual img {
			transition: none;
			transform: none;
		}

		.feature-step {
			opacity: 1;
			transition: none;
		}

		.provider-marquee-track {
			animation: none;
		}

		.bento-tile:hover,
		.blog-card:hover {
			transform: none;
		}
	}
</style>
