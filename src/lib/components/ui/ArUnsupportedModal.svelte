<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { pop, fadeFast } from '$lib/utils/motion';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="ar-modal-backdrop" transition:fadeFast={{ duration: 200 }} onclick={onclose}>
	<div
		class="ar-modal"
		role="dialog"
		aria-label="AR mode requirements"
		tabindex="-1"
		transition:pop={{ duration: 260, y: 14 }}
		onclick={(e) => e.stopPropagation()}
	>
		<button class="ar-close" onclick={onclose} aria-label="Close">
			<Icon name="x" size={14} />
		</button>

		<div class="ar-icon-wrap">
			<div class="ar-icon-glow"></div>
			<div class="ar-icon">
				<Icon name="headset" size={34} />
			</div>
		</div>

		<h2>See her in your space</h2>
		<p>
			AR mode puts your companion right on your floor: walk around her, move her wherever you
			like, and resize her with a pinch. It just needs a browser that speaks WebXR.
		</p>

		<div class="ar-devices">
			<div class="ar-device">
				<span class="ar-device-name">Android phone or tablet</span>
				<span class="ar-device-via">Chrome</span>
			</div>
			<div class="ar-device">
				<span class="ar-device-name">Meta Quest</span>
				<span class="ar-device-via">Headset browser</span>
			</div>
		</div>

		<p class="ar-footnote">
			iPhones don't support WebXR yet: open this page on one of the devices above and the AR
			button lights up automatically.
		</p>

		<button class="ar-cta" onclick={onclose}>Got it</button>
	</div>
</div>

<style>
	.ar-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: color-mix(in srgb, var(--bg-page, #000) 55%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
	}

	.ar-modal {
		position: relative;
		width: min(380px, 100%);
		padding: 2.25rem 1.75rem 1.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		text-align: center;
	}

	.ar-close {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.ar-close:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.ar-icon-wrap {
		position: relative;
		display: inline-flex;
		margin-bottom: 1.25rem;
	}

	.ar-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		border-radius: var(--radius-full);
		background: linear-gradient(135deg, var(--accent), #7dd3fc);
		color: #fff;
	}

	.ar-icon-glow {
		position: absolute;
		inset: -10px;
		border-radius: var(--radius-full);
		background: radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%);
		animation: arGlow 2.6s ease-in-out infinite;
	}

	@keyframes arGlow {
		0%,
		100% {
			opacity: 0.55;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.12);
		}
	}

	.ar-modal h2 {
		margin: 0 0 0.625rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.ar-modal p {
		margin: 0 0 1.25rem;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.ar-devices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}

	.ar-device {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		border-radius: var(--radius-md);
		background: var(--bg-tertiary);
	}

	.ar-device-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.ar-device-via {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.ar-footnote {
		font-size: 0.75rem !important;
		color: var(--text-tertiary) !important;
	}

	.ar-cta {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: var(--radius-full);
		background: var(--accent);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	.ar-cta:hover {
		background: var(--accent-hover);
	}

	.ar-cta:active {
		transform: scale(0.98);
	}
</style>
