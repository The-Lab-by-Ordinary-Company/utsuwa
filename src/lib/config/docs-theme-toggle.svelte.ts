import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

let _theme = $state<Theme>('system');

if (browser) {
	_theme = (localStorage.getItem('colorMode') as Theme) || 'system';
}

export function cycleTheme() {
	const order: Theme[] = ['light', 'dark', 'system'];
	const next = order[(order.indexOf(_theme) + 1) % order.length];
	_theme = next;
	if (!browser) return;
	const root = document.documentElement;
	if (next === 'system') {
		root.removeAttribute('data-docs-theme');
	} else {
		root.setAttribute('data-docs-theme', next);
	}
	const isDark =
		next === 'dark' ||
		(next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	root.classList.toggle('dark', isDark);
	localStorage.setItem('colorMode', next);
}

export function getIconName(): string {
	return _theme === 'light' ? 'sun' : _theme === 'dark' ? 'moon' : 'monitor';
}

export function getLabel(): string {
	return _theme === 'light' ? 'Light' : _theme === 'dark' ? 'Dark' : 'System';
}
