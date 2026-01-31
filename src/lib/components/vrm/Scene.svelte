<script lang="ts">
	// Simplified scene matching @pixiv/three-vrm examples exactly
	// https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/examples/humanoidAnimation/main.js
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { HemisphereLight, DirectionalLight } from 'three';
	import VrmModel from './VrmModel.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { screenshotStore } from '$lib/stores/screenshot.svelte';
	import { onMount } from 'svelte';

	// Design language colors (matching CSS tokens in app.css)
	const SCENE_COLORS = {
		light: {
			background: '#ffffff',
			placeholder: '#9ca3af' // text-tertiary equivalent
		},
		dark: {
			background: '#171717',
			placeholder: '#6b7280'
		}
	};

	// Refs for lights (needed to call setHSL methods)
	let hemiLight = $state<HemisphereLight | undefined>(undefined);
	let dirLight = $state<DirectionalLight | undefined>(undefined);

	// Set HSL colors when lights are ready
	$effect(() => {
		if (hemiLight) {
			hemiLight.color.setHSL(0.6, 1, 0.6); // Sky: cyan/turquoise
			hemiLight.groundColor.setHSL(0.095, 1, 0.75); // Ground: pale yellow
		}
	});

	$effect(() => {
		if (dirLight) {
			dirLight.color.setHSL(0.1, 1, 0.95); // Warm white
		}
	});

	interface Props {
		centered?: boolean;
		locked?: boolean;
	}

	let { centered = false, locked = false }: Props = $props();

	const modelUrl = $derived(vrmStore.modelUrl);

	const { camera, renderer, scene } = useThrelte();
	let controls: OrbitControls | null = null;

	// Responsive: detect if desktop (chat sidebar visible on right)
	let isDesktop = $state(false);

	// Dark mode detection
	let isDarkMode = $state(false);

	onMount(() => {
		const checkDesktop = () => {
			isDesktop = window.innerWidth > 768;
		};
		checkDesktop();
		window.addEventListener('resize', checkDesktop);

		// Check dark mode
		const checkDarkMode = () => {
			isDarkMode = document.documentElement.classList.contains('dark');
		};
		checkDarkMode();

		// Watch for dark mode changes
		const observer = new MutationObserver(checkDarkMode);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		// Register screenshot handler
		screenshotStore.register(() => {
			if (renderer && camera.current && scene) {
				renderer.render(scene, camera.current);
				const dataUrl = renderer.domElement.toDataURL('image/png');
				const link = document.createElement('a');
				link.download = `utsuwa-screenshot-${Date.now()}.png`;
				link.href = dataUrl;
				link.click();
			}
		});

		return () => {
			window.removeEventListener('resize', checkDesktop);
			observer.disconnect();
			screenshotStore.unregister();
		};
	});

	// Background color from design language
	const backgroundColor = $derived(() => {
		return isDarkMode ? SCENE_COLORS.dark.background : SCENE_COLORS.light.background;
	});

	// Placeholder color from design language
	const placeholderColor = $derived(() => {
		return isDarkMode ? SCENE_COLORS.dark.placeholder : SCENE_COLORS.light.placeholder;
	});

	// Camera always centered (no sidebar offset needed with new bottom chat bar layout)
	const cameraTargetX = $derived(0);
	const cameraDistance = $derived(displayStore.cameraDistance);

	// Setup OrbitControls (skip when locked)
	$effect(() => {
		if (locked) return;

		if (camera.current && renderer) {
			controls = new OrbitControls(camera.current, renderer.domElement);
			controls.enableDamping = true;
			controls.target.set(cameraTargetX, 1, 0);
			controls.minDistance = 0.5;
			controls.maxDistance = 5;
			controls.update();

			return () => {
				controls?.dispose();
			};
		}
	});

	// Update controls target and camera position when desktop state changes
	$effect(() => {
		if (controls && camera.current) {
			controls.target.setX(cameraTargetX);
			camera.current.position.setX(cameraTargetX);
			controls.update();
		}
	});

	// Update controls each frame
	useTask(() => {
		controls?.update();
	});
</script>

<!-- Camera - view with model centered, distance from display settings -->
<T.PerspectiveCamera makeDefault position={[cameraTargetX, 1.15, cameraDistance]} fov={30} near={0.1} far={20} />

<!-- Scene Background - syncs with light/dark mode and theme -->
<T.Color attach="background" args={[backgroundColor()]} />

<!-- Hemisphere lighting matching Three.js example -->
<!-- https://threejs.org/examples/webgl_lights_hemisphere.html -->
<T.HemisphereLight
	bind:ref={hemiLight}
	intensity={2}
	position={[0, 50, 0]}
/>

<!-- Directional light with shadows -->
<T.DirectionalLight
	bind:ref={dirLight}
	intensity={3}
	position={[-30, 52.5, 30]}
	castShadow
	shadow.mapSize.width={2048}
	shadow.mapSize.height={2048}
	shadow.camera.left={-3}
	shadow.camera.right={3}
	shadow.camera.top={3}
	shadow.camera.bottom={-3}
	shadow.camera.far={100}
	shadow.bias={-0.0001}
/>

<!-- VRM Model -->
{#if modelUrl}
	<VrmModel url={modelUrl} />
{:else}
	<!-- Placeholder cube when no model loaded -->
	<T.Mesh position={[0, 1, 0]}>
		<T.BoxGeometry args={[0.5, 0.5, 0.5]} />
		<T.MeshStandardMaterial color={placeholderColor()} />
	</T.Mesh>
{/if}

<!-- Ground plane - receives shadows -->
<T.Mesh rotation.x={-Math.PI / 2} position.y={0} receiveShadow>
	<T.CircleGeometry args={[2, 64]} />
	<T.MeshStandardMaterial color={backgroundColor()} />
</T.Mesh>
