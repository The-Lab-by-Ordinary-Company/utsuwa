<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		class: className = '',
		disabled = false,
		children,
		...rest
	}: Props = $props();

	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		danger: 'btn-danger'
	};

	const sizeClasses = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};
</script>

<ButtonPrimitive.Root
	class="btn {variantClasses[variant]} {sizeClasses[size]} {className}"
	{disabled}
	{...rest}
>
	{@render children()}
</ButtonPrimitive.Root>

<style>
	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		border: 1px solid transparent;
		border-radius: var(--radius-full);
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
		outline: none;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.1s ease;
	}

	:global(.btn:focus-visible) {
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	:global(.btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.btn:active:not(:disabled)) {
		transform: scale(0.97);
	}

	:global(.btn-sm) {
		padding: 0.4rem 0.85rem;
		font-size: 0.8rem;
	}

	:global(.btn-lg) {
		padding: 0.8rem 1.75rem;
		font-size: 1rem;
	}

	/* Primary - solid accent */
	:global(.btn-primary) {
		background: var(--accent);
		color: #fff;
	}

	:global(.btn-primary:hover:not(:disabled)) {
		background: var(--accent-hover);
		box-shadow: var(--shadow-glow);
	}

	/* Secondary - gray fill, no stroke */
	:global(.btn-secondary) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	:global(.btn-secondary:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	/* Ghost - transparent, fills gray on hover */
	:global(.btn-ghost) {
		background: transparent;
		color: var(--text-secondary);
	}

	:global(.btn-ghost:hover:not(:disabled)) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	/* Danger - solid error */
	:global(.btn-danger) {
		background: var(--color-error);
		color: #fff;
	}

	:global(.btn-danger:hover:not(:disabled)) {
		filter: brightness(0.94);
	}
</style>
