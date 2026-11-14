import { isOperator } from './accessor';

/** An output of a zoom curve which is active at the zoom */
export interface ZoomBranch {
	/** index of the output in the node */
	index: number;
	/** how far the zoom is from the stop of the output */
	distance: number;
}

const INTERPOLATE = new Set(['interpolate', 'interpolate-hcl', 'interpolate-lab']);

/**
 * The outputs of a zoom `step` or `interpolate` which give the value at the zoom:
 * - `["step", ["zoom"], out0, z1, out1, ...]`: the one output whose interval holds the zoom
 * - `["interpolate", type, ["zoom"], z1, out1, ...]`: the outputs of the two stops around
 *   the zoom, or of the nearest stop outside the range
 *
 * Undefined if the node is not a zoom curve.
 */
export function activeZoomBranches(node: unknown[], zoom: number): ZoomBranch[] | undefined {
	const op = node[0] as string;
	if (op === 'step' && isOperator(node[1], 'zoom')) {
		let index = 2;
		for (let i = 3; i < node.length - 1; i += 2) {
			if (zoom >= Number(node[i])) index = i + 1;
		}
		return [{ index, distance: 0 }];
	}
	if (INTERPOLATE.has(op) && isOperator(node[2], 'zoom')) {
		const stops: { index: number; zoom: number }[] = [];
		for (let i = 3; i < node.length - 1; i += 2)
			stops.push({ index: i + 1, zoom: Number(node[i]) });
		if (stops.length === 0) return undefined;
		const at = (s: { index: number; zoom: number }) => ({
			index: s.index,
			distance: Math.abs(zoom - s.zoom)
		});
		const exact = stops.find((s) => s.zoom === zoom);
		if (exact) return [at(exact)];
		if (zoom <= stops[0].zoom) return [at(stops[0])];
		const last = stops[stops.length - 1];
		if (zoom >= last.zoom) return [at(last)];
		const upper = stops.findIndex((s) => s.zoom > zoom);
		return [at(stops[upper - 1]), at(stops[upper])];
	}
	return undefined;
}
