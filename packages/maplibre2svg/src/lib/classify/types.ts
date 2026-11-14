import type { EvaluatedLayer } from '../expression';
import type { LegendEntryKind } from '../types';

/** Properties of a feature. `undefined` marks a field which must be absent */
export type FeatureProperties = Record<string, unknown>;

/** What the label of a class is made from */
export type LabelInfo =
	| { kind: 'single' }
	| { kind: 'default' }
	/** values of a `match` branch */
	| { kind: 'category'; values: unknown[] }
	/** interval of a `step`: `min <= value < max` */
	| { kind: 'range'; min?: number; max?: number }
	/**
	 * stop of an `interpolate`. The first and last stops are bounds, since `interpolate` gives
	 * their outputs to every value below and above them: `≤ first`, `≥ last`
	 */
	| { kind: 'stop'; value: unknown; bound?: 'lower' | 'upper' }
	/** condition of a `case`, and the position of the class among the classes of the layer */
	| { kind: 'condition'; condition: unknown; index: number };

/** A class made from a classifying node, before the layer is evaluated for it */
export interface ClassCandidate {
	kind: Exclude<LegendEntryKind, 'single' | 'ramp'>;
	/** properties of the representative feature */
	properties: FeatureProperties;
	label: LabelInfo;
	/**
	 * When the representative feature could not be made, the output of the branch, which
	 * replaces the classifying node when the layer is evaluated.
	 */
	substitute?: { output: unknown };
}

/** A class of a layer, with the layer evaluated for its representative feature */
export interface LegendClass {
	kind: Exclude<LegendEntryKind, 'ramp'>;
	properties: FeatureProperties;
	label: LabelInfo;
	layer: EvaluatedLayer;
}
