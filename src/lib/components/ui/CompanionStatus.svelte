<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { Icon } from '$lib/components/ui';

	let isExpanded = $state(false);

	const charState = $derived(characterStore.state);
	const moodInfo = $derived(characterStore.moodInfo);
	const stageInfo = $derived(characterStore.stageInfo);
	const affectionPercent = $derived(characterStore.affectionPercent);
	const isCompanionMode = $derived(characterStore.appMode === 'companion');

	// Stats config with colors for the vertical bars
	const datingStats = $derived([
		{ key: 'affection', label: 'Love', icon: 'heart', value: affectionPercent, color: '#ff6b9d', glowColor: 'rgba(255, 107, 157, 0.5)' },
		{ key: 'trust', label: 'Trust', icon: 'shield', value: charState.trust, color: '#4dd0ff', glowColor: 'rgba(77, 208, 255, 0.5)' },
		{ key: 'intimacy', label: 'Intimacy', icon: 'sparkles', value: charState.intimacy, color: '#c084fc', glowColor: 'rgba(192, 132, 252, 0.5)' },
		{ key: 'comfort', label: 'Comfort', icon: 'home', value: charState.comfort, color: '#4ade80', glowColor: 'rgba(74, 222, 128, 0.5)' },
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.5)' },
		{ key: 'respect', label: 'Respect', icon: 'award', value: charState.respect, color: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.5)' }
	]);

	const companionStats = $derived([
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: '#4dd0ff', glowColor: 'rgba(77, 208, 255, 0.5)' },
		{ key: 'chats', label: 'Chats', icon: 'message-circle', value: Math.min(charState.totalInteractions, 100), color: '#4ade80', glowColor: 'rgba(74, 222, 128, 0.5)' }
	]);
</script>

<div
	class="status-container"
	class:expanded={isExpanded}
	class:high-affection={!isCompanionMode && charState.affection > 500}
>
	<!-- Expanded content (appears above trigger) -->
	{#if isExpanded}
		<div class="status-details">
			<!-- Sims-style vertical stat bars -->
			<div class="stat-bars" class:companion-mode={isCompanionMode}>
				{#each isCompanionMode ? companionStats : datingStats as stat, i}
					<div class="stat-bar-wrapper" style="--delay: {i}; --bar-color: {stat.color}; --bar-glow: {stat.glowColor}">
						<div class="stat-bar-track">
							<div class="stat-bar-fill" style="height: {stat.value}%">
								<div class="stat-bar-shine"></div>
							</div>
							<div class="stat-bar-bubbles">
								{#each Array(3) as _, j}
									<div class="bubble" style="--bubble-delay: {j * 0.3}s"></div>
								{/each}
							</div>
						</div>
						<div class="stat-icon">
							<Icon name={stat.icon} size={14} />
						</div>
						<span class="stat-label">{stat.label}</span>
					</div>
				{/each}
			</div>

			{#if !isCompanionMode}
				<!-- Quick Stats Row -->
				<div class="quick-stats">
					<div class="quick-stat">
						<Icon name="calendar" size={11} />
						<span>{charState.daysKnown}d</span>
					</div>
					<div class="quick-stat">
						<Icon name="message-circle" size={11} />
						<span>{charState.totalInteractions}</span>
					</div>
					{#if charState.currentStreak > 1}
						<div class="quick-stat streak">
							<Icon name="flame" size={11} />
							<span>{charState.currentStreak}</span>
						</div>
					{/if}
					<a href="/settings/persona" class="quick-stat profile-link">
						<span>Profile</span>
						<Icon name="arrow-right" size={11} />
					</a>
				</div>
			{:else if charState.currentStreak > 1}
				<div class="quick-stats">
					<div class="quick-stat streak">
						<Icon name="flame" size={11} />
						<span>{charState.currentStreak} day streak</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Toggle bar (always visible at bottom) -->
	<button class="status-toggle" onclick={() => isExpanded = !isExpanded}>
		<span class="mood-icon" style="color: {moodInfo.color}">
			<Icon name={moodInfo.icon} size={18} />
		</span>
		<span class="mood-label">{moodInfo.description}</span>
		<span class="chevron" class:rotated={isExpanded}>
			<Icon name="chevron-up" size={14} />
		</span>
	</button>
</div>

<style>
	.status-container {
		position: fixed;
		bottom: 6rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
		/* Glossy panel - like a PS2 menu */
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(245, 245, 250, 0.9) 50%,
			rgba(235, 235, 240, 0.95) 100%
		);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: 20px;
		overflow: hidden;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;
		/* Layered shadows for depth */
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.05),
			0 4px 20px rgba(0, 0, 0, 0.1),
			0 8px 32px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .status-container {
		background: linear-gradient(
			180deg,
			rgba(45, 45, 50, 0.95) 0%,
			rgba(35, 35, 40, 0.95) 50%,
			rgba(28, 28, 32, 0.98) 100%
		);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
	}

	@media (min-width: 641px) {
		.status-container {
			bottom: 7.5rem;
		}
	}

	.status-container.high-affection {
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.05),
			0 4px 20px rgba(0, 0, 0, 0.1),
			0 0 40px rgba(255, 107, 157, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 1);
	}

	:global(.dark) .status-container.high-affection {
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 0 50px rgba(255, 107, 157, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	/* Toggle Button */
	.status-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%);
		border: none;
		border-top: 1px solid transparent;
		cursor: pointer;
		color: var(--text-primary);
		font-family: inherit;
		transition: background 0.15s;
	}

	:global(.dark) .status-toggle {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%);
	}

	.expanded .status-toggle {
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		background: transparent;
	}

	:global(.dark) .expanded .status-toggle {
		border-top-color: rgba(255, 255, 255, 0.06);
	}

	.mood-icon {
		display: flex;
		flex-shrink: 0;
	}

	.mood-label {
		flex: 1;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-align: left;
	}

	.chevron {
		display: flex;
		flex-shrink: 0;
		transition: transform 0.2s ease-out;
		opacity: 0.4;
		color: var(--text-tertiary);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.status-toggle:hover {
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.02) 100%);
	}

	:global(.dark) .status-toggle:hover {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
	}

	/* Expanded Content */
	.status-details {
		padding: 1rem 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Sims-style Vertical Stat Bars */
	.stat-bars {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.stat-bars.companion-mode {
		gap: 1.5rem;
	}

	.stat-bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		animation: slideUp 0.3s ease-out backwards;
		animation-delay: calc(var(--delay) * 40ms);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.stat-bar-track {
		width: 20px;
		height: 70px;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.15) 0%,
			rgba(0, 0, 0, 0.1) 50%,
			rgba(0, 0, 0, 0.08) 100%
		);
		border-radius: 10px;
		position: relative;
		overflow: hidden;
		/* Inner shadow for inset look */
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.15),
			inset 0 0 0 1px rgba(0, 0, 0, 0.05),
			0 1px 0 rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .stat-bar-track {
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.4) 0%,
			rgba(0, 0, 0, 0.3) 50%,
			rgba(0, 0, 0, 0.25) 100%
		);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 0 0 1px rgba(0, 0, 0, 0.2),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.stat-bar-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--bar-color) 100%, white 30%) 0%,
			var(--bar-color) 40%,
			color-mix(in srgb, var(--bar-color) 100%, black 15%) 100%
		);
		border-radius: 8px;
		transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		/* Glow effect */
		box-shadow:
			0 0 12px var(--bar-glow),
			0 0 4px var(--bar-glow),
			inset 0 0 0 1px rgba(255, 255, 255, 0.3);
	}

	.stat-bar-shine {
		position: absolute;
		top: 0;
		left: 2px;
		right: 50%;
		height: 100%;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.4) 0%,
			rgba(255, 255, 255, 0.1) 100%
		);
		border-radius: 6px 0 0 6px;
		pointer-events: none;
	}

	/* Animated bubbles in the bar */
	.stat-bar-bubbles {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
	}

	.bubble {
		position: absolute;
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		animation: bubbleRise 2s ease-in-out infinite;
		animation-delay: var(--bubble-delay);
		opacity: 0;
	}

	.bubble:nth-child(2) {
		left: 30%;
		width: 3px;
		height: 3px;
	}

	.bubble:nth-child(3) {
		left: 70%;
		width: 3px;
		height: 3px;
	}

	@keyframes bubbleRise {
		0% {
			bottom: -6px;
			opacity: 0;
		}
		10% {
			opacity: 0.7;
		}
		90% {
			opacity: 0.3;
		}
		100% {
			bottom: 100%;
			opacity: 0;
		}
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border-radius: 8px;
		color: var(--bar-color);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
		filter: drop-shadow(0 0 3px var(--bar-glow));
	}

	:global(.dark) .stat-icon {
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.stat-label {
		font-size: 0.55rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-tertiary);
	}

	/* Quick Stats */
	.quick-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		justify-content: center;
	}

	.quick-stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding: 0.3rem 0.5rem;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.06) 100%);
		border-radius: 20px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .quick-stat {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.04) 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.quick-stat.streak {
		color: white;
		background: linear-gradient(180deg, #ff8f3f 0%, #ff6b1a 100%);
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow:
			0 2px 8px rgba(255, 107, 26, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.quick-stat.profile-link {
		color: white;
		text-decoration: none;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow:
			0 2px 8px rgba(1, 178, 255, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.quick-stat.profile-link:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}
</style>
