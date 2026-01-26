type ScreenshotCallback = () => void;

let screenshotCallback: ScreenshotCallback | null = null;

export const screenshotStore = {
	register(callback: ScreenshotCallback) {
		screenshotCallback = callback;
	},
	unregister() {
		screenshotCallback = null;
	},
	take() {
		screenshotCallback?.();
	}
};
