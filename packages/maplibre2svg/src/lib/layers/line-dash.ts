import { numberOf } from './common';

/**
 * The `stroke-dasharray` of `line-dasharray`, whose lengths are multiples of the line width
 * in MapLibre. An odd number of lengths is repeated, as dashes and gaps alternate; negative
 * and missing lengths count as 0. Undefined when the line is solid.
 */
export function dashArray(value: unknown, lineWidth: number): number[] | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined;
	const lengths = value.map((v) => Math.max(0, numberOf(v, 0)) * lineWidth);
	if (lengths.every((v) => v === 0)) return undefined;
	// all gaps 0: a solid line
	if (lengths.length > 1 && lengths.every((v, i) => i % 2 === 0 || v === 0)) return undefined;
	return lengths.length % 2 === 1 ? [...lengths, ...lengths] : lengths;
}

/** Length of one period of the dashes */
export const dashPeriod = (dashes: number[]) => dashes.reduce((sum, v) => sum + v, 0);

/** How many periods of the dashes the swatch shows at least */
export const MIN_DASH_PERIODS = 2;

/**
 * Fit the dashes into a swatch: the width which shows `MIN_DASH_PERIODS` periods, up to
 * `maxWidth`, and the dashes scaled down when even that is too narrow
 */
export function fitDashes(dashes: number[], baseWidth: number, maxWidth: number, ends: number) {
	const needed = MIN_DASH_PERIODS * dashPeriod(dashes) + ends;
	const width = Math.min(Math.max(baseWidth, needed), maxWidth);
	const scale = needed > width ? (width - ends) / (needed - ends) : 1;
	return { width, dashes: scale === 1 ? dashes : dashes.map((v) => v * scale) };
}
