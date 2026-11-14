import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { classifyLayer } from './classify';
import { labelClasses, layerLabelOf } from './label';
import { renderSymbols } from './layers';
import { resolveOptions } from './options';
import type { LayerLegend, LegendEntry, LegendOptions } from './types';

/**
 * Create the legend of one layer of a style: one entry per class of the layer, or a single
 * entry when the layer has no feature-dependent classification.
 */
export async function createLayerLegend(
	layer: LayerSpecification,
	// the style gives the sprite, glyphs and sources, which the renderers of later steps read
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend> {
	const resolved = resolveOptions(options);
	const classes = classifyLayer(layer, { zoom: resolved.zoom });
	const labelled = labelClasses(layer, classes, { defaultLabel: resolved.defaultLabel });
	const symbols = renderSymbols(
		labelled.map((cls) => cls.layer),
		{ document: resolved.document, swatch: resolved.swatch }
	);
	const entries: LegendEntry[] = labelled.map((cls, i) => ({
		label: cls.text,
		kind: cls.kind,
		...symbols[i]
	}));
	return { layerId: layer.id, type: layer.type, label: layerLabelOf(layer), entries };
}

/** Create the legends of all layers of a style, in the order of the style */
export async function createLegend(
	style: StyleSpecification,
	options: LegendOptions = {}
): Promise<LayerLegend[]> {
	return Promise.all(style.layers.map((layer) => createLayerLegend(layer, style, options)));
}
