<script lang="ts">
	// Minimal viewer scene: one white directional light, flat backdrop,
	// grid + axes helpers, free orbit controls. No post-processing.
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { ShaderMaterial, Color } from 'three';
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
	let controls: OrbitControls | null = null;

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

	const cameraDistance = $derived(displayStore.cameraDistance);

	// Setup OrbitControls (skip when locked)
	$effect(() => {
		if (locked) return;

		if (camera.current && renderer) {
			controls = new OrbitControls(camera.current, renderer.domElement);
			controls.target.set(0, 0.85, 0);
			controls.screenSpacePanning = true;
			controls.update();

			return () => {
				controls?.dispose();
			};
		}
	});

	useTask(() => {
		controls?.update();
	});
</script>

<!-- Camera - distance from display settings -->
<T.PerspectiveCamera makeDefault position={[0, 1.1, cameraDistance]} fov={35} near={0.1} far={1000} />

<!-- Overlay mode: enable raycast for click-through detection -->
{#if overlay}
	<OverlayRaycastHandler />
{/if}

<!-- Backdrop + floor (hidden in overlay mode for transparency) -->
{#if !overlay}
	<T.Color attach="background" args={[backgroundColor]} />
	<T.Mesh rotation.x={-Math.PI / 2} position.y={0}>
		<T.CircleGeometry args={[2.5, 64]} />
		<T is={floorMaterial} />
	</T.Mesh>
{/if}

<!-- Single white directional light. Math.PI matches the legacy-lighting
     intensity 1 the classic three-vrm viewers were tuned against. -->
<T.DirectionalLight intensity={Math.PI} position={[1, 1, 1]} />

<!-- VRM Model -->
{#if modelUrl}
	<VrmModel url={modelUrl} />
{/if}
