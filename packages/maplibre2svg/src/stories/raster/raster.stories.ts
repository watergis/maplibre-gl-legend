import type { Meta, StoryObj } from '@storybook/html-vite';
import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { layerStory, typeMeta, type TypeStoryArgs } from '../utils/expression-stories';

type Args = TypeStoryArgs & { lng: number; lat: number; source: string };

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

const SOURCE_NAMES = Object.keys(SOURCES);

const meta = typeMeta('raster');

export default {
	title: 'Layers/raster',
	...meta,
	args: { ...meta.args, zoom: 10, lng: 36.82, lat: -1.29, source: 'osm' },
	argTypes: {
		...meta.argTypes,
		lng: {
			control: { type: 'range', min: -180, max: 180, step: 0.01 },
			description: 'The longitude of the tile drawn',
			table: { category: 'legend' }
		},
		lat: {
			control: { type: 'range', min: -85, max: 85, step: 0.01 },
			description: 'The latitude of the tile drawn',
			table: { category: 'legend' }
		},
		source: {
			control: { type: 'select' },
			options: SOURCE_NAMES,
			description: 'The source of the layer',
			table: { category: 'source' }
		}
	}
} satisfies Meta<Args>;

/** A story of a raster layer on a source, which the `source` control can change */
const raster = (name: string, source: string, paint: Record<string, unknown> = {}): Story =>
	layerStory(
		'raster',
		name,
		{ paint },
		{
			args: { source },
			setup: (args) => {
				const id = String(args.source);
				return {
					options: { center: [Number(args.lng), Number(args.lat)] },
					style: { sources: { [id]: SOURCES[id] } }
				};
			},
			layer: (layer, args) => ({ ...layer, source: String(args.source) }) as LayerSpecification
		}
	) as Story;

/** the OpenStreetMap tile at the center and zoom */
export const OpenStreetMap = raster('OpenStreetMap', 'osm');

/** the Esri World Imagery tile at the center and zoom */
export const EsriWorldImagery = raster('EsriWorldImagery', 'imagery');

/** raster-opacity 0.4 */
export const RasterOpacity = raster('RasterOpacity', 'osm', { 'raster-opacity': 0.4 });

/** raster-saturation -1: grey, as a CSS filter */
export const RasterSaturation = raster('RasterSaturation', 'osm', { 'raster-saturation': -1 });

/** raster-contrast 0.6, as a CSS filter */
export const RasterContrast = raster('RasterContrast', 'osm', { 'raster-contrast': 0.6 });

/** raster-hue-rotate 180, as a CSS filter */
export const RasterHueRotate = raster('RasterHueRotate', 'osm', { 'raster-hue-rotate': 180 });

/** raster-brightness-min 0.3 and raster-brightness-max 0.7, as a CSS filter */
export const RasterBrightness = raster('RasterBrightness', 'osm', {
	'raster-brightness-min': 0.3,
	'raster-brightness-max': 0.7
});

/** a 512px source: the tile of one zoom less than a 256px source */
export const TileSize512Pixels = raster('TileSize512Pixels', 'osm512');

/** a pmtiles:// source, which the legend cannot load: the placeholder */
export const PmtilesPlaceholder = raster('PmtilesPlaceholder', 'pmtiles');

/** a tile which gives 404 in the browser: the placeholder beneath shows */
export const MissingTile = raster('MissingTile', 'missing');

/** a source with only a TileJSON url: the control resolves its tiles; here the placeholder */
export const TileJsonSourceOnly = raster('TileJsonSourceOnly', 'tilejson');

/** an image source */
export const ImageSource = raster('ImageSource', 'radar');
