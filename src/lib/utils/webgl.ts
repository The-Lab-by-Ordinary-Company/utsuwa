/**
 * Reports whether a WebGL context can be created at all. Chrome blocks new
 * context creation for a page after a context loss ("was blocked"), in
 * which case `getContext` returns null — checked before we let Threlte
 * mount a Canvas so the page shows a fallback instead of crashing with an
 * uncaught WebGLRenderer error.
 */
export function isWebGLAvailable(): boolean {
	if (typeof document === 'undefined') return false;
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
		return gl != null;
	} catch {
		return false;
	}
}