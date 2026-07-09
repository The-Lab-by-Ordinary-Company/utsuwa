import type { PhotoBackground, PhotoFrameId, PhotoSticker } from '$lib/stores/photomode.svelte';

// Composite-step drawing for photo captures. Frames are drawn programmatically
// so they stay crisp at any resolution and aspect ratio; no bitmap assets.

export function drawPhotoBackground(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	background: PhotoBackground
): void {
	if (background.type === 'solid' && background.value) {
		ctx.fillStyle = background.value;
		ctx.fillRect(0, 0, width, height);
	} else if (background.type === 'gradient' && background.value) {
		// Gradient value is "colorA,colorB", rendered top to bottom
		const [from, to] = background.value.split(',');
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, from?.trim() || '#ffffff');
		gradient.addColorStop(1, to?.trim() || '#ffffff');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
	}
	// 'room' captures the opaque scene as-is; 'transparent' leaves alpha alone
}

export function drawPhotoFrame(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	frame: PhotoFrameId
): void {
	if (frame === 'polaroid') {
		const side = Math.round(Math.min(width, height) * 0.045);
		const bottom = Math.round(Math.min(width, height) * 0.16);
		ctx.fillStyle = '#fdfdfa';
		// Four border bands rather than a hollow rect so alpha stays clean
		ctx.fillRect(0, 0, width, side); // top
		ctx.fillRect(0, 0, side, height); // left
		ctx.fillRect(width - side, 0, side, height); // right
		ctx.fillRect(0, height - bottom, width, bottom); // bottom
	} else if (frame === 'film') {
		const bar = Math.round(height * 0.12);
		ctx.fillStyle = '#0c0c0e';
		ctx.fillRect(0, 0, width, bar);
		ctx.fillRect(0, height - bar, width, bar);
		// Sprocket holes
		const hole = Math.round(bar * 0.38);
		const gap = hole * 2.2;
		ctx.fillStyle = '#f5f5f0';
		for (let x = gap / 2; x < width - hole; x += gap) {
			const y1 = (bar - hole) / 2;
			const y2 = height - bar + y1;
			ctx.fillRect(Math.round(x), Math.round(y1), hole, hole);
			ctx.fillRect(Math.round(x), Math.round(y2), hole, hole);
		}
	}
}

export function drawPhotoVignette(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number
): void {
	// Elliptical falloff drawn in a scaled unit space, matching the CSS
	// radial-gradient ellipse the live preview uses
	ctx.save();
	ctx.translate(width / 2, height / 2);
	ctx.scale(width / 2, height / 2);
	const gradient = ctx.createRadialGradient(0, 0, 0.55, 0, 0, 1);
	gradient.addColorStop(0, 'rgba(0,0,0,0)');
	gradient.addColorStop(1, 'rgba(0,0,0,0.38)');
	ctx.fillStyle = gradient;
	ctx.fillRect(-1, -1, 2, 2);
	ctx.restore();
}

const stickerImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadStickerImage(src: string): Promise<HTMLImageElement> {
	let cached = stickerImageCache.get(src);
	if (!cached) {
		cached = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Sticker failed to load: ${src}`));
			img.src = src;
		});
		cached.catch(() => stickerImageCache.delete(src));
		stickerImageCache.set(src, cached);
	}
	return cached;
}

// Stickers store their center and width as viewport fractions, so drawing is
// a straight remap onto the (possibly supersampled) output canvas.
export async function drawPhotoStickers(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	stickers: PhotoSticker[]
): Promise<void> {
	for (const sticker of stickers) {
		try {
			const img = await loadStickerImage(sticker.src);
			const drawWidth = sticker.width * width;
			const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth || 1);
			ctx.drawImage(
				img,
				sticker.x * width - drawWidth / 2,
				sticker.y * height - drawHeight / 2,
				drawWidth,
				drawHeight
			);
		} catch (e) {
			console.error('[PhotoMode] Sticker skipped in capture:', e);
		}
	}
}
