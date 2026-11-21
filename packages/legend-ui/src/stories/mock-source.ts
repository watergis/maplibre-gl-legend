import type { LayerSpecification } from 'maplibre-gl';
import type { LayerSymbol, LegendSource } from '../lib/types/legend-source';

/** Options of {@link MockSource} */
export interface MockSourceOptions {
	/** the layers of the style, in the order of `style.layers` */
	layers: LayerSpecification[];
	/** the IDs of the layers rendered in the view. Default: all layers */
	rendered?: string[];
	/** the IDs of the hidden layers. Default: none */
	hidden?: string[];
	/** draw the symbol of a layer. Default: a swatch of the color of the layer */
	createSymbol?: (layer: LayerSpecification) => Promise<LayerSymbol>;
}

/**
 * A {@link LegendSource} without a map, for the stories and the tests: the layers, their
 * visibility and the rendered layers are kept in memory.
 */
export class MockSource implements LegendSource {
	readonly layers: LayerSpecification[];
	rendered: Set<string>;
	readonly hidden: Set<string>;
	/** the layers passed to openStyleEditor */
	readonly editedLayers: string[] = [];
	/** called after the visibility of layers is changed, e.g. to refresh the panel */
	onChange?: () => void;
	private readonly drawSymbol?: (layer: LayerSpecification) => Promise<LayerSymbol>;

	constructor(options: MockSourceOptions) {
		this.layers = options.layers;
		this.rendered = new Set(options.rendered ?? options.layers.map((l) => l.id));
		this.hidden = new Set(options.hidden ?? []);
		this.drawSymbol = options.createSymbol;
	}

	getLayers(): LayerSpecification[] {
		return this.layers;
	}

	getRenderedLayerIds(): Set<string> {
		// a hidden layer is not rendered
		return new Set([...this.rendered].filter((id) => !this.hidden.has(id)));
	}

	isLayerVisible(layerId: string): boolean {
		return !this.hidden.has(layerId);
	}

	setLayersVisibility(layerIds: string[], visible: boolean): void {
		for (const id of layerIds) {
			if (visible) this.hidden.delete(id);
			else this.hidden.add(id);
		}
		this.onChange?.();
	}

	createSymbol(layer: LayerSpecification): Promise<LayerSymbol> {
		if (this.drawSymbol) return this.drawSymbol(layer);
		return Promise.resolve(swatchSymbol(layer));
	}

	openStyleEditor(layerId: string): void {
		this.editedLayers.push(layerId);
	}
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** the color of a layer: its fill, line or circle color, or gray */
function layerColor(layer: LayerSpecification): string {
	const paint = (layer as { paint?: Record<string, unknown> }).paint ?? {};
	const color = paint['fill-color'] ?? paint['line-color'] ?? paint['circle-color'];
	return typeof color === 'string' ? color : '#9ca3af';
}

/** a symbol drawn without maplibre2svg: a swatch by the type of the layer */
export function swatchSymbol(layer: LayerSpecification): LayerSymbol {
	if (typeof document === 'undefined') return { type: 'error' };
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('width', '20');
	svg.setAttribute('height', '20');
	svg.setAttribute('viewBox', '0 0 20 20');
	const color = layerColor(layer);
	let shape: SVGElement;
	if (layer.type === 'line') {
		shape = document.createElementNS(SVG_NS, 'line');
		shape.setAttribute('x1', '2');
		shape.setAttribute('y1', '10');
		shape.setAttribute('x2', '18');
		shape.setAttribute('y2', '10');
		shape.setAttribute('stroke', color);
		shape.setAttribute('stroke-width', '3');
	} else if (layer.type === 'circle') {
		shape = document.createElementNS(SVG_NS, 'circle');
		shape.setAttribute('cx', '10');
		shape.setAttribute('cy', '10');
		shape.setAttribute('r', '6');
		shape.setAttribute('fill', color);
	} else {
		shape = document.createElementNS(SVG_NS, 'rect');
		shape.setAttribute('x', '2');
		shape.setAttribute('y', '3');
		shape.setAttribute('width', '16');
		shape.setAttribute('height', '14');
		shape.setAttribute('fill', color);
		shape.setAttribute('stroke', '#555');
	}
	svg.appendChild(shape);
	return { type: 'single', svg };
}

/** a classified symbol: a swatch and a label per class, stacked */
export function classesSymbol(classes: { label: string; color: string }[]): LayerSymbol {
	const svg = document.createElementNS(SVG_NS, 'svg');
	const height = classes.length * 20;
	svg.setAttribute('width', '120');
	svg.setAttribute('height', String(height));
	svg.setAttribute('viewBox', `0 0 120 ${height}`);
	classes.forEach(({ label, color }, i) => {
		const line = document.createElementNS(SVG_NS, 'line');
		line.setAttribute('x1', '2');
		line.setAttribute('x2', '18');
		line.setAttribute('y1', String(i * 20 + 10));
		line.setAttribute('y2', String(i * 20 + 10));
		line.setAttribute('stroke', color);
		line.setAttribute('stroke-width', '3');
		const text = document.createElementNS(SVG_NS, 'text');
		text.setAttribute('x', '26');
		text.setAttribute('y', String(i * 20 + 14));
		text.setAttribute('font-size', '12');
		text.setAttribute('fill', 'currentColor');
		text.textContent = label;
		svg.append(line, text);
	});
	return { type: 'classes', svg };
}
