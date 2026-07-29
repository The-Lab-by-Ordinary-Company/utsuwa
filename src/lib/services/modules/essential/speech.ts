import type { ModuleDefinition } from '$lib/types/module';

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
				key: 'activeLanguage',
				type: 'text',
				label: 'Language',
				description: 'Primary language for multilingual TTS (ISO 639-1)',
				placeholder: 'en',
				defaultValue: 'en'
			},
			{
				key: 'speed',
				type: 'number',
				label: 'Speed',
				description: 'Speech rate (0.5-2.0)',
				defaultValue: 1.0
			},
			{
				key: 'instructions',
				type: 'text',
				label: 'Voice Instructions',
				description: 'Natural-language description of the synthetic voice',
				placeholder: 'female, young adult, moderate pitch, american accent'
			},
			{
				key: 'gender',
				type: 'text',
				label: 'Voice Gender',
				description: 'Gender used for synthetic voice design',
				defaultValue: 'female'
			},
			{
				key: 'age',
				type: 'text',
				label: 'Voice Age',
				description: 'Age group used for synthetic voice design',
				defaultValue: 'young adult'
			},
			{
				key: 'pitch',
				type: 'text',
				label: 'Voice Pitch',
				description: 'Pitch used for synthetic voice design',
				defaultValue: 'moderate'
			},
			{
				key: 'accent',
				type: 'text',
				label: 'Voice Accent',
				description: 'Accent used for synthetic voice design',
				defaultValue: 'american'
			},
			{
				key: 'numStep',
				type: 'number',
				label: 'Num Steps',
				description: 'OmniVoice quality steps (4-64)',
				defaultValue: 32
			},
			{
				key: 'positionTemperature',
				type: 'number',
				label: 'Position Temperature',
				description: 'OmniVoice position temperature (0-2)',
				defaultValue: 1.0
			},
			{
				key: 'classTemperature',
				type: 'number',
				label: 'Class Temperature',
				description: 'OmniVoice class temperature (0-2)',
				defaultValue: 0.2
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
