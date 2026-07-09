import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDisplaySettings, sanitizeCamera } from './display-parser.ts';
import { PHYSICS_INTENSITY_DEFAULT } from '../engine/spring-physics.ts';
import {
	CAMERA_DEFAULTS,
	CAMERA_LIMITS,
	DEFAULT_CHAT_DISPLAY_MODE,
	DEFAULT_SIDEBAR_POSITION
} from './display-types.ts';

test('returns defaults for null input', () => {
	const result = parseDisplaySettings(null);
	assert.deepEqual(result.camera, CAMERA_DEFAULTS);
	assert.deepEqual(result.overlayCamera, CAMERA_DEFAULTS);
	assert.equal(result.physicsIntensity, PHYSICS_INTENSITY_DEFAULT);
	assert.equal(result.chatDisplayMode, DEFAULT_CHAT_DISPLAY_MODE);
	assert.equal(result.sidebarPosition, DEFAULT_SIDEBAR_POSITION);
});

test('returns defaults for invalid JSON string', () => {
	const result = parseDisplaySettings('not-json');
	assert.equal(result.chatDisplayMode, DEFAULT_CHAT_DISPLAY_MODE);
	assert.equal(result.sidebarPosition, DEFAULT_SIDEBAR_POSITION);
});

test('returns defaults for JSON null', () => {
	const result = parseDisplaySettings('null');
	assert.deepEqual(result.camera, CAMERA_DEFAULTS);
	assert.deepEqual(result.overlayCamera, CAMERA_DEFAULTS);
});

test('returns defaults for JSON array', () => {
	const result = parseDisplaySettings('[1,2,3]');
	assert.deepEqual(result.camera, CAMERA_DEFAULTS);
	assert.deepEqual(result.overlayCamera, CAMERA_DEFAULTS);
});

test('parses valid settings object', () => {
	const result = parseDisplaySettings({
		camera: { fov: 45, zoom: 1.5, height: 0.1 },
		overlayCamera: { fov: 30, zoom: 0.8, height: -0.1 },
		physicsIntensity: 0.75,
		chatDisplayMode: 'sidebar',
		sidebarPosition: 'left'
	});
	assert.deepEqual(result.camera, { fov: 45, zoom: 1.5, height: 0.1 });
	assert.deepEqual(result.overlayCamera, { fov: 30, zoom: 0.8, height: -0.1 });
	assert.equal(result.physicsIntensity, 0.75);
	assert.equal(result.chatDisplayMode, 'sidebar');
	assert.equal(result.sidebarPosition, 'left');
});

test('parses valid settings from JSON string', () => {
	const raw = JSON.stringify({
		camera: { fov: 40, zoom: 1.2, height: 0 },
		chatDisplayMode: 'both',
		sidebarPosition: 'right'
	});
	const result = parseDisplaySettings(raw);
	assert.equal(result.chatDisplayMode, 'both');
	assert.equal(result.sidebarPosition, 'right');
});

test('falls back to defaults for missing fields', () => {
	const result = parseDisplaySettings({});
	assert.deepEqual(result.camera, CAMERA_DEFAULTS);
	assert.deepEqual(result.overlayCamera, CAMERA_DEFAULTS);
	assert.equal(result.physicsIntensity, PHYSICS_INTENSITY_DEFAULT);
	assert.equal(result.chatDisplayMode, DEFAULT_CHAT_DISPLAY_MODE);
	assert.equal(result.sidebarPosition, DEFAULT_SIDEBAR_POSITION);
});

test('ignores invalid chat display mode values', () => {
	const result = parseDisplaySettings({ chatDisplayMode: 'floating' });
	assert.equal(result.chatDisplayMode, DEFAULT_CHAT_DISPLAY_MODE);
});

test('ignores invalid sidebar position values', () => {
	const result = parseDisplaySettings({ sidebarPosition: 'top' });
	assert.equal(result.sidebarPosition, DEFAULT_SIDEBAR_POSITION);
});

test('clamps out-of-range camera values', () => {
	const result = parseDisplaySettings({
		camera: { fov: 999, zoom: 999, height: 999 }
	});
	assert.equal(result.camera.fov, 60);
	assert.equal(result.camera.zoom, 2.5);
	assert.equal(result.camera.height, 0.5);
});

test('migrates legacy cameraDistance setting', () => {
	const result = parseDisplaySettings({ cameraDistance: 2.0 });
	assert.equal(result.camera.zoom, 1);
	assert.deepEqual(result.overlayCamera, result.camera);
});

test('uses main camera for overlay camera when overlay camera is missing', () => {
	const result = parseDisplaySettings({
		camera: { fov: 45, zoom: 1.5, height: 0.1 }
	});
	assert.deepEqual(result.overlayCamera, { fov: 45, zoom: 1.5, height: 0.1 });
});

test('returns defaults for undefined input', () => {
	const result = parseDisplaySettings(undefined);
	assert.deepEqual(result.camera, CAMERA_DEFAULTS);
	assert.deepEqual(result.overlayCamera, CAMERA_DEFAULTS);
	assert.equal(result.physicsIntensity, PHYSICS_INTENSITY_DEFAULT);
	assert.equal(result.chatDisplayMode, DEFAULT_CHAT_DISPLAY_MODE);
	assert.equal(result.sidebarPosition, DEFAULT_SIDEBAR_POSITION);
});

test('sanitizeCamera isolates and clamps camera values independently', () => {
	const raw = { fov: 999, zoom: -10, height: 2 };
	const sanitized = sanitizeCamera(raw);
	assert.deepEqual(sanitized, {
		fov: CAMERA_LIMITS.fov.max,
		zoom: CAMERA_LIMITS.zoom.min,
		height: CAMERA_LIMITS.height.max
	});
	// Original object must not be mutated
	assert.deepEqual(raw, { fov: 999, zoom: -10, height: 2 });
});

test('sanitizeCamera fills missing values from defaults', () => {
	const sanitized = sanitizeCamera({ zoom: 2.0 });
	assert.equal(sanitized.fov, CAMERA_DEFAULTS.fov);
	assert.equal(sanitized.zoom, 2.0);
	assert.equal(sanitized.height, CAMERA_DEFAULTS.height);
});
