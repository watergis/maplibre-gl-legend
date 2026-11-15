import type { Meta, StoryObj } from '@storybook/html-vite';
import { createLegend, legendToSvg } from '../../lib';
import {
	layerDetails,
	legendArgs,
	legendArgTypes,
	legendRows,
	sideBySide,
	type LegendStoryArgs
} from '../utils/render';
import {
	combine,
	GENERATED_IMAGES,
	loadStyle,
	MAPLIBRE_DEMO_STYLE,
	UNDP_STYLE,
	UNVT_STYLE
} from '../utils/sprite';

type Args = LegendStoryArgs & {
	styleUrl: string;
	titles: 'always' | 'multi' | 'never';
	reverse: boolean;
};
type Story = StoryObj<Args>;

export default {
	title: 'Example Maplibre Style',
	args: { ...legendArgs, styleUrl: UNVT_STYLE, titles: 'multi', reverse: false },
	argTypes: {
		...legendArgTypes,
		styleUrl: {
			control: 'text',
			description:
				'The URL of a MapLibre style JSON. The server must allow CORS; its sprite is loaded too.',
			table: { category: 'style' }
		},
		titles: {
			control: 'inline-radio',
			options: ['always', 'multi', 'never'],
			description: 'When `legendToSvg` writes the title of a layer',
			table: { category: 'legendToSvg' }
		},
		reverse: {
			control: 'boolean',
			description: 'Draw the layers from the top of the style down',
			table: { category: 'legendToSvg' }
		}
	},
	render: (args) => renderStyle(args)
} satisfies Meta<Args>;

/** The URL of the args, or undefined when it is not an http(s) URL */
function parseUrl(text: string) {
	try {
		const url = new URL(text.trim());
		return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
	} catch {
		return undefined;
	}
}

/** `legendToSvg` of the whole style of `styleUrl`, and the definition of every layer below it */
function renderStyle(args: Args) {
	const root = document.createElement('div');
	root.style.fontFamily = 'sans-serif';
	const url = parseUrl(args.styleUrl ?? '');
	if (!url) {
		root.textContent = args.styleUrl
			? `"${args.styleUrl}" is not an http(s) URL.`
			: 'Paste the URL of a MapLibre style JSON in the styleUrl control.';
		return root;
	}
	root.textContent = 'Loading the style…';
	loadStyle(url.href)
		.then(async ({ style, images }) => {
			const options = {
				zoom: args.zoom,
				defaultLabel: args.defaultLabel,
				...combine(GENERATED_IMAGES, images)
			};
			const legends = await createLegend(style, options);
			const svg = legendToSvg(legends, {
				titles: args.titles,
				reverse: args.reverse,
				separator: true
			});
			const details = style.layers.map((layer, i) =>
				layerDetails(layer, legendRows(legends[i]), {
					zoom: args.zoom,
					defaultLabel: args.defaultLabel
				})
			);
			// the legend on the left, at most 500px tall, and the layer details on
			// the right as tall as the legend: each scrolls on its own
			const legend = document.createElement('div');
			legend.append(svg);
			const scroller = document.createElement('div');
			scroller.style.cssText = 'position:absolute;inset:0;overflow-y:auto';
			scroller.append(...details);
			// the scroller is out of the flow, so the row is as tall as the legend
			const list = document.createElement('div');
			list.style.cssText = 'position:relative;min-height:240px';
			list.append(scroller);
			const columns = sideBySide(legend, list);
			columns.style.alignItems = 'stretch';
			// the legend keeps the width of its SVG; the details take the rest
			legend.style.flex = 'none';
			legend.style.maxWidth = '100%';
			legend.style.maxHeight = '500px';
			legend.style.overflow = 'auto';
			root.replaceChildren(columns);
		})
		.catch((error: unknown) => (root.textContent = `Cannot load ${url.href}: ${String(error)}`));
	return root;
}

/** the whole unvt demo style */
export const UnvtStyle: Story = { args: { styleUrl: UNVT_STYLE } };

/** the whole UNDP style 2.5.0 */
export const UndpStyle: Story = { args: { styleUrl: UNDP_STYLE } };

/** the whole MapLibre demo tiles style (github.com/maplibre/demotiles), which has no sprite */
export const MaplibreDemoStyle: Story = { args: { styleUrl: MAPLIBRE_DEMO_STYLE } };

/** any style: paste the URL of a MapLibre style JSON in the `styleUrl` control */
export const CustomStyle: Story = { args: { styleUrl: '' } };
