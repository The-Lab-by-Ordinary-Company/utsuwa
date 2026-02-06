export const lightVars: Record<string, string> = {
	'--docs-bg': '#f7f7f8',
	'--docs-bg-solid': '#ffffff',
	'--docs-text': '#1a1a1a',
	'--docs-text-muted': '#666666',
	'--docs-border': '#e5e5e5',
	'--docs-border-solid': '#e5e5e5',
	'--docs-surface': 'rgba(255, 255, 255, 0.8)',
	'--docs-surface-solid': '#ffffff',
	'--docs-code-bg': 'rgba(247, 247, 248, 0.9)',
	'--docs-accent': '#01B2FF',
	'--docs-accent-light': '#4dd0ff',
	'--docs-accent-dark': '#0099dd',
	'--docs-accent-hover': '#0099dd',
	'--docs-logo-filter': 'brightness(0)',
	'--docs-glow': 'rgba(1, 178, 255, 0.35)',
	'--docs-glow-strong': 'rgba(1, 178, 255, 0.5)',
	'--docs-inner-highlight': 'rgba(255, 255, 255, 0.6)',
	'--docs-inner-shadow': 'rgba(0, 0, 0, 0.06)',
	'--docs-glass-bg': 'rgba(255, 255, 255, 0.85)',
	'--docs-glass-border': 'rgba(0, 0, 0, 0.08)',
	'--docs-panel-gradient':
		'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
	'--docs-btn-gradient': 'linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%)',
	'--docs-btn-gradient-hover': 'linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%)',
	'--docs-btn-shadow': '0 4px 14px rgba(1, 178, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
	'--docs-btn-shadow-hover': '0 6px 20px rgba(1, 178, 255, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15)'
};

export const darkVars: Record<string, string> = {
	'--docs-bg': '#0a0a0a',
	'--docs-bg-solid': '#0a0a0a',
	'--docs-text': '#fafafa',
	'--docs-text-muted': '#a3a3a3',
	'--docs-border': '#262626',
	'--docs-border-solid': '#262626',
	'--docs-surface': 'rgba(23, 23, 23, 0.9)',
	'--docs-surface-solid': '#171717',
	'--docs-code-bg': 'rgba(23, 23, 23, 0.95)',
	'--docs-accent': '#01B2FF',
	'--docs-accent-light': '#4dd0ff',
	'--docs-accent-dark': '#0099dd',
	'--docs-accent-hover': '#33c1ff',
	'--docs-logo-filter': 'none',
	'--docs-glow': 'rgba(1, 178, 255, 0.3)',
	'--docs-glow-strong': 'rgba(1, 178, 255, 0.45)',
	'--docs-inner-highlight': 'rgba(255, 255, 255, 0.08)',
	'--docs-inner-shadow': 'rgba(0, 0, 0, 0.4)',
	'--docs-glass-bg': 'rgba(23, 23, 23, 0.9)',
	'--docs-glass-border': 'rgba(255, 255, 255, 0.08)',
	'--docs-panel-gradient':
		'linear-gradient(180deg, rgba(38,38,38,0.6) 0%, rgba(23,23,23,0.9) 100%)',
	'--docs-btn-gradient': 'linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%)',
	'--docs-btn-gradient-hover': 'linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%)',
	'--docs-btn-shadow': '0 4px 14px rgba(1, 178, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)',
	'--docs-btn-shadow-hover': '0 6px 20px rgba(1, 178, 255, 0.4), 0 3px 6px rgba(0, 0, 0, 0.35)'
};

export function resolveTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	const stored = localStorage.getItem('docs-theme');
	if (stored === 'light') return 'light';
	if (stored === 'dark') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyVars(el: HTMLElement, vars: Record<string, string>) {
	for (const [key, value] of Object.entries(vars)) {
		el.style.setProperty(key, value);
	}
}
