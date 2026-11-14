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
	options: LegendOptions | Promise<LegendOptions>,
	style: StyleSpecification = { ...EMPTY_STYLE, layers: [layer] }
): HTMLElement {
	const pane = document.createElement('div');
	pane.textContent = 'Loading…';
	Promise.resolve(options)
		.then((resolved) => createLayerLegend(layer, style, resolved))
		.then((legend) => pane.replaceChildren(legendRows(legend)))
		.catch((error: unknown) => {
			pane.style.color = '#c00';
			pane.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
		});
	return pane;
}

/** Options of a story besides the ones of its args, such as the images of a sprite */
export type StoryOptions = Omit<LegendOptions, 'zoom' | 'defaultLabel'>;

/** What a story renders with besides its args */
export interface StorySetup {
	options?: StoryOptions | Promise<StoryOptions>;
	/** root properties of the style, such as `glyphs` */
	style?: Partial<StyleSpecification>;
}

const withArgs = (options: StorySetup['options'], shown: LegendOptions) =>
	Promise.resolve(options ?? {}).then((resolved) => ({ ...resolved, ...shown }));

/** The options shown next to the layer: those of the args, `style.glyphs` and `glyphs: false` */
function displayed(shown: LegendOptions, setup: StorySetup) {
	const display: Record<string, unknown> = { ...shown };
	if (setup.style?.glyphs) display['style.glyphs'] = setup.style.glyphs;
	if (setup.style?.sources) display['style.sources'] = setup.style.sources;
	const options = setup.options as StoryOptions | undefined;
	if (options && !(options instanceof Promise)) {
		if (options.glyphs === false) display.glyphs = false;
		if (options.center) display.center = options.center;
	}
	return display;
}

const styleWith = (setup: StorySetup, layers: LayerSpecification[]): StyleSpecification => ({
	...EMPTY_STYLE,
	...setup.style,
	layers
});

/** Render the legend of a layer next to the definition of the layer */
export function renderLegend(
	layer: LayerSpecification,
	args: Partial<LegendStoryArgs>,
	setup: StorySetup = {}
): HTMLElement {
	const shown = legendOptions(args);
	const root = sideBySide(
		legendPane(layer, withArgs(setup.options, shown), styleWith(setup, [layer])),
		definitionPane(layer, displayed(shown, setup))
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
	setup: StorySetup = {}
): HTMLElement {
	const shown = legendOptions(args);
	const style = styleWith(setup, layers);
	const root = document.createElement('div');
	root.style.fontFamily = 'sans-serif';
	root.style.fontSize = '14px';
	for (const layer of layers) {
		const legend = legendPane(layer, withArgs(setup.options, shown), style);
		root.append(layerDetails(layer, legend, displayed(shown, setup), true));
	}
	return root;
}
