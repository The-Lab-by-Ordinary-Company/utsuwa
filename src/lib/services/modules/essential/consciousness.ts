import type { ModuleDefinition } from '$lib/types/module';

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
			},
			{
				key: 'nsfwMode',
				type: 'boolean',
				label: 'Unfiltered Mode (NSFW)',
				description: 'Injects a preamble instructing the LLM to write uncensored, immersive prose without moralizing or content filtering. Use only with local or uncensored models.',
				defaultValue: false
			},
			{
				key: 'contextSize',
				type: 'number',
				label: 'Context Size',
				description: 'Maximum context size of the model in tokens',
				defaultValue: 32768
			},
			{
				key: 'topP',
				type: 'number',
				label: 'Top P',
				description: 'Nucleus sampling threshold (0.0-1.0)',
				defaultValue: 1.0
			},
			{
				key: 'presencePenalty',
				type: 'number',
				label: 'Presence Penalty',
				description: 'Penalizes tokens that have already appeared (-2.0 to 2.0)',
				defaultValue: 0
			},
			{
				key: 'frequencyPenalty',
				type: 'number',
				label: 'Frequency Penalty',
				description: 'Penalizes tokens based on how often they appeared (-2.0 to 2.0)',
				defaultValue: 0
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
