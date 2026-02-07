import { browser } from '$app/environment';
import * as THREE from 'three';
import { isTauri } from './platform';
import { setIgnoreCursorEvents } from './window';

let raycaster: THREE.Raycaster | null = null;
let mouse = new THREE.Vector2();
let isOverModel = false;
let scene: THREE.Scene | null = null;
let camera: THREE.Camera | null = null;

/**
 * Initialize the raycast system for detecting mouse over VRM model
 */
export function initRaycast(threeScene: THREE.Scene, threeCamera: THREE.Camera): void {
	if (!browser) return;

	scene = threeScene;
	camera = threeCamera;
	raycaster = new THREE.Raycaster();

	// Add event listeners
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseleave', handleMouseLeave);
}

/**
 * Cleanup raycast listeners
 */
export function cleanupRaycast(): void {
	window.removeEventListener('mousemove', handleMouseMove);
	window.removeEventListener('mouseleave', handleMouseLeave);
	raycaster = null;
	scene = null;
	camera = null;
}

/**
 * Handle mouse movement - perform raycast and update click-through state
 */
function handleMouseMove(event: MouseEvent): void {
	if (!raycaster || !scene || !camera) return;

	// Convert mouse position to normalized device coordinates (-1 to +1)
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	// Update raycaster
	raycaster.setFromCamera(mouse, camera);

	// Find intersections with all objects in scene
	const intersects = raycaster.intersectObjects(scene.children, true);

	// Filter to only mesh objects (the VRM model)
	const modelIntersects = intersects.filter(
		(i) => i.object instanceof THREE.Mesh && i.object.visible
	);

	const wasOverModel = isOverModel;
	isOverModel = modelIntersects.length > 0;

	// Click-through disabled: setIgnoreCursorEvents blocks interaction with
	// UI overlays (chat bar, buttons) because it can't distinguish model hits
	// from UI element hits. Needs a proper hit-test that excludes HTML UI regions.
	// if (wasOverModel !== isOverModel && isTauri()) {
	// 	setIgnoreCursorEvents(!isOverModel);
	// }
}

/**
 * Handle mouse leaving window
 */
function handleMouseLeave(): void {
	if (isOverModel) {
		isOverModel = false;
		// Click-through disabled (see handleMouseMove comment above)
		// if (isTauri()) setIgnoreCursorEvents(true);
	}
}

/**
 * Check if mouse is currently over the model
 */
export function isMouseOverModel(): boolean {
	return isOverModel;
}

/**
 * Manually trigger a raycast check (useful for touch events)
 */
export function checkRaycast(x: number, y: number): boolean {
	if (!raycaster || !scene || !camera) return false;

	mouse.x = (x / window.innerWidth) * 2 - 1;
	mouse.y = -(y / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true);

	return intersects.filter((i) => i.object instanceof THREE.Mesh && i.object.visible).length > 0;
}
