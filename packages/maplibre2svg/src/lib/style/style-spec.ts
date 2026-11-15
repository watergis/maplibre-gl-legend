/**
 * The only module which imports from `@maplibre/maplibre-gl-style-spec`. It re-exports the
 * runtime values which the legend needs; the types come from `maplibre-gl`.
 */
export {
	Color,
	ColorArray,
	Formatted,
	NumberArray,
	Padding,
	ResolvedImage,
	VariableAnchorOffsetCollection,
	expression,
	function as styleFunction,
	latest
} from '@maplibre/maplibre-gl-style-spec';
