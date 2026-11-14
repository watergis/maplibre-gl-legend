import { evaluateProperty, propertySpec, toExpression, type EvaluatedLayer } from '../expression';
import { el, uniqueId } from '../svg';
import type { LegendRamp } from '../types';
import { frame, layerOpacity, opacity, paintColor, swatch } from './common';
import { renderDefault } from './default';
import type { RenderContext, RenderedSymbol } from './types';

/** Evenly spaced samples of a ramp, besides its own stops */
const SAMPLES = 48;
/** How far before a stop the color is sampled too, so that a `step` gives a hard edge */
const EPSILON = 1e-6;

const INTERPOLATE = new Set(['interpolate', 'interpolate-hcl', 'interpolate-lab']);

/**
 * The stop values of the first `interpolate` or `step` on `["<input>"]` in an expression, such as
 * the elevations of `color-relief-color`. Undefined when there is none.
 */
export function curveStops(expr: unknown, input: string): number[] | undefined {
	if (!Array.isArray(expr) || expr[0] === 'literal') return undefined;
	const op = expr[0];
	const inputAt = op === 'step' ? 1 : INTERPOLATE.has(op) ? 2 : -1;
	if (inputAt > 0 && Array.isArray(expr[inputAt]) && expr[inputAt][0] === input) {
		const stops: number[] = [];
		for (let i = inputAt + (op === 'step' ? 2 : 1); i < expr.length; i += 2) {
			if (typeof expr[i] === 'number') stops.push(expr[i]);
		}
		return stops;
	}
	for (const child of expr.slice(1)) {
		const found = curveStops(child, input);
		if (found) return found;
	}
	return undefined;
}

/** The expression of a ramp property: the layer's, or the default of the specification */
function rampExpression(layer: EvaluatedLayer, name: string) {
	const spec = propertySpec(layer.type, 'paint', name);
	const raw =
		(layer.original as { paint?: Record<string, unknown> }).paint?.[name] ?? spec?.default;
	return spec && raw !== undefined ? toExpression(raw, spec) : undefined;
}

/** What a ramp property is evaluated over */
export interface RampInput {
	/** the paint property, e.g. `heatmap-color` */
	name: string;
	/** its input operator, e.g. `heatmap-density` */
	input: 'heatmap-density' | 'elevation' | 'line-progress';
	/** the global of the input, e.g. `heatmapDensity` */
	global: 'heatmapDensity' | 'elevation' | 'lineProgress';
	/** the domain; undefined to take the first and the last stop of the expression */
	domain?: [number, number];
}

/** Evaluate a ramp property over its domain: the stops of the expression and even samples */
export function sampleRamp(layer: EvaluatedLayer, ramp: RampInput): LegendRamp | undefined {
	const expr = rampExpression(layer, ramp.name);
	if (expr === undefined) return undefined;
	// stops so large that the span would overflow say nothing usable
	const stops = (curveStops(expr, ramp.input) ?? []).filter(
		(v) => Number.isFinite(v) && Math.abs(v) < 1e15
	);
	const [min, max] = ramp.domain ?? [Math.min(...stops), Math.max(...stops)];
	const span = max - min;
	if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(span)) return undefined;
	const values = new Set<number>(stops.filter((v) => v >= min && v <= max));
	for (let i = 0; i <= SAMPLES; i++) values.add(min + (span * i) / SAMPLES);
	for (const stop of stops)
		if (stop - EPSILON * (span || 1) > min) values.add(stop - EPSILON * (span || 1));
	const sorted = [...values].sort((a, b) => a - b);
	const sampled = sorted.map((value) => {
		const color = evaluateProperty(layer.original, 'paint', ramp.name, {
			zoom: layer.zoom,
			properties: layer.properties,
			globals: { [ramp.global]: value }
		});
		return { value, color: typeof color === 'string' ? color : 'rgba(0,0,0,0)' };
	});
	return { min, max, stops: sampled };
}

/** A horizontal `<linearGradient>` of a ramp, with an id unique on the page */
export function rampGradient(doc: Document, ramp: LegendRamp) {
	const span = ramp.max - ramp.min || 1;
	const id = uniqueId('ramp');
	const stops = ramp.stops.map(({ value, color }) => {
		const css = paintColor(color);
		return el(doc, 'stop', {
			offset: Math.min(1, Math.max(0, (value - ramp.min) / span)),
			'stop-color': css.color,
			'stop-opacity': css.opacity
		});
	});
	return { id, element: el(doc, 'linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 }, stops) };
}

/**
 * A ramp swatch, twice as wide as the others: the neutral frame beneath (a ramp is often
 * transparent at its start), then the gradient with the opacity of the layer. The entry
 * carries the ramp, so that a host can print its domain.
 */
export function renderRamp(
	layer: EvaluatedLayer,
	ctx: RenderContext,
	ramp: RampInput,
	opacityProperty: string
): RenderedSymbol {
	const sampled = sampleRamp(layer, ramp);
	if (!sampled) return renderDefault(layer, ctx);
	const width = ctx.swatch.width * 2;
	const { height } = ctx.swatch;
	const gradient = rampGradient(ctx.document, sampled);
	const border = frame(ctx, width, height);
	const rect = el(ctx.document, 'rect', {
		x: 0.5,
		y: 0.5,
		width: width - 1,
		height: height - 1,
		fill: `url(#${gradient.id})`,
		'fill-opacity': opacity(layer.paint[opacityProperty], layerOpacity(layer))
	});
	const symbol = swatch(ctx, width, height, [
		el(ctx.document, 'defs', {}, [gradient.element]),
		...(border ? [border] : []),
		rect
	]);
	return { ...symbol, ramp: sampled };
}
