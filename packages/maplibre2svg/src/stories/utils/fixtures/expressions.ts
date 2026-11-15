import type { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl';

/**
 * The fields, categories and thresholds shared by the expression stories of every layer
 * type, so that the legends can be compared across types. Each builder takes the outputs
 * of the branches, which differ by property (colors, widths, radii, images ...).
 */

/** string field of the categorical stories */
export const CATEGORY_FIELD = 'landuse';
/** numeric field of the graduated and linear stories */
export const NUMBER_FIELD = 'population';
/** field which the `has` condition of `CategoricalCase` checks */
export const FLAG_FIELD = 'protected';

/** `match` branches: one single value, one with several values */
export const CATEGORIES = ['residential', ['commercial', 'retail'], 'industrial'] as const;
/** thresholds of `step`: `< 100`, `100 – 1000`, `1000 – 10000`, `≥ 10000` */
export const THRESHOLDS = [100, 1000, 10000] as const;
/** stops of `interpolate` */
export const STOPS = [0, 5000, 20000] as const;
/** base of the exponential `interpolate` and the legacy `stops` */
export const EXPONENTIAL_BASE = 1.5;
/** zooms of `ZoomAndData` */
export const ZOOMS = [10, 16] as const;

/** A palette with one color per branch, and the color of the fallback */
export const PALETTE = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3'] as const;
export const FALLBACK_COLOR = '#bbbbbb';

type Output = ExpressionSpecification | string | number | boolean;

const get = (field: string): ExpressionSpecification => ['get', field];
const literal = (value: readonly string[]) =>
	['literal', [...value]] as unknown as ExpressionSpecification;

/** `match` on the category: 3 outputs and the fallback */
export function categorical(outputs: Output[], fallback: Output): ExpressionSpecification {
	const branches = CATEGORIES.flatMap((category, i) => [
		typeof category === 'string' ? category : [...category],
		outputs[i]
	]);
	return ['match', get(CATEGORY_FIELD), ...branches, fallback] as ExpressionSpecification;
}

/**
 * `case` with `==`, `in`, `has` and a condition which cannot be synthesized (the length of
 * the name): 4 outputs and the fallback.
 */
export function categoricalCase(outputs: Output[], fallback: Output): ExpressionSpecification {
	return [
		'case',
		['==', get(CATEGORY_FIELD), CATEGORIES[0]],
		outputs[0],
		['in', get(CATEGORY_FIELD), literal(CATEGORIES[1])],
		outputs[1],
		['has', FLAG_FIELD],
		outputs[2],
		['>', ['length', ['to-string', get('name')]], 10],
		outputs[3],
		fallback
	] as ExpressionSpecification;
}

/** `step` on the number: 4 outputs, one per interval */
export function graduated(outputs: Output[]): ExpressionSpecification {
	const steps = THRESHOLDS.flatMap((threshold, i) => [threshold, outputs[i + 1]]);
	return ['step', get(NUMBER_FIELD), outputs[0], ...steps] as ExpressionSpecification;
}

/** `interpolate` on the number: 3 outputs, one per stop */
export function linear(outputs: Output[]): ExpressionSpecification {
	const stops = STOPS.flatMap((stop, i) => [stop, outputs[i]]);
	return ['interpolate', ['linear'], get(NUMBER_FIELD), ...stops] as ExpressionSpecification;
}

/** exponential `interpolate` on the number: 3 outputs, one per stop */
export function exponential(outputs: Output[]): ExpressionSpecification {
	const stops = STOPS.flatMap((stop, i) => [stop, outputs[i]]);
	return [
		'interpolate',
		['exponential', EXPONENTIAL_BASE],
		get(NUMBER_FIELD),
		...stops
	] as ExpressionSpecification;
}

/** legacy property function with `stops`, the same stops as `exponential` */
export function legacyStops<T extends string | number>(
	outputs: T[]
): DataDrivenPropertyValueSpecification<T> {
	// the typings of maplibre-gl leave out `base`, which the specification allows
	const fn = {
		property: NUMBER_FIELD,
		type: 'exponential' as const,
		base: EXPONENTIAL_BASE,
		stops: STOPS.map((stop, i): [number, T] => [stop, outputs[i]])
	};
	return fn;
}

/** zoom `interpolate` whose outputs are `categorical` matches */
export function zoomAndData(
	low: Output[],
	high: Output[],
	fallback: [Output, Output]
): ExpressionSpecification {
	return [
		'interpolate',
		['linear'],
		['zoom'],
		ZOOMS[0],
		categorical(low, fallback[0]),
		ZOOMS[1],
		categorical(high, fallback[1])
	] as ExpressionSpecification;
}

/** `metadata.legend` of the `CustomLabels` stories */
export function customLabelsMetadata(showDefault: boolean) {
	return {
		legend: {
			label: 'Land use',
			'custom-labels': ['Homes', 'Shops'],
			default: 'Everything else',
			'show-default': showDefault
		}
	};
}
