import type { PageLoad } from './$types';

// Not prerendered: the subdomains (docs/app) rewrite their root to /docs and
// /app, and a static "/" would otherwise win on every host and show the
// landing page there. SSR keeps "/" host-aware via the reroute hook.
export const prerender = false;

const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });

export const load: PageLoad = async () => {
	function normalizeDate(raw: unknown): string {
		if (raw instanceof Date) return raw.toISOString().split('T')[0];
		return String(raw);
	}

	const posts = Object.entries(modules)
		.map(([path, mod]: [string, any]) => ({
			title: mod.metadata.title as string,
			description: mod.metadata.description as string,
			date: normalizeDate(mod.metadata.date),
			image: (mod.metadata.image as string) || '/blog/blog-thumbnail.png',
			slug: path.replace('/src/content/blog/', '').replace('.md', '')
		}))
		.filter((post) => post.date)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	return { posts };
};
