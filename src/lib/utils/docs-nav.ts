import { docsNav, type DocsNavItem, type DocsNavSection } from '$lib/config/docs-nav';

export interface FlatNavItem extends DocsNavItem {
	section: string;
}

export interface BreadcrumbItem {
	title: string;
	href: string | null;
}

export function getFlatNav(): FlatNavItem[] {
	const items: FlatNavItem[] = [];
	for (const section of docsNav) {
		for (const item of section.items) {
			items.push({ ...item, section: section.title });
		}
	}
	return items;
}

export function getBreadcrumbs(slug: string): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ title: 'Docs', href: '/docs' }];

	for (const section of docsNav) {
		for (const item of section.items) {
			if (item.slug === slug) {
				items.push({ title: section.title, href: null });
				items.push({ title: item.title, href: `/docs/${item.slug}` });
				return items;
			}
		}
	}

	return items;
}

export function getPrevNext(slug: string): { prev: FlatNavItem | null; next: FlatNavItem | null } {
	const flat = getFlatNav();
	const index = flat.findIndex((item) => item.slug === slug);

	return {
		prev: index > 0 ? flat[index - 1] : null,
		next: index < flat.length - 1 ? flat[index + 1] : null
	};
}
