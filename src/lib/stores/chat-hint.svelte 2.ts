import { browser } from '$app/environment';

const PRIVACY_ACK_KEY = 'utsuwa-image-privacy-ack';

/**
 * Transient chat toasts (image hints, TTS errors) plus the one-time photo
 * privacy disclosure. Lives in a store so any input surface can raise them
 * while BottomChatBar, which is always mounted, renders them.
 */
function createChatHintStore() {
	let hint = $state<string | null>(null);
	let showPrivacy = $state(false);
	let hintTimer: ReturnType<typeof setTimeout> | null = null;

	function showHint(message: string) {
		hint = message;
		if (hintTimer) clearTimeout(hintTimer);
		hintTimer = setTimeout(() => (hint = null), 6000);
	}

	/** Shown once, the first time a photo is attached, then remembered. */
	function requestPrivacyNotice() {
		if (!browser || localStorage.getItem(PRIVACY_ACK_KEY) === '1') return;
		showPrivacy = true;
	}

	function ackPrivacy() {
		if (browser) localStorage.setItem(PRIVACY_ACK_KEY, '1');
		showPrivacy = false;
	}

	function destroy() {
		if (hintTimer) clearTimeout(hintTimer);
	}

	return {
		get hint() {
			return hint;
		},
		get showPrivacy() {
			return showPrivacy;
		},
		showHint,
		requestPrivacyNotice,
		ackPrivacy,
		destroy
	};
}

export const chatHintStore = createChatHintStore();
