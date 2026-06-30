// Can she actually see what you show her? Vision support is two-layered:
// cloud providers carry a coarse `supportsVision` flag (see providerSupportsVision
// in registry.ts), while local providers (Ollama/LM Studio) depend on the
// installed model, so we sniff the model id here. Kept import-free so it stays
// unit-testable on its own.

/** Substrings that strongly imply a model can accept images. Lowercased. */
const VISION_MODEL_HINTS = [
	'vision',
	'-vl',
	'vl-',
	'llava',
	'bakllava',
	'moondream',
	'minicpm-v',
	'llama3.2-vision',
	'llama-3.2-vision',
	'qwen2-vl',
	'qwen2.5-vl',
	'gemma3',
	'pixtral',
	'internvl',
	'gpt-4o',
	'gpt-4.1',
	'gpt-4-turbo',
	'gpt-4-vision',
	'claude-3',
	'claude-4',
	'gemini'
];

export function modelSupportsVision(modelId: string | undefined | null): boolean {
	if (!modelId) return false;
	const m = modelId.toLowerCase();
	return VISION_MODEL_HINTS.some((hint) => m.includes(hint));
}

/**
 * The gate the UI uses to decide whether "showing her something" is available
 * right now: true if the provider is broadly vision-capable, or the selected
 * model looks vision-capable (covers local llava/vision models). Pass the
 * provider flag from `providerSupportsVision(providerId)` in registry.ts.
 */
export function canShowImages(providerHasVision: boolean, modelId?: string | null): boolean {
	return providerHasVision || modelSupportsVision(modelId);
}
