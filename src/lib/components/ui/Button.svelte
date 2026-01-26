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
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease-out;
		border: 2px solid transparent;
		outline: none;
	}

	:global(.btn:focus-visible) {
		outline: 2px solid var(--color-primary-400);
		outline-offset: 2px;
	}

	:global(.btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.btn:active:not(:disabled)) {
		transform: scale(0.97);
	}

	:global(.btn-sm) {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	:global(.btn-lg) {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}

	:global(.btn-primary) {
		background: color-mix(in srgb, var(--ctp-pink) 15%, transparent);
		border-color: color-mix(in srgb, var(--ctp-pink) 10%, transparent);
		color: var(--ctp-pink);
	}

	:global(.btn-primary:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--ctp-pink) 25%, transparent);
		border-color: color-mix(in srgb, var(--ctp-pink) 20%, transparent);
	}

	:global(.btn-secondary) {
		background: var(--color-neutral-100);
		border-color: var(--color-neutral-200);
		color: var(--color-neutral-700);
	}

	:global(.btn-secondary:hover:not(:disabled)) {
		background: var(--color-neutral-200);
	}

	:global(.btn-ghost) {
		background: transparent;
		border-color: transparent;
		color: var(--color-neutral-600);
	}

	:global(.btn-ghost:hover:not(:disabled)) {
		background: var(--color-neutral-100);
	}

	:global(.btn-danger) {
		background: color-mix(in srgb, var(--ctp-red) 15%, transparent);
		border-color: color-mix(in srgb, var(--ctp-red) 10%, transparent);
		color: var(--ctp-red);
	}

	:global(.btn-danger:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--ctp-red) 25%, transparent);
	}
</style>
