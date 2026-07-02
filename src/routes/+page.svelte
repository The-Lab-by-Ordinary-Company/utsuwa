<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';
	import ProviderIcons from '$lib/components/icons/ProviderIcons.svelte';
	import SiteNav from '$lib/components/marketing/SiteNav.svelte';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import { sectionUrl } from '$lib/config/links';
	import { reveal } from '$lib/utils/reveal';

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

	// Pause the hero loop while it's scrolled out of view; resume on return.
	function pauseOffscreen(node: HTMLVideoElement) {
		if (typeof IntersectionObserver === 'undefined') return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) node.play().catch(() => {});
				else node.pause();
			},
			{ threshold: 0.1 }
		);
		obs.observe(node);
		return { destroy: () => obs.disconnect() };
	}

	// Hero headline, split so each word can blur-fade in on its own beat.
	const heroWords = 'An open-source AI companion you can see and talk to'.split(' ');

	// Statement line, same treatment but triggered on scroll. The second
	// sentence renders muted.
	const statementWords = [
		...'Utsuwa means vessel.'.split(' ').map((w) => ({ w, muted: false })),
		...'You decide what fills it.'.split(' ').map((w) => ({ w, muted: true }))
	];

	const features = [
		{
			title: 'A real 3D body, not a chat box.',
			body: "Drop in any VRM model and watch it come to life. Replies appear as 3D speech bubbles that follow your companion's head as it moves, breathes, and looks around.",
			shot: 'companion',
			alt: 'Utsuwa desktop app with a 3D VRM avatar companion and chat interface'
		},
		{
			title: 'She actually remembers.',
			body: 'Local AI embeddings weave your conversations into a web of memories she can recall by meaning, not keywords. Affection, trust, and mood shift over time across eight relationship stages — from Stranger to Soulmate.',
			shot: 'memory',
			alt: 'Semantic memory graph showing AI companion relationship and conversation history'
		},
		{
			title: 'You own every part of it.',
			body: 'Run a frontier model or keep it fully offline with Ollama and LM Studio. Mix and match your chat, voice input, and text-to-speech providers — all on your own API keys, with nothing routed through us.',
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

<div class="page-root overflow-x-clip grain">
<SiteNav />
<main>
	<!-- Hero: centered text with a contained video below -->
	<section class="hero">
		<div class="hero-copy">
			<!-- Fade lives on the wrapper: the animation's fill would otherwise
			     override the logo's own theme filter -->
			<span class="hero-fade hero-logo-wrap" style="--wd: 0ms">
				<img src="/brand-assets/logo.svg" alt="Utsuwa" class="hero-logo" />
			</span>

			<h1 class="hero-title text-balance">
				{#each heroWords as word, i}<span class="hero-word" style="--wd: {120 + i * 50}ms"
						>{word}</span
					>{#if i < heroWords.length - 1}{' '}{/if}{/each}
			</h1>

			<p class="hero-fade hero-sub text-pretty" style="--wd: 650ms">
				Load a VRM avatar, connect any LLM, and talk by voice with a character that speaks,
				listens, and remembers, all on your own machine.
			</p>

			<div class="hero-fade hero-actions" style="--wd: 800ms">
				<a href={sectionUrl('app')} class="btn btn-primary btn-lg">Try it live</a>
				<a href="/download" class="btn btn-secondary btn-lg">Download</a>
				<a href={sectionUrl('docs')} class="hero-textlink"
					>Read the docs <span class="link-arrow">&rarr;</span></a
				>
			</div>
		</div>

		<!-- Poster renders immediately with a slow Ken Burns drift; the video
		     fades in over it once it's actually playing. -->
		<div class="hero-media hero-media-enter" aria-hidden="true">
			<img
				class="hero-poster"
				src="/landing-page/hero-poster.jpg"
				alt=""
				width="1920"
				height="996"
			/>
			{#if allowVideo}
				<video
					use:pauseOffscreen
					class="hero-video"
					class:is-ready={videoReady}
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
				class="reveal max-w-2xl text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight text-balance mb-16 md:mb-24"
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
								src={`/marketing/${f.shot}-light.webp`}
								alt={f.alt}
								loading="lazy"
							/>
							<img
								class="feature-img feature-img--dark"
								src={`/marketing/${f.shot}-dark.webp`}
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


	<!-- Statement: one oversized brand line, nothing else -->
	<section class="statement">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<p use:reveal class="statement-text text-balance">
				{#each statementWords as s, i}<span
						class="st-word"
						class:statement-muted={s.muted}
						style="--wd: {i * 70}ms">{s.w}</span
					>{#if i < statementWords.length - 1}{' '}{/if}{/each}
			</p>
		</div>
	</section>

	<!-- Latest from the blog (channel-card layout) -->
	{#if data.posts.length > 0}
		<section class="py-24 md:py-32">
			<div class="max-w-6xl mx-auto px-6">
				<div class="blog-head mb-12 md:mb-14">
					<div>
						<h2
							use:reveal
							class="reveal text-3xl md:text-4xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
							style="font-family: var(--font-sans);"
						>
							Fresh from the blog
						</h2>
						<p
							use:reveal={60}
							class="reveal text-lg text-[var(--text-secondary)] leading-relaxed text-pretty mt-3"
						>
							Guides, deep dives, and release notes from the project.
						</p>
					</div>
					<a use:reveal={120} href="/blog" class="reveal btn btn-secondary shrink-0">
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
	<section class="py-28 md:py-44">
		<div class="max-w-3xl mx-auto px-6 text-center">
			<h2
				use:reveal
				class="reveal text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--text-primary)] tracking-tight text-balance"
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
				<a href={sectionUrl('app')} class="btn btn-primary btn-lg">Try it live</a>
				<a href="/download" class="btn btn-secondary btn-lg">Download</a>
			</div>
		</div>
	</section>

	</main>

	<SiteFooter />
</div>

<style>
	.page-root {
		background: var(--bg-page);
		color: var(--text-primary);
	}

	/* Anchored sections land clear of the sticky nav */
	section {
		scroll-margin-top: 4.5rem;
	}

	/* Hero: centered text over a contained video. 72rem matches the max-w-6xl
	   sections below so the media panel lines up with the feature shots. */
	.hero {
		max-width: 72rem;
		margin: 0 auto;
		padding: clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 3.5rem);
	}

	.hero-copy {
		max-width: 46rem;
		margin: 0 auto;
		text-align: center;
	}

	.hero-logo-wrap {
		display: block;
		margin: 0 auto 1.5rem;
	}

	.hero-logo {
		display: block;
		height: 1.75rem;
		width: auto;
		margin: 0 auto;
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
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	/* Each word blur-fades in on load, staggered left to right. The rest of
	   the hero (logo, sub, actions) uses the same curve via .hero-fade. */
	.hero-word,
	.hero-fade {
		opacity: 0;
		filter: blur(10px);
		transform: translateY(6px);
		animation: wordBlurIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) var(--wd, 0ms) forwards;
	}

	.hero-word {
		display: inline-block;
	}

	@keyframes wordBlurIn {
		to {
			opacity: 1;
			filter: blur(0);
			transform: none;
		}
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
		gap: 0.75rem;
		margin-top: 2rem;
	}

	.hero-textlink {
		margin-left: 0.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.hero-textlink:hover {
		color: var(--accent);
	}

	.link-arrow {
		display: inline-block;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.hero-textlink:hover .link-arrow {
		transform: translateX(3px);
	}

	/* Contained hero video panel */
	.hero-media {
		position: relative;
		margin: clamp(2.5rem, 6vw, 4.5rem) auto 0;
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-xl);
		background: var(--bg-secondary);
		aspect-ratio: 16 / 9;
	}

	/* Slow push-in on the poster while the video loads */
	.hero-poster {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform-origin: 50% 40%;
		animation: kenBurns 18s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	}

	@keyframes kenBurns {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.08);
		}
	}

	/* Cinematic entrance after the headline settles */
	.hero-media-enter {
		animation: heroMediaIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
	}

	@keyframes heroMediaIn {
		from {
			opacity: 0;
			transform: translateY(44px) scale(0.965);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.hero-video {
		position: absolute;
		inset: 0;
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
		max-width: 26rem;
	}

	.feature-h2 {
		margin: 0 0 1rem;
		font-size: clamp(1.6rem, 2.6vw, 2.1rem);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		text-wrap: balance;
	}

	.feature-body {
		font-size: 1rem;
		line-height: 1.65;
		color: var(--text-secondary);
	}

	/* Screenshots drift gently against the scroll while their row is in view.
	   Scroll-driven animation; browsers without support just skip it. */
	@supports (animation-timeline: view()) {
		.feature-media {
			animation: featureDrift linear both;
			animation-timeline: view();
		}
	}

	@keyframes featureDrift {
		from {
			transform: translateY(26px);
		}
		to {
			transform: translateY(-26px);
		}
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

		/* Rows enter from the side their screenshot sits on (media is on the
		   right by default, left on --rev rows). Cleared by .revealed below. */
		.feature-row.reveal {
			transform: translate(36px, 20px);
		}

		.feature-row--rev.reveal {
			transform: translate(-36px, 20px);
		}
	}

	/* Statement */
	.statement {
		padding: clamp(5rem, 13vw, 10rem) 0;
	}

	.statement-text {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.03em;
		color: var(--text-primary);
	}

	.statement-muted {
		color: var(--text-tertiary);
	}

	/* Statement words hold blurred until the line scrolls into view, then
	   resolve left to right on the hero's curve. */
	.st-word {
		display: inline-block;
		opacity: 0;
		filter: blur(10px);
		transform: translateY(6px);
	}

	.statement-text:global(.revealed) .st-word {
		animation: wordBlurIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) var(--wd, 0ms) forwards;
	}

	/* Scroll-reveal: blur-fade-up, same language as the hero */
	.reveal {
		opacity: 0;
		transform: translateY(20px);
		filter: blur(8px);
		transition:
			opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
			filter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: var(--reveal-delay, 0ms);
	}

	/* `.revealed` is toggled by the reveal action at runtime, so mark it global
	   to stop Svelte pruning this rule as "unused". */
	.reveal:global(.revealed) {
		opacity: 1;
		transform: none;
		filter: blur(0);
	}

	/* Blog section header: title left, action right */
	.blog-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
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

	/* Respect reduced motion across the whole page */
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			filter: none;
			transition: none;
		}

		.hero-video {
			transition: none;
		}

		.hero-poster {
			animation: none;
		}

		.hero-word,
		.hero-fade,
		.st-word {
			opacity: 1;
			filter: none;
			transform: none;
			animation: none;
		}

		.hero-media-enter {
			animation: none;
		}

		.provider-marquee-track,
		.feature-media {
			animation: none;
		}

		.channel-card:hover,
		.feature-media,
		.channel-media img {
			transform: none;
		}
	}
</style>
