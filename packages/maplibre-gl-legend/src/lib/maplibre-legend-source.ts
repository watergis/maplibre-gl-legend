import type { LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import { createLayerLegend, createLegendCache, legendToSvg } from '@watergis/maplibre2svg';
import type { LayerSymbol, LegendSource } from '@watergis/legend-ui';

/** Options of {@link MaplibreLegendSource} */
export interface MaplibreLegendSourceOptions {
	/** called after the visibility of layers is changed by the legend */
	onVisibilityChange?: () => void;
	/** open the style editor of a layer */
	openStyleEditor?: (layerId: string, title: string) => void;
}

/**
 * The legend source of a MapLibre map: the layers of its style, the layers rendered in the view,
 * their visibility, and their legend symbols drawn with maplibre2svg.
 */
export class MaplibreLegendSource implements LegendSource {
	// keeps the glyphs and tiles loaded for the legend between redraws
	private readonly cache = createLegendCache();
	private readonly map: MaplibreMap;
	private readonly options: MaplibreLegendSourceOptions;

	constructor(map: MaplibreMap, options: MaplibreLegendSourceOptions = {}) {
		this.map = map;
		this.options = options;
	}

	getLayers(): LayerSpecification[] {
		return this.map.getStyle()?.layers ?? [];
	}

	getRenderedLayerIds(): Set<string> {
		const ids = new Set<string>();
		for (const feature of this.map.queryRenderedFeatures()) ids.add(feature.layer.id);
		return ids;
	}

	isLayerVisible(layerId: string): boolean {
		return this.map.getLayoutProperty(layerId, 'visibility') !== 'none';
	}

	setLayersVisibility(layerIds: string[], visible: boolean): void {
		for (const layerId of layerIds) {
			if (!this.map.getLayer(layerId)) continue;
			this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
		}
		this.options.onVisibilityChange?.();
	}

	async createSymbol(layer: LayerSpecification): Promise<LayerSymbol> {
		const map = this.map;
		const legend = await createLayerLegend(layer, map.getStyle(), {
			zoom: map.getZoom(),
			center: map.getCenter().toArray(),
			getImage: (id) => {
				const image = map.getImage(id);
				const rgba = image?.data;
				if (!rgba || !('data' in rgba)) return undefined;
				return {
					data: rgba.data,
					width: rgba.width,
					height: rgba.height,
					pixelRatio: image.pixelRatio,
					sdf: image.sdf
				};
			},
			listImages: () => map.listImages(),
			cache: this.cache
		});
		if (legend.entries.length === 0) return { type: 'none' };
		if (legend.entries.length === 1) return { type: 'single', svg: legend.entries[0].svg };
		// a classified layer: its classes (symbol and label) under the layer row
		return { type: 'classes', svg: legendToSvg([legend], { titles: 'never' }) };
	}

	openStyleEditor(layerId: string, title: string): void {
		this.options.openStyleEditor?.(layerId, title);
	}
}
