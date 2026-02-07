import type { ModuleDefinition } from '$lib/types/module';
import { LLM_PROVIDERS } from '$lib/services/providers/registry';

// Get model options for a provider
function getModelsForProvider(providerId: string): { value: string; label: string }[] {
	const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
	if (!provider?.models) return [];
	return provider.models.map((m) => ({ value: m.id, label: m.name }));
}

export const consciousnessModule: ModuleDefinition = {
	metadata: {
		id: 'consciousness',
		name: 'Consciousness',
		description: 'Large Language Model for AI responses and reasoning',
		category: 'essential',
		icon: 'brain'
	},

	settingsSchema: {
		fields: [
			{
				key: 'activeProvider',
				type: 'provider-select',
				label: 'LLM Provider',
				description: 'Select from your configured LLM providers',
				providerCategory: 'llm',
				defaultValue: ''
			},
			{
				key: 'activeModel',
				type: 'model-select',
				label: 'Model',
				description: 'Select a model from the chosen provider',
				dependsOnField: 'activeProvider',
				providerCategory: 'llm'
			},
			{
				key: 'temperature',
				type: 'number',
				label: 'Temperature',
				description: 'Controls randomness in responses (0.0-2.0)',
				defaultValue: 0.7
			},
			{
				key: 'maxTokens',
				type: 'number',
				label: 'Max Tokens',
				description: 'Maximum tokens in response',
				defaultValue: 2048
			}
		]
	},

	isConfigured(settings: Record<string, unknown>): boolean {
		// Consciousness is configured if a provider is selected
		return !!settings.activeProvider && !!settings.activeModel;
	},

	async onEnable() {
	},

	async onDisable() {
	},

	onSettingsChange(settings: Record<string, unknown>) {
	}
};
