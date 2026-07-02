import type { PageLoad } from './$types';

export const prerender = true;

const REPO = 'The-Lab-by-Ordinary-Company/utsuwa';

// Resolve the latest release's real asset URLs at build time so the download
// buttons point straight at the files instead of fetching from the browser.
export const load: PageLoad = async ({ fetch }): Promise<{ assets: Record<string, string> }> => {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
		if (!res.ok) return { assets: {} };
		const rel = await res.json();
		if (!rel?.assets) return { assets: {} };

		const url = (re: RegExp): string =>
			rel.assets.find(
				(a: { name: string }) => re.test(a.name) && !a.name.endsWith('.sig')
			)?.browser_download_url ?? '';

		return {
			assets: {
				macOS: url(/\.dmg$/i),
				Windows: url(/\.exe$/i),
				Linux: url(/\.AppImage$/i)
			}
		};
	} catch {
		return { assets: {} };
	}
};
