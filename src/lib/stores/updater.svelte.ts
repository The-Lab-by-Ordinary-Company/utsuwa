import { browser } from '$app/environment';
import { isTauri } from '$lib/services/platform/platform';

type UpdateStatus =
	| 'idle'
	| 'checking'
	| 'available'
	| 'downloading'
	| 'ready'
	| 'uptodate'
	| 'error';

// Minimal shape of the Update object returned by @tauri-apps/plugin-updater.
interface TauriUpdate {
	version: string;
	body?: string;
	downloadAndInstall: (onEvent?: (event: DownloadEvent) => void) => Promise<void>;
}

type DownloadEvent =
	| { event: 'Started'; data: { contentLength?: number } }
	| { event: 'Progress'; data: { chunkLength: number } }
	| { event: 'Finished' };

function createUpdaterStore() {
	let status = $state<UpdateStatus>('idle');
	let availableVersion = $state<string | null>(null);
	let notes = $state<string | null>(null);
	let downloaded = $state(0);
	let contentLength = $state(0);
	let errorMessage = $state<string | null>(null);
	let dismissed = $state(false);

	// The Update handle isn't reactive — keep it out of $state.
	let pending: TauriUpdate | null = null;

	const currentVersion = `v${import.meta.env.VITE_APP_VERSION}`;

	async function check(opts: { silent?: boolean } = {}) {
		if (!browser || !isTauri()) return;
		if (status === 'checking' || status === 'downloading') return;

		status = 'checking';
		errorMessage = null;

		try {
			const { check } = await import('@tauri-apps/plugin-updater');
			const update = (await check()) as TauriUpdate | null;

			if (update) {
				pending = update;
				availableVersion = `v${update.version}`;
				notes = update.body?.trim() || null;
				dismissed = false;
				status = 'available';
			} else {
				status = 'uptodate';
			}
		} catch (e) {
			// A silent launch check shouldn't nag the user if they're just offline.
			if (opts.silent) {
				status = 'idle';
				return;
			}
			errorMessage = e instanceof Error ? e.message : String(e);
			status = 'error';
		}
	}

	async function install() {
		if (!pending) return;

		status = 'downloading';
		downloaded = 0;
		contentLength = 0;

		try {
			await pending.downloadAndInstall((event) => {
				switch (event.event) {
					case 'Started':
						contentLength = event.data.contentLength ?? 0;
						break;
					case 'Progress':
						downloaded += event.data.chunkLength;
						break;
					case 'Finished':
						status = 'ready';
						break;
				}
			});

			status = 'ready';
			const { relaunch } = await import('@tauri-apps/plugin-process');
			await relaunch();
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : String(e);
			status = 'error';
		}
	}

	function dismiss() {
		dismissed = true;
	}

	return {
		get status() {
			return status;
		},
		get availableVersion() {
			return availableVersion;
		},
		get notes() {
			return notes;
		},
		get currentVersion() {
			return currentVersion;
		},
		get errorMessage() {
			return errorMessage;
		},
		get dismissed() {
			return dismissed;
		},
		get progress() {
			if (contentLength <= 0) return 0;
			return Math.min(100, Math.round((downloaded / contentLength) * 100));
		},
		check,
		install,
		dismiss
	};
}

export const updaterStore = createUpdaterStore();
