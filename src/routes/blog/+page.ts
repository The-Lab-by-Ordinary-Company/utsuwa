import type { PageLoad } from './$types';

export const prerender = true;

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
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { posts };
};
