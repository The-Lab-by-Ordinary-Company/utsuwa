import { db, type DBCharacterState } from '$lib/db';
import { createDefaultCharacterState, type CharacterState } from '$lib/types/character';

/**
 * Get the single character state from IndexedDB.
 * Returns the first (and only) record, or creates a default if none exists.
 */
export async function getCharacterState(): Promise<CharacterState> {
	const state = await db.characterStates.toCollection().first();

	if (state) {
		return deserializeCharacterState(state);
	}

	// Return default state (not saved until explicitly saved)
	return createDefaultCharacterState() as CharacterState;
}

/**
 * Save the character state to IndexedDB.
 * Clears existing records and saves the new state (single record model).
 */
export async function saveCharacterState(state: CharacterState): Promise<number> {
	const serialized = serializeCharacterState(state);

	// Check if a record exists
	const existing = await db.characterStates.toCollection().first();

	if (existing && existing.id !== undefined) {
		// Update existing record
		await db.characterStates.put({ ...serialized, id: existing.id });
		return existing.id;
	}

	// Create new record
	const id = await db.characterStates.add(serialized);
	return id as number;
}

/**
 * Delete all character state data (used for reset).
 */
export async function deleteCharacterState(): Promise<void> {
	await db.characterStates.clear();
}

// Serialize dates for storage
function serializeCharacterState(state: CharacterState): Omit<DBCharacterState, 'id'> {
	return {
		...state,
		lastInteraction: state.lastInteraction ? new Date(state.lastInteraction) : null,
		firstMet: new Date(state.firstMet),
		createdAt: new Date(state.createdAt),
		updatedAt: new Date()
	};
}

// Deserialize dates from storage
function deserializeCharacterState(state: DBCharacterState): CharacterState {
	return {
		...state,
		lastInteraction: state.lastInteraction ? new Date(state.lastInteraction) : null,
		firstMet: new Date(state.firstMet),
		createdAt: new Date(state.createdAt),
		updatedAt: new Date(state.updatedAt)
	} as CharacterState;
}
