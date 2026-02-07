<script lang="ts">
	import { T, useThrelte, useTask } from '@threlte/core';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';
	import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { ttsStore } from '$lib/stores/tts.svelte';
	import { lipSyncAnalyzer } from '$lib/services/lipsync/analyzer';
	import { untrack } from 'svelte';
	import * as THREE from 'three';

	// Pose configurations for different VRM versions
	// VRM 0.x and 1.0 have different bone orientations and coordinate systems
	const VRM_POSE_CONFIG = {
		// VRM 0.x (older models like AvatarSample_A/B)
		'0': {
			sceneRotationY: Math.PI, // Rotate 180° to face camera
			leftUpperArm: { x: Math.PI * 0.05, y: 0, z: Math.PI * 0.4 },
			rightUpperArm: { x: Math.PI * 0.05, y: 0, z: -Math.PI * 0.4 },
			leftLowerArm: { x: 0, y: -Math.PI * 0.1, z: 0 },
			rightLowerArm: { x: 0, y: Math.PI * 0.1, z: 0 }
		},
		// VRM 1.0 (VRoid Studio models like Utsuwa)
		'1': {
			sceneRotationY: 0, // Already facing camera
			leftUpperArm: { x: Math.PI * 0.05, y: 0, z: -Math.PI * 0.4 },
			rightUpperArm: { x: Math.PI * 0.05, y: 0, z: Math.PI * 0.4 },
			leftLowerArm: { x: 0, y: -Math.PI * 0.1, z: 0 }, // Same Y values as 0.x
			rightLowerArm: { x: 0, y: Math.PI * 0.1, z: 0 }
		}
	} as const;

	// Find a happy expression from available expressions (works with any model)
	function findHappyExpression(vrmInstance: VRM): string | null {
		const expressions = vrmInstance.expressionManager?.expressions;
		if (!expressions) return null;

		// Priority order of happy-like expressions to look for
		const happyKeywords = ['happy', 'joy', 'smile', 'fun', 'cheerful'];

		for (const keyword of happyKeywords) {
			const match = expressions.find((e) => e.expressionName.toLowerCase().includes(keyword));
			if (match) return match.expressionName;
		}
		return null;
	}

	interface Props {
		url: string;
	}

	let { url }: Props = $props();
	let vrm = $state<VRM | null>(null);
	let group = $state<THREE.Group | null>(null);

	// === Animation State ===
	let mixer = $state<THREE.AnimationMixer | null>(null);
	let idleAction = $state<THREE.AnimationAction | null>(null); // Current idle animation
	let talkingAction = $state<THREE.AnimationAction | null>(null); // Looping talking animation
	let talkingClip = $state<THREE.AnimationClip | null>(null); // Cached talking clip
	let emoteAction = $state<THREE.AnimationAction | null>(null); // One-shot emote animations
	let isEmotePlaying = $state(false); // True when an emote is playing (disables blinking)
	let lastIdleIndex = $state(-1); // Track last played idle to avoid repeats
	const currentAnimation = $derived(vrmStore.currentAnimation);
	// Talking animation plays when TTS is speaking OR when text-based talking is triggered
	const shouldTalk = $derived(ttsStore.isSpeaking || vrmStore.isTalking);

	// === Blinking State ===
	let blinkTimer = $state(0);
	let nextBlinkTime = $state(Math.random() * 4 + 2); // 2-6 seconds
	let isBlinking = $state(false);
	let blinkProgress = $state(0);

	// === Breathing State ===
	let breathTime = $state(0);
	const BREATH_SPEED = 0.8; // cycles per second
	const BREATH_INTENSITY = 0.015; // subtle movement

	// === Eye Saccade State ===
	let saccadeTime = $state(0);
	let nextSaccadeIn = $state(1 + Math.random() * 2);
	let eyeTarget = $state({ x: 0, y: 0 });
	let currentEyeTarget = $state({ x: 0, y: 0 });

	// === Idle Face Animation State ===
	let idleFaceTime = $state(0);
	let headTime = $state(0);

	const { renderer, camera } = useThrelte();

	// Generate thumbnail from the current 3D render
	function generateThumbnail() {
		if (!renderer) return;

		const canvas = renderer.domElement;
		if (!canvas) return;

		const size = 256;
		const thumbCanvas = document.createElement('canvas');
		thumbCanvas.width = size;
		thumbCanvas.height = size;
		const ctx = thumbCanvas.getContext('2d');

		if (ctx) {
			const srcSize = Math.min(canvas.width, canvas.height);
			const srcX = (canvas.width - srcSize) / 2;
			const srcY = (canvas.height - srcSize) / 2;

			ctx.drawImage(canvas, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

			const thumbnailDataUrl = thumbCanvas.toDataURL('image/png');
			vrmStore.setModelPreview(vrmStore.activeModelId, thumbnailDataUrl);
		}
	}

	// Normalize model orientation and position
	function normalizeModel(loadedVrm: VRM) {
		const scene = loadedVrm.scene;
		const version = loadedVrm.meta?.metaVersion === '1' ? '1' : '0';
		const config = VRM_POSE_CONFIG[version];

		// Apply version-specific scene rotation
		scene.rotation.y = config.sceneRotationY;

		// Calculate bounding box
		const box = new THREE.Box3().setFromObject(scene);
		const center = box.getCenter(new THREE.Vector3());

		// Center model at origin (X and Z)
		scene.position.x = -center.x;
		scene.position.z = -center.z;

		// Ground the model (feet at y=0)
		scene.position.y = -box.min.y;
	}

	// Set a natural idle pose (arms relaxed at sides)
	function setIdlePose(loadedVrm: VRM) {
		const humanoid = loadedVrm.humanoid;
		const version = loadedVrm.meta?.metaVersion === '1' ? '1' : '0';
		const config = VRM_POSE_CONFIG[version];

		// Get arm bones
		const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
		const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
		const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
		const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');

		// Apply version-specific arm rotations
		if (leftUpperArm) {
			leftUpperArm.rotation.set(config.leftUpperArm.x, config.leftUpperArm.y, config.leftUpperArm.z);
		}
		if (rightUpperArm) {
			rightUpperArm.rotation.set(config.rightUpperArm.x, config.rightUpperArm.y, config.rightUpperArm.z);
		}
		if (leftLowerArm) {
			leftLowerArm.rotation.set(config.leftLowerArm.x, config.leftLowerArm.y, config.leftLowerArm.z);
		}
		if (rightLowerArm) {
			rightLowerArm.rotation.set(config.rightLowerArm.x, config.rightLowerArm.y, config.rightLowerArm.z);
		}
	}

	// Pick a random idle animation index, excluding the last played one
	function pickRandomIdleIndex(): number {
		const urls = vrmStore.idleAnimationUrls;
		if (urls.length <= 1) return 0;

		let newIndex: number;
		do {
			newIndex = Math.floor(Math.random() * urls.length);
		} while (newIndex === lastIdleIndex);

		return newIndex;
	}

	// Idle animation cycling timer
	let idleCycleTimeout: ReturnType<typeof setTimeout> | null = null;

	// Load and start the looping idle animation
	function startIdleAnimation(targetVrm: VRM, targetMixer: THREE.AnimationMixer) {
		const urls = vrmStore.idleAnimationUrls;
		if (!urls || urls.length === 0) return;

		const index = pickRandomIdleIndex();
		lastIdleIndex = index;
		const idleUrl = urls[index];

		const loader = new GLTFLoader();
		loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

		loader.load(
			idleUrl,
			(gltf) => {
				const vrmAnimations = gltf.userData.vrmAnimations;
				if (!vrmAnimations || vrmAnimations.length === 0) {
					console.error('No idle animation found');
					return;
				}

				const clip = createVRMAnimationClip(vrmAnimations[0], targetVrm);
				const action = targetMixer.clipAction(clip);
				action.setLoop(THREE.LoopRepeat, Infinity);
				action.play();
				idleAction = action;


				// Schedule next animation change
				scheduleIdleCycle(targetVrm, targetMixer, clip.duration);
			},
			undefined,
			(error) => {
				console.error('Error loading idle animation:', error);
			}
		);
	}

	// Schedule the next idle animation switch
	function scheduleIdleCycle(targetVrm: VRM, targetMixer: THREE.AnimationMixer, duration: number) {
		if (idleCycleTimeout) {
			clearTimeout(idleCycleTimeout);
		}
		// Switch after 1-2 full loops of the current animation
		const loops = 1 + Math.random();
		const delay = duration * loops * 1000;
		idleCycleTimeout = setTimeout(() => {
			if (!shouldTalk && !isEmotePlaying) {
				playNextIdleAnimation(targetVrm, targetMixer);
			} else {
				// Retry later if we're busy
				scheduleIdleCycle(targetVrm, targetMixer, duration);
			}
		}, delay);
	}

	// Play the next random idle animation with smooth crossfade
	function playNextIdleAnimation(targetVrm: VRM, targetMixer: THREE.AnimationMixer) {
		const urls = vrmStore.idleAnimationUrls;
		if (!urls || urls.length === 0) return;

		const index = pickRandomIdleIndex();
		lastIdleIndex = index;
		const idleUrl = urls[index];

		const loader = new GLTFLoader();
		loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

		loader.load(
			idleUrl,
			(gltf) => {
				const vrmAnimations = gltf.userData.vrmAnimations;
				if (!vrmAnimations || vrmAnimations.length === 0) return;

				// Fade out current idle
				if (idleAction) {
					idleAction.fadeOut(1.2);
				}

				const clip = createVRMAnimationClip(vrmAnimations[0], targetVrm);
				const action = targetMixer.clipAction(clip);
				action.setLoop(THREE.LoopRepeat, Infinity);
				action.reset().fadeIn(1.2).play();
				idleAction = action;


				// Schedule next change
				scheduleIdleCycle(targetVrm, targetMixer, clip.duration);
			},
			undefined,
			(error) => {
				console.error('Error loading idle animation:', error);
			}
		);
	}

	// Load the talking animation clip (called once after model loads)
	function loadTalkingAnimation(targetVrm: VRM, targetMixer: THREE.AnimationMixer) {
		const talkingUrl = vrmStore.talkingAnimationUrl;
		if (!talkingUrl) return;

		const loader = new GLTFLoader();
		loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

		loader.load(
			talkingUrl,
			(gltf) => {
				const vrmAnimations = gltf.userData.vrmAnimations;
				if (!vrmAnimations || vrmAnimations.length === 0) {
					console.error('No talking animation found');
					return;
				}

				const clip = createVRMAnimationClip(vrmAnimations[0], targetVrm);
				talkingClip = clip;
			},
			undefined,
			(error) => {
				console.error('Error loading talking animation:', error);
			}
		);
	}

	// Update lip-sync analyser when TTS state changes
	$effect(() => {
		lipSyncAnalyzer.setAnalyser(ttsStore.currentAnalyser);
	});

	// Switch between idle and talking animations based on speaking/talking state
	$effect(() => {
		const speaking = shouldTalk;
		const currentMixer = untrack(() => mixer);
		const currentIdleAction = untrack(() => idleAction);
		const currentTalkingClip = untrack(() => talkingClip);
		const currentEmotePlaying = untrack(() => isEmotePlaying);

		// Don't switch if emote is playing or no mixer/clips available
		if (!currentMixer || currentEmotePlaying) return;

		if (speaking && currentTalkingClip) {
			// Start talking animation, fade out idle
			if (currentIdleAction) {
				currentIdleAction.fadeOut(0.3);
			}

			// Create and play talking action
			let currentTalkingAction = untrack(() => talkingAction);
			if (!currentTalkingAction) {
				currentTalkingAction = currentMixer.clipAction(currentTalkingClip);
				currentTalkingAction.setLoop(THREE.LoopRepeat, Infinity);
				talkingAction = currentTalkingAction;
			}
			currentTalkingAction.reset().fadeIn(0.3).play();

		} else if (!speaking) {
			// Stop talking, resume idle animation
			const currentTalkingAction = untrack(() => talkingAction);
			if (currentTalkingAction) {
				currentTalkingAction.fadeOut(0.3);
			}

			// Resume the current idle action
			if (currentIdleAction) {
				currentIdleAction.reset().fadeIn(0.3).play();
			}

		}
	});

	// Play emote animations when currentAnimation changes
	$effect(() => {
		const animId = currentAnimation;
		const currentVrm = untrack(() => vrm);
		const currentMixer = untrack(() => mixer);
		const currentIdleAction = untrack(() => idleAction);

		if (!currentVrm || !currentMixer) return;

		// Stop any current emote
		const prevEmote = untrack(() => emoteAction);
		if (prevEmote) {
			prevEmote.fadeOut(0.3);
		}

		// If no emote selected, just ensure idle is playing
		if (!animId) {
			isEmotePlaying = false;
			emoteAction = null;
			if (currentIdleAction && !currentIdleAction.isRunning()) {
				currentIdleAction.reset().fadeIn(0.3).play();
			}
			return;
		}

		// Find the emote animation
		const animationData = vrmStore.availableAnimations.find((a) => a.url === animId || a.id === animId);
		if (!animationData?.url) return;

		// Load emote VRMA file
		const loader = new GLTFLoader();
		loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

		loader.load(
			animationData.url,
			(gltf) => {
				const vrmAnimations = gltf.userData.vrmAnimations;
				if (!vrmAnimations || vrmAnimations.length === 0) {
					console.error('No VRM animations found in file');
					return;
				}

				untrack(() => {
					if (!vrm || !mixer) return;

					// Fade out idle animation
					const currentIdle = idleAction;
					if (currentIdle) {
						currentIdle.fadeOut(0.2);
					}

					// Create and play emote
					const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
					const action = mixer.clipAction(clip);
					action.setLoop(THREE.LoopOnce, 1);
					action.clampWhenFinished = true;
					action.timeScale = 1.5;
					action.reset().fadeIn(0.2).play();
					emoteAction = action;
					isEmotePlaying = true;

					// Apply happy expression during emote
					const happyExpr = findHappyExpression(vrm);
					if (happyExpr) {
						vrm.expressionManager?.setValue(happyExpr, 0.7);
					}

					// When emote finishes, return to idle
					const capturedMixer = mixer;
					const capturedVrm = vrm;
					const capturedIdleAction = currentIdle;
					const onFinished = (e: { action: THREE.AnimationAction }) => {
						if (e.action === action) {
							capturedMixer.removeEventListener('finished', onFinished);
							isEmotePlaying = false;
							emoteAction = null;

							// Clear happy expression
							if (happyExpr) {
								capturedVrm.expressionManager?.setValue(happyExpr, 0);
							}

							// Resume idle animation
							if (capturedIdleAction) {
								capturedIdleAction.reset().fadeIn(0.3).play();
							}

							vrmStore.setCurrentAnimation(null);
						}
					};
					capturedMixer.addEventListener('finished', onFinished);

				});
			},
			undefined,
			(error) => {
				console.error('Error loading emote animation:', error);
			}
		);
	});

	// Load VRM when URL changes
	$effect(() => {
		if (!url) return;

		vrmStore.setLoading(true);
		vrmStore.setError(null);

		const loader = new GLTFLoader();
		loader.crossOrigin = 'anonymous';
		loader.register((parser) => {
			const plugin = new VRMLoaderPlugin(parser);
			// Enable thumbnail loading for VRM 1.0 models
			if (plugin.metaPlugin) {
				plugin.metaPlugin.needThumbnailImage = true;
			}
			return plugin;
		});

		loader.load(
			url,
			(gltf) => {
				const loadedVrm = gltf.userData.vrm as VRM;

				// Optimize VRM
				VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
				VRMUtils.removeUnnecessaryJoints(loadedVrm.scene);

				// Configure rendering settings for all meshes
				loadedVrm.scene.traverse((obj) => {
					obj.frustumCulled = false;
					// Enable shadow casting for AO and god rays effects
					if (obj instanceof THREE.Mesh) {
						obj.castShadow = true;
						obj.receiveShadow = true;
					}
				});

				// Normalize model orientation and position
				normalizeModel(loadedVrm);

				// Set a natural idle pose (arms down instead of T-pose)
				setIdlePose(loadedVrm);

				vrm = loadedVrm;
				group = loadedVrm.scene;
				const newMixer = new THREE.AnimationMixer(loadedVrm.scene);
				mixer = newMixer;
				vrmStore.setVrm(loadedVrm);
				vrmStore.setLoading(false);

				// Start the looping idle animation
				startIdleAnimation(loadedVrm, newMixer);

				// Pre-load the talking animation
				loadTalkingAnimation(loadedVrm, newMixer);

				// Debug: Log available expressions
				// if (loadedVrm.expressionManager) {
				// 	const expressions = loadedVrm.expressionManager.expressions;
				// 	console.log(
				// 		'Available expressions:',
				// 		expressions.map((e) => e.expressionName)
				// 	);
				// }

				// Extract thumbnail from VRM metadata (supports both 0.x and 1.0)
				let thumbnailImage: HTMLImageElement | undefined;

				if (loadedVrm.meta) {
					if (loadedVrm.meta.metaVersion === '1') {
						// VRM 1.0: thumbnailImage is HTMLImageElement
						thumbnailImage = (loadedVrm.meta as any).thumbnailImage;
					} else {
						// VRM 0.x: texture contains the image
						const texture = (loadedVrm.meta as any).texture;
						if (texture?.image) {
							thumbnailImage = texture.image;
						}
					}
				}

				if (thumbnailImage) {
					try {
						const canvas = document.createElement('canvas');
						const width = thumbnailImage.width || (thumbnailImage as any).naturalWidth || 256;
						const height = thumbnailImage.height || (thumbnailImage as any).naturalHeight || 256;
						canvas.width = width;
						canvas.height = height;
						const ctx = canvas.getContext('2d');
						if (ctx) {
							ctx.drawImage(thumbnailImage as CanvasImageSource, 0, 0);
							const thumbnailDataUrl = canvas.toDataURL('image/png');
							vrmStore.setModelPreview(vrmStore.activeModelId, thumbnailDataUrl);
						}
					} catch (e) {
						console.error('Failed to extract thumbnail:', e);
						setTimeout(() => generateThumbnail(), 500);
					}
				} else {
					// No embedded thumbnail - generate one from the 3D render
					setTimeout(() => generateThumbnail(), 500);
				}

			},
			() => {},
			(error) => {
				console.error('Error loading VRM:', error);
				vrmStore.setError('Failed to load VRM model');
			}
		);

		return () => {
			// Cleanup on unmount or URL change
			if (mixer) {
				mixer.stopAllAction();
				mixer = null;
				idleAction = null;
				talkingAction = null;
				talkingClip = null;
				emoteAction = null;
			}
			if (vrm) {
				vrm.scene.traverse((obj: THREE.Object3D) => {
					if (obj instanceof THREE.Mesh) {
						obj.geometry?.dispose();
						if (Array.isArray(obj.material)) {
							obj.material.forEach((m) => m.dispose());
						} else if (obj.material) {
							obj.material.dispose();
						}
					}
				});
				vrmStore.setVrm(null);
				vrm = null;
				group = null;
			}
		};
	});

	// Update VRM each frame
	useTask((delta) => {
		if (!vrm) return;

		// Update animation mixer
		mixer?.update(delta);

		// Update VRM core
		vrm.update(delta);

		// Track head position for 3D speech bubble
		const headBone = vrm.humanoid.getNormalizedBoneNode('head');
		if (headBone && camera.current) {
			const worldPos = headBone.getWorldPosition(new THREE.Vector3());
			// Offset above and slightly in front of head
			const offsetPos = new THREE.Vector3(worldPos.x, worldPos.y + 0.25, worldPos.z + 0.1);
			vrmStore.setHeadPosition([offsetPos.x, offsetPos.y, offsetPos.z]);

			// Project to screen coordinates
			const screenPos = offsetPos.clone().project(camera.current);
			// Convert from NDC (-1 to 1) to screen percentage (0 to 100)
			const x = (screenPos.x + 1) * 50;
			const y = (-screenPos.y + 1) * 50;
			vrmStore.setHeadScreenPosition({ x, y });
		}

		const expressionManager = vrm.expressionManager;
		if (!expressionManager) return;

		// Helper to set expression (silently ignores if not found)
		const setExpression = (name: string, value: number) => {
			try {
				expressionManager.setValue(name, value);
			} catch {
				// Expression doesn't exist on this model
			}
		};

		// === Blinking Animation (runs during idle, disabled during emotes) ===
		if (!isEmotePlaying) {
			blinkTimer += delta;

			if (!isBlinking && blinkTimer >= nextBlinkTime) {
				// Start blink
				isBlinking = true;
				blinkProgress = 0;
			}

			if (isBlinking) {
				blinkProgress += delta * 8; // Blink duration ~0.125s

				// Asymmetric blink curve: quick close (30%), slow open (70%)
				let blinkValue: number;
				if (blinkProgress < 0.3) {
					// Quick close
					blinkValue = blinkProgress / 0.3;
				} else {
					// Slow open
					blinkValue = 1 - (blinkProgress - 0.3) / 0.7;
				}

				const finalBlinkValue = Math.max(0, blinkValue);

				if (blinkProgress >= 1) {
					// End blink
					isBlinking = false;
					blinkTimer = 0;
					nextBlinkTime = Math.random() * 4 + 2; // Random 2-6 seconds
					// Try all blink expression variants
					setExpression('blink', 0);
					setExpression('Blink', 0);
					setExpression('eyeBlinkLeft', 0);
					setExpression('eyeBlinkRight', 0);
				} else {
					// Try all blink expression variants
					setExpression('blink', finalBlinkValue);
					setExpression('Blink', finalBlinkValue);
					setExpression('eyeBlinkLeft', finalBlinkValue);
					setExpression('eyeBlinkRight', finalBlinkValue);
				}
			}
		}

		// Apply expression changes
		expressionManager.update();

		// === Lip-sync Animation ===
		const visemes = lipSyncAnalyzer.update(delta);

		// Apply viseme weights - try multiple naming conventions
		// VRM 1.0 style
		setExpression('aa', visemes.aa);
		setExpression('ee', visemes.ee);
		setExpression('ih', visemes.ih);
		setExpression('oh', visemes.oh);
		setExpression('ou', visemes.ou);
		// VRM 0.x style
		setExpression('a', visemes.aa);
		setExpression('i', visemes.ih);
		setExpression('u', visemes.ou);
		setExpression('e', visemes.ee);
		setExpression('o', visemes.oh);
		// ARKit style (jawOpen for mouth)
		setExpression('jawOpen', visemes.aa * 0.7);
	});
</script>

{#if group}
	<T is={group} />
{/if}
