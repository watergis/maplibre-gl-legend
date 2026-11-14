import { evaluateProperty, type EvaluatedLayer } from '../expression';
import { el, uniqueId } from '../svg';
import { paintColor } from './common';

/** How many stops sample `line-gradient` along the line */
const SAMPLES = 11;

/**
 * A `<linearGradient>` of `line-gradient`, evaluated with `line-progress` from 0 to 1 along
 * the line from `x1` to `x2`, or undefined when the layer has none. Its id is unique on the
 * page.
 */
export function lineGradient(
	doc: Document,
	layer: EvaluatedLayer,
	x1: number,
	x2: number
): { id: string; element: Element } | undefined {
	if (
		(layer.original as { paint?: Record<string, unknown> }).paint?.['line-gradient'] === undefined
	) {
		return undefined;
	}
	const stops: Element[] = [];
	for (let i = 0; i < SAMPLES; i++) {
		const progress = i / (SAMPLES - 1);
		const value = evaluateProperty(layer.original, 'paint', 'line-gradient', {
			zoom: layer.zoom,
			properties: layer.properties,
			globals: { lineProgress: progress }
		});
		if (value === undefined) return undefined;
		const color = paintColor(value);
		stops.push(
			el(doc, 'stop', {
				offset: progress,
				'stop-color': color.color,
				'stop-opacity': color.opacity
			})
		);
	}
	const id = uniqueId('line-gradient');
	const element = el(
		doc,
		'linearGradient',
		{ id, gradientUnits: 'userSpaceOnUse', x1, y1: 0, x2, y2: 0 },
		stops
	);
	return { id, element };
}
