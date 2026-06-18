import type { PageLoad } from './$types';
import { docsNav } from '$lib/config/docs-nav';

// Pull frontmatter from every doc so the index can show real descriptions.
const modules = import.meta.glob('/src/content/docs/**/*.md', { eager: true });

export const prerender = true;

export const load: PageLoad = () => {
	const meta: Record<string, { title?: string; description?: string }> = {};
	for (const [path, mod] of Object.entries(modules)) {
		const slug = path.replace('/src/content/docs/', '').replace('.md', '');
		meta[slug] =
			((mod as { metadata?: { title?: string; description?: string } }).metadata) ?? {};
	}

	const sections = docsNav.map((section) => ({
		title: section.title,
		icon: section.icon,
		items: section.items.map((item) => ({
			title: item.title,
			slug: item.slug,
			description: meta[item.slug]?.description ?? ''
		}))
	}));

	return { sections };
};
