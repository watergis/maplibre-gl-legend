/**
 * maplibre2svg: legend symbols as SVG from the layers of a MapLibre style.
 *
 * Most hosts need only `createLegend` / `createLayerLegend` and `legendToSvg`. The classes
 * are exported for hosts which keep a generator between updates, or add or replace the
 * adapter of a layer type.
 *
 * @packageDocumentation
 */
export { LegendCache, createLegendCache } from './core/cache';
export { LegendGenerator, createLayerLegend, createLegend } from './core/legend-generator';
export type { OptionalOptions, ResolvedOptions } from './core/options';
export type {
	ImageEncoder,
	LayerLegend,
	LayerSpecification,
	LegendEntry,
	LegendEntryKind,
	LegendImage,
	LegendOptions,
	LegendRamp,
	StyleSpecification,
	SwatchOptions
} from './core/types';
export { LegendSvgRenderer, legendToSvg, type LegendSvgOptions } from './legend-svg';
export type { TextMeasurer } from './util/text-measure';

export {
	AdapterRegistry,
	AreaAdapter,
	BackgroundAdapter,
	CircleAdapter,
	ColorReliefAdapter,
	DefaultAdapter,
	defaultAdapters,
	FillAdapter,
	FillExtrusionAdapter,
	HeatmapAdapter,
	HillshadeAdapter,
	LayerAdapter,
	LineAdapter,
	neutralSymbol,
	RampAdapter,
	RasterAdapter,
	SymbolAdapter,
	type AreaPaint,
	type ClassificationAxisSpec,
	type RampInput,
	type SymbolPart,
	type SymbolPartDrawer
} from './adapters';
export {
	FRAME_COLOR,
	layerOpacity,
	opacity,
	paintColor,
	paintNumber,
	RenderContext,
	Swatch,
	SvgDocument,
	type Attrs,
	type Paint,
	type PatternPaint,
	type PatternTile,
	type RenderContextInit,
	type RenderedSymbol,
	type TextContext
} from './render';
export {
	LayerClassifier,
	CaseClassifier,
	InterpolateClassifier,
	MatchClassifier,
	StepClassifier,
	defaultNodeClassifiers,
	type ClassCandidate,
	type ClassifierKind,
	type ClassifierNode,
	type ClassifyContext,
	type ClassifyOptions,
	type FeatureProperties,
	type LabelInfo,
	type LayerTypeRulebook,
	type LayerTypeRules,
	type LegendClass,
	type NodeClassifier,
	type NodeClassifiers
} from './classify';
export { LabelGenerator, type LabelOptions, type Labelled } from './label';
export {
	LayerEvaluator,
	type EvaluatedLayer,
	type EvaluateLayerOptions,
	type EvaluationInput,
	type GeometryType,
	type GeometryTypeOf,
	type PropertyGroup,
	type UnresolvedTokens
} from './style';
export {
	GlyphRenderer,
	type GlyphFetcher,
	type GlyphLabel,
	type GlyphRendererInit,
	type TextImage,
	type TextImageRequest
} from './assets/glyphs';
export type { Rgba, SdfStyle } from './assets/sdf';
export { ImageStore, type FoundImage, type ImageContext, type ImageSize } from './assets/images';
export {
	RasterSourceResolver,
	type ImageLoader,
	type RasterContext,
	type RasterUrlResolver
} from './assets/raster';
