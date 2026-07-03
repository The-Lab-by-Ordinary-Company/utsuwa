<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { Icon } from '$lib/components/ui';
	import { localPath } from '$lib/config/links';
	import { pop, fadeFast } from '$lib/utils/motion';

	interface Props {
		overlay?: boolean;
	}

	let { overlay = false }: Props = $props();
	let isExpanded = $state(false);

	const charState = $derived(characterStore.state);
	const moodInfo = $derived(characterStore.moodInfo);
	const affectionPercent = $derived(characterStore.affectionPercent);
	const isCompanionMode = $derived(characterStore.appMode === 'companion');

	// Stats config with colors for the vertical bars
	const datingStats = $derived([
		{ key: 'affection', label: 'Love', icon: 'heart', value: affectionPercent, color: 'var(--stat-affection)' },
		{ key: 'trust', label: 'Trust', icon: 'shield', value: charState.trust, color: 'var(--stat-trust)' },
		{ key: 'intimacy', label: 'Intimacy', icon: 'sparkles', value: charState.intimacy, color: 'var(--stat-intimacy)' },
		{ key: 'comfort', label: 'Comfort', icon: 'home', value: charState.comfort, color: 'var(--stat-comfort)' },
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: 'var(--stat-energy)' },
		{ key: 'respect', label: 'Respect', icon: 'award', value: charState.respect, color: 'var(--stat-respect)' }
	]);

	const companionStats = $derived([
		{ key: 'energy', label: 'Energy', icon: 'zap', value: charState.energy, color: 'var(--stat-energy)' },
		{ key: 'chats', label: 'Chats', icon: 'message-circle', value: Math.min(charState.totalInteractions, 100), color: 'var(--color-success)' }
	]);
</script>

{#if overlay}
	<!-- Overlay mode: compact circular button -->
	<div class="overlay-status-wrapper">
		{#if isExpanded}
			<div
				class="overlay-expanded-panel"
				transition:pop={{ base: 'translateX(-50%)', y: 10, duration: 220 }}
				class:high-affection={!isCompanionMode && charState.affection > 500}
			>
				<div class="status-details">
					<div class="stat-bars" class:companion-mode={isCompanionMode}>
						{#each isCompanionMode ? companionStats : datingStats as stat, i}
							<div class="stat-bar-wrapper" style="--delay: {i}; --bar-color: {stat.color}">
								<div class="stat-bar-track">
									<div class="stat-bar-fill" style="height: {stat.value}%"></div>
								</div>
								<div class="stat-icon">
									<Icon name={stat.icon} size={14} />
								</div>
								<span class="stat-label">{stat.label}</span>
							</div>
						{/each}
					</div>

					{#if !isCompanionMode}
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
			</div>
		{/if}

		<button
			class="overlay-status-btn"
			onclick={() => isExpanded = !isExpanded}
			aria-label={isExpanded ? 'Collapse status' : 'Show status'}
			title={isExpanded ? 'Collapse status' : 'Show status'}
			style="--mood-color: {moodInfo.color}"
		>
			{#key isExpanded}
				<span class="icon-inner" in:fadeFast={{ duration: 150 }}>
					{#if isExpanded}
						<Icon name="x" size={20} />
					{:else}
						<Icon name={moodInfo.icon} size={20} />
					{/if}
				</span>
			{/key}
		</button>
	</div>
{:else}
	<!-- Standard mode: full status panel -->
	<div
		class="status-container"
		class:expanded={isExpanded}
		class:high-affection={!isCompanionMode && charState.affection > 500}
	>
		{#if isExpanded}
			<div class="status-details" transition:pop={{ duration: 200, y: 8 }}>
				<div class="stat-bars" class:companion-mode={isCompanionMode}>
					{#each isCompanionMode ? companionStats : datingStats as stat, i}
						<div class="stat-bar-wrapper" style="--delay: {i}; --bar-color: {stat.color}">
							<div class="stat-bar-track">
								<div class="stat-bar-fill" style="height: {stat.value}%"></div>
							</div>
							<div class="stat-icon">
								<Icon name={stat.icon} size={14} />
							</div>
							<span class="stat-label">{stat.label}</span>
						</div>
					{/each}
				</div>

				{#if !isCompanionMode}
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
						<a href={localPath('app', '/settings/persona')} class="quick-stat profile-link">
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
{/if}

<style>
	.status-container {
		position: fixed;
		bottom: 6rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: box-shadow 0.2s;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-sm);
	}

	@media (min-width: 641px) {
		.status-container {
			bottom: 7.5rem;
		}
	}

	.status-container.high-affection {
		box-shadow: 0 0 0 1px var(--stat-affection), var(--shadow-sm);
	}

	/* Toggle Button */
	.status-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: transparent;
		border: none;
		border-top: 1px solid transparent;
		cursor: pointer;
		color: var(--text-primary);
		font-family: inherit;
		transition: background 0.15s;
	}

	.expanded .status-toggle {
		border-top: 1px solid var(--border-subtle);
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
		background: var(--bg-secondary);
	}

	/* Expanded Content */
	.status-details {
		padding: 1rem 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Vertical Stat Bars */
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
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		position: relative;
		overflow: hidden;
	}

	.stat-bar-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bar-color);
		border-radius: var(--radius-full);
		transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		color: var(--bar-color);
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
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
	}

	.quick-stat.streak {
		color: var(--color-warning);
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
	}

	.quick-stat.profile-link {
		color: #fff;
		text-decoration: none;
		background: var(--accent);
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.quick-stat.profile-link:hover {
		background: var(--accent-hover);
	}

	/* Overlay mode: compact circular button */
	.overlay-status-wrapper {
		position: relative;
	}

	.overlay-status-btn {
		width: 48px;
		height: 48px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
		position: relative;
		overflow: hidden;
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-md);
	}

	.overlay-status-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.overlay-status-btn:active {
		transform: translateY(0) scale(0.96);
	}

	.overlay-status-btn .icon-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--mood-color, var(--text-primary));
	}

	/* Expanded panel floating above the controls, centered in viewport */
	.overlay-expanded-panel {
		position: fixed;
		bottom: 5.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		white-space: nowrap;
	}

	.overlay-expanded-panel.high-affection {
		box-shadow: 0 0 0 1px var(--stat-affection), var(--shadow-lg);
	}
</style>
