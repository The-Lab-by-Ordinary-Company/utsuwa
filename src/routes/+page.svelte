<svelte:head>
	<title>Utsuwa — Your AI Companion</title>
	<meta
		name="description"
		content="Open-source VRM avatar viewer with AI chat, voice, and semantic memory. Self-hosted, privacy-first."
	/>
</svelte:head>

<div class="dark bg-[#0a0a0a] text-white overflow-x-hidden">
	<!-- Hero -->
	<section class="relative min-h-screen bg-gradient-to-b from-[#f472b6] via-[#8b5cf6] to-[#0a0a0a]">
		<!-- Nav -->
		<nav class="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
			<a href="/" class="text-lg font-semibold tracking-tight text-white">Utsuwa</a>

			<div class="hidden md:flex items-center gap-6 text-sm text-white/80">
				<a href="#features" class="hover:text-white transition-colors">Features</a>
				<a href="/docs" class="hover:text-white transition-colors">Docs</a>
				<a href="/blog" class="hover:text-white transition-colors">Blog</a>
				<a
					href="https://github.com/dyascj/utsuwa"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-white transition-colors"
				>
					GitHub
				</a>
			</div>

			<a
				href="/app"
				class="bg-white text-black text-xs font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
			>
				Try Live
			</a>
		</nav>

		<!-- Hero content -->
		<div class="relative z-10 flex flex-col items-center justify-center mt-16 px-6">
			<!-- App icon -->
			<div
				class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#7c3aed] flex items-center justify-center shadow-xl mb-6"
			>
				<span class="text-2xl font-bold text-white">器</span>
			</div>

			<!-- Heading -->
			<h1
				class="text-5xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tight text-center mb-4"
				style="font-family: 'Exo 2', sans-serif;"
			>
				Utsuwa
			</h1>

			<!-- Subtitle -->
			<p class="text-lg md:text-xl text-white/80 text-center max-w-2xl mb-8">
				Open-source VRM avatar viewer with AI chat, voice, and semantic memory.
			</p>

			<!-- CTA buttons -->
			<div class="flex flex-wrap items-center justify-center gap-3 mb-12">
				<a
					href="/app"
					class="bg-white text-[#0a0a0a] hover:bg-white/90 text-sm font-bold px-6 py-3 rounded-full shadow-xl transition-all hover:scale-[1.02]"
				>
					Try Live
				</a>
				<a
					href="https://github.com/dyascj/utsuwa/releases"
					target="_blank"
					rel="noopener noreferrer"
					class="bg-white text-[#0a0a0a] hover:bg-white/90 text-sm font-bold px-6 py-3 rounded-full shadow-xl transition-all hover:scale-[1.02]"
				>
					Download
				</a>
				<a
					href="/docs"
					class="border border-white/30 text-white hover:bg-white/10 text-sm font-medium px-6 py-3 rounded-full transition-all"
				>
					Docs
				</a>
			</div>

			<!-- Screenshot card -->
			<div class="max-w-[1067px] w-full mx-auto px-4">
				<div class="rounded-xl overflow-hidden shadow-2xl border border-white/10">
					<img
						src="/brand-assets/thumbnail.png"
						alt="Utsuwa app screenshot"
						class="w-full h-auto"
					/>
				</div>
			</div>

			<!-- Tagline below screenshot -->
			<p
				class="max-w-2xl mt-16 md:mt-24 text-xl md:text-2xl font-semibold text-white tracking-tight text-center"
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
			class="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none"
		></div>
	</section>

	<!-- Feature A: Meet your AI companion -->
	<section id="features" class="bg-[#0a0a0a] border-t border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					Meet your AI companion
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					class="rounded-xl bg-[#111] border border-white/10 aspect-video flex items-center justify-center overflow-hidden shadow-2xl"
				>
					<div class="text-white/20 text-sm">App screenshot</div>
				</div>

				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<div
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f2937] border border-white/10 text-white/80 text-xs font-medium mb-6"
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
					<h3 class="text-2xl md:text-3xl font-medium text-white mb-4 tracking-tight">
						Full 3D, right in your browser.
					</h3>
					<p class="text-lg text-white/50 leading-relaxed">
						Load any VRM avatar model and watch it come to life with idle animations, automatic
						blinking, and speech-driven lip-sync. Chat responses appear as 3D speech bubbles that
						track your companion's head position.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature B: She remembers -->
	<section class="bg-[#0a0a0a] border-t border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					She remembers
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
					<div
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f2937] border border-white/10 text-white/80 text-xs font-medium mb-6"
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
					<h3 class="text-2xl md:text-3xl font-medium text-white mb-4 tracking-tight">
						Memories that mean something.
					</h3>
					<p class="text-lg text-white/50 leading-relaxed">
						Your companion builds a web of memories using local AI embeddings. She finds past
						conversations by meaning, not keywords. Track affection, trust, and mood across 8
						relationship stages — from Stranger to Soulmate.
					</p>
				</div>

				<div
					class="rounded-xl bg-[#111] border border-white/10 aspect-video flex items-center justify-center overflow-hidden shadow-2xl order-1 lg:order-2"
				>
					<div class="text-white/20 text-sm">Memory graph</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature C: Your voice, her ears -->
	<section class="bg-[#0a0a0a] border-t border-white/5">
		<div class="max-w-7xl mx-auto px-6 py-24 md:py-32">
			<div class="text-center mb-16 md:mb-24">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight"
					style="font-family: 'Exo 2', sans-serif;"
				>
					Your voice, her ears
				</h2>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div
					class="rounded-xl bg-[#111] border border-white/10 aspect-video flex items-center justify-center overflow-hidden shadow-2xl"
				>
					<div class="text-white/20 text-sm">Chat interface</div>
				</div>

				<div class="flex flex-col items-start max-w-lg mx-auto lg:mx-0">
					<div
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f2937] border border-white/10 text-white/80 text-xs font-medium mb-6"
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
							<path d="M12 19v3" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<rect x="9" y="2" width="6" height="13" rx="3" />
						</svg>
						Multi-Provider
					</div>
					<h3 class="text-2xl md:text-3xl font-medium text-white mb-4 tracking-tight">
						7 LLM providers. Your voice. Her words.
					</h3>
					<p class="text-lg text-white/50 leading-relaxed">
						Connect OpenAI, Anthropic, Google, DeepSeek, xAI, or run locally with Ollama and LM
						Studio. Add voice input via Groq Whisper or Web Speech API, and hear her respond with
						ElevenLabs or OpenAI TTS — complete with lip-sync.
					</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
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
</style>
