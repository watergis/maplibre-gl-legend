import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { createLayerLegend, type LegendOptions } from '../../lib';
import { definitionPane, layerDetails, sideBySide } from './definition';
import { legendRows } from './rows';

export { definitionPane, layerDetails, sideBySide } from './definition';
export { legendRows } from './rows';

/** Args which every legend story has */
export interface LegendStoryArgs {
	zoom: number;
	defaultLabel: string;
}

export const legendArgs: LegendStoryArgs = { zoom: 12, defaultLabel: 'Other' };

export const legendArgTypes = {
	zoom: { control: { type: 'range', min: 0, max: 22, step: 0.5 } },
	defaultLabel: { control: 'text' }
} as const;

const EMPTY_STYLE: StyleSpecification = { version: 8, sources: {}, layers: [] };

/** The options of a story which change the legend, as passed to `createLayerLegend` */
export function legendOptions(args: Partial<LegendStoryArgs>) {
	return {
		zoom: args.zoom ?? legendArgs.zoom,
		defaultLabel: args.defaultLabel || legendArgs.defaultLabel
	};
}

/**
 * A pane which shows the legend of a layer. It is returned at once and filled when the
 * legend is ready, since `createLayerLegend` is asynchronous.
 */
export function legendPane(
	layer: LayerSpecification,
	options: LegendOptions,
	style: StyleSpecification = { ...EMPTY_STYLE, layers: [layer] }
): HTMLElement {
	const pane = document.createElement('div');
	pane.textContent = 'Loading…';
	createLayerLegend(layer, style, options)
		.then((legend) => pane.replaceChildren(legendRows(legend)))
		.catch((error: unknown) => {
			pane.style.color = '#c00';
			pane.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
		});
	return pane;
}

/** Render the legend of a layer next to the definition of the layer */
export function renderLegend(
	layer: LayerSpecification,
	args: Partial<LegendStoryArgs>,
	options: Omit<LegendOptions, 'zoom' | 'defaultLabel'> = {},
	style?: StyleSpecification
): HTMLElement {
	const shown = legendOptions(args);
	const root = sideBySide(
		legendPane(layer, { ...options, ...shown }, style),
		definitionPane(layer, shown)
	);
	root.style.fontFamily = 'sans-serif';
	root.style.fontSize = '14px';
	return root;
}

/**
 * Render several layers, one collapsible block each with its legend and its definition,
 * such as the variants of one property
 */
export function renderLayers(
	layers: LayerSpecification[],
	args: Partial<LegendStoryArgs>,
	options: Omit<LegendOptions, 'zoom' | 'defaultLabel'> = {}
): HTMLElement {
	const shown = legendOptions(args);
	const style: StyleSpecification = { ...EMPTY_STYLE, layers };
	const root = document.createElement('div');
	root.style.fontFamily = 'sans-serif';
	root.style.fontSize = '14px';
	for (const layer of layers) {
		const legend = legendPane(layer, { ...options, ...shown }, style);
		root.append(layerDetails(layer, legend, shown, true));
	}
	return root;
}
