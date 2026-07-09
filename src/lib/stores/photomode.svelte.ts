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

export interface CaptureOptions {
	// Supersampling factor over the current viewport (quick snap = 1)
	scale: number;
	background: PhotoBackground;
	frame: PhotoFrameId;
}

let active = $state(false);
// null = Natural (the frozen idle stance); otherwise a pose id from the manifest
let selectedPoseId = $state<string | null>(null);
// null = whatever the mood system left; otherwise a VRM expression preset name
let selectedExpression = $state<string | null>(null);
let background = $state<PhotoBackground>({ type: 'room' });
let frameId = $state<PhotoFrameId>('none');
// Bumped when the dock asks the scene to re-fit the camera (photo mode
// otherwise leaves the framing entirely to the user)
let reframeCounter = $state(0);

// The scene owns the renderer, so it registers the capture implementation
let captureHandler: ((options: CaptureOptions) => Promise<Blob | null>) | null = null;

function enter() {
	selectedPoseId = null;
	selectedExpression = null;
	background = { type: 'room' };
	frameId = 'none';
	active = true;
}

function exit() {
	active = false;
	selectedPoseId = null;
	selectedExpression = null;
	background = { type: 'room' };
	frameId = 'none';
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
	return captureHandler({ scale, background: $state.snapshot(background), frame: frameId });
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
	enter,
	exit,
	setPose,
	setExpression,
	setBackground,
	setFrame,
	requestReframe,
	registerCapture,
	capture
};
