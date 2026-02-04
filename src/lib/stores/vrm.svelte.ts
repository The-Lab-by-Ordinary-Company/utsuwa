import { browser } from '$app/environment';
import type { VRM } from '@pixiv/three-vrm';
import localforage from 'localforage';

export interface VrmModel {
	id: string;
	name: string;
	url: string;
	previewUrl?: string;
	isDefault: boolean;
	createdAt: number;
}

// Default models bundled with the app (first one is loaded by default)
const DEFAULT_MODELS: VrmModel[] = [
	{
		id: 'default-utsuwa',
		name: 'Utsuwa',
		url: '/models/utsuwa.vrm',
		previewUrl: undefined,
		isDefault: true,
		createdAt: 0
	}
];

// Configure localforage for VRM storage
const vrmStorage = browser
	? localforage.createInstance({
			name: 'utsuwa-vrm',
			storeName: 'models'
		})
	: null;

function createVrmStore() {
	// Current model state - set default synchronously
	let modelUrl = $state<string | null>(DEFAULT_MODELS[0].url);
	let vrm = $state<VRM | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;

	// Gallery state
	let models = $state<VrmModel[]>([...DEFAULT_MODELS]);
	let activeModelId = $state<string | null>(DEFAULT_MODELS[0].id);

	// Available expressions on current model (persists across navigation)
	let availableExpressions = $state<string[]>([]);

	// Animation state
	let currentAnimation = $state<string | null>(null);

	// Talking animation state (triggered by text output)
	let isTalking = $state(false);
	let talkingTimeout: ReturnType<typeof setTimeout> | null = null;

	// Head position for 3D speech bubble positioning
	let headPosition = $state<[number, number, number]>([0, 1.6, 0]);
	// Screen-space position (x, y as percentages 0-100)
	let headScreenPosition = $state<{ x: number; y: number } | null>(null);
	// Default animations
	const idleAnimationUrl = '/animations/idle.vrma';
	const talkingAnimationUrl = '/animations/talking.vrma';

	// All idle animations for random cycling
	const idleAnimationUrls = [
		'/animations/idle.vrma',
		'/animations/idle_2.vrma',
		'/animations/idle_3.vrma',
		'/animations/idle_4.vrma',
		'/animations/idle_5.vrma'
	];

	// Emote animations (disabled for now - will be re-enabled later)
	const availableAnimations: { id: string; name: string; url: string }[] = [];

	// Initialize from storage (may override defaults with saved values)
	if (browser) {
		initFromStorage();
	}

	async function initFromStorage() {
		try {
			// Load saved models list
			const savedModels = await vrmStorage?.getItem<VrmModel[]>('model-list');
			if (savedModels) {
				// Merge defaults with saved custom models
				const customModels = savedModels.filter((m) => !m.isDefault);
				models = [...DEFAULT_MODELS, ...customModels];
			}

			// Load saved previews for all models
			for (let i = 0; i < models.length; i++) {
				const savedPreview = await vrmStorage?.getItem<string>(`model-preview-${models[i].id}`);
				if (savedPreview) {
					models[i] = { ...models[i], previewUrl: savedPreview };
				}
			}
			// Trigger reactivity after loading all previews
			models = [...models];

			// Load active model ID
			const savedActiveId = await vrmStorage?.getItem<string>('active-model-id');
			if (savedActiveId) {
				const activeModel = models.find((m) => m.id === savedActiveId);
				if (activeModel) {
					activeModelId = savedActiveId;
					modelUrl = activeModel.url;
				} else {
					// Saved model not found, fall back to default
					activeModelId = DEFAULT_MODELS[0].id;
					modelUrl = DEFAULT_MODELS[0].url;
					// Clear stale saved ID from storage
					await vrmStorage?.removeItem('active-model-id');
				}
			} else {
				// Default to first model
				activeModelId = DEFAULT_MODELS[0].id;
				modelUrl = DEFAULT_MODELS[0].url;
			}
		} catch (e) {
			console.error('Failed to load VRM storage:', e);
			// Fallback to default
			activeModelId = DEFAULT_MODELS[0].id;
			modelUrl = DEFAULT_MODELS[0].url;
		}
	}

	async function saveToStorage() {
		if (!vrmStorage) return;
		try {
			// Save custom models (not defaults)
			const customModels = models.filter((m) => !m.isDefault);
			await vrmStorage.setItem('model-list', customModels);
			await vrmStorage.setItem('active-model-id', activeModelId);
		} catch (e) {
			console.error('Failed to save VRM storage:', e);
		}
	}

	function setModelUrl(url: string | null) {
		modelUrl = url;
		error = null;
	}

	function setVrm(instance: VRM | null) {
		vrm = instance;
		// Store available expressions when VRM is set
		if (instance?.expressionManager) {
			availableExpressions = instance.expressionManager.expressions.map((e) => e.expressionName);
		}
	}

	function setLoading(loading: boolean) {
		isLoading = loading;
	}

	function setError(err: string | null) {
		// Clear any existing timeout
		if (errorTimeout) {
			clearTimeout(errorTimeout);
			errorTimeout = null;
		}
		error = err;
		isLoading = false;
		// Auto-dismiss after 5 seconds if error is set
		if (err) {
			errorTimeout = setTimeout(() => {
				error = null;
				errorTimeout = null;
			}, 5000);
		}
	}

	function setActiveModel(id: string) {
		const model = models.find((m) => m.id === id);
		if (model) {
			activeModelId = id;
			modelUrl = model.url;
			saveToStorage();
		}
	}

	function setHeadPosition(pos: [number, number, number]) {
		headPosition = pos;
	}

	function setHeadScreenPosition(pos: { x: number; y: number } | null) {
		headScreenPosition = pos;
	}

	function setCurrentAnimation(animationIdOrPath: string | null) {
		// Accept either an animation ID or a direct path
		// If it's a path (starts with /), use it directly
		// Otherwise, look up the animation by ID
		if (animationIdOrPath === null || animationIdOrPath === 'none') {
			currentAnimation = null;
		} else if (animationIdOrPath.startsWith('/')) {
			// Direct path - use as-is
			currentAnimation = animationIdOrPath;
		} else {
			// Look up by ID in availableAnimations
			const anim = availableAnimations.find((a) => a.id === animationIdOrPath);
			currentAnimation = anim?.url || null;
		}
	}

	// Start talking animation based on text length
	// Estimates ~15 characters per second of speaking
	function startTalking(text: string) {
		// Clear any existing timeout
		if (talkingTimeout) {
			clearTimeout(talkingTimeout);
		}

		// Calculate duration: ~15 chars/sec, minimum 1 second
		const charsPerSecond = 15;
		const duration = Math.max(1, text.length / charsPerSecond) * 1000;

		isTalking = true;

		// Auto-stop after estimated duration
		talkingTimeout = setTimeout(() => {
			isTalking = false;
			talkingTimeout = null;
		}, duration);
	}

	// Stop talking animation immediately
	function stopTalking() {
		if (talkingTimeout) {
			clearTimeout(talkingTimeout);
			talkingTimeout = null;
		}
		isTalking = false;
	}

	async function addModel(file: File, previewDataUrl?: string): Promise<void> {
		const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		const name = file.name.replace(/\.vrm$/i, '');

		// Store the file blob
		const blob = new Blob([await file.arrayBuffer()], { type: 'model/vrm' });
		await vrmStorage?.setItem(`model-blob-${id}`, blob);

		// Create blob URL for immediate use
		const url = URL.createObjectURL(blob);

		const newModel: VrmModel = {
			id,
			name,
			url,
			previewUrl: previewDataUrl,
			isDefault: false,
			createdAt: Date.now()
		};

		models = [...models, newModel];
		await saveToStorage();

		// Store preview if provided
		if (previewDataUrl) {
			await vrmStorage?.setItem(`model-preview-${id}`, previewDataUrl);
		}
	}

	async function removeModel(id: string): Promise<void> {
		const model = models.find((m) => m.id === id);
		if (!model || model.isDefault) return;

		// Remove from storage
		await vrmStorage?.removeItem(`model-blob-${id}`);
		await vrmStorage?.removeItem(`model-preview-${id}`);

		// Remove from list
		models = models.filter((m) => m.id !== id);

		// If this was the active model, switch to default
		if (activeModelId === id) {
			setActiveModel(DEFAULT_MODELS[0].id);
		}

		await saveToStorage();
	}

	async function loadModelBlob(id: string): Promise<string | null> {
		const model = models.find((m) => m.id === id);
		if (!model) return null;

		// Default models use static URLs
		if (model.isDefault) {
			return model.url;
		}

		// Custom models need to load blob from storage
		try {
			const blob = await vrmStorage?.getItem<Blob>(`model-blob-${id}`);
			if (blob) {
				return URL.createObjectURL(blob);
			}
		} catch (e) {
			console.error('Failed to load model blob:', e);
		}
		return null;
	}

	function getActiveModel(): VrmModel | null {
		return models.find((m) => m.id === activeModelId) || null;
	}

	async function setModelPreview(modelId: string | null, previewDataUrl: string): Promise<void> {
		if (!modelId) return;

		// Update in models array
		const modelIndex = models.findIndex((m) => m.id === modelId);
		if (modelIndex !== -1) {
			models[modelIndex] = { ...models[modelIndex], previewUrl: previewDataUrl };
			// Trigger reactivity
			models = [...models];
		}

		// Save to storage for all models (including defaults) so thumbnails persist
		await vrmStorage?.setItem(`model-preview-${modelId}`, previewDataUrl);
	}

	return {
		get modelUrl() {
			return modelUrl;
		},
		get vrm() {
			return vrm;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get models() {
			return models;
		},
		get activeModelId() {
			return activeModelId;
		},
		get availableExpressions() {
			return availableExpressions;
		},
		get currentAnimation() {
			return currentAnimation;
		},
		get availableAnimations() {
			return availableAnimations;
		},
		get idleAnimationUrl() {
			return idleAnimationUrl;
		},
		get idleAnimationUrls() {
			return idleAnimationUrls;
		},
		get talkingAnimationUrl() {
			return talkingAnimationUrl;
		},
		get isTalking() {
			return isTalking;
		},
		get headPosition() {
			return headPosition;
		},
		get headScreenPosition() {
			return headScreenPosition;
		},
		setModelUrl,
		setHeadPosition,
		setHeadScreenPosition,
		setVrm,
		setLoading,
		setError,
		setActiveModel,
		setCurrentAnimation,
		startTalking,
		stopTalking,
		addModel,
		removeModel,
		loadModelBlob,
		getActiveModel,
		setModelPreview
	};
}

export const vrmStore = createVrmStore();
