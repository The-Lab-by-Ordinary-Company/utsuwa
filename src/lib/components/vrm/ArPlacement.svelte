<script lang="ts">
	// Places the avatar on the real floor during an AR session and handles
	// touch gestures via the DOM overlay: one finger drags her around the
	// floor plane, two fingers pinch to resize. Mounted only while presenting;
	// resets the model root transform on unmount.
	import { T, useThrelte } from '@threlte/core';
	import { useHitTest } from '@threlte/xr';
	import { Group, Matrix4, Quaternion, Vector3 } from 'three';
	import { onMount } from 'svelte';

	interface Props {
		/** The group wrapping the avatar; this component drives its transform */
		root: Group;
	}

	let { root }: Props = $props();

	const { camera } = useThrelte();

	let reticle = $state<Group | undefined>();
	let placed = $state(false);
	let reticleVisible = $state(false);

	const hitPos = new Vector3();
	const hitQuat = new Quaternion();
	const hitScale = new Vector3();

	// Center-screen hit test: places the avatar on the first detected floor
	// point, and keeps the reticle glued to whatever the camera aims at.
	useHitTest((hitMatrix: Matrix4, hit) => {
		if (!hit) {
			reticleVisible = false;
			return;
		}
		hitMatrix.decompose(hitPos, hitQuat, hitScale);
		reticleVisible = true;
		reticle?.position.copy(hitPos);

		if (!placed) {
			root.position.copy(hitPos);
			placed = true;
		}
	});

	// --- DOM-overlay touch gestures ---
	let dragging = false;
	let lastX = 0;
	let lastY = 0;
	let pinchStartDist = 0;
	let pinchStartScale = 1;

	const forward = new Vector3();
	const right = new Vector3();

	function isUiTarget(target: EventTarget | null): boolean {
		return (
			target instanceof Element &&
			target.closest('button, input, textarea, a, select, [role="dialog"]') !== null
		);
	}

	function onTouchStart(e: TouchEvent) {
		if (isUiTarget(e.target)) return;
		if (e.touches.length === 1) {
			dragging = true;
			lastX = e.touches[0].clientX;
			lastY = e.touches[0].clientY;
		} else if (e.touches.length === 2) {
			dragging = false;
			pinchStartDist = touchDistance(e);
			pinchStartScale = root.scale.x;
		}
	}

	function onTouchMove(e: TouchEvent) {
		if (e.touches.length === 1 && dragging) {
			const dx = e.touches[0].clientX - lastX;
			const dy = e.touches[0].clientY - lastY;
			lastX = e.touches[0].clientX;
			lastY = e.touches[0].clientY;

			// Move in the floor plane relative to where the camera faces:
			// screen-x slides along camera-right, screen-y along camera-forward
			const cam = camera.current;
			cam.getWorldDirection(forward);
			forward.y = 0;
			forward.normalize();
			right.crossVectors(forward, new Vector3(0, -1, 0)).normalize();

			// Scale finger motion by distance so dragging feels 1:1-ish
			const dist = Math.max(0.5, cam.position.distanceTo(root.position));
			const factor = dist * 0.0022;
			root.position.addScaledVector(right, dx * factor);
			root.position.addScaledVector(forward, -dy * factor);
		} else if (e.touches.length === 2 && pinchStartDist > 0) {
			const ratio = touchDistance(e) / pinchStartDist;
			const next = Math.min(2.5, Math.max(0.3, pinchStartScale * ratio));
			root.scale.setScalar(next);
		}
	}

	function onTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			dragging = false;
			pinchStartDist = 0;
		}
	}

	function touchDistance(e: TouchEvent): number {
		const [a, b] = [e.touches[0], e.touches[1]];
		return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
	}

	onMount(() => {
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: true });
		window.addEventListener('touchend', onTouchEnd, { passive: true });

		return () => {
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
			// Hand the model back to the normal scene untouched
			root.position.set(0, 0, 0);
			root.scale.setScalar(1);
		};
	});
</script>

<!-- Placement reticle: a soft ring on the detected floor until she's placed -->
{#if reticleVisible && !placed}
	<T.Group bind:ref={reticle}>
		<T.Mesh rotation.x={-Math.PI / 2}>
			<T.RingGeometry args={[0.08, 0.1, 32]} />
			<T.MeshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
		</T.Mesh>
	</T.Group>
{/if}
