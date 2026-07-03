import { DEFAULT_LOCAL_BASE_URLS as DEFAULT_BASE_URLS } from './provider-defaults.ts';

const LOCAL_LLM_PROVIDERS = new Set(['ollama', 'lmstudio']);
const LOCAL_TTS_PROVIDERS = new Set(['local-tts']);

const OLLAMA_ORIGINS_DOC_URL =
	'https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama';

function trimTrailingSlashes(url: string): string {
	return url.replace(/\/+$/, '');
}

function stripOpenAIPath(url: string): string {
	return trimTrailingSlashes(url).replace(/\/v1$/, '');
}

function ensureOpenAIPath(url: string): string {
	const cleanUrl = trimTrailingSlashes(url);
	return cleanUrl.endsWith('/v1') ? cleanUrl : `${cleanUrl}/v1`;
}

export function isLocalLLMProvider(providerId: string): boolean {
	return LOCAL_LLM_PROVIDERS.has(providerId);
}

export function isLocalTTSProvider(providerId: string): boolean {
	return LOCAL_TTS_PROVIDERS.has(providerId);
}

// OpenAI-compatible TTS clients append "audio/speech" to the base URL, so the
// base must end with "/v1/". Local servers (Kokoro-FastAPI, openedai-speech)
// mount there, and users routinely paste the bare host or drop the slash.
export function getTTSBaseUrl(providerId: string, baseUrl?: string): string {
	const cleanUrl = trimTrailingSlashes(baseUrl || DEFAULT_BASE_URLS[providerId] || '');

	if (isLocalTTSProvider(providerId)) {
		return `${ensureOpenAIPath(cleanUrl)}/`;
	}

	return `${cleanUrl}/`;
}

export function getLocalTTSConnectionHint(baseUrl?: string, siteOrigin?: string): string {
	const ttsBaseUrl = getTTSBaseUrl('local-tts', baseUrl);
	const originHint = siteOrigin
		? ` If the server blocks this site (${siteOrigin}), enable CORS for that origin.`
		: ' If the server blocks this site, enable CORS for the app origin.';
	return `Could not reach a local TTS server at ${ttsBaseUrl}. Make sure it is running and exposes the OpenAI /v1/audio/speech endpoint (e.g. Kokoro-FastAPI or openedai-speech).${originHint}`;
}

export function getModelsBaseUrl(providerId: string, baseUrl?: string): string {
	const cleanUrl = trimTrailingSlashes(baseUrl || DEFAULT_BASE_URLS[providerId] || '');

	if (providerId === 'ollama') {
		return stripOpenAIPath(cleanUrl);
	}

	if (providerId === 'lmstudio') {
		return ensureOpenAIPath(cleanUrl);
	}

	return cleanUrl;
}

export function getChatBaseUrl(providerId: string, baseUrl?: string): string {
	const cleanUrl = trimTrailingSlashes(baseUrl || DEFAULT_BASE_URLS[providerId] || '');

	if (providerId === 'ollama' || providerId === 'lmstudio') {
		return ensureOpenAIPath(cleanUrl);
	}

	return cleanUrl;
}

export function getLocalProviderConnectionHint(
	providerId: string,
	baseUrl?: string,
	siteOrigin?: string
): string {
	const chatBaseUrl = getChatBaseUrl(providerId, baseUrl);

	if (providerId === 'ollama') {
		const originHint = siteOrigin
			? ` For this site, restart Ollama with OLLAMA_ORIGINS="${siteOrigin}" ollama serve.`
			: ` Set OLLAMA_ORIGINS to this site's origin before starting Ollama.`;
		return `Could not reach Ollama at ${chatBaseUrl}. Make sure Ollama is running with "ollama serve", the model is pulled with "ollama pull <model>", and browser users allow this site's origin with OLLAMA_ORIGINS.${originHint} More help: ${OLLAMA_ORIGINS_DOC_URL}`;
	}

	if (providerId === 'lmstudio') {
		return `Could not reach LM Studio at ${chatBaseUrl}. Open LM Studio, go to the Developer or Server tab, load a model, and click Start Server.`;
	}

	return `Could not reach local provider at ${chatBaseUrl}. Make sure the local server is running and reachable from this device.`;
}
