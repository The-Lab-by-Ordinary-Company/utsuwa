import { browser } from '$app/environment';

export interface ThemeColors {
	// Accent colors (light mode)
	accent: string;
	accentLight: string;
	accentForeground: string;
	// Accent colors (dark mode) - optional, falls back to light mode values
	accentDark?: string;
	accentForegroundDark?: string;
	// Semantic accents
	pink: string;
	mauve: string;
	red: string;
	peach: string;
	yellow: string;
	green: string;
	teal: string;
	sky: string;
	blue: string;
	// Base colors (light mode)
	base: string;
	mantle: string;
	crust: string;
	text: string;
	subtext: string;
	overlay: string;
	// Additional gradient colors (light mode)
	surface0: string;
	surface1: string;
	overlay1: string;
	subtext1: string;
	// Base colors (dark mode)
	baseDark: string;
	mantleDark: string;
	crustDark: string;
	textDark: string;
	subtextDark: string;
	overlayDark: string;
	// Additional gradient colors (dark mode)
	surface0Dark: string;
	surface1Dark: string;
	overlay1Dark: string;
	subtext1Dark: string;
}

export interface ThemeDefinition {
	id: string;
	name: string;
	description: string;
	colors: ThemeColors;
}

// Theme definitions
export const THEMES: ThemeDefinition[] = [
	{
		id: 'default',
		name: 'Default',
		description: 'The default theme for Utsuwa',
		colors: {
			// Accent colors - neutral dark/light based on mode
			accent: '#343541',
			accentLight: '#565869',
			accentForeground: '#ffffff',
			accentDark: '#ececf1',
			accentForegroundDark: '#212121',
			pink: '#6e6e80',
			mauve: '#6e6e80',
			red: '#ef4444',
			peach: '#f97316',
			yellow: '#eab308',
			green: '#10a37f',
			teal: '#10a37f',
			sky: '#10a37f',
			blue: '#6e6e80',
			// Light mode base
			base: '#ffffff',
			mantle: '#f7f7f8',
			crust: '#ececf1',
			text: '#343541',
			subtext: '#6e6e80',
			overlay: '#8e8ea0',
			surface0: '#ececf1',
			surface1: '#e3e3e8',
			overlay1: '#6e6e80',
			subtext1: '#565869',
			// Dark mode base
			baseDark: '#212121',
			mantleDark: '#1a1a1a',
			crustDark: '#141414',
			textDark: '#ececf1',
			subtextDark: '#9a9aab',
			overlayDark: '#5a5a6e',
			surface0Dark: '#2f2f2f',
			surface1Dark: '#3a3a3a',
			overlay1Dark: '#6e6e80',
			subtext1Dark: '#b4b4bf'
		}
	},
	{
		id: 'rosepine',
		name: 'Rosé Pine',
		description: 'All natural pine, faux fur and a bit of soho vibes',
		colors: {
			accent: '#ebbcba',
			accentLight: '#ebbcba',
			accentForeground: '#191724',
			pink: '#ebbcba',
			mauve: '#c4a7e7',
			red: '#eb6f92',
			peach: '#ebbcba',
			yellow: '#f6c177',
			green: '#31748f',
			teal: '#9ccfd8',
			sky: '#9ccfd8',
			blue: '#31748f',
			// Dawn (light)
			base: '#faf4ed',
			mantle: '#fffaf3',
			crust: '#f2e9e1',
			text: '#575279',
			subtext: '#797593',
			overlay: '#9893a5',
			surface0: '#f2e9e1',
			surface1: '#fffaf3',
			overlay1: '#797593',
			subtext1: '#575279',
			// Main (dark)
			baseDark: '#191724',
			mantleDark: '#1f1d2e',
			crustDark: '#26233a',
			textDark: '#e0def4',
			subtextDark: '#908caa',
			overlayDark: '#6e6a86',
			surface0Dark: '#26233a',
			surface1Dark: '#1f1d2e',
			overlay1Dark: '#908caa',
			subtext1Dark: '#e0def4'
		}
	},
	{
		id: 'tokyonight',
		name: 'Tokyo Night',
		description: 'A clean dark theme that celebrates the lights of Tokyo',
		colors: {
			accent: '#7aa2f7',
			accentLight: '#7aa2f7',
			accentForeground: '#1a1b26',
			pink: '#bb9af7',
			mauve: '#bb9af7',
			red: '#f7768e',
			peach: '#ff9e64',
			yellow: '#e0af68',
			green: '#9ece6a',
			teal: '#73daca',
			sky: '#7dcfff',
			blue: '#7aa2f7',
			// Day (light)
			base: '#e1e2e7',
			mantle: '#d5d6db',
			crust: '#c8c9ce',
			text: '#3760bf',
			subtext: '#6172b0',
			overlay: '#848cb5',
			surface0: '#c8c9ce',
			surface1: '#d5d6db',
			overlay1: '#6172b0',
			subtext1: '#3760bf',
			// Night (dark)
			baseDark: '#1a1b26',
			mantleDark: '#16161e',
			crustDark: '#13131a',
			textDark: '#c0caf5',
			subtextDark: '#a9b1d6',
			overlayDark: '#565f89',
			surface0Dark: '#13131a',
			surface1Dark: '#16161e',
			overlay1Dark: '#565f89',
			subtext1Dark: '#a9b1d6'
		}
	},
	{
		id: 'nord',
		name: 'Nord',
		description: 'Arctic, north-bluish color palette',
		colors: {
			accent: '#88c0d0',
			accentLight: '#88c0d0',
			accentForeground: '#2e3440',
			pink: '#b48ead',
			mauve: '#b48ead',
			red: '#bf616a',
			peach: '#d08770',
			yellow: '#ebcb8b',
			green: '#a3be8c',
			teal: '#8fbcbb',
			sky: '#88c0d0',
			blue: '#81a1c1',
			// Snow Storm (light)
			base: '#eceff4',
			mantle: '#e5e9f0',
			crust: '#d8dee9',
			text: '#2e3440',
			subtext: '#3b4252',
			overlay: '#4c566a',
			surface0: '#d8dee9',
			surface1: '#e5e9f0',
			overlay1: '#4c566a',
			subtext1: '#3b4252',
			// Polar Night (dark) - uses Snow Storm for text colors
			baseDark: '#2e3440',
			mantleDark: '#3b4252',
			crustDark: '#434c5e',
			textDark: '#eceff4',
			subtextDark: '#e5e9f0',
			overlayDark: '#d8dee9',
			surface0Dark: '#434c5e',
			surface1Dark: '#3b4252',
			overlay1Dark: '#d8dee9',
			subtext1Dark: '#e5e9f0'
		}
	},
];

function createThemeStore() {
	let currentThemeId = $state<string>('default');

	// Load from localStorage on init
	if (browser) {
		const saved = localStorage.getItem('colorTheme');
		if (saved && THEMES.some((t) => t.id === saved)) {
			currentThemeId = saved;
		}
	}

	function setTheme(themeId: string) {
		const theme = THEMES.find((t) => t.id === themeId);
		if (!theme) return;

		currentThemeId = themeId;

		if (browser) {
			localStorage.setItem('colorTheme', themeId);
			applyTheme(theme);
		}
	}

	function applyTheme(theme: ThemeDefinition) {
		const root = document.documentElement;
		const c = theme.colors;

		// Set accent colors
		root.style.setProperty('--ctp-pink', c.pink);
		root.style.setProperty('--ctp-mauve', c.mauve);
		root.style.setProperty('--ctp-red', c.red);
		root.style.setProperty('--ctp-peach', c.peach);
		root.style.setProperty('--ctp-yellow', c.yellow);
		root.style.setProperty('--ctp-green', c.green);
		root.style.setProperty('--ctp-teal', c.teal);
		root.style.setProperty('--ctp-sky', c.sky);
		root.style.setProperty('--ctp-blue', c.blue);

		// Set base colors based on current mode
		const isDark = root.classList.contains('dark');
		const baseColor = isDark ? c.baseDark : c.base;

		if (isDark) {
			root.style.setProperty('--ctp-base', c.baseDark);
			root.style.setProperty('--ctp-mantle', c.mantleDark);
			root.style.setProperty('--ctp-crust', c.crustDark);
			root.style.setProperty('--ctp-text', c.textDark);
			root.style.setProperty('--ctp-subtext0', c.subtextDark);
			root.style.setProperty('--ctp-subtext1', c.subtext1Dark);
			root.style.setProperty('--ctp-overlay0', c.overlayDark);
			root.style.setProperty('--ctp-overlay1', c.overlay1Dark);
			root.style.setProperty('--ctp-surface0', c.surface0Dark);
			root.style.setProperty('--ctp-surface1', c.surface1Dark);
			root.style.setProperty('--glass-bg', `rgba(${hexToRgb(c.baseDark)}, 0.85)`);
			root.style.setProperty('--glass-bg-solid', `rgba(${hexToRgb(c.baseDark)}, 0.95)`);
			root.style.setProperty('--glass-bg-subtle', `rgba(${hexToRgb(c.baseDark)}, 0.7)`);
			// Glass borders use accent color for theme cohesion
			const accentForBorder = c.accentDark || c.accent;
			root.style.setProperty('--glass-border', `rgba(${hexToRgb(accentForBorder)}, 0.15)`);
			root.style.setProperty('--glass-border-subtle', `rgba(${hexToRgb(accentForBorder)}, 0.08)`);
		} else {
			root.style.setProperty('--ctp-base', c.base);
			root.style.setProperty('--ctp-mantle', c.mantle);
			root.style.setProperty('--ctp-crust', c.crust);
			root.style.setProperty('--ctp-text', c.text);
			root.style.setProperty('--ctp-subtext0', c.subtext);
			root.style.setProperty('--ctp-subtext1', c.subtext1);
			root.style.setProperty('--ctp-overlay0', c.overlay);
			root.style.setProperty('--ctp-overlay1', c.overlay1);
			root.style.setProperty('--ctp-surface0', c.surface0);
			root.style.setProperty('--ctp-surface1', c.surface1);
			root.style.setProperty('--glass-bg', `rgba(${hexToRgb(c.base)}, 0.85)`);
			root.style.setProperty('--glass-bg-solid', `rgba(${hexToRgb(c.base)}, 0.95)`);
			root.style.setProperty('--glass-bg-subtle', `rgba(${hexToRgb(c.base)}, 0.7)`);
			// Glass borders use accent color for theme cohesion
			root.style.setProperty('--glass-border', `rgba(${hexToRgb(c.accent)}, 0.20)`);
			root.style.setProperty('--glass-border-subtle', `rgba(${hexToRgb(c.accent)}, 0.10)`);
		}

		// Update accent variables (use dark mode variants if available)
		const accent = isDark && c.accentDark ? c.accentDark : c.accent;
		const accentForeground = isDark && c.accentForegroundDark ? c.accentForegroundDark : c.accentForeground;
		root.style.setProperty('--accent', accent);
		root.style.setProperty('--accent-foreground', accentForeground);

		// Stat colors (semantic mappings)
		root.style.setProperty('--stat-trust', c.green);
		root.style.setProperty('--stat-intimacy', c.pink);
		root.style.setProperty('--stat-comfort', c.mauve);
		root.style.setProperty('--stat-energy', c.sky);
		root.style.setProperty('--stat-respect', c.peach);
		root.style.setProperty('--stat-affection', c.pink);

		// Tier colors
		root.style.setProperty('--tier-stranger', isDark ? c.overlayDark : c.overlay);
		root.style.setProperty('--tier-acquaintance', c.blue);
		root.style.setProperty('--tier-friend', c.green);
		root.style.setProperty('--tier-close-friend', c.teal);
		root.style.setProperty('--tier-best-friend', c.yellow);
		root.style.setProperty('--tier-soulmate', c.pink);
		root.style.setProperty('--tier-eternal-bond', c.mauve);

		// Semantic colors
		root.style.setProperty('--color-success', c.green);
		root.style.setProperty('--color-error', c.red);
		root.style.setProperty('--color-warning', c.yellow);
		root.style.setProperty('--color-info', c.blue);

		// Scene colors for 3D
		root.style.setProperty('--scene-bg', baseColor);
		root.style.setProperty('--scene-placeholder', c.mauve);
	}

	function hexToRgb(hex: string): string {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) return '0, 0, 0';
		return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
	}

	// Re-apply theme when dark mode changes
	function onDarkModeChange() {
		const theme = THEMES.find((t) => t.id === currentThemeId);
		if (theme) {
			applyTheme(theme);
		}
	}

	// Initialize on mount
	if (browser) {
		const theme = THEMES.find((t) => t.id === currentThemeId);
		if (theme) {
			applyTheme(theme);
		}

		// Watch for dark mode changes
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === 'class') {
					onDarkModeChange();
				}
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	}

	return {
		get currentThemeId() {
			return currentThemeId;
		},
		get currentTheme() {
			return THEMES.find((t) => t.id === currentThemeId) ?? THEMES[0];
		},
		get themes() {
			return THEMES;
		},
		setTheme
	};
}

export const themeStore = createThemeStore();
