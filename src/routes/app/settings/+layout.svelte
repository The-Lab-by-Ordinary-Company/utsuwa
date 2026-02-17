<script lang="ts">
	import { page } from '$app/stores';
	import { Icon } from '$lib/components/ui';

	let { children } = $props();

	const navItems = [
		{ href: '/settings/persona', label: 'Character', icon: 'persona' },
		{ href: '/settings/display', label: 'Display', icon: 'monitor' },
		{ href: '/settings/data', label: 'Data', icon: 'database' },
		{ href: '/settings/developer', label: 'Developer', icon: 'code' }
	];

	const currentIcon = $derived(
		navItems.find((item) => $page.url.pathname === item.href)?.icon || 'settings'
	);
</script>

<div class="settings-layout">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="back-button">
				<Icon name="chevron-left" size={20} />
				<span>Back</span>
			</a>
			<h1>Settings</h1>
		</div>

		<nav class="nav">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-item"
					class:active={$page.url.pathname === item.href}
				>
					<Icon name={item.icon} size={18} />
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Content -->
	<main class="content">
		{@render children()}
		<div class="page-bg-icon">
			{#if currentIcon === 'persona'}
				<!-- User circle solid -->
				<svg viewBox="0 0 512 512" fill="currentColor"><path d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z"/></svg>
			{:else if currentIcon === 'heart'}
				<!-- Heart solid -->
				<svg viewBox="0 0 512 512" fill="currentColor"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>
			{:else if currentIcon === 'monitor'}
				<!-- Desktop solid -->
				<svg viewBox="0 0 576 512" fill="currentColor"><path d="M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64H240l-10.7 32H160c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H346.7L336 416H512c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zM512 64V288H64V64H512z"/></svg>
			{:else if currentIcon === 'database'}
				<!-- Database solid -->
				<svg viewBox="0 0 448 512" fill="currentColor"><path d="M448 80v48c0 44.2-100.3 80-224 80S0 172.2 0 128V80C0 35.8 100.3 0 224 0S448 35.8 448 80zM393.2 214.7c20.8-7.4 39.9-16.9 54.8-28.6V288c0 44.2-100.3 80-224 80S0 332.2 0 288V186.1c14.9 11.8 34 21.2 54.8 28.6C99.7 230.7 159.5 240 224 240s124.3-9.3 169.2-25.3zM0 346.1c14.9 11.8 34 21.2 54.8 28.6C99.7 390.7 159.5 400 224 400s124.3-9.3 169.2-25.3c20.8-7.4 39.9-16.9 54.8-28.6V432c0 44.2-100.3 80-224 80S0 476.2 0 432V346.1z"/></svg>
			{:else if currentIcon === 'code'}
				<!-- Code solid -->
				<svg viewBox="0 0 640 512" fill="currentColor"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/></svg>
			{:else}
				<!-- Gear solid (fallback) -->
				<svg viewBox="0 0 512 512" fill="currentColor"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
			{/if}
		</div>
	</main>
</div>

<style>
	.settings-layout {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		background: linear-gradient(180deg, #f8f8f8 0%, #ebebeb 100%);
		border-right: 1px solid rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		padding: 1rem;
		box-shadow:
			inset -1px 0 0 rgba(255, 255, 255, 0.8),
			2px 0 8px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .sidebar {
		background: linear-gradient(180deg, #1f1f1f 0%, #171717 100%);
		border-right-color: rgba(255, 255, 255, 0.06);
		box-shadow:
			inset -1px 0 0 rgba(255, 255, 255, 0.03),
			2px 0 8px rgba(0, 0, 0, 0.2);
	}

	.sidebar-header {
		padding: 0.5rem 0 1.5rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		margin-bottom: 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-decoration: none;
		border-radius: 12px;
		transition: all 0.15s ease-out;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .back-button {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.back-button:hover {
		background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .back-button:hover {
		background: linear-gradient(180deg, #333333 0%, #282828 100%);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.sidebar-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 14px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease-out;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .nav-item {
		background: linear-gradient(180deg, #2a2a2a 0%, #222222 100%);
		border-color: rgba(255, 255, 255, 0.06);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.nav-item:hover {
		background: linear-gradient(180deg, #f8f8f8 0%, #eeeeee 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .nav-item:hover {
		background: linear-gradient(180deg, #333333 0%, #2a2a2a 100%);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.nav-item.active {
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		border-color: rgba(0, 0, 0, 0.1);
		color: white;
		font-weight: 600;
		box-shadow:
			0 3px 8px rgba(1, 178, 255, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	:global(.dark) .nav-item.active {
		box-shadow:
			0 3px 10px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.nav-label {
		flex: 1;
	}

	.content {
		flex: 1;
		padding: 2rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.page-bg-icon {
		position: absolute;
		bottom: -2rem;
		right: -2rem;
		opacity: 0.04;
		pointer-events: none;
		z-index: 0;
		color: #01B2FF;
		transform: rotate(-12deg);
	}

	.page-bg-icon svg {
		width: 280px;
		height: 280px;
	}

	:global(.dark) .page-bg-icon {
		opacity: 0.06;
	}

	/* Tablet: Icon-only sidebar */
	@media (min-width: 768px) and (max-width: 1023px) {
		.sidebar {
			width: 68px;
			padding: 0.75rem;
		}

		.sidebar-header {
			padding: 0.25rem 0 1rem;
		}

		.back-button {
			padding: 0.5rem;
			margin-bottom: 0.75rem;
			justify-content: center;
		}

		.back-button span {
			display: none;
		}

		.sidebar-header h1 {
			display: none;
		}

		.nav-item {
			justify-content: center;
			padding: 0.75rem;
		}

		.nav-label {
			display: none;
		}

		.content {
			padding: 1.5rem;
		}
	}

	/* Mobile: Horizontal scroll nav */
	@media (max-width: 767px) {
		.settings-layout {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid var(--border-light);
			padding: 0.5rem 0.75rem;
			gap: 0.5rem;
		}

		.sidebar-header {
			padding: 0.25rem 0 0.5rem;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.sidebar-header h1 {
			display: none;
		}

		.back-button {
			margin-bottom: 0;
			padding: 0.5rem 0.75rem;
		}

		.nav {
			flex-direction: row;
			overflow-x: auto;
			gap: 0.375rem;
			padding: 0.25rem;
			margin: 0 -0.75rem;
			padding-left: 0.75rem;
			padding-right: 0.75rem;
			/* Fade edges to indicate scroll */
			mask-image: linear-gradient(
				to right,
				transparent,
				black 0.5rem,
				black calc(100% - 0.5rem),
				transparent
			);
			-webkit-mask-image: linear-gradient(
				to right,
				transparent,
				black 0.5rem,
				black calc(100% - 0.5rem),
				transparent
			);
			scrollbar-width: none;
		}

		.nav::-webkit-scrollbar {
			display: none;
		}

		.nav-item {
			white-space: nowrap;
			padding: 0.625rem 0.875rem;
			border-radius: 2rem;
			font-size: 0.8125rem;
			min-height: 44px;
			display: flex;
			align-items: center;
		}

		.nav-item.active {
			background: #01B2FF;
			color: white;
		}

		.content {
			padding: 0.75rem;
			flex: 1;
			min-height: 0;
			padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
		}

		.page-bg-icon {
			bottom: -1.5rem;
			right: -1.5rem;
		}

		.page-bg-icon svg {
			width: 180px;
			height: 180px;
		}
	}

	/* Extra small mobile */
	@media (max-width: 400px) {
		.nav-label {
			display: none;
		}

		.nav-item {
			padding: 0.625rem;
			justify-content: center;
		}
	}
</style>
