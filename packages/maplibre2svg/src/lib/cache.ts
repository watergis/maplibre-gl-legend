import type { LegendCache } from './types';

/** Create a cache to share between calls, such as the updates of the legend of one map */
export function createLegendCache(): LegendCache {
	return { store: new Map() };
}
