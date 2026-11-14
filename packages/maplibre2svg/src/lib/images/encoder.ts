import type { ImageEncoder } from '../types';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function draw(ctx: Context2D | null, rgba: Uint8ClampedArray, width: number, height: number) {
	if (!ctx || typeof ImageData === 'undefined') return false;
	ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return true;
}

function blobToDataUrl(blob: Blob): Promise<string | undefined> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
		reader.onerror = () => resolve(undefined);
		reader.readAsDataURL(blob);
	});
}

/**
 * The encoder of the environment: a canvas of the document, else an `OffscreenCanvas`, into
 * a PNG data URL. Gives undefined where neither can draw, such as in Node or happy-dom, and
 * never throws.
 */
export function defaultEncoder(doc: Document): ImageEncoder {
	return async (rgba, width, height) => {
		if (width <= 0 || height <= 0) return undefined;
		try {
			const canvas = doc.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			if (
				typeof canvas.getContext === 'function' &&
				draw(canvas.getContext('2d'), rgba, width, height)
			) {
				const url = canvas.toDataURL('image/png');
				if (url.startsWith('data:image/png')) return url;
			}
		} catch {
			// no DOM canvas: try the next
		}
		try {
			if (typeof OffscreenCanvas === 'undefined' || typeof FileReader === 'undefined')
				return undefined;
			const canvas = new OffscreenCanvas(width, height);
			if (!draw(canvas.getContext('2d'), rgba, width, height)) return undefined;
			return await blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
		} catch {
			return undefined;
		}
	};
}
