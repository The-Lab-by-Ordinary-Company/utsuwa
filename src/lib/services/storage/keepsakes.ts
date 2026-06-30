import { browser } from '$app/environment';
import localforage from 'localforage';
import { computeScaledDimensions } from '$lib/services/chat/image-scaling';

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

// Downscale oversized images so we don't ship huge base64 to the model (or
// store huge blobs). Only re-encodes when the image is actually too big, so
// small screenshots keep their original format and transparency.
async function downscaleIfNeeded(file: Blob): Promise<{ blob: Blob; mimeType: string }> {
	const mimeType = file.type || 'image/png';
	try {
		const bitmap = await createImageBitmap(file);
		const { width, height } = computeScaledDimensions(bitmap.width, bitmap.height);
		if (width === bitmap.width && height === bitmap.height) {
			bitmap.close();
			return { blob: file, mimeType };
		}
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			bitmap.close();
			return { blob: file, mimeType };
		}
		ctx.drawImage(bitmap, 0, 0, width, height);
		bitmap.close();
		const scaled = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', 0.85)
		);
		return scaled ? { blob: scaled, mimeType: 'image/jpeg' } : { blob: file, mimeType };
	} catch {
		return { blob: file, mimeType };
	}
}

/** Read a picked or dropped image into the shape we need to show it and maybe keep it. */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
	const { blob, mimeType } = await downscaleIfNeeded(file);
	const base64 = await blobToBase64(blob);
	return {
		id: crypto.randomUUID(),
		mimeType,
		base64,
		blob
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
