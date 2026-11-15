import { RampAdapter, type RampInput } from '../base/ramp';

/**
 * `heatmap`: one ramp entry, `heatmap-color` over `heatmap-density` 0 → 1 (the default ramp
 * when unset), with `heatmap-opacity`
 */
export class HeatmapAdapter extends RampAdapter {
	readonly type = 'heatmap';
	readonly geometryType = 'Point';
	protected readonly ramp: RampInput = {
		name: 'heatmap-color',
		input: 'heatmap-density',
		global: 'heatmapDensity',
		domain: [0, 1]
	};
	protected readonly opacityProperty = 'heatmap-opacity';
}
