export const lightVars: Record<string, string> = {
	'--docs-bg': '#f6f8f9',
	'--docs-bg-solid': '#ffffff',
	'--docs-text': '#1c2b33',
	'--docs-text-muted': '#70767d',
	'--docs-border': '#d9d9d9',
	'--docs-border-solid': '#d9d9d9',
	'--docs-surface': 'rgba(255, 255, 255, 0.8)',
	'--docs-surface-solid': '#ffffff',
	'--docs-code-bg': 'rgba(246, 248, 249, 0.9)',
	'--docs-accent': '#00b2ff',
	'--docs-accent-light': '#4cc9ff',
	'--docs-accent-hover': '#0096d6',
	'--docs-logo-filter': 'brightness(0)',
	'--docs-glow': 'rgba(0, 178, 255, 0.3)',
	'--docs-glow-strong': 'rgba(0, 178, 255, 0.45)',
	'--docs-inner-highlight': 'rgba(255, 255, 255, 0.6)',
	'--docs-inner-shadow': 'rgba(28, 43, 51, 0.06)',
	'--docs-glass-bg': 'rgba(255, 255, 255, 0.85)',
	'--docs-glass-border': 'rgba(28, 43, 51, 0.08)',
	'--docs-panel-gradient':
		'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
	'--docs-btn-gradient': '#00b2ff',
	'--docs-btn-gradient-hover': '#0096d6',
	'--docs-btn-shadow': '0 4px 20px 6px rgba(58, 156, 255, 0.1)',
	'--docs-btn-shadow-hover': '0 6px 24px 8px rgba(58, 156, 255, 0.16)'
};

export const darkVars: Record<string, string> = {
	'--docs-bg': '#0c1116',
	'--docs-bg-solid': '#0c1116',
	'--docs-text': '#f6f8f9',
	'--docs-text-muted': '#9da9b7',
	'--docs-border': '#26313a',
	'--docs-border-solid': '#26313a',
	'--docs-surface': 'rgba(20, 27, 33, 0.9)',
	'--docs-surface-solid': '#141b21',
	'--docs-code-bg': 'rgba(20, 27, 33, 0.95)',
	'--docs-accent': '#00b2ff',
	'--docs-accent-light': '#66d0ff',
	'--docs-accent-hover': '#33c1ff',
	'--docs-logo-filter': 'none',
	'--docs-glow': 'rgba(0, 178, 255, 0.3)',
	'--docs-glow-strong': 'rgba(0, 178, 255, 0.45)',
	'--docs-inner-highlight': 'rgba(255, 255, 255, 0.08)',
	'--docs-inner-shadow': 'rgba(0, 0, 0, 0.4)',
	'--docs-glass-bg': 'rgba(20, 27, 33, 0.9)',
	'--docs-glass-border': 'rgba(255, 255, 255, 0.08)',
	'--docs-panel-gradient':
		'linear-gradient(180deg, rgba(29,38,46,0.6) 0%, rgba(20,27,33,0.9) 100%)',
	'--docs-btn-gradient': '#00b2ff',
	'--docs-btn-gradient-hover': '#33c1ff',
	'--docs-btn-shadow': '0 4px 20px 6px rgba(0, 178, 255, 0.18)',
	'--docs-btn-shadow-hover': '0 6px 24px 8px rgba(0, 178, 255, 0.26)'
};

export function resolveTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	const stored = localStorage.getItem('colorMode');
	if (stored === 'light') return 'light';
	if (stored === 'dark') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyVars(el: HTMLElement, vars: Record<string, string>) {
	for (const [key, value] of Object.entries(vars)) {
		el.style.setProperty(key, value);
	}
}

export function setupThemeWatcher(getEl: () => HTMLElement | null, isBrowser: boolean) {
	const el = getEl();
	if (!el || !isBrowser) return;

	const update = () => {
		const target = getEl();
		const theme = resolveTheme();
		if (target) applyVars(target, theme === 'dark' ? darkVars : lightVars);

		// Sync data-docs-theme so Shiki code blocks pick the right colors
		const stored = localStorage.getItem('colorMode');
		if (stored === 'light' || stored === 'dark') {
			document.documentElement.setAttribute('data-docs-theme', stored);
		} else {
			document.documentElement.removeAttribute('data-docs-theme');
		}
	};

	update();

	const onStorage = () => update();
	window.addEventListener('storage', onStorage);

	const mql = window.matchMedia('(prefers-color-scheme: dark)');
	mql.addEventListener('change', update);

	const observer = new MutationObserver(update);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class']
	});

	return () => {
		window.removeEventListener('storage', onStorage);
		mql.removeEventListener('change', update);
		observer.disconnect();
	};
}
