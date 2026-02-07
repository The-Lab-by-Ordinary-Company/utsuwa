import {
	type CharacterState,
	type MoodState,
	type StateUpdates,
	type RelationshipStage,
	type PersonaExtensions,
	type AppMode,
	createDefaultCharacterState,
	RELATIONSHIP_STAGE_INFO,
	MOOD_INFO
} from '$lib/types/character';
import { browser } from '$app/environment';
import {
	getCharacterState,
	saveCharacterState,
	deleteCharacterState
} from '$lib/services/storage/character';
import { statChangesStore } from './statChanges.svelte';
import { applyTimeDecay } from '$lib/engine/state-updates';
import { calculateStage } from '$lib/engine/stages';

// Single character state
let state = $state<CharacterState>(createDefaultCharacterState() as CharacterState);

// Loading state
let isLoading = $state(true);
let isReady = $state(false);
let error = $state<string | null>(null);

// Debounce save timeout
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Create the store object
function createCharacterStore() {
	// Derived mood info
	const moodInfo = $derived.by(() => {
		const mood = state?.mood;
		if (!mood) return MOOD_INFO.neutral;
		return MOOD_INFO[mood.primary] ?? MOOD_INFO.neutral;
	});

	// Derived stage info
	const stageInfo = $derived.by(() => {
		const stage = state?.relationshipStage;
		if (!stage) return RELATIONSHIP_STAGE_INFO.stranger;
		return RELATIONSHIP_STAGE_INFO[stage] ?? RELATIONSHIP_STAGE_INFO.stranger;
	});

	// Affection as percentage (0-100)
	const affectionPercent = $derived.by(() => {
		return Math.min(100, Math.floor((state?.affection ?? 0) / 10));
	});

	// Overall "health" score (weighted average of stats)
	const overallHealth = $derived.by(() => {
		if (!state) return 50;
		const energy = state.energy;
		const trust = state.trust;
		const comfort = state.comfort;
		return Math.round(energy * 0.3 + trust * 0.35 + comfort * 0.35);
	});

	// Load state from IndexedDB
	async function loadState(): Promise<void> {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			const loaded = await getCharacterState();
			state = loaded;

			// Apply time-based recovery/decay based on time since last interaction
			if (state.lastInteraction) {
				const hoursSince =
					(Date.now() - new Date(state.lastInteraction).getTime()) / (1000 * 60 * 60);
				if (hoursSince > 0.5) {
					// Only apply if at least 30 minutes have passed
					const timeUpdates = applyTimeDecay(state, hoursSince);
					if (Object.keys(timeUpdates).length > 0) {
						// Apply updates directly without emitting visual indicators (silent recovery)
						if (timeUpdates.energyDelta !== undefined) {
							state = {
								...state,
								energy: Math.max(0, Math.min(100, state.energy + timeUpdates.energyDelta))
							};
						}
						if (timeUpdates.affectionDelta !== undefined) {
							state = {
								...state,
								affection: Math.max(0, Math.min(1000, state.affection + timeUpdates.affectionDelta))
							};
						}
						if (timeUpdates.trustDelta !== undefined) {
							state = {
								...state,
								trust: Math.max(0, Math.min(100, state.trust + timeUpdates.trustDelta))
							};
						}
						if (timeUpdates.moodChange) {
							state = {
								...state,
								mood: {
									...state.mood,
									primary: timeUpdates.moodChange.emotion,
									intensity: Math.max(
										0,
										Math.min(100, state.mood.intensity + (timeUpdates.moodChange.intensityDelta ?? 0))
									),
									causes: timeUpdates.moodChange.cause
										? [...state.mood.causes.slice(-4), timeUpdates.moodChange.cause]
										: state.mood.causes
								}
							};
						}
						// Save the recovered state (use $state.snapshot to strip Proxy)
						const plainState = $state.snapshot(state);
						await saveCharacterState({ ...plainState, updatedAt: new Date() });
					}
				}
			}

			isReady = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load state';
			console.error('Failed to load character state:', e);
		} finally {
			isLoading = false;
		}
	}

	// Save state to IndexedDB (debounced)
	async function save(immediate = false): Promise<void> {
		if (!browser) return;

		// Clear existing timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		const doSave = async () => {
			try {
				// Use $state.snapshot() to strip Proxy for IndexedDB
				const plainState = $state.snapshot(state);
				await saveCharacterState({
					...plainState,
					updatedAt: new Date()
				});
			} catch (e) {
				console.error('Failed to save character state:', e);
			}
		};

		if (immediate) {
			await doSave();
		} else {
			// Debounce by 1 second
			saveTimeout = setTimeout(doSave, 1000);
		}
	}

	// Update persona fields (name, systemPrompt, extensions)
	function updatePersona(updates: {
		name?: string;
		systemPrompt?: string;
		extensions?: PersonaExtensions;
	}): void {
		state = {
			...state,
			...(updates.name !== undefined && { name: updates.name }),
			...(updates.systemPrompt !== undefined && { systemPrompt: updates.systemPrompt }),
			...(updates.extensions !== undefined && { extensions: updates.extensions }),
			updatedAt: new Date()
		};
		save();
	}

	// Apply state updates
	function applyUpdates(updates: StateUpdates): void {
		const newState = { ...state };
		const isCompanionMode = state.appMode === 'companion';

		// Apply mood change (always applies in both modes)
		if (updates.moodChange) {
			newState.mood = {
				...newState.mood,
				primary: updates.moodChange.emotion,
				intensity: Math.max(
					0,
					Math.min(100, newState.mood.intensity + (updates.moodChange.intensityDelta ?? 0))
				)
			};
			if (updates.moodChange.cause) {
				newState.mood.causes = [...newState.mood.causes.slice(-4), updates.moodChange.cause];
			}
		}

		// Apply energy (always applies in both modes)
		if (updates.energyDelta !== undefined && updates.energyDelta !== 0) {
			newState.energy = Math.max(0, Math.min(100, newState.energy + updates.energyDelta));
			statChangesStore.emit('energy', updates.energyDelta);
		}

		// Only apply relationship stats in Dating Sim Mode
		if (!isCompanionMode) {
			if (updates.affectionDelta !== undefined && updates.affectionDelta !== 0) {
				newState.affection = Math.max(0, Math.min(1000, newState.affection + updates.affectionDelta));
				statChangesStore.emit('affection', updates.affectionDelta);
			}
			if (updates.trustDelta !== undefined && updates.trustDelta !== 0) {
				newState.trust = Math.max(0, Math.min(100, newState.trust + updates.trustDelta));
				statChangesStore.emit('trust', updates.trustDelta);
			}
			if (updates.intimacyDelta !== undefined && updates.intimacyDelta !== 0) {
				newState.intimacy = Math.max(0, Math.min(100, newState.intimacy + updates.intimacyDelta));
				statChangesStore.emit('intimacy', updates.intimacyDelta);
			}
			if (updates.comfortDelta !== undefined && updates.comfortDelta !== 0) {
				newState.comfort = Math.max(0, Math.min(100, newState.comfort + updates.comfortDelta));
				statChangesStore.emit('comfort', updates.comfortDelta);
			}
			if (updates.respectDelta !== undefined && updates.respectDelta !== 0) {
				newState.respect = Math.max(0, Math.min(100, newState.respect + updates.respectDelta));
				statChangesStore.emit('respect', updates.respectDelta);
			}
		}

		// Update timestamp and interaction count
		newState.lastInteraction = new Date();
		newState.totalInteractions++;
		newState.updatedAt = new Date();

		// Update state with reactive assignment
		state = newState;

		// Save to IndexedDB (debounced)
		save();
	}

	// Set mood directly
	function setMood(mood: MoodState): void {
		state = {
			...state,
			mood,
			updatedAt: new Date()
		};
		save();
	}

	// Set relationship stage
	function setRelationshipStage(stage: RelationshipStage): void {
		state = {
			...state,
			relationshipStage: stage,
			updatedAt: new Date()
		};
		save();
	}

	// Set app mode (companion vs dating_sim)
	function setAppMode(mode: AppMode): void {
		const previousMode = state.appMode;
		const previousStage = state.relationshipStage;

		if (mode === 'companion') {
			// Save current dating sim stage before switching, then lock to companion stage
			state = {
				...state,
				appMode: mode,
				savedDatingSimStage: previousStage !== 'companion' ? previousStage : state.savedDatingSimStage,
				relationshipStage: 'companion',
				updatedAt: new Date()
			};
		} else {
			// Restore to dating sim - calculate stage from current stats
			const calculatedStage = calculateStage(state, state.completedEvents || []);
			state = {
				...state,
				appMode: mode,
				relationshipStage: calculatedStage,
				updatedAt: new Date()
			};
		}

		save();
	}

	// Mark event as completed
	function markEventCompleted(eventId: string): void {
		if (!state.completedEvents.includes(eventId)) {
			state = {
				...state,
				completedEvents: [...state.completedEvents, eventId],
				updatedAt: new Date()
			};
			save();
		}
	}

	// Check if event is completed
	function hasCompletedEvent(eventId: string): boolean {
		return state?.completedEvents.includes(eventId) ?? false;
	}

	// Update streak (call on session start)
	function updateStreak(): void {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

		let newStreak = state.currentStreak;
		let newLongest = state.longestStreak;

		if (state.streakLastDate === today) {
			// Already visited today, no change
		} else if (state.streakLastDate === yesterday) {
			// Consecutive day
			newStreak++;
			newLongest = Math.max(newLongest, newStreak);
		} else {
			// Streak broken
			newStreak = 1;
		}

		state = {
			...state,
			currentStreak: newStreak,
			longestStreak: newLongest,
			streakLastDate: today,
			updatedAt: new Date()
		};
		save();
	}

	// Calculate days known
	function updateDaysKnown(): void {
		const firstMet = state.firstMet;
		const now = new Date();
		const daysKnown = Math.floor((now.getTime() - firstMet.getTime()) / (1000 * 60 * 60 * 24));

		if (daysKnown !== state.daysKnown) {
			state = {
				...state,
				daysKnown,
				updatedAt: new Date()
			};
			save();
		}
	}

	// Mark onboarding as complete (prevents re-showing on refresh)
	function markOnboardingComplete(): void {
		state = {
			...state,
			lastInteraction: new Date(),
			updatedAt: new Date()
		};
		save();
	}

	// Reset state (delete and recreate)
	async function resetState(): Promise<void> {
		if (!browser) return;

		try {
			await deleteCharacterState();
			state = createDefaultCharacterState() as CharacterState;
			await save(true);
		} catch (e) {
			console.error('Failed to reset character state:', e);
		}
	}

	// Initialize on browser
	if (browser) {
		loadState();

		// Flush pending saves before the page unloads to prevent data loss.
		// IndexedDB transactions started in beforeunload typically complete before teardown.
		window.addEventListener('beforeunload', () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
				const plainState = $state.snapshot(state);
				saveCharacterState({ ...plainState, updatedAt: new Date() });
			}
		});
	}

	return {
		// Getters
		get state() {
			return state;
		},
		get isLoading() {
			return isLoading;
		},
		get isReady() {
			return isReady;
		},
		get error() {
			return error;
		},
		get moodInfo() {
			return moodInfo;
		},
		get stageInfo() {
			return stageInfo;
		},
		get affectionPercent() {
			return affectionPercent;
		},
		get overallHealth() {
			return overallHealth;
		},
		get appMode() {
			return state.appMode;
		},

		// Persona accessors (convenience)
		get name() {
			return state.name;
		},
		get systemPrompt() {
			return state.systemPrompt;
		},
		get extensions() {
			return state.extensions;
		},

		// Actions
		loadState,
		save,
		updatePersona,
		applyUpdates,
		setMood,
		setRelationshipStage,
		setAppMode,
		markEventCompleted,
		hasCompletedEvent,
		updateStreak,
		updateDaysKnown,
		markOnboardingComplete,
		resetState
	};
}

// Export singleton store
export const characterStore = createCharacterStore();
