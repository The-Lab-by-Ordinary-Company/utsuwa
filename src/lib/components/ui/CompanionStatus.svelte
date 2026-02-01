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
							style="width: {charState.energy}%"
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
						<span class="heart-glow"><Icon name="heart" size={14} color="#01B2FF" /></span>
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
						color="#01B2FF"
						size={56}
						strokeWidth={5}
					/>
					<CircularGauge
						value={charState.intimacy}
						iconName="heart"
						label="Intimacy"
						color="#01B2FF"
						size={56}
						strokeWidth={5}
					/>
					<CircularGauge
						value={charState.comfort}
						iconName="home"
						label="Comfort"
						color="#01B2FF"
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
								style="width: {charState.energy}%"
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
								style="width: {charState.respect}%"
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
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all 0.2s ease-out;
		min-width: 280px;
		display: flex;
		flex-direction: column;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.12),
			0 2px 6px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .status-container {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	@media (min-width: 641px) {
		.status-container {
			bottom: 6.5rem;
		}
	}

	.status-container.high-affection {
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.12),
			0 0 24px rgba(1, 178, 255, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .status-container.high-affection {
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 30px rgba(1, 178, 255, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
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
		filter: drop-shadow(0 0 4px rgba(1, 178, 255, 0.5));
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
		height: 6px;
		background: linear-gradient(180deg, #e0e0e0 0%, #d0d0d0 100%);
		border-radius: 3px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .stat-bar-container {
		background: linear-gradient(180deg, #2a2a2a 0%, #222222 100%);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.stat-bar {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
		color: white;
		padding: 0.3rem 0.5rem;
		background: linear-gradient(180deg, #555555 0%, #333333 100%);
		border-radius: var(--radius-full);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	:global(.dark) .quick-stat {
		background: linear-gradient(180deg, #4a4a4a 0%, #333333 100%);
	}

	.quick-stat.streak {
		color: white;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		box-shadow:
			0 2px 6px rgba(1, 178, 255, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	/* Profile Link */
	.profile-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-full);
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		transition: all 0.15s ease;
		box-shadow:
			0 2px 8px rgba(1, 178, 255, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.profile-link:hover {
		background: linear-gradient(180deg, #66d9ff 0%, #1ebfff 50%, #00a6e6 100%);
		transform: translateY(-1px);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
