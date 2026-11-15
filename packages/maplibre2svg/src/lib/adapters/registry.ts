import type { GeometryType } from '../style';
import { BackgroundAdapter } from './background';
import { CircleAdapter } from './circle';
import { ColorReliefAdapter } from './color-relief';
import { DefaultAdapter } from './default';
import { FillAdapter } from './fill';
import { FillExtrusionAdapter } from './fill-extrusion';
import { HeatmapAdapter } from './heatmap';
import { HillshadeAdapter } from './hillshade';
import type { LayerAdapter } from './base/layer-adapter';
import { LineAdapter } from './line';
import { RasterAdapter } from './raster';
import { SymbolAdapter } from './symbol';

/** The adapters of every layer type of the style specification */
export function defaultAdapters(): LayerAdapter[] {
	return [
		new FillAdapter(),
		new LineAdapter(),
		new CircleAdapter(),
		new FillExtrusionAdapter(),
		new BackgroundAdapter(),
		new SymbolAdapter(),
		new RasterAdapter(),
		new HillshadeAdapter(),
		new HeatmapAdapter(),
		new ColorReliefAdapter()
	];
}

/**
 * The adapters of the layer types, by type. A type without an adapter gets the fallback,
 * which draws the neutral symbol.
 */
export class AdapterRegistry {
	readonly #adapters = new Map<string, LayerAdapter>();
	readonly #fallback: LayerAdapter;

	constructor(
		adapters: Iterable<LayerAdapter> = [],
		fallback: LayerAdapter = new DefaultAdapter()
	) {
		this.#fallback = fallback;
		for (const adapter of adapters) this.register(adapter);
	}

	/** The registry of the built-in adapters, with `extra` added over them */
	static withDefaults(extra: Iterable<LayerAdapter> = []): AdapterRegistry {
		return new AdapterRegistry([...defaultAdapters(), ...extra]);
	}

	/** Add an adapter, replacing the one of its type if there is one */
	register(adapter: LayerAdapter): this {
		this.#adapters.set(adapter.type, adapter);
		return this;
	}

	/** The adapter of the layer type, or the fallback */
	get(type: string): LayerAdapter {
		return this.#adapters.get(type) ?? this.#fallback;
	}

	/** Whether the layer type has an adapter of its own */
	has(type: string): boolean {
		return this.#adapters.has(type);
	}

	/** The layer types which have an adapter */
	get types(): string[] {
		return [...this.#adapters.keys()];
	}

	/** The geometry type of the features of a layer type */
	geometryTypeOf = (type: string): GeometryType => this.get(type).geometryType;
}
