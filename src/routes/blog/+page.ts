import type { PageLoad } from './$types';
import { getSortedPosts } from '$lib/utils/blog-posts';

export const prerender = true;

export const load: PageLoad = async () => {
	return { posts: getSortedPosts() };
};
