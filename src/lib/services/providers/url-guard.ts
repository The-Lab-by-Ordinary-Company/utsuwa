// Server-side SSRF guard for provider requests. The web deployment proxies
// model-list and chat requests to a client-supplied base URL; without this,
// anyone could point it at internal addresses (cloud metadata, localhost
// services, private ranges). The desktop build talks to providers directly and
// never hits these routes, so this only gates the hosted web path.

// Literal IPv4/IPv6 hosts and hostnames that must not be reachable through the
// proxy. Covers loopback, private ranges, link-local (incl. 169.254.169.254
// cloud metadata), and unspecified addresses.
export function isPrivateHost(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets

	if (host === 'localhost' || host.endsWith('.localhost')) return true;
	if (host === '' || host === '0.0.0.0' || host === '::' || host === '::1') return true;

	// IPv6 loopback/link-local/unique-local
	if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
	// IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1) — fall through to the IPv4 check
	const mapped = host.startsWith('::ffff:') ? host.slice(7) : host;

	const v4 = mapped.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		if (a === 127) return true; // loopback
		if (a === 10) return true; // private
		if (a === 172 && b >= 16 && b <= 31) return true; // private
		if (a === 192 && b === 168) return true; // private
		if (a === 169 && b === 254) return true; // link-local + metadata
		if (a === 0) return true; // "this" network
	}

	return false;
}

// Validate a resolved provider base URL before the server fetches it. Returns the
// parsed URL, or throws if it uses a non-HTTP scheme or targets a private host.
// Set allowPrivate (self-hosters running local models behind the web server) to
// permit loopback/private targets.
export function assertSafeProviderUrl(rawUrl: string, allowPrivate = false): URL {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw new Error('Invalid provider URL');
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('Provider URL must use http or https');
	}

	if (!allowPrivate && isPrivateHost(url.hostname)) {
		throw new Error('Provider URL host is not allowed');
	}

	return url;
}
