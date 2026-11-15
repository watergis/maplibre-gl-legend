import type { LayerSpecification } from 'maplibre-gl';
import { AdapterRegistry } from './adapters';
import { ImageStore } from './assets/images';
import { RasterSourceResolver } from './assets/raster';
import { LayerClassifier, type ClassifyOptions } from './classify';
import { createLegendCache } from './core/cache';
import type { ImageEncoder, LegendImage, SwatchOptions } from './core/types';
import { RenderContext, type RenderContextInit } from './render';
import { LayerEvaluator, type EvaluatedLayer, type EvaluateLayerOptions } from './style';

/** The built-in adapters */
export const adapters = AdapterRegistry.withDefaults();
const evaluator = new LayerEvaluator(adapters.geometryTypeOf);
const classifier = new LayerClassifier(adapters, evaluator);

/** Evaluate a layer as the legend does */
export const evaluateLayer = (layer: LayerSpecification, options: EvaluateLayerOptions) =>
	evaluator.evaluate(layer, options);

/** Classify a layer as the legend does */
export const classifyLayer = (layer: LayerSpecification, options: ClassifyOptions) =>
	classifier.classify(layer, options);

/** Draw the symbol of an evaluated layer with the adapter of its type */
export const renderSymbol = (layer: EvaluatedLayer, ctx: RenderContext) =>
	adapters.get(layer.type).render(layer, ctx);

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
): RenderContext =>
	new RenderContext({
		document,
		swatch: { width: 30, height: 20, maxSize: 40, frame: true, ...swatch },
		siblings,
		images: new ImageStore({
			getImage: (id) => images[id],
			listImages: () => Object.keys(images),
			encode: fakeEncoder().encode,
			cache: createLegendCache()
		}),
		pixelRatio: 1,
		text: { glyphs: undefined, sampleText: 'Aa' },
		raster: new RasterSourceResolver({
			sources: {},
			center: [0, 0],
			zoom: 0,
			pixelRatio: 1,
			cache: createLegendCache()
		})
	});

/** A copy of a render context with some of its parts changed */
export const withContext = (ctx: RenderContext, changes: Partial<RenderContextInit>) =>
	new RenderContext({ ...ctx, document: ctx.document, ...changes });

/** A copy of a render context whose encoder cannot encode, as without a canvas */
export const withoutEncoder = (ctx: RenderContext) =>
	withContext(ctx, { images: new ImageStore({ ...ctx.images, encode: () => undefined }) });

/** The attributes of the first element of the name in a symbol */
export function attrsOf(root: Element, selector: string, index = 0) {
	const node = root.querySelectorAll(selector)[index];
	if (!node) throw new Error(`no ${selector} #${index}`);
	return Object.fromEntries([...node.attributes].map((a) => [a.name, a.value]));
}
