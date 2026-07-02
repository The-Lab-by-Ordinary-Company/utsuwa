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

<!-- Button styles are the canonical .btn* classes in app.css (single source). -->
