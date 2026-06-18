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

	// Every provider we actually support today — keep this honest.
	// `icon` maps to the keys in ProviderIcons' PROVIDER_ICONS map.
	const providers = [
		{ name: 'OpenAI', icon: 'openai' },
		{ name: 'Anthropic', icon: 'anthropic' },
		{ name: 'Google', icon: 'google' },
		{ name: 'DeepSeek', icon: 'deepseek' },
		{ name: 'xAI', icon: 'xai' },
		{ name: 'Ollama', icon: 'ollama' },
		{ name: 'LM Studio', icon: 'lmstudio' },
		{ name: 'Groq Whisper', icon: 'groq' },
		{ name: 'ElevenLabs', icon: 'elevenlabs' }
	];

	const stats = [
		{ value: '100%', label: 'Local & private' },
		{ value: '0', label: 'Accounts required' },
		{ value: '9+', label: 'AI providers' },
		{ value: 'MIT', label: 'Open source' }
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

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Utsuwa — Open-Source AI Companion with 3D VRM Avatars" />
	<meta property="og:description" content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and support for OpenAI, Anthropic, Google, and local LLMs. Desktop app and web. Self-hosted, privacy-first." />
	<meta property="og:image" content={`${SITE_URL}/brand-assets/thumbnail.png`} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:site_name" content="Utsuwa" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Utsuwa — Open-Source AI Companion with 3D VRM Avatars" />
	<meta name="twitter:description" content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and support for OpenAI, Anthropic, Google, and local LLMs." />
	<meta name="twitter:image" content={`${SITE_URL}/brand-assets/thumbnail.png`} />

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

<div class="bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-[#fafafa] overflow-x-hidden">
<main>
	<!-- Hero -->
	<section class="hero relative min-h-screen bg-gradient-to-b from-[#4dd0ff] via-[#01B2FF] to-white">
		<!-- Animated aurora wash -->
		<div class="hero-aurora pointer-events-none absolute inset-0"></div>

		<!-- Frutiger Aero glass bubbles -->
		<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<span class="aero-bubble" style="--size:120px; --x:8%;  --y:62%; --dur:13s; --delay:-2s;"></span>
			<span class="aero-bubble" style="--size:64px;  --x:18%; --y:30%; --dur:17s; --delay:-6s;"></span>
			<span class="aero-bubble" style="--size:200px; --x:78%; --y:24%; --dur:21s; --delay:-1s;"></span>
			<span class="aero-bubble" style="--size:90px;  --x:88%; --y:60%; --dur:15s; --delay:-9s;"></span>
			<span class="aero-bubble" style="--size:44px;  --x:62%; --y:14%; --dur:11s; --delay:-4s;"></span>
			<span class="aero-bubble" style="--size:150px; --x:40%; --y:78%; --dur:23s; --delay:-12s;"></span>
		</div>

		<!-- Nav -->
		<nav class="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
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
					class="skeu-btn-sm text-xs font-semibold px-4 py-2 rounded-full transition-all"
				>
					Try Live
				</a>
			</div>
		</nav>

		<!-- Hero content -->
		<div class="relative z-10 flex flex-col items-center justify-center mt-12 md:mt-16 px-6">
			<h1 class="sr-only">Utsuwa — Open-Source AI Companion with 3D VRM Avatars</h1>

			<!-- Eyebrow pill -->
			<div use:reveal class="reveal glass-pill mb-7" >
				<span class="glass-pill-dot"></span>
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
				<a href={sectionUrl('app')} class="skeu-btn-glass text-sm font-bold px-6 py-3 rounded-full transition-all">
					Try Live
				</a>
				<a
					href={GITHUB_RELEASES}
					target="_blank"
					rel="noopener noreferrer"
					class="skeu-btn-glass text-sm font-bold px-6 py-3 rounded-full transition-all"
				>
					Download
				</a>
				<a
					href={sectionUrl('docs')}
					class="skeu-btn-glass-outline text-sm font-medium px-6 py-3 rounded-full transition-all"
				>
					Docs
				</a>
			</div>

			<!-- Screenshot card -->
			<div use:reveal={320} class="reveal screenshot-stage max-w-[1067px] w-full mx-auto px-4">
				<div class="screenshot-frame rounded-xl overflow-hidden">
					<img
						src="/landing-page/utsuwa-thumbnail.png"
						alt="Utsuwa desktop app showing a 3D VRM avatar companion with chat interface"
						class="w-full h-auto"
					/>
				</div>
			</div>

			<!-- Stat row -->
			<div use:reveal={120} class="reveal grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-12 mb-12 md:mb-16 w-full max-w-3xl">
				{#each stats as stat}
					<div class="stat-tile">
						<div class="stat-value">{stat.value}</div>
						<div class="stat-label">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Bottom gradient fade -->
		<div
			class="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 pointer-events-none"
		></div>
	</section>

	<!-- Provider strip -->
	<section class="bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5">
		<div class="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
			<p use:reveal class="reveal eyebrow justify-center mb-5">Bring your own brain</p>
			<h2
				use:reveal={60}
				class="reveal text-2xl md:text-3xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] tracking-tight text-balance mb-10"
				style="font-family: 'Exo 2', sans-serif;"
			>
				Plug in any model. Use your own keys.
			</h2>
			<div use:reveal={120} class="reveal flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
				{#each providers as provider}
					<span class="provider-chip">
						<ProviderIcons provider={provider.icon} size={18} />
						{provider.name}
					</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- Feature A: Presence -->
	<section id="features" class="bg-[#f5f7fa] dark:bg-[#101013] border-t border-black/5 dark:border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					use:reveal
					class="reveal skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4"
				>
					<img src="/landing-page/speaking-shot-1.png" alt="3D VRM avatar with speech bubble and lip-sync animation" class="img-outline w-full h-full object-contain rounded-lg" />
				</div>

				<div use:reveal={120} class="reveal flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<p class="eyebrow mb-5"><span class="eyebrow-num">01</span> Presence</p>
					<h2 class="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] mb-4 tracking-tight text-balance" style="font-family: 'Exo 2', sans-serif;">
						A real 3D body, not a chat box.
					</h2>
					<p class="text-lg text-black/55 dark:text-white/55 leading-relaxed text-pretty mb-6">
						Drop in any VRM model and watch it come to life. Replies appear as 3D speech bubbles
						that follow your companion's head as it moves, breathes, and looks around.
					</p>
					<div class="flex flex-wrap gap-2">
						<span class="feature-chip">Idle animation</span>
						<span class="feature-chip">Auto-blink</span>
						<span class="feature-chip">Speech lip-sync</span>
						<span class="feature-chip">Head-tracked bubbles</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature B: Memory -->
	<section class="bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div use:reveal class="reveal flex flex-col items-start max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
					<p class="eyebrow mb-5"><span class="eyebrow-num">02</span> Memory</p>
					<h2 class="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] mb-4 tracking-tight text-balance" style="font-family: 'Exo 2', sans-serif;">
						She actually remembers.
					</h2>
					<p class="text-lg text-black/55 dark:text-white/55 leading-relaxed text-pretty mb-6">
						Local AI embeddings weave your conversations into a web of memories she can recall by
						meaning, not keywords. Affection, trust, and mood shift over time across eight
						relationship stages — from Stranger to Soulmate.
					</p>
					<div class="flex flex-wrap gap-2">
						<span class="feature-chip">Semantic recall</span>
						<span class="feature-chip">On-device embeddings</span>
						<span class="feature-chip">8 relationship stages</span>
						<span class="feature-chip">Mood &amp; trust</span>
					</div>
				</div>

				<div
					use:reveal={120}
					class="reveal skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4 order-1 lg:order-2"
				>
					<img src="/landing-page/memory-graph.png" alt="Semantic memory graph showing AI companion relationship and conversation history" class="img-outline w-full h-full object-contain rounded-lg" />
				</div>
			</div>
		</div>
	</section>

	<!-- Feature C: Control -->
	<section class="bg-[#f5f7fa] dark:bg-[#101013] border-t border-black/5 dark:border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					use:reveal
					class="reveal skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4"
				>
					<img src="/landing-page/ai-services.png" alt="Settings panel showing LLM provider options including OpenAI, Anthropic, and Ollama" class="img-outline w-full h-full object-contain rounded-lg" />
				</div>

				<div use:reveal={120} class="reveal flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<p class="eyebrow mb-5"><span class="eyebrow-num">03</span> Control</p>
					<h2 class="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] mb-4 tracking-tight text-balance" style="font-family: 'Exo 2', sans-serif;">
						You own every part of it.
					</h2>
					<p class="text-lg text-black/55 dark:text-white/55 leading-relaxed text-pretty mb-6">
						Run a frontier model or keep it fully offline with Ollama and LM Studio. Mix and match
						your chat, voice input, and text-to-speech providers — all on your own API keys, with
						nothing routed through us.
					</p>
					<div class="flex flex-wrap gap-2">
						<span class="feature-chip">Frontier or local</span>
						<span class="feature-chip">Your API keys</span>
						<span class="feature-chip">Swap voices</span>
						<span class="feature-chip">No middleman</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Everything in the vessel — bento -->
	<section class="bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5 py-24 md:py-32">
		<div class="max-w-7xl mx-auto px-6">
			<div class="text-center mb-16 md:mb-20">
				<p use:reveal class="reveal eyebrow justify-center mb-5">The whole kit</p>
				<h2
					use:reveal={60}
					class="reveal text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] tracking-tight text-balance"
					style="font-family: 'Exo 2', sans-serif;"
				>
					Everything packed into the vessel.
				</h2>
			</div>

			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
				{#each bento as item, i}
					<div use:reveal={(i % 3) * 90} class="reveal bento-tile">
						<div class="bento-icon">
							<Icon name={item.icon} size={22} class="text-white" />
						</div>
						<h3 class="text-lg font-semibold text-[#1a1a1a] dark:text-[#fafafa] mt-5 mb-2 tracking-tight">
							{item.title}
						</h3>
						<p class="text-sm text-black/55 dark:text-white/55 leading-relaxed text-pretty">
							{item.body}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Latest Updates (Blog) -->
	{#if data.posts.length > 0}
		<section class="bg-[#f5f7fa] dark:bg-[#101013] border-t border-black/5 dark:border-white/5 py-24 md:py-32">
			<div class="max-w-7xl mx-auto px-6">
				<div use:reveal class="reveal flex items-end justify-between mb-12 md:mb-16">
					<h2
						class="text-3xl md:text-4xl font-semibold text-[#1a1a1a] dark:text-[#fafafa] tracking-tight"
						style="font-family: 'Exo 2', sans-serif;"
					>
						Latest updates
					</h2>
					<a
						href="/blog"
						class="text-sm font-medium text-[#01B2FF] hover:text-[#4dd0ff] transition-colors hidden sm:inline-flex items-center gap-1"
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
									<time datetime={post.date} class="text-[#01B2FF]">
										{formatDate(post.date)}
									</time>
									<span class="text-black/25 dark:text-white/30">&middot;</span>
									<span class="text-black/40 dark:text-white/40">CJ Dyas</span>
								</div>
								<h3
									class="text-base font-semibold text-[#1a1a1a] dark:text-[#fafafa] group-hover:text-[#01B2FF] transition-colors tracking-tight"
								>
									{post.title}
								</h3>
								<p class="text-sm text-black/50 dark:text-white/50 leading-relaxed line-clamp-2">
									{post.description}
								</p>
							</div>
						</a>
					{/each}
				</div>

				<div class="mt-8 text-center sm:hidden">
					<a
						href="/blog"
						class="text-sm font-medium text-[#01B2FF] hover:text-[#4dd0ff] transition-colors inline-flex items-center gap-1"
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

	<!-- Final CTA -->
	<section class="relative overflow-hidden">
		<div
			class="absolute inset-0 bg-gradient-to-b from-[#4dd0ff] via-[#01B2FF] to-[#0077cc]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50"
		></div>
		<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<span class="aero-bubble" style="--size:160px; --x:12%; --y:55%; --dur:19s; --delay:-3s;"></span>
			<span class="aero-bubble" style="--size:80px;  --x:82%; --y:30%; --dur:14s; --delay:-7s;"></span>
			<span class="aero-bubble" style="--size:50px;  --x:68%; --y:70%; --dur:12s; --delay:-1s;"></span>
		</div>

		<div
			class="relative z-10 flex flex-col items-center justify-center text-center max-w-7xl mx-auto px-6 py-32 md:py-48"
		>
			<img
				use:reveal
				src="/brand-assets/logo.svg"
				alt="Utsuwa"
				class="reveal hero-logo mb-5"
			/>
			<p use:reveal={80} class="reveal text-lg md:text-xl text-white/85 text-balance max-w-xl mb-8">
				Open it once and it's yours. No sign-up, no catch.
			</p>
			<div use:reveal={160} class="reveal flex flex-wrap items-center justify-center gap-3 mb-6">
				<a
					href={sectionUrl('app')}
					class="skeu-btn-glass text-sm font-bold px-6 py-3 rounded-full transition-all"
				>
					Try Live
				</a>
				<a
					href={GITHUB_RELEASES}
					target="_blank"
					rel="noopener noreferrer"
					class="skeu-btn-glass text-sm font-bold px-6 py-3 rounded-full transition-all"
				>
					Download
				</a>
				<a
					href={sectionUrl('docs')}
					class="skeu-btn-glass-outline text-sm font-medium px-6 py-3 rounded-full transition-all"
				>
					Docs
				</a>
			</div>

			<p use:reveal={200} class="reveal text-sm text-white/60 max-w-sm">
				Desktop app available for macOS 14+ with Apple Silicon. Web app works in any modern
				browser.
			</p>
		</div>
	</section>

	</main>

	<!-- Footer -->
	<footer class="bg-[#f5f7fa] dark:bg-[#101013] border-t border-black/5 dark:border-white/5 pt-20 md:pt-24 overflow-hidden">
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
						<h3 class="text-xs font-semibold text-black/35 dark:text-white/35 mb-1">Project</h3>
						<a
							href={GITHUB_REPO}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 dark:text-white/60 hover:text-[#01B2FF] transition-colors"
							>GitHub</a
						>
						<a
							href={GITHUB_RELEASES}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 dark:text-white/60 hover:text-[#01B2FF] transition-colors"
							>Releases</a
						>
						<a
							href={sectionUrl('docs')}
							class="text-xs font-medium text-black/60 dark:text-white/60 hover:text-[#01B2FF] transition-colors"
							>Docs</a
						>
						<a
							href="/blog"
							class="text-xs font-medium text-black/60 dark:text-white/60 hover:text-[#01B2FF] transition-colors"
							>Blog</a
						>
					</div>

					<div class="flex flex-col gap-4 min-w-[120px]">
						<h3 class="text-xs font-semibold text-black/35 dark:text-white/35 mb-1">Legal</h3>
						<a
							href={`${GITHUB_REPO}/blob/main/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 dark:text-white/60 hover:text-[#01B2FF] transition-colors"
							>MIT License</a
						>
					</div>
				</div>
			</div>
		</div>

		<!-- Giant logo -->
		<div
			class="w-full flex justify-center items-end select-none pointer-events-none overflow-hidden pb-0"
		>
			<img
				src="/brand-assets/logo.svg"
				alt=""
				class="footer-giant-logo-light translate-y-[12%]"
			/>
		</div>

		<!-- Bottom bar -->
		<div class="w-full border-t border-black/8 dark:border-white/8 bg-[#f5f7fa] dark:bg-[#101013] relative z-10">
			<div
				class="max-w-7xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0"
			>
				<div
					class="text-[11px] text-black/35 dark:text-white/35 font-medium tracking-tight order-2 md:order-1"
				>
					&copy; 2026 Ordinary Company Group LLC. Open source under MIT.
				</div>
				<div class="flex items-center gap-5 order-1 md:order-2">
					<a
						href={GITHUB_REPO}
						target="_blank"
						rel="noopener noreferrer"
						class="text-black/40 dark:text-white/40 hover:text-[#01B2FF] transition-colors"
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
	.nav-logo {
		height: 1.125rem;
		width: auto;
		filter: brightness(0) invert(1);
	}

	/* Glass theme toggle in the hero nav (sits on the bright blue gradient) */
	.nav-theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		color: #fff;
		background: rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 2px 6px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition:
			transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.nav-theme-btn:hover {
		background: rgba(255, 255, 255, 0.24);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-1px);
	}

	.nav-theme-btn:active {
		transform: translateY(0) scale(0.96);
	}

	.hero-logo {
		width: min(80vw, 500px);
		height: auto;
		filter: brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.25));
	}

	/* Animated aurora wash over the hero gradient */
	.hero-aurora {
		background:
			radial-gradient(60% 50% at 20% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 60%),
			radial-gradient(50% 40% at 85% 15%, rgba(180, 240, 255, 0.55) 0%, transparent 55%),
			radial-gradient(55% 45% at 70% 70%, rgba(255, 255, 255, 0.35) 0%, transparent 60%);
		opacity: 0.7;
		animation: auroraDrift 18s ease-in-out infinite alternate;
		will-change: transform, opacity;
	}

	@keyframes auroraDrift {
		0% {
			transform: translate3d(-3%, -2%, 0) scale(1.05);
			opacity: 0.55;
		}
		100% {
			transform: translate3d(3%, 2%, 0) scale(1.15);
			opacity: 0.8;
		}
	}

	/* Frutiger Aero glass bubbles */
	.aero-bubble {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background:
			radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.25) 22%, transparent 45%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(1, 178, 255, 0.12) 100%);
		box-shadow:
			inset 0 0 20px rgba(255, 255, 255, 0.45),
			inset 0 -6px 14px rgba(1, 130, 200, 0.25),
			0 8px 30px rgba(0, 80, 130, 0.15);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		animation: floatBubble var(--dur, 16s) ease-in-out var(--delay, 0s) infinite alternate;
		will-change: transform;
	}

	@keyframes floatBubble {
		0% {
			transform: translateY(0) translateX(0) scale(1);
			opacity: 0.7;
		}
		50% {
			opacity: 0.95;
		}
		100% {
			transform: translateY(-40px) translateX(16px) scale(1.08);
			opacity: 0.6;
		}
	}

	/* Glass eyebrow pill on the blue hero */
	.glass-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: #fff;
		background: rgba(255, 255, 255, 0.16);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.35);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.glass-pill-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
		animation: pulseDot 2.4s ease-in-out infinite;
	}

	@keyframes pulseDot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	/* Screenshot frame with 3D tilt + glow ring */
	.screenshot-stage {
		perspective: 1600px;
	}

	.screenshot-frame {
		position: relative;
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-shadow:
			0 2px 8px rgba(0, 60, 100, 0.12),
			0 24px 60px rgba(0, 60, 100, 0.28);
		transition:
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		transform-style: preserve-3d;
		will-change: transform;
	}

	.screenshot-stage:hover .screenshot-frame {
		transform: rotateX(2deg) rotateY(-2.5deg) translateY(-8px) scale(1.01);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.6),
			0 30px 80px rgba(0, 60, 100, 0.35),
			0 0 60px rgba(1, 178, 255, 0.25);
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
		color: #0088cc;
	}

	.eyebrow-num {
		font-family: 'Exo 2', sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		color: #01b2ff;
		padding: 0.15rem 0.45rem;
		border-radius: 0.4rem;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.14) 0%, rgba(1, 178, 255, 0.06) 100%);
		border: 1px solid rgba(1, 178, 255, 0.25);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
	}

	/* Feature callout chips */
	.feature-chip {
		font-size: 0.78rem;
		font-weight: 600;
		color: #0a7bb0;
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 255, 0.7) 100%);
		border: 1px solid rgba(1, 178, 255, 0.22);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			0 1px 3px rgba(0, 0, 0, 0.05);
	}

	/* Provider chips */
	.provider-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #1a1a1a;
		padding: 0.5rem 1.05rem 0.5rem 0.85rem;
		border-radius: 9999px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.75) 100%);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(1, 178, 255, 0.18);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 2px 8px rgba(0, 0, 0, 0.05);
		transition:
			transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			border-color 0.3s ease;
	}

	.provider-chip:hover {
		transform: translateY(-2px);
		border-color: rgba(1, 178, 255, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 1),
			0 0 16px rgba(1, 178, 255, 0.15),
			0 6px 18px rgba(0, 0, 0, 0.08);
	}

	/* Stat tiles */
	.stat-tile {
		text-align: center;
		padding: 1rem 0.75rem;
		border-radius: 1rem;
		background: linear-gradient(165deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 255, 0.7) 100%);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.6);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 4px 16px rgba(0, 60, 100, 0.1);
	}

	.stat-value {
		font-family: 'Exo 2', sans-serif;
		font-size: 1.85rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		background: linear-gradient(180deg, #2bb8ff 0%, #0088cc 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.stat-label {
		margin-top: 0.4rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: rgba(0, 0, 0, 0.45);
	}

	/* Bento tiles */
	.bento-tile {
		padding: 1.6rem;
		border-radius: 1.25rem;
		background: linear-gradient(165deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.8) 55%, rgba(1, 178, 255, 0.06) 100%);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(1, 178, 255, 0.16);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 4px 20px rgba(0, 0, 0, 0.06),
			0 1px 3px rgba(0, 0, 0, 0.04);
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			border-color 0.4s ease;
	}

	.bento-tile:hover {
		transform: translateY(-6px);
		border-color: rgba(1, 178, 255, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 1),
			0 0 30px rgba(1, 178, 255, 0.12),
			0 16px 40px rgba(0, 60, 100, 0.12);
	}

	/* Glossy skeu icon tile inside bento */
	.bento-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.875rem;
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 45%, #0099dd 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 0 -2px 4px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(1, 178, 255, 0.4),
			0 0 18px rgba(1, 178, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Subtle image outline for depth */
	.img-outline {
		outline: 1px solid rgba(0, 0, 0, 0.06);
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

	.skeu-btn-sm {
		color: white;
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 40%, #0099dd 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 2px 4px rgba(1, 178, 255, 0.2);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.skeu-btn-sm:hover {
		background: linear-gradient(180deg, #5dd8ff 0%, #1abcff 40%, #01a8ee 100%);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 12px rgba(1, 178, 255, 0.35),
			0 2px 8px rgba(1, 178, 255, 0.25);
	}

	.skeu-btn-sm:active {
		transform: translateY(0) scale(0.97);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Glass buttons for blue backgrounds */
	.skeu-btn-glass {
		color: #0a0a0a;
		font-weight: 700;
		background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%);
		border: 1px solid rgba(255, 255, 255, 0.6);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			inset 0 -1px 2px rgba(0, 0, 0, 0.06),
			0 2px 8px rgba(0, 0, 0, 0.15),
			0 4px 16px rgba(0, 0, 0, 0.1);
		text-shadow: none;
	}

	.skeu-btn-glass:hover {
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 16px rgba(255, 255, 255, 0.2),
			0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.skeu-btn-glass:active {
		transform: translateY(0) scale(0.97);
		background: linear-gradient(180deg, #e8e8e8 0%, #ddd 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.skeu-btn-glass-outline {
		color: white;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.15),
			0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.skeu-btn-glass-outline:hover {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.4);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 0 12px rgba(255, 255, 255, 0.1),
			0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.skeu-btn-glass-outline:active {
		transform: translateY(0) scale(0.97);
		background: rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.15),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Skeuomorphic card (light) — Frutiger Aero glass */
	.skeu-card-light {
		background: linear-gradient(
			165deg,
			rgba(255, 255, 255, 0.9) 0%,
			rgba(240, 248, 255, 0.7) 50%,
			rgba(1, 178, 255, 0.06) 100%
		);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(1, 178, 255, 0.15);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.footer-brand-logo-light {
		height: 1.25rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.7;
	}

	.footer-giant-logo-light {
		width: 80vw;
		max-width: 1200px;
		height: auto;
		filter: brightness(0);
		opacity: 0.06;
	}

	/* Blog cards — Sims 2000s / Frutiger Aero (light) */
	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: 1.25rem;
		overflow: hidden;
		background: linear-gradient(
			165deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(240, 248, 255, 0.8) 50%,
			rgba(1, 178, 255, 0.08) 100%
		);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(1, 178, 255, 0.18);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 1px 4px rgba(0, 0, 0, 0.05);
		transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	/* Glossy top shine */
	.blog-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.6) 0%,
			transparent 100%
		);
		border-radius: 1.25rem 1.25rem 0 0;
		pointer-events: none;
		z-index: 1;
	}

	.blog-card:hover {
		border-color: rgba(1, 178, 255, 0.4);
		transform: translateY(-6px) scale(1.02);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 1),
			0 0 30px rgba(1, 178, 255, 0.15),
			0 8px 32px rgba(1, 178, 255, 0.1),
			0 20px 48px rgba(0, 0, 0, 0.1);
	}

	.blog-card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: linear-gradient(135deg, #e8f0f8 0%, #dde8f2 100%);
		margin: 0.5rem 0.5rem 0;
		border-radius: 0.875rem;
	}

	.blog-card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.875rem;
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

	/* ===== Dark mode (matches the app/docs #0a0a0a theme) =====
	   The hero keeps its bright blue gradient; everything below goes dark glass. */
	:global(.dark) .skeu-card-light {
		background: linear-gradient(
			165deg,
			rgba(40, 44, 52, 0.7) 0%,
			rgba(20, 24, 32, 0.6) 50%,
			rgba(1, 178, 255, 0.08) 100%
		);
		border-color: rgba(1, 178, 255, 0.18);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 1px 3px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .provider-chip {
		color: #eef4f8;
		background: linear-gradient(180deg, rgba(40, 44, 52, 0.85) 0%, rgba(22, 26, 34, 0.7) 100%);
		border-color: rgba(1, 178, 255, 0.22);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 2px 8px rgba(0, 0, 0, 0.35);
	}

	:global(.dark) .provider-chip:hover {
		border-color: rgba(1, 178, 255, 0.5);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			0 0 16px rgba(1, 178, 255, 0.25),
			0 6px 18px rgba(0, 0, 0, 0.4);
	}

	:global(.dark) .feature-chip {
		color: #7fd8ff;
		background: linear-gradient(180deg, rgba(40, 44, 52, 0.8) 0%, rgba(22, 26, 34, 0.6) 100%);
		border-color: rgba(1, 178, 255, 0.25);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 1px 3px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .stat-tile {
		background: linear-gradient(165deg, rgba(40, 44, 52, 0.7) 0%, rgba(22, 26, 34, 0.55) 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 4px 16px rgba(0, 0, 0, 0.4);
	}

	:global(.dark) .stat-label {
		color: rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .bento-tile {
		background: linear-gradient(
			165deg,
			rgba(40, 44, 52, 0.7) 0%,
			rgba(20, 24, 32, 0.6) 55%,
			rgba(1, 178, 255, 0.07) 100%
		);
		border-color: rgba(1, 178, 255, 0.18);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 1px 3px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .bento-tile:hover {
		border-color: rgba(1, 178, 255, 0.45);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			0 0 30px rgba(1, 178, 255, 0.18),
			0 16px 40px rgba(0, 0, 0, 0.5);
	}

	:global(.dark) .eyebrow {
		color: #4dd0ff;
	}

	:global(.dark) .blog-card {
		background: linear-gradient(
			165deg,
			rgba(40, 44, 52, 0.8) 0%,
			rgba(20, 24, 32, 0.65) 50%,
			rgba(1, 178, 255, 0.08) 100%
		);
		border-color: rgba(1, 178, 255, 0.2);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 1px 4px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .blog-card::before {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
	}

	:global(.dark) .blog-card:hover {
		border-color: rgba(1, 178, 255, 0.45);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.14),
			0 0 30px rgba(1, 178, 255, 0.18),
			0 8px 32px rgba(1, 178, 255, 0.12),
			0 20px 48px rgba(0, 0, 0, 0.5);
	}

	:global(.dark) .blog-card-image {
		background: linear-gradient(135deg, #1a1f28 0%, #12161d 100%);
	}

	:global(.dark) .img-outline {
		outline-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .footer-brand-logo-light {
		filter: brightness(0) invert(1);
		opacity: 0.7;
	}

	:global(.dark) .footer-giant-logo-light {
		filter: brightness(0) invert(1);
		opacity: 0.06;
	}

	/* Respect reduced motion across the whole page */
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.hero-aurora,
		.aero-bubble,
		.glass-pill-dot {
			animation: none;
		}

		.screenshot-stage:hover .screenshot-frame,
		.bento-tile:hover,
		.provider-chip:hover,
		.blog-card:hover {
			transform: none;
		}
	}
</style>
