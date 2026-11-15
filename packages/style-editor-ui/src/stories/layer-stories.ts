/**
 * Styles of the stories of the style editor: a style per layer type, made only of data generated
 * here (GeoJSON, raster and DEM tiles from the `story-raster://` and `story-dem://` protocols,
 * icons), so the stories work without tile servers. Only the glyphs of the text are loaded from
 * the MapLibre demo tiles.
 */
import type { FeatureCollection } from 'geojson';
import {
	addProtocol,
	type LayerSpecification,
	type Map,
	type StyleSpecification
} from 'maplibre-gl';

const GLYPHS = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';
const FONT = ['Open Sans Semibold'];

/** a story of the style editor: a style, and the layer the editor opens */
export interface LayerStory {
	/** the layer the editor is opened for */
	layerId: string;
	/** the title of the dialog */
	title: string;
	style: StyleSpecification;
	/** initial view */
	center?: [number, number];
	zoom?: number;
	pitch?: number;
}

// ---------------------------------------------------------------------------------------------
// GeoJSON

const square = (x: number, y: number, size: number): [number, number][][] => [
	[
		[x, y],
		[x + size, y],
		[x + size, y + size],
		[x, y + size],
		[x, y]
	]
];

const CLASSES = ['park', 'water', 'residential', 'industrial'];

/** a grid of squares, with a class, a name and a height */
const areas: FeatureCollection = {
	type: 'FeatureCollection',
	features: Array.from({ length: 16 }, (_, i) => {
		const x = -0.2 + (i % 4) * 0.1;
		const y = -0.2 + Math.floor(i / 4) * 0.1;
		return {
			type: 'Feature',
			properties: { class: CLASSES[i % 4], name: `Area ${i + 1}`, height: 20 + i * 15 },
			geometry: { type: 'Polygon', coordinates: square(x, y, 0.08) }
		};
	})
};

const ROAD_CLASSES = ['primary', 'secondary', 'tertiary'];

/** a few roads of different classes */
const roads: FeatureCollection = {
	type: 'FeatureCollection',
	features: Array.from({ length: 6 }, (_, i) => ({
		type: 'Feature',
		properties: { class: ROAD_CLASSES[i % 3], name: `Road ${i + 1}` },
		geometry: {
			type: 'LineString',
			coordinates: Array.from({ length: 12 }, (_, j) => [
				-0.25 + j * 0.045,
				-0.2 + i * 0.08 + Math.sin(j / 2 + i) * 0.02
			])
		}
	}))
};

/** points with a size and a name, scattered with a fixed seed */
const points: FeatureCollection = (() => {
	let seed = 7;
	const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
	return {
		type: 'FeatureCollection',
		features: Array.from({ length: 300 }, (_, i) => {
			// denser in the middle, for the heatmap
			const r = 0.22 * random() ** 1.5;
			const a = random() * Math.PI * 2;
			return {
				type: 'Feature',
				properties: { size: 1 + (i % 5), name: i % 12 === 0 ? `Point ${i}` : '' },
				geometry: { type: 'Point', coordinates: [Math.cos(a) * r, Math.sin(a) * r] }
			};
		})
	};
})();

const vectorSources: StyleSpecification['sources'] = {
	areas: { type: 'geojson', data: areas },
	roads: { type: 'geojson', data: roads },
	points: { type: 'geojson', data: points }
};

const base: LayerSpecification = {
	id: 'background',
	type: 'background',
	paint: { 'background-color': '#f1f5f9' }
};

/** a style with the base layers, then the layers of the story */
const style = (
	layers: LayerSpecification[],
	sources: StyleSpecification['sources'] = vectorSources
): StyleSpecification => ({
	version: 8,
	glyphs: GLYPHS,
	sources,
	layers: [base, ...layers]
});

const areaContext: LayerSpecification = {
	id: 'areas-context',
	type: 'fill',
	source: 'areas',
	paint: { 'fill-color': '#cbd5e1', 'fill-opacity': 0.5 }
};

// ---------------------------------------------------------------------------------------------
// generated raster and DEM tiles

const TILE_SIZE = 256;

/** longitude / latitude of a pixel of a tile */
const lngLat = (z: number, x: number, y: number, px: number, py: number) => {
	const n = 2 ** z;
	const lng = ((x + px / TILE_SIZE) / n) * 360 - 180;
	const m = Math.PI - (2 * Math.PI * (y + py / TILE_SIZE)) / n;
	const lat = (180 / Math.PI) * Math.atan(Math.sinh(m));
	return [lng, lat];
};

/** elevation of the generated terrain, in m: hills around [0, 0] */
const elevation = (lng: number, lat: number) =>
	600 +
	500 * Math.sin(lng * 18) * Math.cos(lat * 14) +
	300 * Math.exp(-((lng * lng + lat * lat) / 0.01));

const parseTile = (url: string) => {
	const [z, x, y] = url.split('://')[1].split('/').map(Number);
	return { z, x, y };
};

const toPng = async (draw: (data: Uint8ClampedArray) => void) => {
	const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
	const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
	const image = context.createImageData(TILE_SIZE, TILE_SIZE);
	draw(image.data);
	context.putImageData(image, 0, 0);
	const blob = await canvas.convertToBlob({ type: 'image/png' });
	return { data: await blob.arrayBuffer() };
};

let protocolsAdded = false;

/** add the `story-raster://` and `story-dem://` protocols, once */
export function addStoryProtocols() {
	if (protocolsAdded) return;
	protocolsAdded = true;
	// a colourful raster: hue by longitude, lightness by latitude, with a grid
	addProtocol('story-raster', ({ url }) => {
		const { z, x, y } = parseTile(url);
		return toPng((data) => {
			for (let py = 0; py < TILE_SIZE; py++) {
				for (let px = 0; px < TILE_SIZE; px++) {
					const [lng, lat] = lngLat(z, x, y, px, py);
					const i = (py * TILE_SIZE + px) * 4;
					const grid =
						Math.abs(lng * 20 - Math.round(lng * 20)) < 0.03 ||
						Math.abs(lat * 20 - Math.round(lat * 20)) < 0.03;
					data[i] = 128 + 127 * Math.sin(lng * 10);
					data[i + 1] = 128 + 127 * Math.sin(lat * 10 + 2);
					data[i + 2] = 128 + 127 * Math.sin((lng + lat) * 10 + 4);
					if (grid) data[i] = data[i + 1] = data[i + 2] = 40;
					data[i + 3] = 255;
				}
			}
		});
	});
	// terrarium-encoded DEM
	addProtocol('story-dem', ({ url }) => {
		const { z, x, y } = parseTile(url);
		return toPng((data) => {
			for (let py = 0; py < TILE_SIZE; py++) {
				for (let px = 0; px < TILE_SIZE; px++) {
					const value = elevation(...(lngLat(z, x, y, px, py) as [number, number])) + 32768;
					const i = (py * TILE_SIZE + px) * 4;
					data[i] = Math.floor(value / 256);
					data[i + 1] = Math.floor(value % 256);
					data[i + 2] = Math.floor((value % 1) * 256);
					data[i + 3] = 255;
				}
			}
		});
	});
}

const rasterSources: StyleSpecification['sources'] = {
	raster: {
		type: 'raster',
		tiles: ['story-raster://{z}/{x}/{y}'],
		tileSize: TILE_SIZE,
		maxzoom: 14
	},
	dem: {
		type: 'raster-dem',
		tiles: ['story-dem://{z}/{x}/{y}'],
		tileSize: TILE_SIZE,
		encoding: 'terrarium',
		maxzoom: 12
	}
};

// ---------------------------------------------------------------------------------------------
// icons

/** an image of a pin: `pin-sdf` is an SDF image (its color is set by the style), `pin` is not */
export function addStoryImages(map: Map) {
	map.on('styleimagemissing', ({ id }) => {
		if (id !== 'pin' && id !== 'pin-sdf') return;
		const size = 32;
		const data = new Uint8Array(size * size * 4);
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const d = Math.hypot(x - size / 2 + 0.5, y - size / 2.5);
				const inside =
					d < size / 3 || (y > size / 2 && Math.abs(x - size / 2 + 0.5) < (size - y) / 2.5);
				const i = (y * size + x) * 4;
				if (id === 'pin-sdf') {
					// a rough distance field: 255 inside, fading out
					const alpha = inside ? 255 : Math.max(0, 191 - (d - size / 3) * 40);
					data[i] = data[i + 1] = data[i + 2] = 0;
					data[i + 3] = alpha;
				} else if (inside) {
					const ring = d < size / 7;
					data[i] = ring ? 255 : 220;
					data[i + 1] = ring ? 255 : 38;
					data[i + 2] = ring ? 255 : 38;
					data[i + 3] = 255;
				}
			}
		}
		map.addImage(id, { width: size, height: size, data }, { sdf: id === 'pin-sdf' });
	});
}

// ---------------------------------------------------------------------------------------------
// stories

/** the stories, by layer type (and variants) */
export const LAYER_STORIES = {
	background: {
		layerId: 'background',
		title: 'Background',
		style: style([])
	},
	fill: {
		layerId: 'areas',
		title: 'Land use',
		style: style([
			{
				id: 'areas',
				type: 'fill',
				source: 'areas',
				paint: {
					'fill-color': [
						'match',
						['get', 'class'],
						'park',
						'#86efac',
						'water',
						'#93c5fd',
						'residential',
						'#fde68a',
						'#d4d4d8'
					],
					'fill-outline-color': '#475569',
					'fill-opacity': 0.8
				}
			}
		])
	},
	fillExpression: {
		layerId: 'areas',
		title: 'Land use (computed color)',
		style: style([
			{
				id: 'areas',
				type: 'fill',
				source: 'areas',
				paint: {
					// the color is computed from the height: only the manual editor edits it
					'fill-color': ['case', ['>', ['get', 'height'], 120], '#f97316', '#0ea5e9'],
					'fill-opacity': 0.7
				}
			}
		])
	},
	line: {
		layerId: 'roads',
		title: 'Roads',
		style: style([
			areaContext,
			{
				id: 'roads',
				type: 'line',
				source: 'roads',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': [
						'match',
						['get', 'class'],
						'primary',
						'#dc2626',
						'secondary',
						'#f59e0b',
						'#64748b'
					],
					'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 12, 4, 15, 12]
				}
			}
		])
	},
	lineDashed: {
		layerId: 'roads',
		title: 'Paths',
		style: style([
			areaContext,
			{
				id: 'roads',
				type: 'line',
				source: 'roads',
				paint: { 'line-color': '#334155', 'line-width': 2, 'line-dasharray': [10, 4] }
			}
		])
	},
	symbolText: {
		layerId: 'labels',
		title: 'Area labels',
		style: style([
			areaContext,
			{
				id: 'labels',
				type: 'symbol',
				source: 'areas',
				layout: {
					'text-field': ['get', 'name'],
					'text-font': FONT,
					'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 18]
				},
				paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }
			}
		])
	},
	symbolSdfIcon: {
		layerId: 'pins',
		title: 'Pins (SDF icon)',
		style: style([
			areaContext,
			{
				id: 'pins',
				type: 'symbol',
				source: 'points',
				filter: ['!=', ['get', 'name'], ''],
				layout: {
					'icon-image': 'pin-sdf',
					'icon-size': 1,
					'icon-anchor': 'bottom',
					'text-field': ['get', 'name'],
					'text-font': FONT,
					'text-size': 12,
					'text-anchor': 'top'
				},
				paint: {
					'icon-color': '#7c3aed',
					'icon-halo-color': '#ffffff',
					'icon-halo-width': 1,
					'text-color': '#4c1d95'
				}
			}
		])
	},
	symbolIcon: {
		layerId: 'pins',
		title: 'Pins (icon)',
		style: style([
			areaContext,
			{
				id: 'pins',
				type: 'symbol',
				source: 'points',
				filter: ['!=', ['get', 'name'], ''],
				layout: { 'icon-image': 'pin', 'icon-size': 1, 'icon-anchor': 'bottom' }
			}
		])
	},
	circle: {
		layerId: 'points',
		title: 'Points',
		style: style([
			areaContext,
			{
				id: 'points',
				type: 'circle',
				source: 'points',
				paint: {
					'circle-color': '#2563eb',
					'circle-radius': ['step', ['zoom'], 3, 11, 5, 13, 8],
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 1,
					'circle-opacity': 0.85
				}
			}
		])
	},
	fillExtrusion: {
		layerId: 'buildings',
		title: 'Buildings',
		pitch: 55,
		zoom: 10.5,
		style: style([
			{
				id: 'buildings',
				type: 'fill-extrusion',
				source: 'areas',
				paint: {
					'fill-extrusion-color': '#a78bfa',
					'fill-extrusion-height': ['*', ['get', 'height'], 30],
					'fill-extrusion-base': 0,
					'fill-extrusion-opacity': 0.9
				}
			}
		])
	},
	raster: {
		layerId: 'raster',
		title: 'Raster',
		style: style([{ id: 'raster', type: 'raster', source: 'raster' }], rasterSources)
	},
	hillshade: {
		layerId: 'hillshade',
		title: 'Hillshade',
		style: style(
			[
				{
					id: 'hillshade',
					type: 'hillshade',
					source: 'dem',
					paint: { 'hillshade-exaggeration': 0.6, 'hillshade-shadow-color': '#1e293b' }
				}
			],
			rasterSources
		)
	},
	colorRelief: {
		layerId: 'color-relief',
		title: 'Color relief',
		style: style(
			[
				{
					id: 'color-relief',
					type: 'color-relief',
					source: 'dem',
					paint: {
						'color-relief-color': [
							'interpolate',
							['linear'],
							['elevation'],
							0,
							'#14532d',
							400,
							'#65a30d',
							800,
							'#facc15',
							1200,
							'#b45309',
							1500,
							'#ffffff'
						],
						'color-relief-opacity': 0.9
					}
				}
			],
			rasterSources
		)
	},
	heatmap: {
		layerId: 'heat',
		title: 'Heatmap',
		style: style([
			areaContext,
			{
				id: 'heat',
				type: 'heatmap',
				source: 'points',
				paint: {
					'heatmap-radius': 20,
					'heatmap-intensity': 1,
					'heatmap-color': [
						'interpolate',
						['linear'],
						['heatmap-density'],
						0,
						'rgba(0, 0, 255, 0)',
						0.2,
						'royalblue',
						0.4,
						'cyan',
						0.6,
						'lime',
						0.8,
						'yellow',
						1,
						'red'
					]
				}
			}
		])
	}
} satisfies Record<string, LayerStory>;
