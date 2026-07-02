<script lang="ts">
	import { GITHUB_RELEASES } from '$lib/config/site';

	const version = `v${import.meta.env.VITE_APP_VERSION}`;
</script>

<a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" class="version-chip">
	{version}
</a>

<style>
	.version-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		border: none;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		text-decoration: none;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.version-chip:hover {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		color: var(--text-primary);
	}
</style>
