export { resampleInto, sampleDistance, type DistanceField } from './sample';
export {
	EDGE_GAMMA,
	SDF_CUTOFF,
	SDF_PX,
	sdfThresholds,
	shadeDistances,
	type Rgba,
	type SdfStyle
} from './shade';

/** Device pixels per CSS pixel to draw at: the screen's, from 1 to 3 */
export function outputPixelRatio(value?: number): number {
	const ratio = value ?? (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
	return Number.isFinite(ratio) ? Math.min(3, Math.max(1, ratio)) : 1;
}
