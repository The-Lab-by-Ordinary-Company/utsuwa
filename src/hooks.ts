import type { Reroute } from '@sveltejs/kit';

// Subdomain → internal route prefix. On docs.utsuwa.ai a request for
// `/overview/introduction` is routed to `/docs/overview/introduction`, and
// app.utsuwa.ai/settings → /app/settings. This runs on both the server and
// during client-side navigation, so clean subdomain URLs resolve everywhere.
// "Prepend only if missing" keeps already-prefixed paths working as a safety net.
export const reroute: Reroute = ({ url }) => {
	const host = url.hostname;

	if (host.startsWith('docs.')) {
		if (!url.pathname.startsWith('/docs')) {
			return url.pathname === '/' ? '/docs' : `/docs${url.pathname}`;
		}
	} else if (host.startsWith('app.')) {
		if (!url.pathname.startsWith('/app')) {
			return url.pathname === '/' ? '/app' : `/app${url.pathname}`;
		}
	}

	// Main domain / localhost: leave the path untouched.
};
