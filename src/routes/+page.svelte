<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL, GITHUB_REPO, GITHUB_RELEASES } from '$lib/config/site';
	import ProviderIcons from '$lib/components/icons/ProviderIcons.svelte';
	import SiteNav from '$lib/components/marketing/SiteNav.svelte';
	import { sectionUrl } from '$lib/config/links';

	let { data }: { data: PageData } = $props();

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


	const features = [
		{
			num: '01',
			eyebrow: 'Presence',
			title: 'A real 3D body, not a chat box.',
			body: "Drop in any VRM model and watch it come to life. Replies appear as 3D speech bubbles that follow your companion's head as it moves, breathes, and looks around.",
			chips: ['Idle animation', 'Auto-blink', 'Speech lip-sync', 'Head-tracked bubbles'],
			shot: 'companion',
			alt: 'Utsuwa desktop app with a 3D VRM avatar companion and chat interface'
		},
		{
			num: '02',
			eyebrow: 'Memory',
			title: 'She actually remembers.',
			body: 'Local AI embeddings weave your conversations into a web of memories she can recall by meaning, not keywords. Affection, trust, and mood shift over time across eight relationship stages — from Stranger to Soulmate.',
			chips: ['Semantic recall', 'On-device embeddings', '8 relationship stages', 'Mood & trust'],
			shot: 'memory',
			alt: 'Semantic memory graph showing AI companion relationship and conversation history'
		},
		{
			num: '03',
			eyebrow: 'Control',
			title: 'You own every part of it.',
			body: 'Run a frontier model or keep it fully offline with Ollama and LM Studio. Mix and match your chat, voice input, and text-to-speech providers — all on your own API keys, with nothing routed through us.',
			chips: ['Frontier or local', 'Your API keys', 'Swap voices', 'No middleman'],
			shot: 'settings',
			alt: 'Settings panel showing LLM provider options including OpenAI, Anthropic, and Ollama'
		}
	];

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
	<SiteNav />

	<!-- Hero: centered text with a contained video below -->
	<section class="hero">
		<div class="hero-copy">
			<img use:reveal src="/brand-assets/logo.svg" alt="Utsuwa" class="reveal hero-logo" />

			<h1 use:reveal={80} class="reveal hero-title text-balance">
				An open-source AI companion you can see and talk to
			</h1>

			<p use:reveal={160} class="reveal hero-sub text-pretty">
				Load a VRM avatar, connect any LLM, and talk by voice with a character that speaks,
				listens, and remembers, all on your own machine.
			</p>

			<div use:reveal={240} class="reveal hero-actions">
				<a href={sectionUrl('app')} class="btn btn-primary btn-lg">Try it live</a>
				<a href="/download" class="btn btn-secondary btn-lg">Download</a>
				<a href={sectionUrl('docs')} class="hero-textlink">Read the docs &rarr;</a>
			</div>
		</div>

		<div use:reveal={320} class="reveal hero-media" aria-hidden="true">
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
		</div>
	</section>

	<!-- Provider strip -->
	<section
		class="py-20 md:py-28 overflow-hidden"
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

	<!-- Features: alternating media rows -->
	<section id="features" class="py-24 md:py-32">
		<div class="max-w-6xl mx-auto px-6">
			<h2
				use:reveal
				class="reveal text-center text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight text-balance mb-20 md:mb-28"
				style="font-family: var(--font-sans);"
			>
				The best way to bring an AI to life.
			</h2>

			<div class="flex flex-col gap-24 md:gap-36">
				{#each features as f, i}
					<div use:reveal class="reveal feature-row" class:feature-row--rev={i % 2 === 1}>
						<div class="feature-media">
							<img
								class="feature-img feature-img--light"
								src={`/marketing/${f.shot}-light.png`}
								alt={f.alt}
								loading="lazy"
							/>
							<img
								class="feature-img feature-img--dark"
								src={`/marketing/${f.shot}-dark.png`}
								alt={f.alt}
								loading="lazy"
							/>
						</div>
						<div class="feature-copy">
							<h3 class="feature-h2" style="font-family: var(--font-sans);">{f.title}</h3>
							<p class="feature-body">{f.body}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>


	<!-- Latest from the blog (channel-card layout) -->
	{#if data.posts.length > 0}
		<section class="py-24 md:py-32">
			<div class="max-w-6xl mx-auto px-6">
				<div class="text-center mb-14 md:mb-16">
					<h2
						use:reveal
						class="reveal text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
						style="font-family: var(--font-sans);"
					>
						Fresh from the blog
					</h2>
					<p
						use:reveal={60}
						class="reveal text-lg text-[var(--text-secondary)] leading-relaxed text-pretty max-w-xl mx-auto mt-5"
					>
						Guides, deep dives, and release notes from the project.
					</p>
					<a use:reveal={120} href="/blog" class="reveal btn btn-secondary mt-8">
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
							<path d="M7 17 17 7M7 7h10v10" />
						</svg>
					</a>
				</div>

				<div class="grid md:grid-cols-3 gap-5 lg:gap-6">
					{#each data.posts as post, i}
						<a use:reveal={(i % 3) * 90} href="/blog/{post.slug}" class="reveal channel-card">
							<div class="channel-media">
								<img src={post.image} alt={post.title} loading="lazy" />
							</div>
							<div class="channel-body">
								<time datetime={post.date} class="channel-date">{formatDate(post.date)}</time>
								<h3 class="channel-title">{post.title}</h3>
								<span class="channel-cta btn btn-on-card btn-block">Read article →</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Closing CTA -->
	<section class="py-24 md:py-32">
		<div class="max-w-3xl mx-auto px-6 text-center">
			<h2
				use:reveal
				class="reveal text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
				style="font-family: var(--font-sans);"
			>
				Ready to meet your companion?
			</h2>
			<p
				use:reveal={80}
				class="reveal text-lg text-[var(--text-secondary)] leading-relaxed text-pretty max-w-xl mx-auto mt-5 mb-9"
			>
				Try it right in your browser, or download the desktop app. Free and open source.
			</p>
			<div use:reveal={160} class="reveal flex flex-wrap items-center justify-center gap-3">
				<a href={sectionUrl('app')} class="btn btn-primary text-sm font-bold px-6 py-3 rounded-full">
					Try it live
				</a>
				<a href="/download" class="btn btn-secondary text-sm font-bold px-6 py-3 rounded-full">
					Download
				</a>
			</div>
		</div>
	</section>

	</main>

	<!-- Footer -->
	<footer class="border-t border-[var(--border-subtle)] pt-20 md:pt-24 overflow-hidden">
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
		<div class="w-full border-t border-[var(--border-subtle)] relative z-10">
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
		background: var(--bg-page);
		color: var(--text-primary);
	}

	/* Hero: centered text over a contained video */
	.hero {
		max-width: 78rem;
		margin: 0 auto;
		padding: clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 3.5rem);
	}

	.hero-copy {
		max-width: 46rem;
		margin: 0 auto;
		text-align: center;
	}

	.hero-logo {
		display: block;
		height: 1.75rem;
		width: auto;
		margin: 0 auto 1.5rem;
		filter: brightness(0);
		opacity: 0.9;
	}

	:global(.dark) .hero-logo {
		filter: none;
	}

	.hero-title {
		margin: 0 auto 1.35rem;
		max-width: 20ch;
		color: var(--text-primary);
		font-weight: 600;
		font-size: clamp(2.25rem, 5.5vw, 4rem);
		line-height: 1.06;
		letter-spacing: -0.03em;
	}

	.hero-sub {
		margin: 0 auto;
		max-width: 40rem;
		color: var(--text-secondary);
		font-size: clamp(1.05rem, 1.6vw, 1.2rem);
		line-height: 1.6;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		margin-top: 2rem;
	}

	.hero-textlink {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.hero-textlink:hover {
		color: var(--accent);
	}

	/* Contained hero video panel */
	.hero-media {
		max-width: 72rem;
		margin: clamp(2.5rem, 6vw, 4.5rem) auto 0;
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-xl);
		background: var(--bg-secondary);
		aspect-ratio: 16 / 9;
	}

	.hero-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		opacity: 0;
		transition: opacity 1s ease;
	}

	.hero-video.is-ready {
		opacity: 1;
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
	.feature-row {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Real full-app screenshots, shown directly with rounded corners + a soft
	   shadow (theme-aware, no gradient panel). */
	.feature-img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
	}

	.feature-img--dark {
		display: none;
	}

	:global(.dark) .feature-img--light {
		display: none;
	}

	:global(.dark) .feature-img--dark {
		display: block;
	}

	.feature-copy {
		max-width: 24rem;
	}

	.feature-h2 {
		margin: 0 0 0.9rem;
		font-size: clamp(1.4rem, 2vw, 1.7rem);
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		text-wrap: balance;
	}

	.feature-body {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	@media (min-width: 900px) {
		.feature-row {
			flex-direction: row-reverse;
			align-items: center;
			gap: 4.5rem;
		}

		.feature-row--rev {
			flex-direction: row;
		}

		.feature-media {
			flex: 1.6;
			min-width: 0;
		}

		.feature-copy {
			flex: 1;
		}
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

	.footer-brand-logo-light {
		height: 1.25rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.6;
	}

	/* Blog cards (flat) */
	.channel-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: var(--radius-xl);
		overflow: hidden;
		background: var(--bg-tertiary);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.channel-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg);
	}

	.channel-media {
		aspect-ratio: 16 / 11;
		overflow: hidden;
		background: var(--gradient-aurora-cool);
	}

	.channel-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.channel-card:hover .channel-media img {
		transform: scale(1.04);
	}

	.channel-body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
		padding: 1.25rem;
	}

	.channel-date {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-tertiary);
	}

	.channel-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--text-primary);
		text-wrap: balance;
	}

	.channel-cta {
		margin-top: auto;
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

		.hero-video {
			transition: none;
		}

		.provider-marquee-track {
			animation: none;
		}

		.channel-card:hover,
		.feature-media,
		.channel-media img {
			transform: none;
		}
	}
</style>
