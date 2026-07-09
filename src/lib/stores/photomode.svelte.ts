// Photo mode state. The scene, model, and dock all key off this store:
// entering pauses the idle-cycle scheduler and talking swaps (VrmModel),
// switches the camera to the free photo profile (Scene), and hides the chat
// UI behind the dock (app page). Exiting restores the live-companion loop.

let active = $state(false);
// null = Natural (the frozen idle stance); otherwise a pose id from the manifest
let selectedPoseId = $state<string | null>(null);
// Bumped when the dock asks the scene to re-fit the camera (photo mode
// otherwise leaves the framing entirely to the user)
let reframeCounter = $state(0);

function enter() {
	selectedPoseId = null;
	active = true;
}

function exit() {
	active = false;
	selectedPoseId = null;
}

function setPose(id: string | null) {
	selectedPoseId = id;
}

function requestReframe() {
	reframeCounter++;
}

export const photomodeStore = {
	get active() {
		return active;
	},
	get selectedPoseId() {
		return selectedPoseId;
	},
	get reframeCounter() {
		return reframeCounter;
	},
	enter,
	exit,
	setPose,
	requestReframe
};
