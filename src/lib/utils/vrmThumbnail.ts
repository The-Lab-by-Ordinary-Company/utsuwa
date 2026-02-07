import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';
import {
	WebGLRenderer,
	Scene,
	PerspectiveCamera,
	AmbientLight,
	DirectionalLight,
	Box3,
	Vector3
} from 'three';

/**
 * Generate a thumbnail for a VRM model by rendering it to an offscreen canvas.
 */
export async function generateVrmThumbnail(url: string): Promise<string | null> {
	// Create offscreen canvas
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 512;

	const renderer = new WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
		preserveDrawingBuffer: true
	});
	renderer.setSize(canvas.width, canvas.height, false);
	renderer.setPixelRatio(1);

	const scene = new Scene();
	const camera = new PerspectiveCamera(35, 1, 0.01, 100);

	// Lighting
	const ambientLight = new AmbientLight(0xffffff, 0.8);
	const directionalLight = new DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(1, 1, 1);
	scene.add(ambientLight, directionalLight);

	// Load VRM
	const loader = new GLTFLoader();
	loader.crossOrigin = 'anonymous';
	loader.register((parser) => new VRMLoaderPlugin(parser));

	return new Promise((resolve) => {
		loader.load(
			url,
			(gltf) => {
				try {
					const vrm = gltf.userData.vrm as VRM;

					// Optimize
					VRMUtils.removeUnnecessaryVertices(vrm.scene);
					VRMUtils.removeUnnecessaryJoints(vrm.scene);

					// Rotate to face camera
					vrm.scene.rotation.y = Math.PI;

					// Add to scene
					scene.add(vrm.scene);

					// Calculate bounding box and position camera
					const box = new Box3().setFromObject(vrm.scene);
					const center = box.getCenter(new Vector3());
					const size = box.getSize(new Vector3());

					// Position camera to frame the upper body/face
					const headY = center.y + size.y * 0.25;
					camera.position.set(0, headY, size.z * 2);
					camera.lookAt(0, headY, 0);
					camera.updateProjectionMatrix();

					// Render
					renderer.render(scene, camera);

					// Get data URL
					const dataUrl = canvas.toDataURL('image/png');

					// Cleanup
					vrm.scene.traverse((obj: any) => {
						if (obj.geometry?.dispose) obj.geometry.dispose();
						if (obj.material) {
							const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
							materials.forEach((mat: any) => {
								if (mat?.map?.dispose) mat.map.dispose();
								mat?.dispose?.();
							});
						}
					});
					scene.remove(vrm.scene);
					renderer.dispose();

					resolve(dataUrl);
				} catch (e) {
					console.error('Error generating thumbnail:', e);
					renderer.dispose();
					resolve(null);
				}
			},
			undefined,
			(error) => {
				console.error('Error loading VRM for thumbnail:', error);
				renderer.dispose();
				resolve(null);
			}
		);
	});
}

/**
 * Pre-generate thumbnails for all models that don't have one yet.
 */
export async function preGenerateThumbnails(
	models: Array<{ id: string; url: string; previewUrl?: string }>,
	onThumbnailGenerated: (modelId: string, dataUrl: string) => void
): Promise<void> {
	for (const model of models) {
		// Skip if already has a preview
		if (model.previewUrl) continue;

		const thumbnail = await generateVrmThumbnail(model.url);
		if (thumbnail) {
			onThumbnailGenerated(model.id, thumbnail);
		}
	}
}
