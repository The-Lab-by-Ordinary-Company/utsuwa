import { browser } from '$app/environment';
import localforage from 'localforage';

// "Traces of life": the images you've shown her. Stored locally only. The blob
// never leaves the device; only the single vision inference does. Mirrors the
// VRM blob store in stores/vrm.svelte.ts.
const keepsakeStorage = browser
	? localforage.createInstance({ name: 'utsuwa-keepsakes', storeName: 'images' })
	: null;

export interface PreparedImage {
	id: string;
	mimeType: string;
	base64: string; // raw base64, no data: prefix
	blob: Blob;
}

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/** Read a picked or dropped image into the shape we need to show it and maybe keep it. */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
	const base64 = await blobToBase64(file);
	return {
		id: crypto.randomUUID(),
		mimeType: file.type || 'image/png',
		base64,
		blob: file
	};
}

/** Persist a shown image as a keepsake. Call when it becomes a kept memory. */
export async function keepImage(id: string, blob: Blob): Promise<void> {
	await keepsakeStorage?.setItem(`keepsake-blob-${id}`, blob);
}

export async function getKeepsakeBlob(id: string): Promise<Blob | null> {
	return (await keepsakeStorage?.getItem<Blob>(`keepsake-blob-${id}`)) ?? null;
}

/** Object URL for display. Caller revokes it when done. */
export async function getKeepsakeImageUrl(id: string): Promise<string | null> {
	const blob = await getKeepsakeBlob(id);
	return blob ? URL.createObjectURL(blob) : null;
}

/** She forgets it: hard-delete the blob. */
export async function forgetKeepsakeImage(id: string): Promise<void> {
	await keepsakeStorage?.removeItem(`keepsake-blob-${id}`);
}
