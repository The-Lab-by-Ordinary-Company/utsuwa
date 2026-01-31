<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { Progress, Icon } from '$lib/components/ui';
	import CircularGauge from './CircularGauge.svelte';

	let isExpanded = $state(false);

	const charState = $derived(characterStore.state);
	const moodInfo = $derived(characterStore.moodInfo);
	const stageInfo = $derived(characterStore.stageInfo);
	const affectionPercent = $derived(characterStore.affectionPercent);
	const isCompanionMode = $derived(characterStore.appMode === 'companion');
</script>

<div
	class="status-container"
	class:expanded={isExpanded}
	class:high-affection={!isCompanionMode && charState.affection > 500}
>
	<!-- Expanded content (appears above trigger) -->
	{#if isExpanded}
		<div class="status-details">
			{#if isCompanionMode}
				<!-- Companion Mode: Simplified view -->
				<div class="companion-header">
					<Icon name="sparkles" size={16} color="#01B2FF" />
					<span class="companion-title">Companion</span>
				</div>

				<!-- Energy only -->
				<div class="stat-row">
					<Icon name="zap" size={12} />
					<span class="stat-label">Energy</span>
					<div class="stat-bar-container">
						<div
							class="stat-bar"
							style="width: {charState.energy}%; background: var(--stat-energy)"
						></div>
					</div>
					<span class="stat-value">{charState.energy}</span>
				</div>

				<!-- Quick Stats -->
				<div class="quick-stats">
					<div class="quick-stat">
						<Icon name="message-circle" size={12} />
						<span>{charState.totalInteractions} chats</span>
					</div>
					{#if charState.currentStreak > 1}
						<div class="quick-stat streak">
							<Icon name="flame" size={12} />
							<span>{charState.currentStreak} day streak</span>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Dating Sim Mode: Full view -->
				<!-- Relationship Stage & Affection -->
				<div class="affection-section">
					<div class="affection-label">
						<span class="heart-glow"><Icon name="heart" size={14} color="var(--ctp-pink)" /></span>
						<span class="tier-name">{stageInfo.name}</span>
						<span class="affection-value">{affectionPercent}%</span>
					</div>
					<Progress value={affectionPercent} variant="affection" size="md" />
				</div>

				<!-- Core Stats Trio -->
				<div class="stats-trio">
					<CircularGauge
						value={charState.trust}
						iconName="shield"
						label="Trust"
						color="var(--stat-trust)"
						size={56}
						strokeWidth={5}
					/>
					<CircularGauge
						value={charState.intimacy}
						iconName="heart"
						label="Intimacy"
						color="var(--stat-intimacy)"
						size={56}
						strokeWidth={5}
					/>
					<CircularGauge
						value={charState.comfort}
						iconName="home"
						label="Comfort"
						color="var(--stat-comfort)"
						size={56}
						strokeWidth={5}
					/>
				</div>

				<!-- Secondary Stats -->
				<div class="secondary-stats">
					<div class="stat-row">
						<Icon name="zap" size={12} />
						<span class="stat-label">Energy</span>
						<div class="stat-bar-container">
							<div
								class="stat-bar"
								style="width: {charState.energy}%; background: var(--stat-energy)"
							></div>
						</div>
						<span class="stat-value">{charState.energy}</span>
					</div>
					<div class="stat-row">
						<Icon name="award" size={12} />
						<span class="stat-label">Respect</span>
						<div class="stat-bar-container">
							<div
								class="stat-bar"
								style="width: {charState.respect}%; background: var(--stat-respect)"
							></div>
						</div>
						<span class="stat-value">{charState.respect}</span>
					</div>
				</div>

				<!-- Quick Stats -->
				<div class="quick-stats">
					<div class="quick-stat">
						<Icon name="calendar" size={12} />
						<span>{charState.daysKnown} days</span>
					</div>
					<div class="quick-stat">
						<Icon name="message-circle" size={12} />
						<span>{charState.totalInteractions} chats</span>
					</div>
					{#if charState.currentStreak > 1}
						<div class="quick-stat streak">
							<Icon name="flame" size={12} />
							<span>{charState.currentStreak} day streak</span>
						</div>
					{/if}
				</div>

				<!-- View Profile Link -->
				<a href="/settings/persona" class="profile-link">
					View Full Profile
					<Icon name="arrow-right" size={14} />
				</a>
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
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
		background: var(--bg-primary);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all 0.2s ease-out;
		min-width: 280px;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-md);
	}

	@media (min-width: 641px) {
		.status-container {
			bottom: 6.5rem;
		}
	}

	.status-container.high-affection {
		box-shadow: var(--shadow-md), 0 0 20px rgba(1, 178, 255, 0.2);
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
	}

	.expanded .status-toggle {
		border-top: 1px solid var(--border-light);
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
		padding: 0.875rem 0.875rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		animation: slideUp 0.2s ease-out;
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

	/* Affection Section */
	.affection-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.affection-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.heart-glow {
		display: flex;
		filter: drop-shadow(0 0 4px rgba(244, 114, 182, 0.5));
	}

	.tier-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.affection-value {
		margin-left: auto;
		color: var(--text-tertiary);
		font-size: 0.7rem;
	}

	/* Stats Trio */
	.stats-trio {
		display: flex;
		justify-content: space-around;
		padding: 0.375rem 0;
	}

	/* Secondary Stats */
	.secondary-stats {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.stat-label {
		width: 3.5rem;
	}

	.stat-bar-container {
		flex: 1;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
	}

	.stat-bar {
		height: 100%;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.stat-value {
		width: 1.5rem;
		text-align: right;
		font-weight: 500;
	}

	/* Quick Stats */
	.quick-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.quick-stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: var(--text-tertiary);
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-xs);
	}

	.quick-stat.streak {
		color: #01B2FF;
		background: rgba(1, 178, 255, 0.1);
	}

	/* Profile Link */
	.profile-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		font-weight: 500;
		color: #01B2FF;
		text-decoration: none;
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		background: rgba(1, 178, 255, 0.1);
		transition: all 0.15s ease;
	}

	.profile-link:hover {
		background: rgba(1, 178, 255, 0.15);
		transform: translateX(2px);
	}

	/* Companion Mode Header */
	.companion-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-light);
		margin-bottom: 0.25rem;
	}

	.companion-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #01B2FF;
	}
</style>
