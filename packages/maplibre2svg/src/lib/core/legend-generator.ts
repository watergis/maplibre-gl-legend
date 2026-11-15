import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { AdapterRegistry } from '../adapters/registry';
import { DEFAULT_SAMPLE, GlyphRenderer } from '../assets/glyphs';
import { ImageStore } from '../assets/images';
import { RasterSourceResolver } from '../assets/raster';
import { LayerClassifier } from '../classify';
import { LabelGenerator } from '../label';
import { RenderContext, Swatch, type RenderedSymbol } from '../render';
import { LayerEvaluator, type EvaluatedLayer } from '../style';
import { createLegendCache } from './cache';
import { resolveOptions, type ResolvedOptions } from './options';
import type { LayerLegend, LegendEntry, LegendOptions } from './types';

/**
 * Makes the legends of the layers of a style. For each layer:
 *
 * 1. `LayerClassifier` splits it into classes, each with the layer evaluated for a
 *    representative feature at the zoom;
 * 2. `LabelGenerator` labels the classes and applies `metadata.legend`;
 * 3. the `LayerAdapter` of the layer type draws the symbol of each class;
 * 4. the symbols of the layer are widened to the widest, so that their labels line up.
 *
 * One generator keeps one cache, so that an image or a glyph range is loaded once for all the
 * layers it makes legends of.
 *
 * ```ts
 * const generator = new LegendGenerator({ zoom: map.getZoom(), getImage });
 * const legends = await generator.createLegend(map.getStyle());
 * ```
 */
export class LegendGenerator {
	/** the options, with the defaults filled in */
	readonly options: ResolvedOptions;
	/** the adapters of the layer types */
	readonly adapters: AdapterRegistry;
	readonly #classifier: LayerClassifier;
	readonly #labels: LabelGenerator;

	constructor(options: LegendOptions = {}) {
		this.options = resolveOptions(options);
		this.adapters = AdapterRegistry.withDefaults(options.adapters);
		const evaluator = new LayerEvaluator(this.adapters.geometryTypeOf);
		this.#classifier = new LayerClassifier(this.adapters, evaluator);
		this.#labels = new LabelGenerator({ defaultLabel: this.options.defaultLabel });
	}

	/**
	 * The legend of one layer: one entry per class of the layer, or a single entry when the
	 * layer has no feature-dependent classification. The style gives the glyphs and the
	 * sources.
	 */
	async createLayerLegend(
		layer: LayerSpecification,
		style: StyleSpecification
	): Promise<LayerLegend> {
		const classes = this.#classifier.classify(layer, { zoom: this.options.zoom });
		const labelled = this.#labels.label(layer, classes);
		const symbols = await this.renderClasses(
			labelled.map((cls) => cls.layer),
			this.createRenderContext(style)
		);
		const entries: LegendEntry[] = labelled.map((cls, i) => {
			const symbol = symbols[i];
			// a ramp (heatmap) is one entry, labelled with the layer
			return { label: cls.text, kind: symbol.ramp ? 'ramp' : cls.kind, ...symbol };
		});
		return {
			layerId: layer.id,
			type: layer.type,
			label: this.#labels.layerLabel(layer),
			entries
		};
	}

	/** The legends of all layers of a style, in the order of the style */
	createLegend(style: StyleSpecification): Promise<LayerLegend[]> {
		return Promise.all(style.layers.map((layer) => this.createLayerLegend(layer, style)));
	}

	/**
	 * Draw the symbols of the classes of one layer with the adapter of its type. They share the
	 * widest width, with their content centered, so that the labels after them line up.
	 */
	async renderClasses(layers: EvaluatedLayer[], ctx: RenderContext): Promise<RenderedSymbol[]> {
		const withSiblings = ctx.withSiblings(layers);
		const symbols = await Promise.all(
			layers.map((layer) => this.adapters.get(layer.type).render(layer, withSiblings))
		);
		const width = Math.max(0, ...symbols.map((symbol) => symbol.width));
		return symbols.map((symbol) => Swatch.widen(symbol, width));
	}

	/** What the adapters draw with, from the options and the style */
	createRenderContext(style: StyleSpecification): RenderContext {
		const o = this.options;
		const glyphs =
			o.glyphs && typeof style.glyphs === 'string'
				? new GlyphRenderer({
						template: style.glyphs,
						fetchGlyphs: o.fetchGlyphs,
						cache: o.cache,
						encode: o.imageEncoder,
						pixelRatio: o.pixelRatio
					})
				: undefined;
		return new RenderContext({
			document: o.document,
			swatch: o.swatch,
			images: new ImageStore({
				getImage: o.getImage,
				listImages: o.listImages,
				encode: o.imageEncoder,
				cache: o.cache
			}),
			pixelRatio: o.pixelRatio,
			text: { glyphs, sampleText: o.sampleText ?? DEFAULT_SAMPLE, measure: o.measureText },
			raster: new RasterSourceResolver({
				sources: { ...style.sources, ...o.sources },
				center: o.center ?? [0, 0],
				zoom: o.zoom,
				pixelRatio: o.pixelRatio,
				resolveUrl: o.resolveRasterUrl,
				loadImage: o.loadImage,
				cache: o.cache
			})
		});
	}
}

/**
 * Create the legend of one layer of a style: one entry per class of the layer, or a single
 * entry when the layer has no feature-dependent classification
 */
export function createLayerLegend(
	layer: LayerSpecification,
	// the style gives the glyphs and the sources
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend> {
	return new LegendGenerator(options).createLayerLegend(layer, style);
}

/** Create the legends of all layers of a style, in the order of the style */
export function createLegend(
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend[]> {
	// one cache for all layers, so that an image or a glyph range is loaded once
	return new LegendGenerator({
		...options,
		cache: options.cache ?? createLegendCache()
	}).createLegend(style);
}
