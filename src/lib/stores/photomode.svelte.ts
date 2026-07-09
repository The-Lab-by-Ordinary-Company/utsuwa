// Photo mode state. The scene, model, and dock all key off this store:
// entering pauses the idle-cycle scheduler and talking swaps (VrmModel),
// switches the camera to the free photo profile (Scene), and hides the chat
// UI behind the dock (app page). Exiting restores the live-companion loop.

export interface PhotoBackground {
	type: 'room' | 'transparent' | 'solid' | 'gradient';
	// Solid: a CSS color. Gradient: a CSS linear-gradient string (also drawn
	// into captures by the composite step).
	value?: string;
}

export type PhotoFrameId = 'none' | 'polaroid' | 'film';

export type PhotoFilterId = 'none' | 'warm' | 'cool' | 'mono' | 'sepia' | 'film';

// CSS filter strings shared by the live preview and the capture composite so
// what you see is exactly what you save
export const PHOTO_FILTERS: Record<PhotoFilterId, { label: string; css: string }> = {
	none: { label: 'None', css: 'none' },
	warm: { label: 'Warm', css: 'saturate(1.15) sepia(0.12) brightness(1.03)' },
	cool: { label: 'Cool', css: 'saturate(1.05) hue-rotate(-10deg) brightness(1.02)' },
	mono: { label: 'Mono', css: 'grayscale(1) contrast(1.06)' },
	sepia: { label: 'Sepia', css: 'sepia(0.55) contrast(0.95)' },
	film: { label: 'Film', css: 'contrast(1.08) saturate(0.88) sepia(0.08)' }
};

export interface PhotoSticker {
	id: string;
	src: string;
	// Center position and width as fractions of the viewport, so the capture
	// composite maps them onto the supersampled output exactly
	x: number;
	y: number;
	width: number;
}

export interface CaptureOptions {
	// Supersampling factor over the current viewport (quick snap = 1)
	scale: number;
	background: PhotoBackground;
	frame: PhotoFrameId;
	filter: PhotoFilterId;
	vignette: boolean;
	stickers: PhotoSticker[];
}

let active = $state(false);
// null = Natural (the frozen idle stance); otherwise a pose id from the manifest
let selectedPoseId = $state<string | null>(null);
// null = whatever the mood system left; otherwise a VRM expression preset name
let selectedExpression = $state<string | null>(null);
let background = $state<PhotoBackground>({ type: 'room' });
let frameId = $state<PhotoFrameId>('none');
let filterId = $state<PhotoFilterId>('none');
let vignette = $state(false);
let showGrid = $state(false);
// Head tracking: the head turns toward the scene camera while posing
let headTracking = $state(false);
let stickers = $state<PhotoSticker[]>([]);
let stickerSeq = 0;
// Bumped when the dock asks the scene to re-fit the camera (photo mode
// otherwise leaves the framing entirely to the user)
let reframeCounter = $state(0);

// The scene owns the renderer, so it registers the capture implementation
let captureHandler: ((options: CaptureOptions) => Promise<Blob | null>) | null = null;

function reset() {
	selectedPoseId = null;
	selectedExpression = null;
	background = { type: 'room' };
	frameId = 'none';
	filterId = 'none';
	vignette = false;
	showGrid = false;
	headTracking = false;
	stickers = [];
}

function enter() {
	reset();
	active = true;
}

function exit() {
	active = false;
	reset();
}

function setPose(id: string | null) {
	selectedPoseId = id;
}

function setExpression(name: string | null) {
	selectedExpression = name;
}

function setBackground(next: PhotoBackground) {
	background = next;
}

function setFrame(id: PhotoFrameId) {
	frameId = id;
}

function setFilter(id: PhotoFilterId) {
	filterId = id;
}

function setVignette(on: boolean) {
	vignette = on;
}

function setGrid(on: boolean) {
	showGrid = on;
}

function setHeadTracking(on: boolean) {
	headTracking = on;
}

function addSticker(src: string) {
	stickers = [
		...stickers,
		{ id: `sticker-${++stickerSeq}`, src, x: 0.5, y: 0.82, width: 0.22 }
	];
}

function updateSticker(id: string, patch: Partial<Pick<PhotoSticker, 'x' | 'y' | 'width'>>) {
	stickers = stickers.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

function removeSticker(id: string) {
	stickers = stickers.filter((s) => s.id !== id);
}

function requestReframe() {
	reframeCounter++;
}

function registerCapture(handler: (options: CaptureOptions) => Promise<Blob | null>) {
	captureHandler = handler;
	return () => {
		if (captureHandler === handler) captureHandler = null;
	};
}

async function capture(scale: number): Promise<Blob | null> {
	if (!captureHandler) return null;
	return captureHandler({
		scale,
		background: $state.snapshot(background),
		frame: frameId,
		filter: filterId,
		vignette,
		stickers: $state.snapshot(stickers)
	});
}

export const photomodeStore = {
	get active() {
		return active;
	},
	get selectedPoseId() {
		return selectedPoseId;
	},
	get selectedExpression() {
		return selectedExpression;
	},
	get background() {
		return background;
	},
	get frameId() {
		return frameId;
	},
	get reframeCounter() {
		return reframeCounter;
	},
	get filterId() {
		return filterId;
	},
	get vignette() {
		return vignette;
	},
	get showGrid() {
		return showGrid;
	},
	get headTracking() {
		return headTracking;
	},
	get stickers() {
		return stickers;
	},
	enter,
	exit,
	setPose,
	setExpression,
	setBackground,
	setFrame,
	setFilter,
	setVignette,
	setGrid,
	setHeadTracking,
	addSticker,
	updateSticker,
	removeSticker,
	requestReframe,
	registerCapture,
	capture
};
