import type { LegendImage } from '../lib';
import { hatch, sdfDisc } from './fixtures/images';

/** The sprite of the demo style */
export const DEMO_SPRITE = 'https://narwassco.github.io/mapbox-stylefiles/unvt/sprite/sprite';

/** Where the stories get the images of the style from */
export interface StoryImages {
	getImage: (id: string) => LegendImage | undefined;
	listImages: () => string[];
}

interface SpriteEntry {
	x: number;
	y: number;
	width: number;
	height: number;
	pixelRatio?: number;
	sdf?: boolean;
}

async function loadPixels(url: string): Promise<ImageData> {
	const image = new Image();
	image.crossOrigin = 'anonymous';
	image.src = url;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no canvas');
	ctx.drawImage(image, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Cut one image out of the sheet of the sprite */
function cut(sheet: ImageData, entry: SpriteEntry): LegendImage {
	const data = new Uint8ClampedArray(entry.width * entry.height * 4);
	for (let row = 0; row < entry.height; row++) {
		const start = ((entry.y + row) * sheet.width + entry.x) * 4;
		data.set(sheet.data.subarray(start, start + entry.width * 4), row * entry.width * 4);
	}
	return {
		data,
		width: entry.width,
		height: entry.height,
		pixelRatio: entry.pixelRatio ?? 1,
		sdf: entry.sdf === true
	};
}

/**
 * Load a sprite (JSON and PNG) as MapLibre does, with `@2x` on high-density screens and the
 * plain one when that fails
 */
export async function loadSprite(base: string): Promise<StoryImages> {
	const suffixes = window.devicePixelRatio > 1 ? ['@2x', ''] : [''];
	let lastError: unknown;
	for (const suffix of suffixes) {
		try {
			const index = (await (await fetch(`${base}${suffix}.json`)).json()) as Record<
				string,
				SpriteEntry
			>;
			const sheet = await loadPixels(`${base}${suffix}.png`);
			const images = new Map<string, LegendImage>();
			return {
				getImage: (id) => {
					const entry = index[id];
					if (!entry) return undefined;
					if (!images.has(id)) images.set(id, cut(sheet, entry));
					return images.get(id);
				},
				listImages: () => Object.keys(index)
			};
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

/** Images made in code, see `fixtures/images.ts` */
export const GENERATED_IMAGES: Record<string, LegendImage> = {
	'disc-sdf': sdfDisc(48, 2),
	hatch: hatch()
};

let demo: Promise<StoryImages> | undefined;

/**
 * The images of the stories: the demo sprite and the generated images. Without the network,
 * the generated images only.
 */
export async function storyImages(): Promise<StoryImages> {
	demo ??= loadSprite(DEMO_SPRITE).catch(() => ({
		getImage: () => undefined,
		listImages: () => []
	}));
	const sprite = await demo;
	return {
		getImage: (id) => GENERATED_IMAGES[id] ?? sprite.getImage(id),
		listImages: () => [...Object.keys(GENERATED_IMAGES), ...sprite.listImages()]
	};
}
