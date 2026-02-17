<script lang="ts">
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import VrmScene from '$lib/components/vrm/VrmScene.svelte';
	import { Icon } from '$lib/components/ui';
	import * as THREE from 'three';
	import localforage from 'localforage';
	import { debugEventsStore, testEvents } from '$lib/stores/debugEvents.svelte';
	import { goto } from '$app/navigation';

	// Material debug modes from @pixiv/three-vrm-materials-mtoon
	const materialDebugModes = [
		{ id: 'none', name: 'None (Normal Rendering)' },
		{ id: 'normal', name: 'Normals' },
		{ id: 'litShadeRate', name: 'Lit/Shade Rate' },
		{ id: 'uv', name: 'UV Coordinates' }
	];

	let currentDebugMode = $state('none');

	// Apply debug mode to all MToon materials in the VRM
	function setMaterialDebugMode(mode: string) {
		currentDebugMode = mode;
		const vrm = vrmStore.vrm;
		if (!vrm) return;

		vrm.scene.traverse((obj) => {
			if (obj instanceof THREE.Mesh && obj.material) {
				const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
				for (const mat of materials) {
					// Check if it's an MToon material (has debugMode property)
					if ('debugMode' in mat) {
						(mat as any).debugMode = mode;
						mat.needsUpdate = true;
					}
				}
			}
		});
	}

	// Expression categories for organization
	const expressionCategories = {
		eyes: [
			'eyeBlinkLeft',
			'eyeBlinkRight',
			'eyeLookDownLeft',
			'eyeLookDownRight',
			'eyeLookInLeft',
			'eyeLookInRight',
			'eyeLookOutLeft',
			'eyeLookOutRight',
			'eyeLookUpLeft',
			'eyeLookUpRight',
			'eyeSquintLeft',
			'eyeSquintRight',
			'eyeWideLeft',
			'eyeWideRight'
		],
		brows: [
			'browDownLeft',
			'browDownRight',
			'browInnerUp',
			'browOuterUpLeft',
			'browOuterUpRight'
		],
		mouth: [
			'jawForward',
			'jawLeft',
			'jawRight',
			'jawOpen',
			'mouthClose',
			'mouthFunnel',
			'mouthPucker',
			'mouthLeft',
			'mouthRight',
			'mouthSmileLeft',
			'mouthSmileRight',
			'mouthFrownLeft',
			'mouthFrownRight',
			'mouthDimpleLeft',
			'mouthDimpleRight',
			'mouthStretchLeft',
			'mouthStretchRight',
			'mouthRollLower',
			'mouthRollUpper',
			'mouthShrugLower',
			'mouthShrugUpper',
			'mouthPressLeft',
			'mouthPressRight',
			'mouthLowerDownLeft',
			'mouthLowerDownRight',
			'mouthUpperUpLeft',
			'mouthUpperUpRight'
		],
		other: [
			'cheekPuff',
			'cheekSquintLeft',
			'cheekSquintRight',
			'noseSneerLeft',
			'noseSneerRight',
			'tongueOut',
			'neutral',
			'happy',
			'angry',
			'sad',
			'relaxed',
			'surprised'
		]
	};

	// Track expression values
	let expressionValues = $state<Record<string, number>>({});

	// Use stored expressions (persists across navigation)
	let availableExpressions = $derived(vrmStore.availableExpressions);

	// Filter categories to only show available expressions
	function getAvailableInCategory(category: string[]): string[] {
		return category.filter((name) => availableExpressions.includes(name));
	}

	// Set expression value
	function setExpression(name: string, value: number) {
		expressionValues[name] = value;
		const vrm = vrmStore.vrm;
		if (vrm?.expressionManager) {
			try {
				vrm.expressionManager.setValue(name, value);
				vrm.expressionManager.update();
			} catch {
				// Expression doesn't exist
			}
		}
	}

	// Reset all expressions
	function resetAll() {
		const vrm = vrmStore.vrm;
		if (vrm?.expressionManager) {
			for (const name of availableExpressions) {
				vrm.expressionManager.setValue(name, 0);
				expressionValues[name] = 0;
			}
			vrm.expressionManager.update();
		}
	}

	// Test blink
	function testBlink() {
		setExpression('eyeBlinkLeft', 1);
		setExpression('eyeBlinkRight', 1);
		setTimeout(() => {
			setExpression('eyeBlinkLeft', 0);
			setExpression('eyeBlinkRight', 0);
		}, 150);
	}

	// Test smile
	function testSmile() {
		setExpression('mouthSmileLeft', 0.8);
		setExpression('mouthSmileRight', 0.8);
		setExpression('cheekSquintLeft', 0.3);
		setExpression('cheekSquintRight', 0.3);
		setTimeout(() => {
			setExpression('mouthSmileLeft', 0);
			setExpression('mouthSmileRight', 0);
			setExpression('cheekSquintLeft', 0);
			setExpression('cheekSquintRight', 0);
		}, 1000);
	}

	// Test surprised
	function testSurprised() {
		setExpression('eyeWideLeft', 0.8);
		setExpression('eyeWideRight', 0.8);
		setExpression('browInnerUp', 0.7);
		setExpression('browOuterUpLeft', 0.5);
		setExpression('browOuterUpRight', 0.5);
		setExpression('jawOpen', 0.4);
		setTimeout(() => {
			setExpression('eyeWideLeft', 0);
			setExpression('eyeWideRight', 0);
			setExpression('browInnerUp', 0);
			setExpression('browOuterUpLeft', 0);
			setExpression('browOuterUpRight', 0);
			setExpression('jawOpen', 0);
		}, 1000);
	}

	// Test sad
	function testSad() {
		setExpression('browInnerUp', 0.6);
		setExpression('browDownLeft', 0.3);
		setExpression('browDownRight', 0.3);
		setExpression('mouthFrownLeft', 0.5);
		setExpression('mouthFrownRight', 0.5);
		setTimeout(() => {
			setExpression('browInnerUp', 0);
			setExpression('browDownLeft', 0);
			setExpression('browDownRight', 0);
			setExpression('mouthFrownLeft', 0);
			setExpression('mouthFrownRight', 0);
		}, 1000);
	}

	// Open mouth for testing
	function testMouthOpen() {
		setExpression('jawOpen', 0.7);
		setTimeout(() => {
			setExpression('jawOpen', 0);
		}, 500);
	}

	// Clear all VRM storage (IndexedDB)
	let clearingStorage = $state(false);
	async function clearVrmStorage() {
		clearingStorage = true;
		try {
			const vrmStorage = localforage.createInstance({
				name: 'utsuwa-vrm',
				storeName: 'models'
			});
			await vrmStorage.clear();
			// console.log('VRM storage cleared');
			// Reload to reset state
			window.location.reload();
		} catch (e) {
			console.error('Failed to clear VRM storage:', e);
		}
		clearingStorage = false;
	}

	// Trigger a test event
	async function triggerEvent(event: typeof testEvents[0]) {
		debugEventsStore.trigger(event);
		// Navigate to home to show the event
		await goto('/');
	}

	// Clear all character data
	async function clearCharacterData() {
		try {
			indexedDB.deleteDatabase('utsuwa-db');
			// console.log('Character database cleared');
			window.location.reload();
		} catch (e) {
			console.error('Failed to clear character data:', e);
		}
	}
</script>

<div class="developer-settings">
	<div class="dev-header">
		<div>
			<h2>Developer Tools</h2>
			<p class="description">Test and debug VRM facial expressions and animations.</p>
		</div>
	</div>

	<div class="dev-layout">
		<!-- Viewport -->
		<div class="viewport-container">
			<div class="viewport">
				<VrmScene centered />
			</div>
			<div class="viewport-controls">
				<button class="viewport-btn" onclick={resetAll} title="Reset expressions">
					<Icon name="refresh-cw" size={16} />
					Reset
				</button>
			</div>
		</div>

		<!-- Controls Panel -->
		<div class="controls-panel">
			<!-- Animation Selection -->
		<section class="section">
			<h3>Animation</h3>
			<p class="hint">Select an animation to play on the model.</p>
			<div class="animation-select">
				<select
					value={vrmStore.currentAnimation || 'none'}
					onchange={(e) => vrmStore.setCurrentAnimation(e.currentTarget.value === 'none' ? null : e.currentTarget.value)}
				>
					{#each vrmStore.availableAnimations as anim}
						<option value={anim.id}>{anim.name}</option>
					{/each}
				</select>
			</div>
		</section>

		<!-- Material Debug -->
		<section class="section">
			<h3>Material Debug</h3>
			<p class="hint">Visualize different material properties (MToon).</p>
			<div class="animation-select">
				<select
					value={currentDebugMode}
					onchange={(e) => setMaterialDebugMode(e.currentTarget.value)}
				>
					{#each materialDebugModes as mode}
						<option value={mode.id}>{mode.name}</option>
					{/each}
				</select>
			</div>
		</section>

		<!-- Quick Actions -->
		<section class="section">
			<h3>Quick Tests</h3>
			<div class="quick-actions">
				<button class="action-btn" onclick={testBlink}>Test Blink</button>
				<button class="action-btn" onclick={testSmile}>Test Smile</button>
				<button class="action-btn" onclick={testSurprised}>Test Surprised</button>
				<button class="action-btn" onclick={testSad}>Test Sad</button>
				<button class="action-btn" onclick={testMouthOpen}>Test Mouth Open</button>
				<button class="action-btn reset" onclick={resetAll}>Reset All</button>
			</div>
		</section>

		<!-- Events Debug -->
		<section class="section">
			<h3>Event System</h3>
			<p class="hint">Trigger test events to preview the event modal styling.</p>
			<div class="event-buttons">
				{#each testEvents as event}
					<button class="event-btn" onclick={() => triggerEvent(event)}>
						<Icon name={event.type === 'milestone' ? 'sparkles' : event.type === 'anniversary' ? 'calendar' : event.type === 'conditional' ? 'heart' : 'shuffle'} size={14} />
						{event.name}
					</button>
				{/each}
			</div>
		</section>

		<!-- Storage -->
		<section class="section">
			<h3>Storage</h3>
			<p class="hint">Clear cached data from browser storage.</p>
			<div class="quick-actions">
				<button class="action-btn reset" onclick={clearVrmStorage} disabled={clearingStorage}>
					{clearingStorage ? 'Clearing...' : 'Clear VRM Storage'}
				</button>
				<button class="action-btn reset" onclick={clearCharacterData}>
					Reset Character Data
				</button>
			</div>
		</section>

		<!-- Available Expressions Info -->
		<section class="section">
			<h3>Available Expressions ({availableExpressions.length})</h3>
			<p class="hint">This model supports the following expressions:</p>
			<div class="expression-tags">
				{#each availableExpressions as expr}
					<span class="tag">{expr}</span>
				{/each}
			</div>
		</section>

		<!-- Expression Sliders by Category -->
		{#each Object.entries(expressionCategories) as [category, expressions]}
			{@const available = getAvailableInCategory(expressions)}
			{#if available.length > 0}
				<section class="section">
					<h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
					<div class="sliders">
						{#each available as expr}
							<div class="slider-row">
								<label for={expr}>{expr}</label>
								<input
									type="range"
									id={expr}
									min="0"
									max="1"
									step="0.01"
									value={expressionValues[expr] || 0}
									oninput={(e) => setExpression(expr, parseFloat(e.currentTarget.value))}
								/>
								<span class="value">{(expressionValues[expr] || 0).toFixed(2)}</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/each}
		</div>
	</div>
</div>

<style>
	.developer-settings {
		max-width: 1400px;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.dev-header {
		margin-bottom: 1rem;
	}

	h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}


	.description {
		margin: 0;
		color: var(--text-secondary);
	}


	.dev-layout {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.viewport-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.viewport {
		flex: 1;
		min-height: 400px;
		background: linear-gradient(180deg, #f0f0f0 0%, #e5e5e5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 14px;
		overflow: hidden;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.05),
			0 2px 8px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .viewport {
		background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.viewport-controls {
		display: flex;
		gap: 0.5rem;
	}

	.viewport-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease-out;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .viewport-btn {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.viewport-btn:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .viewport-btn:hover {
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}


	.controls-panel {
		overflow-y: auto;
		min-height: 0;
		padding-right: 0.5rem;
		padding-bottom: 1rem;
	}

	.section {
		margin-bottom: 1.25rem;
		padding: 1.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 14px;
		box-shadow:
			0 3px 10px rgba(0, 0, 0, 0.06),
			0 1px 3px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .section {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 3px 10px rgba(0, 0, 0, 0.25),
			0 1px 3px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}


	.section h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}


	.hint {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.animation-select select {
		width: 100%;
		padding: 0.75rem 1rem;
		background: linear-gradient(180deg, #f8f8f8 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		font-size: 0.875rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s ease-out;
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.05),
			0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .animation-select select {
		background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.2),
			0 1px 0 rgba(255, 255, 255, 0.03);
	}


	.animation-select select:hover {
		border-color: rgba(1, 178, 255, 0.4);
	}

	.animation-select select:focus {
		outline: none;
		border-color: #01B2FF;
		box-shadow: 0 0 0 3px rgba(1, 178, 255, 0.15);
	}

	.quick-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease-out;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .action-btn {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}


	.action-btn:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .action-btn:hover {
		box-shadow:
			0 4px 10px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}


	.action-btn.reset {
		background: linear-gradient(180deg, #fff0f0 0%, #ffe5e5 100%);
		border-color: rgba(220, 38, 38, 0.2);
		color: var(--color-red-700);
	}

	:global(.dark) .action-btn.reset {
		background: linear-gradient(180deg, #3a2020 0%, #2a1515 100%);
		border-color: rgba(220, 38, 38, 0.3);
		color: var(--color-red-300);
	}

	.action-btn.reset:hover {
		background: linear-gradient(180deg, #ffe5e5 0%, #ffd5d5 100%);
		transform: translateY(-1px);
	}

	:global(.dark) .action-btn.reset:hover {
		background: linear-gradient(180deg, #4a2525 0%, #3a1a1a 100%);
	}

	.event-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.event-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: linear-gradient(180deg, #e8f7ff 0%, #d8f0ff 100%);
		border: 1px solid rgba(1, 178, 255, 0.3);
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #01B2FF;
		cursor: pointer;
		transition: all 0.15s ease-out;
		box-shadow:
			0 2px 6px rgba(1, 178, 255, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .event-btn {
		background: linear-gradient(180deg, #1a3040 0%, #152530 100%);
		border-color: rgba(1, 178, 255, 0.35);
		box-shadow:
			0 2px 6px rgba(1, 178, 255, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.event-btn:hover {
		transform: translateY(-2px);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .event-btn:hover {
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.expression-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tag {
		padding: 0.3rem 0.6rem;
		background: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 8px;
		font-size: 0.75rem;
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-secondary);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .tag {
		background: linear-gradient(180deg, #252525 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.06);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}


	.sliders {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slider-row {
		display: grid;
		grid-template-columns: 180px 1fr 50px;
		align-items: center;
		gap: 1rem;
	}

	.slider-row label {
		font-size: 0.8125rem;
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-secondary);
	}


	.slider-row input[type='range'] {
		width: 100%;
		height: 8px;
		background: linear-gradient(180deg, #d0d0d0 0%, #e0e0e0 100%);
		border-radius: 4px;
		outline: none;
		-webkit-appearance: none;
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.15),
			0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .slider-row input[type='range'] {
		background: linear-gradient(180deg, #1a1a1a 0%, #252525 100%);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.4),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}


	.slider-row input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		border-radius: 50%;
		cursor: pointer;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		transition: transform 0.1s ease-out;
	}

	.slider-row input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.slider-row .value {
		font-size: 0.75rem;
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-tertiary);
		text-align: right;
	}

	@media (max-width: 900px) {
		.dev-layout {
			grid-template-columns: 1fr;
		}

		.viewport {
			min-height: 300px;
			max-height: 350px;
		}
	}

	@media (max-width: 640px) {
		.dev-header {
			margin-bottom: 0.75rem;
		}

		h2 {
			font-size: 1.25rem;
		}

		.description {
			font-size: 0.875rem;
		}

		.viewport {
			min-height: 240px;
			max-height: 280px;
		}

		.viewport-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.section {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		.section h3 {
			font-size: 0.9rem;
			margin-bottom: 0.75rem;
		}

		.hint {
			font-size: 0.8125rem;
			margin-bottom: 0.625rem;
		}

		.quick-actions {
			gap: 0.375rem;
		}

		.action-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.8125rem;
		}

		.event-buttons {
			gap: 0.375rem;
		}

		.event-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}

		.expression-tags {
			gap: 0.25rem;
		}

		.tag {
			padding: 0.1875rem 0.375rem;
			font-size: 0.6875rem;
		}

		.slider-row {
			grid-template-columns: 1fr 50px;
		}

		.slider-row label {
			grid-column: 1 / -1;
			margin-bottom: -0.5rem;
			font-size: 0.75rem;
		}

		.slider-row .value {
			font-size: 0.6875rem;
		}
	}

	@media (max-width: 400px) {
		.viewport {
			min-height: 200px;
			max-height: 240px;
		}

		.event-btn span {
			display: none;
		}

		.event-btn {
			padding: 0.5rem;
		}
	}
</style>
