import type { Meta } from '@storybook/html-vite';
import { layerStory, typeMetaArgs, type TypeStoryArgs } from './expression-stories';

export default { title: 'Layers/color-relief', ...typeMetaArgs } satisfies Meta<TypeStoryArgs>;

const relief = (name: string, color: unknown, opacity?: number) =>
	layerStory('color-relief', name, {
		paint: {
			'color-relief-color': color,
			...(opacity === undefined ? {} : { 'color-relief-opacity': opacity })
		}
	});

/** an interpolate from sea level to 4000 m: one row per stop, `≤ 0` … `≥ 4000` */
export const Hypsometric = relief('Hypsometric', [
	'interpolate',
	['linear'],
	['elevation'],
	0,
	'#4b7f52',
	500,
	'#a6c48a',
	1500,
	'#e8d8a8',
	2500,
	'#b08d57',
	4000,
	'#ffffff'
]);

/** negative elevations below the sea, at color-relief-opacity 0.6 */
export const Bathymetry = relief(
	'Bathymetry',
	[
		'interpolate',
		['linear'],
		['elevation'],
		-6000,
		'#08306b',
		-200,
		'#6baed6',
		0,
		'#c6dbef',
		0.1,
		'#74c476',
		3000,
		'#8c6d31'
	],
	0.6
);

/** a step whose first threshold is above the lowest land: `< 500` and `≥ 3000` are rows too */
export const StepClasses = relief('StepClasses', [
	'step',
	['elevation'],
	'#2c7bb6',
	500,
	'#abd9e9',
	1500,
	'#ffffbf',
	2200,
	'#fdae61',
	3000,
	'#d7191c'
]);
