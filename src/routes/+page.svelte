<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';
	import ProviderIcons from '$lib/components/icons/ProviderIcons.svelte';
	import SiteNav from '$lib/components/marketing/SiteNav.svelte';
	import SiteFooter from '$lib/components/marketing/SiteFooter.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { sectionUrl } from '$lib/config/links';
	import { reveal } from '$lib/utils/reveal';

	let { data }: { data: PageData } = $props();

	function heroParallax(node: HTMLElement) {
		const layers = node.querySelectorAll<HTMLElement>('[data-parallax]');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mobile = window.matchMedia('(max-width: 899px)');
		let frame = 0;

		const render = () => {
			frame = 0;
			const travel = reducedMotion.matches || mobile.matches
				? 0
				: Math.min(Math.max(-node.getBoundingClientRect().top, 0), node.offsetHeight);

			for (const layer of layers) {
				const offset = travel * Number(layer.dataset.parallax ?? 0);
				layer.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
			}
		};

		const queueRender = () => {
			if (!frame) frame = requestAnimationFrame(render);
		};

		window.addEventListener('scroll', queueRender, { passive: true });
		window.addEventListener('resize', queueRender);
		reducedMotion.addEventListener('change', queueRender);
		render();

		return {
			destroy() {
				window.removeEventListener('scroll', queueRender);
				window.removeEventListener('resize', queueRender);
				reducedMotion.removeEventListener('change', queueRender);
				cancelAnimationFrame(frame);
			}
		};
	}

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
			title: 'She steps into your room.',
			body: 'Place her on your real floor through the camera and she stands there in your space, holding her ground as you move around her. Drag her anywhere, pinch to resize, and keep the chat open the whole time, in Android Chrome or any WebXR-capable headset browser.',
			shot: 'ar',
			alt: 'Utsuwa VRM companion in WebXR AR camera passthrough shown on an Android phone held in a hand'
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

	<link rel="preload" as="image" href="/landing-page/hero-character.png" />

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
		license: 'https://www.gnu.org/licenses/agpl-3.0.html',
		author: {
			'@type': 'Organization',
			name: 'Juice Boxx Games LLC',
			url: SITE_URL
		}
	})}</script>`}
</svelte:head>

<div class="page-root overflow-x-clip grain">
<SiteNav />
<main>
	<!-- Hero: asymmetric editorial layout built around a default Utsuwa companion. -->
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-stage" use:heroParallax>
			<h1 id="hero-title" class="hero-title">
				<span class="hero-title-piece hero-title-left hero-enter" data-parallax="0.05" style="--enter-delay: 0ms">
					An open-source<br />AI companion
				</span>
				<span class="hero-title-piece hero-title-right hero-enter" data-parallax="0.09" style="--enter-delay: 120ms">
					you can see<br />and talk to.
				</span>
			</h1>

			<div class="hero-character-wrap hero-enter" style="--enter-delay: 80ms">
				<img
					class="hero-character"
					data-parallax="0.14"
					src="/landing-page/hero-character.png"
					alt="A smiling 3D VRM companion from Utsuwa waving"
					width="1151"
					height="1488"
					fetchpriority="high"
				/>
			</div>

			<p class="hero-sub hero-enter text-pretty" style="--enter-delay: 200ms">
				Load a VRM avatar, connect any LLM, and talk by voice with a character that speaks,
				listens, and remembers, all on your own machine.
			</p>

			<div class="hero-actions hero-enter" style="--enter-delay: 280ms">
				<Button href={sectionUrl('app')} size="lg">Try it live</Button>
				<Button href="/download" variant="secondary" size="lg">Download</Button>
				<a href={sectionUrl('docs')} class="hero-textlink"
					>Read the docs <span class="link-arrow">&rarr;</span></a
				>
			</div>
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

	/* The editorial stage echoes the reference while the page's existing type,
	   color, and button system keeps it unmistakably Utsuwa. */
	.hero {
		max-width: 80rem;
		margin: 0 auto;
		padding: 1rem 1.5rem clamp(2rem, 5vw, 4rem);
	}

	.hero-stage {
		--hero-surface: #ffffff;
		--hero-ink: #000000;
		--hero-muted: rgba(0, 0, 0, 0.58);
		position: relative;
		isolation: isolate;
		min-height: clamp(41rem, calc(100svh - 6.5rem), 48rem);
		overflow: hidden;
		background: var(--hero-surface);
	}

	:global(.dark) .hero-stage {
		--hero-surface: #000000;
		--hero-ink: #ffffff;
		--hero-muted: rgba(255, 255, 255, 0.58);
	}

	.hero-stage::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -2;
		background-image:
			linear-gradient(to right, color-mix(in srgb, var(--hero-ink) 5%, transparent) 1px, transparent 1px),
			linear-gradient(to bottom, color-mix(in srgb, var(--hero-ink) 5%, transparent) 1px, transparent 1px);
		background-size: 8rem 8rem;
		mask-image: radial-gradient(ellipse 62% 74% at 50% 48%, #000, transparent 82%);
	}

	.hero-title {
		margin: 0;
		color: var(--hero-ink);
	}

	.hero-title-piece {
		position: absolute;
		z-index: 2;
		display: block;
		font-size: clamp(2.8rem, 5vw, 4.65rem);
		font-weight: 500;
		line-height: 0.98;
		letter-spacing: -0.055em;
		text-wrap: balance;
	}

	.hero-title-left {
		top: clamp(3.5rem, 7vw, 5rem);
		left: clamp(1.5rem, 4vw, 3.5rem);
	}

	.hero-title-right {
		top: 52%;
		right: clamp(1.5rem, 4vw, 3.5rem);
		font-size: clamp(2.6rem, 4.25vw, 4rem);
		text-align: right;
	}

	.hero-enter {
		opacity: 0;
		filter: blur(8px);
		translate: 0 22px;
		animation: heroEnter 0.7s var(--ease-brand) var(--enter-delay, 0ms) both;
	}

	@keyframes heroEnter {
		to {
			opacity: 1;
			filter: blur(0);
			translate: 0 0;
		}
	}

	[data-parallax] {
		transform: translate3d(0, var(--parallax-y, 0px), 0);
	}

	.hero-character-wrap {
		position: absolute;
		left: 50%;
		bottom: -2.25rem;
		z-index: 1;
		height: 84%;
		transform: translateX(-50%);
		pointer-events: none;
		-webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 76%, transparent 100%);
		mask-image: linear-gradient(to bottom, #000 0%, #000 76%, transparent 100%);
	}

	.hero-character {
		display: block;
		height: 100%;
		width: auto;
	}

	.hero-sub {
		position: absolute;
		left: clamp(1.5rem, 4vw, 3.5rem);
		bottom: clamp(1.5rem, 4vw, 3.25rem);
		z-index: 2;
		max-width: 18rem;
		margin: 0;
		color: var(--hero-muted);
		font-size: 0.92rem;
		line-height: 1.55;
	}

	.hero-actions {
		position: absolute;
		right: clamp(1.5rem, 4vw, 3.5rem);
		bottom: clamp(1.5rem, 4vw, 3.25rem);
		z-index: 3;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.hero-textlink {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		margin-left: 0.25rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--hero-muted);
		text-decoration: none;
		transition-property: color;
		transition-duration: 150ms;
		transition-timing-function: ease-out;
	}

	.hero-textlink:hover {
		color: var(--hero-ink);
	}

	.link-arrow {
		display: inline-block;
		margin-left: 0.3rem;
		transition-property: transform;
		transition-duration: 200ms;
		transition-timing-function: var(--ease-brand);
	}

	.hero-textlink:hover .link-arrow {
		transform: translateX(3px);
	}

	@media (max-width: 899px) {
		.hero {
			padding: 0.5rem 1rem 2.5rem;
		}

		.hero-stage {
			display: flex;
			min-height: 0;
			flex-direction: column;
			padding: 1.5rem 1.25rem 1.75rem;
		}

		.hero-title-piece,
		.hero-character-wrap,
		.hero-sub,
		.hero-actions {
			position: static;
		}

		.hero-title {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 100%;
			margin-top: 2rem;
			text-align: center;
		}

		.hero-title-piece {
			font-size: clamp(2.65rem, 11vw, 4.5rem);
		}

		.hero-title-right {
			align-self: auto;
			margin-top: 0.3rem;
		}

		.hero-character-wrap {
			align-self: center;
			height: auto;
			width: min(100%, 29rem);
			margin: 1.75rem auto -0.5rem;
			transform: none;
		}

		.hero-character {
			height: auto;
			width: 100%;
		}

		.hero-sub {
			max-width: 30rem;
			margin-inline: auto;
			font-size: 1rem;
			text-align: center;
		}

		.hero-actions {
			justify-content: center;
			width: 100%;
			margin-top: 1.5rem;
		}
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

	@keyframes wordBlurIn {
		to {
			opacity: 1;
			filter: blur(0);
			transform: none;
		}
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

		.hero-enter {
			opacity: 1;
			filter: none;
			translate: none;
			animation: none;
		}

		.st-word {
			opacity: 1;
			filter: none;
			transform: none;
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
