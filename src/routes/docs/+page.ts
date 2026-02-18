import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
	redirect(301, '/docs/overview/introduction');
};
