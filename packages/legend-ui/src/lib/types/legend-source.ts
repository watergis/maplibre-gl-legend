import type { LayerSpecification } from 'maplibre-gl';

/** A class of a layer styled by data: its symbol and its label */
export interface LegendClass {
	/** the symbol, with `width` and `height` attributes */
	svg: SVGElement;
	label: string;
}

/**
 * The legend symbol of a layer:
 *
 * - `none`: the layer has nothing to draw. It is not listed.
 * - `single`: one symbol, shown next to the title of the layer.
 * - `classes`: a layer styled by data, with a symbol and a label per class, shown under the title
 *   as a row per class. The rows are HTML, so long labels wrap to the width of the panel.
 * - `error`: the symbol could not be drawn. A fallback icon is shown.
 */
export type LayerSymbol =
	| { type: 'none' }
	| { type: 'single'; svg: SVGElement }
	| { type: 'classes'; classes: LegendClass[] }
	| { type: 'error' };

/**
 * What the legend panel needs from the map. The plugin implements it with a MapLibre map; the
 * stories implement it with mock data.
 */
export interface LegendSource {
	/** all layers of the style, in the order of `style.layers` */
	getLayers(): LayerSpecification[];
	/** the IDs of the layers which have features rendered in the current view */
	getRenderedLayerIds(): Set<string>;
	/** whether a layer is visible (its `visibility` is not `none`) */
	isLayerVisible(layerId: string): boolean;
	/** show / hide layers */
	setLayersVisibility(layerIds: string[], visible: boolean): void;
	/** draw the legend symbol of a layer at the current view */
	createSymbol(layer: LayerSpecification): Promise<LayerSymbol>;
	/** open the style editor of a layer (with `showStyleEditor`) */
	openStyleEditor?(layerId: string, title: string): void;
}
