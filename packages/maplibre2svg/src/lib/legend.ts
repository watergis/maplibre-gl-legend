import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { createLegendCache } from './cache';
import { classifyLayer } from './classify';
import { labelClasses, layerLabelOf } from './label';
import { renderSymbols } from './layers';
import { resolveOptions } from './options';
import { renderContextOf } from './render-context';
import type { LayerLegend, LegendEntry, LegendOptions } from './types';

/**
 * Create the legend of one layer of a style: one entry per class of the layer, or a single
 * entry when the layer has no feature-dependent classification.
 */
export async function createLayerLegend(
	layer: LayerSpecification,
	// the style gives the glyphs and the sources
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend> {
	const resolved = resolveOptions(options);
	const classes = classifyLayer(layer, { zoom: resolved.zoom });
	const labelled = labelClasses(layer, classes, { defaultLabel: resolved.defaultLabel });
	const symbols = await renderSymbols(
		labelled.map((cls) => cls.layer),
		renderContextOf(resolved, style)
	);
	const entries: LegendEntry[] = labelled.map((cls, i) => {
		const symbol = symbols[i];
		// a ramp (heatmap) is one entry, labelled with the layer
		return { label: cls.text, kind: symbol.ramp ? 'ramp' : cls.kind, ...symbol };
	});
	return { layerId: layer.id, type: layer.type, label: layerLabelOf(layer), entries };
}

/** Create the legends of all layers of a style, in the order of the style */
export async function createLegend(
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend[]> {
	// one cache for all layers, so that an image or a glyph range is loaded once
	const shared = { ...options, cache: options.cache ?? createLegendCache() };
	return Promise.all(style.layers.map((layer) => createLayerLegend(layer, style, shared)));
}
