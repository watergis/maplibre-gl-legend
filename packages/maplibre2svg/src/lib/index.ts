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
export type { ResolvedOptions } from './core/options';
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
	type Paint,
	type PatternPaint,
	type PatternTile,
	type RenderContextInit,
	type RenderedSymbol,
	type TextContext
} from './render';
export { LayerClassifier, type LegendClass, type LabelInfo } from './classify';
export { LabelGenerator } from './label';
export { LayerEvaluator, type EvaluatedLayer, type GeometryType } from './style';
export { GlyphRenderer } from './assets/glyphs';
export { ImageStore } from './assets/images';
export { RasterSourceResolver } from './assets/raster';
