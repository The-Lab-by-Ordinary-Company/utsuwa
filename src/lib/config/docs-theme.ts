// The docs/blog surfaces still speak in --docs-* names, but every value now
// aliases the app tokens in app.css so there's a single source of truth.
// --docs-logo-filter is the only genuine per-theme value left.
export const lightVars: Record<string, string> = {
	'--docs-bg': 'var(--bg-page)',
	'--docs-bg-solid': 'var(--bg-primary)',
	'--docs-text': 'var(--text-primary)',
	'--docs-text-muted': 'var(--text-secondary)',
	'--docs-border': 'var(--border-light)',
	'--docs-border-solid': 'var(--border-light)',
	'--docs-surface': 'var(--bg-secondary)',
	'--docs-surface-solid': 'var(--bg-primary)',
	'--docs-code-bg': 'var(--bg-secondary)',
	'--docs-accent': 'var(--accent)',
	'--docs-accent-light': 'var(--accent)',
	'--docs-accent-hover': 'var(--accent-hover)',
	'--docs-logo-filter': 'brightness(0)',
	'--docs-glow': 'var(--accent-muted)',
	'--docs-glow-strong': 'var(--accent-muted)',
	'--docs-inner-highlight': 'transparent',
	'--docs-inner-shadow': 'transparent',
	'--docs-glass-bg': 'var(--bg-secondary)',
	'--docs-glass-border': 'var(--border-subtle)',
	'--docs-panel-gradient': 'var(--bg-secondary)',
	'--docs-btn-gradient': 'var(--accent)',
	'--docs-btn-gradient-hover': 'var(--accent-hover)',
	'--docs-btn-shadow': 'var(--shadow-sm)',
	'--docs-btn-shadow-hover': 'var(--shadow-md)'
};

export const darkVars: Record<string, string> = {
	'--docs-bg': 'var(--bg-page)',
	'--docs-bg-solid': 'var(--bg-primary)',
	'--docs-text': 'var(--text-primary)',
	'--docs-text-muted': 'var(--text-secondary)',
	'--docs-border': 'var(--border-light)',
	'--docs-border-solid': 'var(--border-light)',
	'--docs-surface': 'var(--bg-secondary)',
	'--docs-surface-solid': 'var(--bg-primary)',
	'--docs-code-bg': 'var(--bg-secondary)',
	'--docs-accent': 'var(--accent)',
	'--docs-accent-light': 'var(--accent)',
	'--docs-accent-hover': 'var(--accent-hover)',
	'--docs-logo-filter': 'none',
	'--docs-glow': 'var(--accent-muted)',
	'--docs-glow-strong': 'var(--accent-muted)',
	'--docs-inner-highlight': 'transparent',
	'--docs-inner-shadow': 'transparent',
	'--docs-glass-bg': 'var(--bg-secondary)',
	'--docs-glass-border': 'var(--border-subtle)',
	'--docs-panel-gradient': 'var(--bg-secondary)',
	'--docs-btn-gradient': 'var(--accent)',
	'--docs-btn-gradient-hover': 'var(--accent-hover)',
	'--docs-btn-shadow': 'var(--shadow-sm)',
	'--docs-btn-shadow-hover': 'var(--shadow-md)'
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
