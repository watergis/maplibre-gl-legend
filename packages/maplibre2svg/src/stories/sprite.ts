import type { StyleSpecification } from 'maplibre-gl';
import type { LegendImage } from '../lib';
import { hatch } from './fixtures/images';

/** The demo style of the repository: non-SDF icons, glyphs of watergis/font-glyphs */
export const UNVT_STYLE = 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json';
/** The UNDP style, pinned: SDF icons (`icon-color`), a sprite array, Proxima Nova glyphs */
export const UNDP_STYLE = 'https://unpkg.com/@undp-data/style@2.5.0/dist/style.json';

/** Where the stories get the images of a style from */
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

const NO_IMAGES: StoryImages = { getImage: () => undefined, listImages: () => [] };

/** How long a sprite may take; a server which does not answer (CORS) is given up */
const SPRITE_TIMEOUT = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('timeout')), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}

/** The pixels of an image URL; `onload`, since `decode()` waits while the tab is hidden */
function loadPixels(url: string): Promise<ImageData> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) return reject(new Error('no canvas'));
			ctx.drawImage(image, 0, 0);
			resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
		};
		image.onerror = () => reject(new Error(`cannot load ${url}`));
		image.src = url;
	});
}

/** Cut one image out of the sheet of the sprite */
function cut(sheet: ImageData, entry: SpriteEntry): LegendImage {
	const data = new Uint8ClampedArray(entry.width * entry.height * 4);
	for (let row = 0; row < entry.height; row++) {
		const start = ((entry.y + row) * sheet.width + entry.x) * 4;
		data.set(sheet.data.subarray(start, start + entry.width * 4), row * entry.width * 4);
	}
	const pixelRatio = entry.pixelRatio ?? 1;
	return { data, width: entry.width, height: entry.height, pixelRatio, sdf: entry.sdf === true };
}

/**
 * Load a sprite (JSON and PNG) as MapLibre does, `@2x` on high-density screens and the plain
 * one when that fails. The ids get `prefix`, as MapLibre names the images of a sprite which is
 * not the `default` one of a sprite array (`esri:…`).
 */
export async function loadSprite(base: string, prefix = ''): Promise<StoryImages> {
	const suffixes = window.devicePixelRatio > 1 ? ['@2x', ''] : [''];
	let lastError: unknown;
	for (const suffix of suffixes) {
		try {
			const response = await fetch(`${base}${suffix}.json`);
			const index = (await response.json()) as Record<string, SpriteEntry>;
			const sheet = await loadPixels(`${base}${suffix}.png`);
			const images = new Map<string, LegendImage>();
			return {
				getImage: (id) => {
					if (!id.startsWith(prefix)) return undefined;
					const entry = index[id.slice(prefix.length)];
					if (!entry) return undefined;
					if (!images.has(id)) images.set(id, cut(sheet, entry));
					return images.get(id);
				},
				listImages: () => Object.keys(index).map((id) => prefix + id)
			};
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

/** Images from several sources, the first which has an id wins */
export function combine(...sources: StoryImages[]): StoryImages {
	return {
		getImage: (id) => sources.map((s) => s.getImage(id)).find((image) => image !== undefined),
		listImages: () => [...new Set(sources.flatMap((s) => s.listImages()))]
	};
}

/** A style and the images of its sprite(s) */
export interface LoadedStyle {
	url: string;
	style: StyleSpecification;
	images: StoryImages;
}

/**
 * Load a style and its sprite, a URL or an array of `{id, url}` resolved against the style
 * URL. A sprite which fails to load (such as one blocked by CORS) is left out.
 */
async function fetchStyle(url: string): Promise<LoadedStyle> {
	const style = (await (await fetch(url)).json()) as StyleSpecification;
	const sprite = style.sprite;
	const entries =
		typeof sprite === 'string'
			? [{ id: 'default', url: sprite }]
			: Array.isArray(sprite)
				? sprite
				: [];
	const sprites = await Promise.all(
		entries.map(({ id, url: spriteUrl }) =>
			withTimeout(
				loadSprite(new URL(spriteUrl, url).href, id === 'default' ? '' : `${id}:`),
				SPRITE_TIMEOUT
			).catch(() => NO_IMAGES)
		)
	);
	return { url, style, images: combine(...sprites) };
}

const styles = new Map<string, Promise<LoadedStyle>>();

/** A style and its images, loaded once per page */
export function loadStyle(url: string): Promise<LoadedStyle> {
	if (!styles.has(url)) styles.set(url, fetchStyle(url));
	return styles.get(url) as Promise<LoadedStyle>;
}

/** Images made in code: the sprites have no image meant as a fill pattern */
export const GENERATED_IMAGES: StoryImages = {
	getImage: (id) => (id === 'hatch' ? HATCH : undefined),
	listImages: () => ['hatch']
};
const HATCH = hatch();

/**
 * The images of the stories: the generated ones, the unvt sprite (non-SDF), then the UNDP
 * sprite (SDF). Without the network, the generated images only.
 */
export async function storyImages(): Promise<StoryImages> {
	const load = (url: string) =>
		loadStyle(url).then(
			(s) => s.images,
			() => NO_IMAGES
		);
	const [unvt, undp] = await Promise.all([load(UNVT_STYLE), load(UNDP_STYLE)]);
	return combine(GENERATED_IMAGES, unvt, undp);
}

/** The setup of a story which needs the images of the sprites */
export const withImages = () => ({ options: storyImages() });
