import type { PreparedImage } from '$lib/services/storage/keepsakes';

export interface PendingPhoto {
	image: PreparedImage;
	url: string;
}

/**
 * The in-progress message: typed text plus queued photos. Lives outside the
 * input components so the draft survives moving between the floating bar and
 * the chat window's docked input.
 */
function createChatDraftStore() {
	let draft = $state('');
	let pending = $state<PendingPhoto[]>([]);

	function addPending(image: PreparedImage, url: string) {
		pending = [...pending, { image, url }];
	}

	function removePending(id: string) {
		pending = pending.filter((p) => {
			if (p.image.id === id) URL.revokeObjectURL(p.url);
			return p.image.id !== id;
		});
	}

	/** Drain the draft for sending: returns content, revokes URLs, clears state. */
	function takeAll(): { text: string; images: PreparedImage[] } {
		const text = draft.trim();
		const images = pending.map((p) => p.image);
		pending.forEach((p) => URL.revokeObjectURL(p.url));
		pending = [];
		draft = '';
		return { text, images };
	}

	return {
		get draft() {
			return draft;
		},
		set draft(value: string) {
			draft = value;
		},
		get pending() {
			return pending;
		},
		addPending,
		removePending,
		takeAll
	};
}

export const chatDraftStore = createChatDraftStore();
