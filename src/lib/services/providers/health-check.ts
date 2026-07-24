import { getTTSBaseUrl, isLocalTTSProvider } from './local-endpoints.ts';

export type HealthStatus = 'unknown' | 'healthy' | 'unhealthy';

interface HealthEntry {
	status: HealthStatus;
	checkedAt: number;
}

const HEALTH_CHECK_TIMEOUT_MS = 5000;
const HEALTH_CACHE_TTL_MS = 10_000;

const healthState = new Map<string, HealthEntry>();
const listeners = new Set<() => void>();

function healthKey(providerId: string, baseUrl?: string): string {
	return `${providerId}|${baseUrl ?? ''}`;
}

function emit() {
	for (const listener of listeners) {
		listener();
	}
}

export function getTTSProviderHealth(providerId: string, baseUrl?: string): HealthStatus {
	const key = healthKey(providerId, baseUrl);
	const entry = healthState.get(key);
	if (!entry) return 'unknown';
	if (Date.now() - entry.checkedAt > HEALTH_CACHE_TTL_MS) return 'unknown';
	return entry.status;
}

function setTTSProviderHealth(providerId: string, baseUrl: string | undefined, status: HealthStatus) {
	const key = healthKey(providerId, baseUrl);
	healthState.set(key, { status, checkedAt: Date.now() });
	emit();
}

export function subscribeTTSProviderHealth(callback: () => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

function healthUrlForProvider(providerId: string, baseUrl: string): string | null {
	if (providerId === 'omnivoice') {
		const stripped = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
		return `${stripped}/health`;
	}

	if (providerId === 'local-tts') {
		return `${baseUrl}audio/voices`;
	}

	return null;
}

export async function checkTTSProviderHealth(
	providerId: string,
	baseUrl?: string
): Promise<HealthStatus> {
	const providerBaseUrl = getTTSBaseUrl(providerId, baseUrl);
	const healthUrl = healthUrlForProvider(providerId, providerBaseUrl);
	if (!healthUrl) {
		setTTSProviderHealth(providerId, baseUrl, 'unknown');
		return 'unknown';
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

	try {
		const response = await fetch(healthUrl, {
			method: 'GET',
			signal: controller.signal
		});
		const status = response.ok ? 'healthy' : 'unhealthy';
		setTTSProviderHealth(providerId, baseUrl, status);
		return status;
	} catch {
		setTTSProviderHealth(providerId, baseUrl, 'unhealthy');
		return 'unhealthy';
	} finally {
		clearTimeout(timeout);
	}
}
