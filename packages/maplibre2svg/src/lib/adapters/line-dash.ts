import { numberOf } from '../util/number';

/** `stroke-dasharray` and `stroke-dashoffset` of a line */
export interface DashPattern {
	dashes: number[];
	offset: number;
}

/**
 * The SVG dashes of `line-dasharray`, whose lengths are multiples of the line width in
 * MapLibre. Negative and missing lengths count as 0. Undefined when the line is solid.
 *
 * An odd number of lengths is not repeated as in CSS: MapLibre's `LineAtlas.getDashRanges`
 * treats the last length as a dash which joins the first one (`left = -last`), over a period
 * of the plain sum. So `[1, 1, 4]` is a dash of 4 + 1 and a gap of 1, starting 4 into the
 * joined dash, and a single length is a solid line.
 */
export function dashPattern(value: unknown, lineWidth: number): DashPattern | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined;
	let lengths = value.map((v) => Math.max(0, numberOf(v, 0)) * lineWidth);
	let offset = 0;
	if (lengths.length % 2 === 1) {
		if (lengths.length === 1) return undefined;
		const last = lengths[lengths.length - 1];
		lengths = [last + lengths[0], ...lengths.slice(1, -1)];
		offset = last;
	}
	if (lengths.every((v) => v === 0)) return undefined;
	// no gaps: a solid line
	if (lengths.every((v, i) => i % 2 === 0 || v === 0)) return undefined;
	return { dashes: lengths, offset };
}

/** Length of one period of the dashes */
export const dashPeriod = (pattern: DashPattern) => pattern.dashes.reduce((sum, v) => sum + v, 0);

/** How many periods of the dashes the swatch shows at least */
export const MIN_DASH_PERIODS = 2;

/**
 * Fit the dashes into a swatch: the width which shows `MIN_DASH_PERIODS` periods, up to
 * `maxWidth`, and the dashes scaled down when even that is too narrow
 */
export function fitDashes(pattern: DashPattern, baseWidth: number, maxWidth: number, ends: number) {
	const needed = MIN_DASH_PERIODS * dashPeriod(pattern) + ends;
	const width = Math.min(Math.max(baseWidth, needed), maxWidth);
	const scale = needed > width ? (width - ends) / (needed - ends) : 1;
	return {
		width,
		pattern:
			scale === 1
				? pattern
				: { dashes: pattern.dashes.map((v) => v * scale), offset: pattern.offset * scale }
	};
}
