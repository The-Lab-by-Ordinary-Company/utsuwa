<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL, GITHUB_REPO, GITHUB_RELEASES } from '$lib/config/site';
	import Icon from '$lib/components/ui/Icon.svelte';

	let { data }: { data: PageData } = $props();
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

<div class="bg-white text-[#0a0a0a] overflow-x-hidden">
<main>
	<!-- Hero -->
	<section class="relative min-h-screen bg-gradient-to-b from-[#4dd0ff] via-[#01B2FF] to-white">
		<!-- Nav -->
		<nav class="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
			<a href="/" class="flex items-center">
				<img src="/brand-assets/logo.svg" alt="Utsuwa" class="nav-logo" />
			</a>

			<div class="hidden md:flex items-center gap-6 text-sm text-white/80">
				<a href="#features" class="hover:text-white transition-colors">Features</a>
				<a href="/docs" class="hover:text-white transition-colors">Docs</a>
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

			<a
				href="/app"
				class="skeu-btn-sm text-xs font-semibold px-4 py-2 rounded-full transition-all"
			>
				Try Live
			</a>
		</nav>

		<!-- Hero content -->
		<div class="relative z-10 flex flex-col items-center justify-center mt-16 px-6">
			<h1 class="sr-only">Utsuwa — Open-Source AI Companion with 3D VRM Avatars</h1>
			<!-- Logo -->
			<img
				src="/brand-assets/logo.svg"
				alt="Utsuwa — AI companion app"
				class="hero-logo mb-6"
			/>

			<!-- Subtitle -->
			<p class="text-lg md:text-xl text-white/80 text-center max-w-2xl mb-8">
				Open-source VRM avatar viewer with AI chat, voice, and semantic memory.
			</p>

			<!-- CTA buttons -->
			<div class="flex flex-wrap items-center justify-center gap-3 mb-12">
				<a href="/app" class="skeu-btn-glass text-sm font-bold px-6 py-3 rounded-full transition-all">
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
					href="/docs"
					class="skeu-btn-glass-outline text-sm font-medium px-6 py-3 rounded-full transition-all"
				>
					Docs
				</a>
			</div>

			<!-- Screenshot card -->
			<div class="max-w-[1067px] w-full mx-auto px-4">
				<div class="rounded-xl overflow-hidden shadow-2xl border border-white/10">
					<img
						src="/landing-page/utsuwa-thumbnail.png"
						alt="Utsuwa desktop app showing a 3D VRM avatar companion with chat interface"
						class="w-full h-auto"
					/>
				</div>
			</div>

			<!-- Tagline below screenshot -->
			<p
				class="max-w-2xl mt-16 md:mt-24 text-xl md:text-2xl font-semibold text-[#1a1a1a] tracking-tight text-center"
			>
				A vessel for AI to inhabit. Chat, listen, remember — your companion, your way.
			</p>
		</div>

		<!-- Decorative glass floaters -->
		<div
			class="hidden md:block absolute top-[40%] left-[-5%] w-[400px] h-[300px] glass-panel rounded-xl opacity-60 -rotate-6 scale-75 md:scale-90 pointer-events-none"
		>
			<div class="flex items-center gap-1.5 px-3 py-2">
				<div class="w-2.5 h-2.5 rounded-full bg-white/40"></div>
				<div class="w-2.5 h-2.5 rounded-full bg-white/30"></div>
				<div class="w-2.5 h-2.5 rounded-full bg-white/20"></div>
			</div>
			<div
				class="mx-3 mt-2 h-full rounded-lg bg-gradient-to-b from-white/10 to-transparent"
			></div>
		</div>

		<div
			class="hidden md:block absolute top-[35%] right-[-5%] w-[450px] h-[320px] glass-panel rounded-xl opacity-70 rotate-3 scale-75 md:scale-90 pointer-events-none"
		>
			<div class="flex items-center gap-1.5 px-3 py-2">
				<div class="w-2.5 h-2.5 rounded-full bg-white/40"></div>
				<div class="w-2.5 h-2.5 rounded-full bg-white/30"></div>
				<div class="w-2.5 h-2.5 rounded-full bg-white/20"></div>
			</div>
			<div
				class="mx-3 mt-2 h-full rounded-lg bg-gradient-to-b from-white/10 to-transparent"
			></div>
		</div>

		<!-- Bottom gradient fade -->
		<div
			class="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"
		></div>
	</section>

	<!-- Feature A: Meet your AI companion -->
	<section id="features" class="bg-white border-t border-black/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					Meet your AI companion
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					class="skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4"
				>
					<img src="/landing-page/speaking-shot-1.png" alt="3D VRM avatar with speech bubble and lip-sync animation" class="w-full h-full object-contain rounded-lg" />
				</div>

				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<div
						class="skeu-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
							/>
						</svg>
						3D Avatar
					</div>
					<h3 class="text-2xl md:text-3xl font-medium text-[#1a1a1a] mb-4 tracking-tight">
						Full 3D avatars, anywhere.
					</h3>
					<p class="text-lg text-black/50 leading-relaxed">
						Load any VRM avatar model and watch it come to life with idle animations, automatic
						blinking, and speech-driven lip-sync. Chat responses appear as 3D speech bubbles that
						track your companion's head position.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature B: She remembers -->
	<section class="bg-[#f5f7fa] border-t border-black/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					She remembers
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
					<div
						class="skeu-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
							/>
							<circle cx="12" cy="12" r="10" />
						</svg>
						Semantic Memory
					</div>
					<h3 class="text-2xl md:text-3xl font-medium text-[#1a1a1a] mb-4 tracking-tight">
						Memories that mean something.
					</h3>
					<p class="text-lg text-black/50 leading-relaxed">
						Your companion builds a web of memories using local AI embeddings. She finds past
						conversations by meaning, not keywords. Track affection, trust, and mood across 8
						relationship stages — from Stranger to Soulmate.
					</p>
				</div>

				<div
					class="skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4 order-1 lg:order-2"
				>
					<img src="/landing-page/memory-graph.png" alt="Semantic memory graph showing AI companion relationship and conversation history" class="w-full h-full object-contain rounded-lg" />
				</div>
			</div>
		</div>
	</section>

	<!-- Feature C: You're in control -->
	<section class="bg-white border-t border-black/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					You're in control
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					class="skeu-card-light rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden p-4"
				>
					<img src="/landing-page/ai-services.png" alt="Settings panel showing LLM provider options including OpenAI, Anthropic, and Ollama" class="w-full h-full object-contain rounded-lg" />
				</div>

				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<div
						class="skeu-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
					>
						<Icon name="settings" size={12} />
						Bring Your Own Keys
					</div>
					<h3 class="text-2xl md:text-3xl font-medium text-[#1a1a1a] mb-4 tracking-tight">
						Pick your providers. Use your keys.
					</h3>
					<p class="text-lg text-black/50 leading-relaxed">
						Choose from OpenAI, Anthropic, Google, DeepSeek, xAI, or run locally with Ollama and LM
						Studio. Add voice input via Groq Whisper or Web Speech API, and pick your TTS with
						ElevenLabs or OpenAI — all with your own API keys.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- More features grid -->
	<section class="bg-[#f5f7fa] border-t border-black/5 py-24 md:py-32">
		<div class="max-w-7xl mx-auto px-6">
			<h2
				class="text-3xl md:text-4xl font-semibold text-[#1a1a1a] text-center mb-16 tracking-tight"
				style="font-family: 'Exo 2', sans-serif;"
			>
				More features
			</h2>

			<div class="grid md:grid-cols-3 gap-6 lg:gap-8">
				<!-- Card 1: Desktop Overlay -->
				<div class="flex flex-col group cursor-default">
					<div
						class="skeu-card-light rounded-2xl aspect-[16/10] mb-6 flex items-center justify-center relative overflow-hidden group-hover:border-[#01B2FF]/30 transition-all duration-500"
					>
						<Icon name="monitor" size={48} class="text-black/15 group-hover:text-[#01B2FF]/50 transition-colors duration-500" />
					</div>
					<div class="px-2">
						<h3
							class="text-base font-semibold text-[#1a1a1a] mb-2 text-center md:text-left tracking-tight"
						>
							Desktop overlay
						</h3>
						<p class="text-sm text-black/50 text-center md:text-left leading-relaxed">
							Your companion floats on your desktop with a transparent background. Always-on-top,
							draggable, with global hotkeys.
						</p>
					</div>
				</div>

				<!-- Card 2: Local-First -->
				<div class="flex flex-col group cursor-default">
					<div
						class="skeu-card-light rounded-2xl aspect-[16/10] mb-6 flex items-center justify-center relative overflow-hidden group-hover:border-[#01B2FF]/30 transition-all duration-500"
					>
						<Icon name="database" size={48} class="text-black/15 group-hover:text-[#01B2FF]/50 transition-colors duration-500" />
					</div>
					<div class="px-2">
						<h3
							class="text-base font-semibold text-[#1a1a1a] mb-2 text-center md:text-left tracking-tight"
						>
							Local-first storage
						</h3>
						<p class="text-sm text-black/50 text-center md:text-left leading-relaxed">
							All data stays on your device in IndexedDB. No account required. Export and import
							save files anytime.
						</p>
					</div>
				</div>

				<!-- Card 3: Open Source -->
				<div class="flex flex-col group cursor-default">
					<div
						class="skeu-card-light rounded-2xl aspect-[16/10] mb-6 flex items-center justify-center relative overflow-hidden group-hover:border-[#01B2FF]/30 transition-all duration-500"
					>
						<Icon name="code" size={48} class="text-black/15 group-hover:text-[#01B2FF]/50 transition-colors duration-500" />
					</div>
					<div class="px-2">
						<h3
							class="text-base font-semibold text-[#1a1a1a] mb-2 text-center md:text-left tracking-tight"
						>
							Open source
						</h3>
						<p class="text-sm text-black/50 text-center md:text-left leading-relaxed">
							MIT licensed. Self-host, modify, contribute. Built with SvelteKit, Three.js, and
							Tauri.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Latest Updates (Blog) -->
	{#if data.posts.length > 0}
		<section class="bg-white border-t border-black/5 py-24 md:py-32">
			<div class="max-w-7xl mx-auto px-6">
				<div class="flex items-end justify-between mb-12 md:mb-16">
					<h2
						class="text-3xl md:text-4xl font-semibold text-[#1a1a1a] tracking-tight"
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
					{#each data.posts as post}
						<a href="/blog/{post.slug}" class="blog-card group">
							<div class="blog-card-image">
								<img src={post.image} alt={post.title} loading="lazy" />
							</div>
							<div class="blog-card-body">
								<div class="flex items-center gap-1.5 text-xs font-medium">
									<time datetime={post.date} class="text-[#01B2FF]">
										{formatDate(post.date)}
									</time>
									<span class="text-black/25">&middot;</span>
									<span class="text-black/40">CJ Dyas</span>
								</div>
								<h3
									class="text-base font-semibold text-[#1a1a1a] group-hover:text-[#01B2FF] transition-colors tracking-tight"
								>
									{post.title}
								</h3>
								<p class="text-sm text-black/50 leading-relaxed line-clamp-2">
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

		<div
			class="relative z-10 flex flex-col items-center justify-center text-center max-w-7xl mx-auto px-6 py-32 md:py-48"
		>
			<img
				src="/brand-assets/logo.svg"
				alt="Utsuwa"
				class="hero-logo mb-4"
			/>
			<div class="flex flex-wrap items-center justify-center gap-3 mb-6">
				<a
					href="/app"
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
					href="/docs"
					class="skeu-btn-glass-outline text-sm font-medium px-6 py-3 rounded-full transition-all"
				>
					Docs
				</a>
			</div>

			<p class="text-sm text-white/60 max-w-sm">
				Desktop app available for macOS 14+ with Apple Silicon. Web app works in any modern
				browser.
			</p>
		</div>
	</section>

	</main>

	<!-- Footer -->
	<footer class="bg-[#f5f7fa] border-t border-black/5 pt-20 md:pt-24 overflow-hidden">
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
						<h3 class="text-xs font-semibold text-black/35 mb-1">Project</h3>
						<a
							href={GITHUB_REPO}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 hover:text-[#01B2FF] transition-colors"
							>GitHub</a
						>
						<a
							href={GITHUB_RELEASES}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 hover:text-[#01B2FF] transition-colors"
							>Releases</a
						>
						<a
							href="/docs"
							class="text-xs font-medium text-black/60 hover:text-[#01B2FF] transition-colors"
							>Docs</a
						>
						<a
							href="/blog"
							class="text-xs font-medium text-black/60 hover:text-[#01B2FF] transition-colors"
							>Blog</a
						>
					</div>

					<div class="flex flex-col gap-4 min-w-[120px]">
						<h3 class="text-xs font-semibold text-black/35 mb-1">Legal</h3>
						<a
							href={`${GITHUB_REPO}/blob/main/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-medium text-black/60 hover:text-[#01B2FF] transition-colors"
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
		<div class="w-full border-t border-black/8 bg-[#f5f7fa] relative z-10">
			<div
				class="max-w-7xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0"
			>
				<div
					class="text-[11px] text-black/35 font-medium tracking-tight order-2 md:order-1"
				>
					&copy; 2026 Ordinary Company Group LLC. Open source under MIT.
				</div>
				<div class="flex items-center gap-5 order-1 md:order-2">
					<a
						href={GITHUB_REPO}
						target="_blank"
						rel="noopener noreferrer"
						class="text-black/40 hover:text-[#01B2FF] transition-colors"
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

	.hero-logo {
		width: min(80vw, 500px);
		height: auto;
		filter: brightness(0) invert(1);
		drop-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.glass-panel {
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.4) 0%,
			rgba(255, 255, 255, 0.1) 100%
		);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.skeu-icon {
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 40%, #0099dd 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 2px rgba(0, 0, 0, 0.15),
			0 4px 12px rgba(1, 178, 255, 0.4),
			0 0 20px rgba(1, 178, 255, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.skeu-btn {
		color: white;
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 40%, #0099dd 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 2px 6px rgba(1, 178, 255, 0.25);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.skeu-btn:hover {
		background: linear-gradient(180deg, #5dd8ff 0%, #1abcff 40%, #01a8ee 100%);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 16px rgba(1, 178, 255, 0.4),
			0 4px 12px rgba(1, 178, 255, 0.3);
	}

	.skeu-btn:active {
		transform: translateY(0);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
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
		transform: translateY(0);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Skeuomorphic badge */
	.skeu-badge {
		color: #0088cc;
		background: linear-gradient(180deg, rgba(1, 178, 255, 0.12) 0%, rgba(1, 178, 255, 0.06) 100%);
		border: 1px solid rgba(1, 178, 255, 0.25);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.6),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04),
			0 2px 6px rgba(1, 178, 255, 0.1),
			0 0 10px rgba(1, 178, 255, 0.05);
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
		transform: translateY(0);
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
		transform: translateY(0);
		background: rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.15),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Skeuomorphic card (dark) */
	.skeu-card {
		background: linear-gradient(180deg, #141414 0%, #0d0d0d 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.04),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3),
			0 4px 16px rgba(0, 0, 0, 0.3),
			0 1px 3px rgba(0, 0, 0, 0.2);
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

	.footer-brand-logo {
		height: 1.25rem;
		width: auto;
		filter: brightness(0) invert(1);
	}

	.footer-brand-logo-light {
		height: 1.25rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.7;
	}

	.footer-giant-logo {
		width: 80vw;
		max-width: 1200px;
		height: auto;
		filter: brightness(0) invert(1);
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
</style>
