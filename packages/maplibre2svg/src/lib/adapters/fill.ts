import { paintColor, type Paint, type Swatch } from '../render';
import type { Attrs } from '../render/svg';
import type { EvaluatedLayer } from '../style';
import { AreaAdapter } from './area';

/** Width of the outline, as MapLibre draws it */
const OUTLINE_WIDTH = 1;

/** The outline of a fill, and whether it is a border of its own color */
export type FillOutline = Paint & { distinct: boolean };

/**
 * The outline of a fill as MapLibre draws it: `fill-outline-color` when set, else the fill
 * color, and only when `fill-antialias` is on. `distinct` tells whether it differs from the
 * fill, i.e. whether it is a border of its own. Undefined when there is none.
 */
export function fillOutline(layer: EvaluatedLayer, fillOpacity: number): FillOutline | undefined {
	if (layer.paint['fill-antialias'] === false) return undefined;
	const fill = paintColor(layer.paint['fill-color'], fillOpacity);
	const explicit = layer.paint['fill-outline-color'];
	if (explicit === undefined) return { ...fill, distinct: false };
	const outline = paintColor(explicit, fillOpacity);
	const distinct = outline.color !== fill.color || outline.opacity !== fill.opacity;
	return { ...outline, distinct };
}

/**
 * `fill`: a rectangle of `fill-color` × `fill-opacity` (or `fill-pattern`). An outline of its
 * own color is drawn 1px wide, inset by half a pixel so that the edge of the SVG does not clip
 * it. Otherwise the neutral frame stands in for the outline of the fill color, which would
 * vanish for a light fill; without the frame, that outline is drawn as MapLibre does.
 */
export class FillAdapter extends AreaAdapter {
	readonly type = 'fill';
	readonly geometryType = 'Polygon';
	readonly classificationAxes = [
		['paint', 'fill-color'],
		['paint', 'fill-pattern'],
		['paint', 'fill-outline-color'],
		['paint', 'fill-opacity']
	] as const;
	protected readonly colorProperty = 'fill-color';
	protected readonly opacityProperty = 'fill-opacity';
	protected readonly patternProperty = 'fill-pattern';

	protected override framed(layer: EvaluatedLayer): boolean {
		return !fillOutline(layer, this.alpha(layer))?.distinct;
	}

	protected override shape(layer: EvaluatedLayer, swatch: Swatch, fill: Attrs): Element {
		const outline = fillOutline(layer, this.alpha(layer));
		const framed = swatch.framed && !outline?.distinct;
		const stroke = outline && (outline.distinct || !framed) ? outline : undefined;
		return swatch.insetRect({
			...fill,
			stroke: stroke?.color,
			'stroke-opacity': stroke?.opacity,
			'stroke-width': stroke ? OUTLINE_WIDTH : undefined
		});
	}
}
