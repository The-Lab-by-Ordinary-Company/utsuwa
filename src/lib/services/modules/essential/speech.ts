import type { ModuleDefinition } from '$lib/types/module';
import { TTS_PROVIDERS } from '$lib/services/providers/registry';

// Get voice options for a provider
function getVoicesForProvider(providerId: string): { value: string; label: string }[] {
	const provider = TTS_PROVIDERS.find((p) => p.id === providerId);
	if (!provider?.voices) return [];
	return provider.voices.map((v) => ({ value: v.id, label: v.name }));
}

export const speechModule: ModuleDefinition = {
	metadata: {
		id: 'speech',
		name: 'Speech',
		description: 'Text-to-Speech for voice output',
		category: 'essential',
		icon: 'volume'
	},

	settingsSchema: {
		fields: [
			{
				key: 'activeProvider',
				type: 'provider-select',
				label: 'TTS Provider',
				description: 'Select from your configured TTS providers',
				providerCategory: 'tts',
				defaultValue: ''
			},
			{
				key: 'activeModel',
				type: 'model-select',
				label: 'Model',
				description: 'Select a TTS model from the chosen provider',
				dependsOnField: 'activeProvider',
				providerCategory: 'tts'
			},
			{
				key: 'activeVoiceId',
				type: 'text',
				label: 'Voice ID',
				description: 'Voice identifier for the selected provider',
				placeholder: 'Select a voice'
			},
			{
				key: 'speed',
				type: 'number',
				label: 'Speed',
				description: 'Speech rate (0.5-2.0)',
				defaultValue: 1.0
			}
		]
	},

	isConfigured(settings: Record<string, unknown>): boolean {
		// Speech is configured if a provider is selected
		// Some providers (like browser TTS) don't require voice ID
		return !!settings.activeProvider;
	},

	async onEnable() {
	},

	async onDisable() {
	},

	onSettingsChange(settings: Record<string, unknown>) {
	}
};
