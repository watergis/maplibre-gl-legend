import type { LayerSpecification } from 'maplibre-gl';
import type { LayerType, PropertyType, StyleEditorMap } from '../interfaces';

/** what decides whether a field is shown */
export interface FieldCondition {
	map: StyleEditorMap;
	layer: LayerSpecification;
}

interface PropertyFieldBase {
	/** `paint` or `layout` */
	type: PropertyType;
	/** the property edited by the field */
	property: string;
	/** properties set to the same value, e.g. `text-opacity` with `icon-opacity` */
	linked?: string[];
	label: string;
	/** the field is shown only when it returns true */
	when?: (condition: FieldCondition) => boolean;
}

/** a numeric property, edited with a slider and a number box */
export interface NumberFieldConfig extends PropertyFieldBase {
	kind: 'number';
	/** the range of the slider, in the unit shown */
	min: number;
	max: number;
	step: number;
	unit?: string;
	/** the value is a fraction (0..1) shown in % */
	percent?: boolean;
}

/** a color property */
export interface ColorFieldConfig extends PropertyFieldBase {
	kind: 'color';
}

/** a property chosen from a list: the values of the specification, or the given options */
export interface SelectFieldConfig extends PropertyFieldBase {
	kind: 'select';
	options?: { label: string; value: unknown }[];
}

/** the switch adding a heatmap layer made from the features of the layer */
export interface HeatmapGeneratorFieldConfig {
	kind: 'heatmap-generator';
	label: string;
	when?: (condition: FieldCondition) => boolean;
}

/** a field of the editor of a layer type */
export type FieldConfig =
	NumberFieldConfig | ColorFieldConfig | SelectFieldConfig | HeatmapGeneratorFieldConfig;

const opacity = (property: string, linked?: string[]): NumberFieldConfig => ({
	kind: 'number',
	type: 'paint',
	property,
	linked,
	label: 'Opacity',
	min: 0,
	max: 100,
	step: 1,
	percent: true
});

const color = (
	property: string,
	label: string,
	type: PropertyType = 'paint'
): ColorFieldConfig => ({
	kind: 'color',
	type,
	property,
	label
});

const number = (
	property: string,
	label: string,
	range: Pick<NumberFieldConfig, 'min' | 'max' | 'step' | 'unit' | 'percent'>,
	type: PropertyType = 'paint'
): NumberFieldConfig => ({ kind: 'number', type, property, label, ...range });

const heatmap: HeatmapGeneratorFieldConfig = { kind: 'heatmap-generator', label: 'Heatmap' };

const px = (max: number, step = 1) => ({ min: 0, max, step, unit: 'px' });
const degrees = { min: 0, max: 359, step: 1, unit: '°' };
const unitRange = { min: -1, max: 1, step: 0.01 };

/** whether the icon of a symbol layer is an SDF image, which can be colored */
const hasSdfIcon = ({ map, layer }: FieldCondition) => {
	const image = map.getLayoutProperty(layer.id, 'icon-image');
	return typeof image === 'string' && map.getImage(image)?.sdf === true;
};
const hasIcon = ({ map, layer }: FieldCondition) => !!map.getLayoutProperty(layer.id, 'icon-image');
const hasText = ({ map, layer }: FieldCondition) => !!map.getLayoutProperty(layer.id, 'text-field');

const withCondition = (fields: FieldConfig[], when: FieldConfig['when']): FieldConfig[] =>
	fields.map((field) => ({ ...field, when }));

/**
 * The fields of the editor of each layer type. Other properties are edited in the manual editor.
 */
export const FIELDS: Partial<Record<LayerType, FieldConfig[]>> = {
	background: [opacity('background-opacity'), color('background-color', 'Background color')],
	fill: [
		opacity('fill-opacity'),
		color('fill-color', 'Fill color'),
		color('fill-outline-color', 'Fill outline color')
	],
	line: [
		heatmap,
		opacity('line-opacity'),
		color('line-color', 'Line color'),
		number('line-width', 'Line width', px(20, 0.5)),
		{
			kind: 'select',
			type: 'paint',
			property: 'line-dasharray',
			label: 'Line pattern',
			options: [
				{ label: 'Solid', value: undefined },
				{ label: 'Dash', value: [10, 4] },
				{ label: 'Dash dot', value: [10, 3, 2, 3] },
				{ label: 'Dot', value: [1, 1] }
			]
		},
		number('line-blur', 'Line blur', px(20, 0.5))
	],
	symbol: [
		heatmap,
		opacity('icon-opacity', ['text-opacity']),
		...withCondition(
			[
				number('icon-size', 'Icon size', { min: 0, max: 10, step: 0.1 }, 'layout'),
				{ kind: 'select', type: 'layout', property: 'icon-overlap', label: 'Icon overlap' }
			],
			hasIcon
		),
		...withCondition(
			[
				color('icon-color', 'Icon color'),
				color('icon-halo-color', 'Icon halo color'),
				number('icon-halo-width', 'Icon halo width', px(10, 0.5)),
				number('icon-halo-blur', 'Icon halo blur', px(10, 0.5))
			],
			hasSdfIcon
		),
		...withCondition(
			[
				number('text-size', 'Text size', px(64, 0.5), 'layout'),
				color('text-color', 'Text color'),
				number('text-rotate', 'Text rotate', degrees, 'layout'),
				color('text-halo-color', 'Text halo color'),
				number('text-halo-width', 'Text halo width', px(10, 0.5)),
				number('text-halo-blur', 'Text halo blur', px(10, 0.5))
			],
			hasText
		)
	],
	circle: [
		heatmap,
		opacity('circle-opacity'),
		number('circle-radius', 'Circle radius', px(30, 0.5)),
		color('circle-color', 'Circle color'),
		number('circle-stroke-width', 'Circle stroke width', px(20, 0.5)),
		color('circle-stroke-color', 'Circle stroke color')
	],
	'fill-extrusion': [
		opacity('fill-extrusion-opacity'),
		color('fill-extrusion-color', 'Fill extrusion color'),
		number('fill-extrusion-height', 'Fill extrusion height', {
			min: 0,
			max: 200,
			step: 1,
			unit: 'm'
		}),
		number('fill-extrusion-base', 'Fill extrusion base', { min: 0, max: 200, step: 1, unit: 'm' })
	],
	hillshade: [
		number('hillshade-exaggeration', 'Hillshade exaggeration', {
			min: 0,
			max: 100,
			step: 1,
			percent: true
		}),
		color('hillshade-accent-color', 'Hillshade accent color'),
		color('hillshade-highlight-color', 'Hillshade highlight color'),
		color('hillshade-shadow-color', 'Hillshade shadow color'),
		number('hillshade-illumination-direction', 'Hillshade illumination direction', degrees)
	],
	raster: [
		opacity('raster-opacity'),
		number('raster-brightness-max', 'Raster brightness max', { min: 0, max: 1, step: 0.01 }),
		number('raster-brightness-min', 'Raster brightness min', { min: 0, max: 1, step: 0.01 }),
		number('raster-contrast', 'Raster contrast', unitRange),
		number('raster-saturation', 'Raster saturation', unitRange),
		number('raster-hue-rotate', 'Raster hue rotate', degrees),
		{ kind: 'select', type: 'paint', property: 'raster-resampling', label: 'Raster resampling' }
	],
	heatmap: [
		opacity('heatmap-opacity'),
		color('heatmap-color', 'Heatmap color'),
		number('heatmap-intensity', 'Heatmap intensity', { min: 0, max: 10, step: 0.1 }),
		number('heatmap-radius', 'Heatmap radius', { min: 1, max: 100, step: 1, unit: 'px' }),
		number('heatmap-weight', 'Heatmap weight', { min: 0, max: 10, step: 0.1 })
	],
	'color-relief': [
		opacity('color-relief-opacity'),
		color('color-relief-color', 'Color relief color')
	]
};

/**
 * The fields shown for a layer.
 *
 * @param condition the map and the layer
 * @returns the fields, empty for a layer type without fields
 */
export function getFields(condition: FieldCondition): FieldConfig[] {
	return (FIELDS[condition.layer.type] ?? []).filter((field) => field.when?.(condition) ?? true);
}

/**
 * Whether the fields of a layer type edit a layout property. The manual editor shows the layout
 * properties only for these layer types.
 *
 * @param layerType the type of the layer
 * @returns true when a field of the layer type is a layout property
 */
export function hasLayoutFields(layerType: LayerType): boolean {
	return (FIELDS[layerType] ?? []).some(
		(field) => field.kind !== 'heatmap-generator' && field.type === 'layout'
	);
}
