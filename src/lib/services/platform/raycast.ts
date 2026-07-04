import { browser } from '$app/environment';
import * as THREE from 'three';

let raycaster: THREE.Raycaster | null = null;
const mouse = new THREE.Vector2();
let scene: THREE.Scene | null = null;
let camera: THREE.Camera | null = null;

/**
 * Store scene references for on-demand raycasts (checkRaycast).
 *
 * Note: this deliberately does NOT raycast on mousemove. Recursive raycasts
 * against a skinned VRM are expensive (CPU-side skinned vertex transforms) and
 * mousemove fires at mouse polling rate, which tanked the overlay framerate on
 * hover — with the result feeding a click-through toggle that's disabled anyway.
 */
export function initRaycast(threeScene: THREE.Scene, threeCamera: THREE.Camera): void {
	if (!browser) return;

	scene = threeScene;
	camera = threeCamera;
	raycaster = new THREE.Raycaster();
}

export function cleanupRaycast(): void {
	raycaster = null;
	scene = null;
	camera = null;
}

/**
 * Manually trigger a raycast check at a screen position
 */
export function checkRaycast(x: number, y: number): boolean {
	if (!raycaster || !scene || !camera) return false;

	mouse.x = (x / window.innerWidth) * 2 - 1;
	mouse.y = -(y / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true);

	return intersects.filter((i) => i.object instanceof THREE.Mesh && i.object.visible).length > 0;
}
