import { isTauri } from '$lib/services/platform/platform';

// Puts a file where users expect downloads to land. Browsers get a normal
// download. The desktop webview drops blob: downloads on the floor, so the app
// writes straight into the Downloads folder instead (the only folder the fs
// capability allows writing to). Resolves true when it wrote the file itself,
// false when the browser took over.
export async function saveToDownloads(filename: string, blob: Blob): Promise<boolean> {
	if (isTauri()) {
		const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
		await writeFile(filename, new Uint8Array(await blob.arrayBuffer()), {
			baseDir: BaseDirectory.Download
		});
		return true;
	}
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
	return false;
}
