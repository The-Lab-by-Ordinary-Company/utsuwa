<script lang="ts">
	// Minimal viewer scene: one white directional light, flat backdrop,
	// grid + axes helpers, free orbit controls. No post-processing.
	import { T, useThrelte, useTask } from '@threlte/core';
	import { useXR } from '@threlte/xr';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import {
		ShaderMaterial,
		Color,
		Box3,
		Vector3,
		Vector2,
		Raycaster,
		PerspectiveCamera,
		Group
	} from 'three';
	import type { VRM } from '@pixiv/three-vrm';
	import ArPlacement from './ArPlacement.svelte';
	import VrmModel from './VrmModel.svelte';
	import OverlayRaycastHandler from '$lib/components/overlay/OverlayRaycastHandler.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { photomodeStore, type CaptureOptions } from '$lib/stores/photomode.svelte';
	import { bucketTouchZone } from '$lib/services/photo-touch';
	import { drawPhotoFrame, drawPhotoBackground } from '$lib/services/photo-capture';
	import { onMount } from 'svelte';

	// Backdrop colors per theme
	const SCENE_COLORS = {
		light: { background: '#ffffff', floor: '#000000' },
		dark: { background: '#0a0a0a', floor: '#ffffff' }
	};

	// Soft studio floor: a disc that fades out toward its edge
	const floorVertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const floorFragmentShader = `
		uniform vec3 uColor;
		uniform float uOpacity;
		varying vec2 vUv;
		void main() {
			float dist = length(vUv - 0.5);
			float alpha = uOpacity * smoothstep(0.5, 0.1, dist);
			gl_FragColor = vec4(uColor, alpha);
		}
	`;

	interface Props {
		centered?: boolean;
		locked?: boolean;
		overlay?: boolean;
	}

	let { centered = false, locked = false, overlay = false }: Props = $props();

	const modelUrl = $derived(vrmStore.modelUrl);

	const { camera, renderer, scene } = useThrelte();
	const { isPresenting } = useXR();
	let controls: OrbitControls | null = null;
	let modelRoot = $state<Group | undefined>();

	// Dark mode detection
	let isDarkMode = $state(false);

	onMount(() => {
		const checkDarkMode = () => {
			isDarkMode = document.documentElement.classList.contains('dark');
		};
		checkDarkMode();

		const observer = new MutationObserver(checkDarkMode);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		// Photo-mode capture: render one supersampled frame in place (the canvas
		// has preserveDrawingBuffer), composite background and frame on a 2D
		// canvas, and hand back a PNG blob. Restores the live pixel ratio after.
		const unregisterCapture = photomodeStore.registerCapture(async (options: CaptureOptions) => {
			if (!renderer || !scene || !camera.current) return null;
			const glCanvas = renderer.domElement;
			const prevRatio = renderer.getPixelRatio();
			// Cap the supersample so width/height never exceed the GPU texture limit
			const maxTex = renderer.capabilities.maxTextureSize;
			const scale = Math.min(
				options.scale,
				maxTex / glCanvas.width || 1,
				maxTex / glCanvas.height || 1
			);
			try {
				if (scale !== 1) {
					renderer.setPixelRatio(prevRatio * scale);
				}
				renderer.render(scene, camera.current);

				const out = document.createElement('canvas');
				out.width = glCanvas.width;
				out.height = glCanvas.height;
				const ctx = out.getContext('2d');
				if (!ctx) return null;
				drawPhotoBackground(ctx, out.width, out.height, options.background);
				ctx.drawImage(glCanvas, 0, 0);
				drawPhotoFrame(ctx, out.width, out.height, options.frame);

				return await new Promise<Blob | null>((resolve) =>
					out.toBlob((blob) => resolve(blob), 'image/png')
				);
			} finally {
				if (scale !== 1) {
					renderer.setPixelRatio(prevRatio);
					renderer.render(scene, camera.current);
				}
			}
		});

		// Tap reactions: commit the raycast target at pointerdown (the camera can
		// drift before pointerup), fire only if the gesture stays a tap so orbit
		// drags never trigger her.
		const canvas = renderer?.domElement;
		let tapCandidate: { zone: ReturnType<typeof bucketTouchZone>; x: number; y: number; at: number } | null = null;
		const raycaster = new Raycaster();
		const pointerNdc = new Vector2();

		function onPointerDown(e: PointerEvent) {
			if (!photomodeStore.active || !renderer || !camera.current) return;
			const vrm = vrmStore.vrm;
			if (!vrm) return;
			const rect = renderer.domElement.getBoundingClientRect();
			pointerNdc.set(
				((e.clientX - rect.left) / rect.width) * 2 - 1,
				-((e.clientY - rect.top) / rect.height) * 2 + 1
			);
			raycaster.setFromCamera(pointerNdc, camera.current);
			const hits = raycaster.intersectObject(vrm.scene, true);
			if (hits.length === 0) {
				tapCandidate = null;
				return;
			}
			tapCandidate = {
				zone: bucketTouchZone(vrm, hits[0].point),
				x: e.clientX,
				y: e.clientY,
				at: performance.now()
			};
		}

		function onPointerUp(e: PointerEvent) {
			if (!tapCandidate) return;
			const moved = Math.hypot(e.clientX - tapCandidate.x, e.clientY - tapCandidate.y);
			const elapsed = performance.now() - tapCandidate.at;
			if (tapCandidate.zone && moved < 8 && elapsed < 450) {
				photomodeStore.requestReaction(tapCandidate.zone);
			}
			tapCandidate = null;
		}

		canvas?.addEventListener('pointerdown', onPointerDown);
		canvas?.addEventListener('pointerup', onPointerUp);

		// Set transparent background for overlay mode
		if (overlay) {
			if (scene) {
				scene.background = null;
			}
			// Ensure renderer clears to transparent
			if (renderer) {
				renderer.setClearColor(0x000000, 0);
			}
		}

		return () => {
			observer.disconnect();
			unregisterCapture();
			canvas?.removeEventListener('pointerdown', onPointerDown);
			canvas?.removeEventListener('pointerup', onPointerUp);
		};
	});

	// Any non-room photo background clears the GL canvas to transparent; the
	// page shows a CSS preview behind it and the capture composites the real
	// background, so what you see is what you save.
	const photoTransparent = $derived(
		photomodeStore.active && photomodeStore.background.type !== 'room'
	);

	$effect(() => {
		if (!renderer || overlay) return;
		if (photoTransparent) {
			renderer.setClearColor(0x000000, 0);
			return () => {
				renderer.setClearColor(0x000000, 1);
			};
		}
	});

	const backgroundColor = $derived(
		isDarkMode ? SCENE_COLORS.dark.background : SCENE_COLORS.light.background
	);

	// One material for the life of the scene; only its color uniform changes on
	// theme toggle. Rebuilding it per toggle (the old $derived.by) orphaned a GPU
	// shader program each time.
	const floorMaterial = new ShaderMaterial({
		uniforms: {
			uColor: { value: new Color(SCENE_COLORS.light.floor) },
			uOpacity: { value: 0.06 }
		},
		vertexShader: floorVertexShader,
		fragmentShader: floorFragmentShader,
		transparent: true,
		depthWrite: false
	});

	$effect(() => {
		const theme = isDarkMode ? SCENE_COLORS.dark : SCENE_COLORS.light;
		(floorMaterial.uniforms.uColor.value as Color).set(theme.floor);
	});

	onMount(() => () => floorMaterial.dispose());

	// --- Camera auto-fit ---
	// Frames each model by its actual proportions: bottom of frame around the
	// upper thigh, top of the head just under the top of the screen. User
	// settings (fov/zoom/height) adjust on top of the fitted framing.
	// Overlay windows frame very differently, so they keep their own profile
	const camSettings = $derived(overlay ? displayStore.overlayCamera : displayStore.camera);

	function computeFit(vrm: VRM): { center: number; halfSpan: number } {
		vrm.scene.updateWorldMatrix(true, true);
		const box = new Box3().setFromObject(vrm.scene);
		const headTop = box.max.y;

		// Thigh line from the raw skeleton (world matrices are valid right after
		// updateWorldMatrix, unlike the normalized rig at load time); fall back
		// to a proportional guess
		let thighY = headTop * 0.45;
		const upperLeg =
			vrm.humanoid?.getRawBoneNode('leftUpperLeg') ??
			vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
		if (upperLeg) {
			const p = new Vector3();
			upperLeg.getWorldPosition(p);
			thighY = p.y * 0.92;
		}

		const top = headTop + (headTop - thighY) * 0.04;
		return { center: (top + thighY) / 2, halfSpan: (top - thighY) / 2 };
	}

	function applyCamera() {
		// The XR session owns the camera while presenting
		if (renderer?.xr.isPresenting) return;
		const cam = camera.current;
		if (!(cam instanceof PerspectiveCamera)) return;

		const s = overlay ? displayStore.overlayCamera : displayStore.camera;
		cam.fov = s.fov;
		cam.updateProjectionMatrix();

		const vrm = vrmStore.vrm;
		const fit = vrm ? computeFit(vrm) : { center: 1.0, halfSpan: 0.55 };
		const distance = fit.halfSpan / Math.tan((s.fov * Math.PI) / 360) / s.zoom;
		const targetY = fit.center + s.height;

		cam.position.set(0, targetY, distance);
		if (controls) {
			controls.target.set(0, targetY, 0);
			controls.update();
		} else {
			cam.lookAt(0, targetY, 0);
		}
	}

	// Re-frame when the model or the camera settings change. In photo mode the
	// user owns the framing, so FOV changes only adjust the lens in place
	// instead of snapping the camera back to the fitted position.
	$effect(() => {
		void vrmStore.vrm;
		void camSettings.fov;
		void camSettings.zoom;
		void camSettings.height;
		if (photomodeStore.active) {
			const cam = camera.current;
			if (cam instanceof PerspectiveCamera) {
				cam.fov = camSettings.fov;
				cam.updateProjectionMatrix();
			}
			return;
		}
		applyCamera();
	});

	// The dock's reset chip explicitly asks for the fitted framing back
	$effect(() => {
		void photomodeStore.reframeCounter;
		if (photomodeStore.active) applyCamera();
	});

	// Photo-mode camera profile: damping for deliberate motion, a wider zoom
	// range for close portraits and full-body shots, and a polar clamp that
	// keeps the camera above the floor. Exiting restores the chat profile and
	// re-applies the fitted framing.
	$effect(() => {
		if (!controls) return;
		if (photomodeStore.active) {
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.minDistance = 0.3;
			controls.maxDistance = 8;
			controls.minPolarAngle = 0.05;
			controls.maxPolarAngle = Math.PI * 0.6;
			return () => {
				if (!controls) return;
				controls.enableDamping = false;
				controls.minDistance = 0;
				controls.maxDistance = Infinity;
				controls.minPolarAngle = 0;
				controls.maxPolarAngle = Math.PI;
				applyCamera();
			};
		}
	});

	// Setup OrbitControls (skip when locked)
	$effect(() => {
		if (locked) return;

		if (camera.current && renderer) {
			controls = new OrbitControls(camera.current, renderer.domElement);
			controls.screenSpacePanning = true;
			applyCamera();

			return () => {
				controls?.dispose();
			};
		}
	});

	// Orbit controls fight the XR camera; disable them while presenting and
	// re-apply the fitted framing when the session ends
	$effect(() => {
		if (!controls) return;
		controls.enabled = !$isPresenting;
		if (!$isPresenting) applyCamera();
	});

	useTask(() => {
		if (controls?.enabled) controls.update();
	});
</script>

<!-- Camera - auto-fitted to the model once it loads -->
<T.PerspectiveCamera makeDefault position={[0, 1.1, 2]} fov={camSettings.fov} near={0.1} far={1000} />

<!-- Overlay mode: enable raycast for click-through detection -->
{#if overlay}
	<OverlayRaycastHandler />
{/if}

<!-- Backdrop + floor (hidden in overlay mode, AR passthrough, and photo
     backgrounds, which render through a transparent canvas + composite) -->
{#if !overlay && !$isPresenting && !photoTransparent}
	<T.Color attach="background" args={[backgroundColor]} />
{/if}
{#if !overlay && !$isPresenting && !(photomodeStore.active && photomodeStore.background.type !== 'room')}
	<T.Mesh rotation.x={-Math.PI / 2} position.y={0}>
		<T.CircleGeometry args={[2.5, 64]} />
		<T is={floorMaterial} />
	</T.Mesh>
{/if}

<!-- Single white directional light. Math.PI matches the legacy-lighting
     intensity 1 the classic three-vrm viewers were tuned against. -->
<T.DirectionalLight intensity={Math.PI} position={[1, 1, 1]} />

<!-- VRM Model, wrapped so AR placement can move/scale it without remounting -->
<T.Group bind:ref={modelRoot}>
	{#if modelUrl}
		<VrmModel url={modelUrl} />
	{/if}
</T.Group>

{#if $isPresenting && modelRoot}
	<ArPlacement root={modelRoot} />
{/if}
