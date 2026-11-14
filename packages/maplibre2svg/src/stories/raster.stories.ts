import type { Meta, StoryObj } from '@storybook/html-vite';
import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { storyLayer, typeMetaArgs, type TypeStoryArgs } from './expression-stories';
import { renderLayers, renderLegend, type StorySetup } from './render';

type Args = TypeStoryArgs & { lng: number; lat: number };

export default {
	title: 'Layers/raster',
	...typeMetaArgs,
	args: { ...typeMetaArgs.args, zoom: 10, lng: 36.82, lat: -1.29 },
	argTypes: {
		...typeMetaArgs.argTypes,
		lng: { control: { type: 'range', min: -180, max: 180, step: 0.01 } },
		lat: { control: { type: 'range', min: -85, max: 85, step: 0.01 } }
	}
} satisfies Meta<Args>;

type Story = StoryObj<Args>;

const SOURCES: Record<string, SourceSpecification> = {
	osm: {
		type: 'raster',
		tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
		tileSize: 256,
		maxzoom: 19
	},
	imagery: {
		type: 'raster',
		tiles: [
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
		],
		tileSize: 256,
		maxzoom: 19
	},
	osm512: {
		type: 'raster',
		tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
		tileSize: 512,
		// OpenStreetMap answers 400 above zoom 19
		maxzoom: 19
	},
	pmtiles: { type: 'raster', tiles: ['pmtiles://example.pmtiles/{z}/{x}/{y}'] },
	missing: {
		type: 'raster',
		tiles: ['https://tile.openstreetmap.org/no-such-path/{z}/{x}/{y}.png'],
		maxzoom: 19
	},
	tilejson: { type: 'raster', url: 'https://example.com/tiles.json' },
	radar: {
		type: 'image',
		url: 'https://maplibre.org/maplibre-gl-js/docs/assets/radar.gif',
		coordinates: [
			[-80.425, 46.437],
			[-71.516, 46.437],
			[-71.516, 37.936],
			[-80.425, 37.936]
		]
	}
};

const raster = (name: string, source: string, paint: Record<string, unknown> = {}) =>
	({ ...storyLayer('raster', name, { paint }), source }) as LayerSpecification;

const setup = (args: Args, sources: string[]): StorySetup => ({
	options: { center: [args.lng, args.lat] },
	style: { sources: Object.fromEntries(sources.map((id) => [id, SOURCES[id]])) }
});

const single = (name: string, source: string, paint: Record<string, unknown> = {}): Story => ({
	render: (args) => renderLegend(raster(name, source, paint), args, setup(args, [source]))
});

/** the OpenStreetMap tile at the center and zoom */
export const OpenStreetMap = single('OpenStreetMap', 'osm');

/** two sources side by side: OpenStreetMap and Esri World Imagery */
export const TwoSources: Story = {
	render: (args) => {
		const root = document.createElement('div');
		root.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px';
		for (const id of ['osm', 'imagery']) {
			const pane = renderLegend(raster(`Source-${id}`, id), args, setup(args, [id]));
			pane.style.flex = '1 1 280px';
			pane.style.minWidth = '0';
			root.append(pane);
		}
		return root;
	}
};

/** raster-opacity, saturation, contrast, hue-rotate and brightness, as CSS filters */
export const Adjustments: Story = {
	render: (args) =>
		renderLayers(
			[
				raster('Opacity', 'osm', { 'raster-opacity': 0.4 }),
				raster('Desaturated', 'osm', { 'raster-saturation': -1 }),
				raster('Contrast', 'osm', { 'raster-contrast': 0.6 }),
				raster('HueRotate', 'osm', { 'raster-hue-rotate': 180 }),
				raster('Brightness', 'osm', { 'raster-brightness-min': 0.3, 'raster-brightness-max': 0.7 })
			],
			args,
			setup(args, ['osm'])
		)
};

/** a 512px source: the tile of one zoom less than a 256px source */
export const TileSize512 = single('TileSize512', 'osm512');

/** a pmtiles:// source, which the legend cannot load: the placeholder */
export const PmtilesFallback = single('PmtilesFallback', 'pmtiles');

/** a tile which gives 404 in the browser: the placeholder beneath shows */
export const MissingTile = single('MissingTile', 'missing');

/** a source with only a TileJSON url: the control resolves its tiles; here the placeholder */
export const TileJsonOnly = single('TileJsonOnly', 'tilejson');

/** an image source */
export const ImageSource = single('ImageSource', 'radar');
