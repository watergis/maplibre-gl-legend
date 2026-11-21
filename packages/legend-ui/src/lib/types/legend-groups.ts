/**
 * Groups of layers listed (and shown / hidden) together: the title of each group and its members.
 *
 * The members of a group are either:
 *
 * - an array of layer IDs, which can also have objects of nested groups, e.g.
 *   `['points-symbols', { 'Some Points': ['points-halo', 'points-circles'] }]`
 * - an object of nested groups, e.g. `{ WTP: ['wtp', 'wtp_annotation'], Tank: ['tank'] }`
 *
 * Groups can be nested to any depth.
 *
 * @example
 * ```ts
 * const groups: LegendGroups = {
 * 	// a group of layers
 * 	Pipeline: ['pipeline', 'pipeline_annotation'],
 * 	// a group of groups
 * 	'Water Facilities': {
 * 		WTP: ['wtp', 'wtp_annotation'],
 * 		Tank: ['tank', 'tank_annotation']
 * 	},
 * 	// a group of layers and groups
 * 	'All Points': [{ 'Some Points': ['points-halo', 'points-circles'] }, 'points-symbols']
 * };
 * ```
 */
export interface LegendGroups {
	[title: string]: LegendGroupMembers;
}

/** The members of a group in {@link LegendGroups}: layer IDs and nested groups, or nested groups only. */
export type LegendGroupMembers = (string | LegendGroups)[] | LegendGroups;
