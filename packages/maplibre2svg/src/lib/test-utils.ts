import type { LayerSpecification } from 'maplibre-gl';
import { classifyLayer } from './classify';
import { evaluateLayer, type EvaluatedLayer } from './expression';
import type { RenderContext } from './layers';
import { createLegendCache } from './cache';
import type { ImageEncoder, LegendImage, SwatchOptions } from './types';

/** A layer for tests */
export const testLayer = (
	type: string,
	paint: Record<string, unknown>,
	layout: Record<string, unknown> = {}
) => ({ id: 'test', type, source: 's', paint, layout }) as unknown as LayerSpecification;

/** The classes of a layer, with the value of one property each */
export const classSummary = (layer: LayerSpecification, zoom: number, property: string) =>
	classifyLayer(layer, { zoom }).map((c) => ({
		kind: c.kind,
		properties: c.properties,
		value: c.layer.paint[property] ?? c.layer.layout[property]
	}));

/** A layer evaluated at zoom 0 for a feature */
export const evaluatedLayer = (
	type: string,
	paint: Record<string, unknown> = {},
	layout: Record<string, unknown> = {},
	properties: Record<string, unknown> = {}
) => evaluateLayer(testLayer(type, paint, layout), { zoom: 0, properties });

/** An RGBA image of one color, `width × height` pixels */
export function solidImage(
	width: number,
	height: number,
	rgba: [number, number, number, number] = [255, 0, 0, 255],
	options: Partial<LegendImage> = {}
): LegendImage {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
	return { data, width, height, pixelRatio: 1, sdf: false, ...options };
}

/** An encoder which names the image by its size and first pixel, and counts its calls */
export function fakeEncoder() {
	const calls: string[] = [];
	const encode: ImageEncoder = (rgba, width, height) => {
		const url = `data:image/x-test,${width}x${height}/${[...rgba.slice(0, 4)].join(',')}`;
		calls.push(url);
		return url;
	};
	return { encode, calls };
}

/** A render context with the default swatch, and images from the map given */
export const renderContext = (
	siblings: EvaluatedLayer[] = [],
	images: Record<string, LegendImage> = {},
	swatch: Partial<SwatchOptions> = {}
): RenderContext => ({
	document,
	swatch: { width: 30, height: 20, maxSize: 40, frame: true, ...swatch },
	siblings,
	images: {
		getImage: (id) => images[id],
		listImages: () => Object.keys(images),
		encode: fakeEncoder().encode,
		cache: createLegendCache()
	},
	pixelRatio: 1,
	text: {
		glyphs: undefined,
		fetchGlyphs: () => Promise.reject(new Error('no glyphs in tests')),
		sampleText: 'Aa'
	}
});

/** The attributes of the first element of the name in a symbol */
export function attrsOf(root: Element, selector: string, index = 0) {
	const node = root.querySelectorAll(selector)[index];
	if (!node) throw new Error(`no ${selector} #${index}`);
	return Object.fromEntries([...node.attributes].map((a) => [a.name, a.value]));
}
