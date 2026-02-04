<script lang="ts">
	// Simplified scene matching @pixiv/three-vrm examples exactly
	// https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/examples/humanoidAnimation/main.js
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { HemisphereLight, DirectionalLight, ShaderMaterial, Color, BackSide, SRGBColorSpace, ACESFilmicToneMapping, HalfFloatType } from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';
	import VrmModel from './VrmModel.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { displayStore } from '$lib/stores/display.svelte';
	import { screenshotStore } from '$lib/stores/screenshot.svelte';
	import { onMount } from 'svelte';

	// Dot grid shader for background sphere
	const dotGridVertexShader = `
		varying vec2 vUv;
		varying vec3 vNormal;
		void main() {
			vUv = uv;
			vNormal = normal;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const dotGridFragmentShader = `
		uniform vec3 uBackgroundColor;
		uniform vec3 uDotColor;
		uniform float uDotSize;
		uniform float uSpacingX;
		uniform float uSpacingY;
		varying vec2 vUv;

		void main() {
			// Create grid with separate X and Y spacing for proper circles on sphere
			vec2 grid = fract(vec2(vUv.x * uSpacingX, vUv.y * uSpacingY));
			float dist = length(grid - 0.5);
			float dot = 1.0 - smoothstep(uDotSize - 0.005, uDotSize + 0.005, dist);
			vec3 color = mix(uBackgroundColor, uDotColor, dot);
			gl_FragColor = vec4(color, 1.0);
		}
	`;

	// Design language colors (matching CSS tokens in app.css)
	const SCENE_COLORS = {
		light: {
			background: '#ffffff',
			dot: '#d0d0d0',
			placeholder: '#9ca3af' // text-tertiary equivalent
		},
		dark: {
			background: '#353535',
			dot: '#888888',
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

	const { camera, renderer, scene, autoRender } = useThrelte();
	let controls: OrbitControls | null = null;
	let composer: EffectComposer | null = null;

	// Responsive: detect if desktop (chat sidebar visible on right)
	let isDesktop = $state(false);

	// Dark mode detection
	let isDarkMode = $state(false);

	// Create dot grid shader material - recreate on theme change for proper reactivity
	const dotGridMaterial = $derived.by(() => {
		const bgColor = isDarkMode ? SCENE_COLORS.dark.background : SCENE_COLORS.light.background;
		const dotColor = isDarkMode ? SCENE_COLORS.dark.dot : SCENE_COLORS.light.dot;

		return new ShaderMaterial({
			uniforms: {
				uBackgroundColor: { value: new Color(bgColor) },
				uDotColor: { value: new Color(dotColor) },
				uDotSize: { value: 0.025 },
				uSpacingX: { value: 200.0 },
				uSpacingY: { value: 100.0 }
			},
			vertexShader: dotGridVertexShader,
			fragmentShader: dotGridFragmentShader,
			side: BackSide,
			depthWrite: false
		});
	});

	// Set up post-processing - stored outside reactive system
	function setupComposer() {
		if (!renderer || !scene || !camera.current || composer) return;

		// Configure renderer for vibrant colors
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.toneMapping = ACESFilmicToneMapping;
		renderer.toneMappingExposure = 0.8;

		// Disable Threlte's auto-render so we can use the composer
		autoRender.set(false);

		// Create new composer
		composer = new EffectComposer(renderer, {
			frameBufferType: HalfFloatType
		});

		// Add render pass
		composer.addPass(new RenderPass(scene, camera.current));

		// Add bloom effect - subtle glow on bright areas
		const bloomEffect = new BloomEffect({
			intensity: 0.15,
			luminanceThreshold: 0.85,
			luminanceSmoothing: 0.3,
			mipmapBlur: true
		});
		composer.addPass(new EffectPass(camera.current, bloomEffect));

		// Set initial size
		composer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
	}

	onMount(() => {
		// Setup composer after a small delay to ensure camera is ready
		const composerTimeout = setTimeout(() => {
			setupComposer();
		}, 100);

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
			if (composer) {
				composer.render();
				const dataUrl = renderer.domElement.toDataURL('image/png');
				const link = document.createElement('a');
				link.download = `utsuwa-screenshot-${Date.now()}.png`;
				link.href = dataUrl;
				link.click();
			}
		});

		return () => {
			clearTimeout(composerTimeout);
			window.removeEventListener('resize', checkDesktop);
			observer.disconnect();
			screenshotStore.unregister();
			composer?.dispose();
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

	// Update controls and render with post-processing each frame
	// Handle resize in render loop to prevent black flash (resize + render happen atomically)
	let lastWidth = 0;
	let lastHeight = 0;
	useTask(() => {
		controls?.update();

		// Check for resize and handle it before rendering (same frame = no flash)
		if (composer && renderer) {
			const width = renderer.domElement.clientWidth;
			const height = renderer.domElement.clientHeight;
			if (width !== lastWidth || height !== lastHeight) {
				lastWidth = width;
				lastHeight = height;
				composer.setSize(width, height);
			}
			composer.render();
		} else {
			// Fallback to normal render if composer not ready
			if (renderer && scene && camera.current) {
				renderer.render(scene, camera.current);
			}
		}
	});
</script>

<!-- Camera - view with model centered, distance from display settings -->
<T.PerspectiveCamera makeDefault position={[cameraTargetX, 1.15, cameraDistance]} fov={30} near={0.1} far={20} />

<!-- Scene Background fallback -->
<T.Color attach="background" args={[backgroundColor()]} />

<!-- Dot Grid Background Sphere (skybox-style) -->
<T.Mesh position={[0, 0, 0]}>
	<T.SphereGeometry args={[15, 64, 32]} />
	<T is={dotGridMaterial} />
</T.Mesh>

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
	<T.ShadowMaterial opacity={0.15} />
</T.Mesh>
