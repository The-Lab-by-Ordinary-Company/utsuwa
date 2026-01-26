import type { ModuleDefinition } from '$lib/types/module';
import { consciousnessModule } from './essential/consciousness';
import { speechModule } from './essential/speech';

// Registry of all available modules
export const moduleRegistry: ModuleDefinition[] = [
	// Essential modules
	consciousnessModule,
	speechModule
];

// Helper to get module by ID
export function getModuleById(id: string): ModuleDefinition | undefined {
	return moduleRegistry.find((m) => m.metadata.id === id);
}

// Helper to get modules by category
export function getModulesByCategory(category: string): ModuleDefinition[] {
	return moduleRegistry.filter((m) => m.metadata.category === category);
}

// Get all unique categories
export function getCategories(): string[] {
	const categories = new Set(moduleRegistry.map((m) => m.metadata.category));
	return Array.from(categories);
}
