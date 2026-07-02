import type { LayoutLoad } from './$types';
import { getSortedPosts } from '$lib/utils/blog-posts';

// Feeds the recent-posts dropdown in the blog nav.
export const load: LayoutLoad = async () => {
	return { recentPosts: getSortedPosts().slice(0, 4) };
};
