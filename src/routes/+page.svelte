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
