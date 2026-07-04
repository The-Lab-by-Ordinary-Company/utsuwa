<script lang="ts">
	// Minimal viewer scene: one white directional light, flat backdrop,
	// grid + axes helpers, free orbit controls. No post-processing.
	import { T, useThrelte, useTask } from '@threlte/core';
	import { useXR } from '@threlte/xr';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { ShaderMaterial, Color, Box3, Vector3, PerspectiveCamera, Group } from 'three';
	import type { VRM } from '@pixiv/three-vrm';
	import ArPlacement from './ArPlacement.svelte';
	import VrmModel from './VrmModel.svelte';
	import OverlayRaycastHandler from '$lib/components/overlay/OverlayRaycastHandler.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { screenshotStore } from '$lib/stores/screenshot.svelte';
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

		// Register screenshot handler
		screenshotStore.register(() => {
			if (renderer && scene && camera.current) {
				renderer.render(scene, camera.current);
				const dataUrl = renderer.domElement.toDataURL('image/png');
				const link = document.createElement('a');
				link.download = `utsuwa-screenshot-${Date.now()}.png`;
				link.href = dataUrl;
				link.click();
			}
		});

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
			screenshotStore.unregister();
		};
	});

	const backgroundColor = $derived(
		isDarkMode ? SCENE_COLORS.dark.background : SCENE_COLORS.light.background
	);

	const floorMaterial = $derived.by(() => {
		const theme = isDarkMode ? SCENE_COLORS.dark : SCENE_COLORS.light;
		return new ShaderMaterial({
			uniforms: {
				uColor: { value: new Color(theme.floor) },
				uOpacity: { value: 0.06 }
			},
			vertexShader: floorVertexShader,
			fragmentShader: floorFragmentShader,
			transparent: true,
			depthWrite: false
		});
	});

	// --- Camera auto-fit ---
	// Frames each model by its actual proportions: bottom of frame around the
	// upper thigh, top of the head just under the top of the screen. User
	// settings (fov/zoom/height) adjust on top of the fitted framing.
	const camSettings = $derived(displayStore.camera);

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

		const s = displayStore.camera;
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

	// Re-frame when the model or the camera settings change
	$effect(() => {
		void vrmStore.vrm;
		void camSettings.fov;
		void camSettings.zoom;
		void camSettings.height;
		applyCamera();
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

<!-- Backdrop + floor (hidden in overlay mode and AR passthrough) -->
{#if !overlay && !$isPresenting}
	<T.Color attach="background" args={[backgroundColor]} />
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
