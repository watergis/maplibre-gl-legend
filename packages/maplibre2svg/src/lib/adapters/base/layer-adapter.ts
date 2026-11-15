import type { RenderContext, RenderedSymbol } from '../../render';
import type { EvaluatedLayer, GeometryType, PropertyGroup } from '../../style';

/** A paint or layout property which a layer can be classified by, e.g. `['paint', 'fill-color']` */
export type ClassificationAxisSpec = readonly [group: PropertyGroup, name: string];

/**
 * What the legend knows about one layer type, in one place: the geometry its features have,
 * the properties its classes are taken from, and how the symbol of a class is drawn.
 *
 * Every layer type of the style specification has an adapter; a type without one gets the
 * neutral symbol of `DefaultAdapter`. An adapter is stateless: one instance serves every
 * layer of its type.
 *
 * ```ts
 * class MyFillAdapter extends FillAdapter {
 *   override render(layer: EvaluatedLayer, ctx: RenderContext) { ... }
 * }
 * createLegend(style, { adapters: [new MyFillAdapter()] });
 * ```
 */
export abstract class LayerAdapter {
	/** the layer type, e.g. `fill` */
	abstract readonly type: string;

	/**
	 * The geometry type of the features which the layer type draws, which expressions with
	 * `["geometry-type"]` are evaluated for
	 */
	readonly geometryType: GeometryType = 'Unknown';

	/**
	 * The properties which the classes of a layer are taken from, in order of priority: the
	 * first one whose value depends on the feature (a `match`, `case`, `step` or
	 * `interpolate`) classifies the layer
	 */
	readonly classificationAxes: readonly ClassificationAxisSpec[] = [];

	/**
	 * Inputs besides the feature which classify the layer type, such as `elevation` for
	 * `color-relief`. Their classes have no representative feature: the output of each branch
	 * stands in for the node.
	 */
	readonly classifyingInputs?: ReadonlySet<string>;

	/** Draw the symbol of one class: the layer evaluated for its representative feature */
	abstract render(
		layer: EvaluatedLayer,
		ctx: RenderContext
	): RenderedSymbol | Promise<RenderedSymbol>;
}
