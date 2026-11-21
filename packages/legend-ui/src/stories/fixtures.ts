import type { LayerSpecification } from 'maplibre-gl';
import type { LegendGroups } from '../lib/types/legend-groups';

const fill = (id: string, color: string, sourceLayer = id): LayerSpecification =>
	({
		id,
		type: 'fill',
		source: 'water',
		'source-layer': sourceLayer,
		paint: { 'fill-color': color }
	}) as LayerSpecification;

const line = (id: string, color: string, sourceLayer = id): LayerSpecification =>
	({
		id,
		type: 'line',
		source: 'water',
		'source-layer': sourceLayer,
		paint: { 'line-color': color }
	}) as LayerSpecification;

const circle = (id: string, color: string, sourceLayer = id): LayerSpecification =>
	({
		id,
		type: 'circle',
		source: 'water',
		'source-layer': sourceLayer,
		paint: { 'circle-color': color }
	}) as LayerSpecification;

/** the layers of the stories, in the order of `style.layers` (the last one is drawn on top) */
export const LAYERS: LayerSpecification[] = [
	fill('village', '#fde68a'),
	line('village-outline', '#a16207', 'village'),
	line('pipeline', '#2563eb'),
	circle('pipeline-valve', '#1e3a8a', 'pipeline'),
	fill('wtp', '#a5f3fc'),
	circle('wtp-point', '#0891b2', 'wtp'),
	fill('tank', '#c7d2fe'),
	circle('tank-point', '#4f46e5', 'tank'),
	circle('intake', '#0f766e')
];

/** the titles of the layers */
export const TARGETS: Record<string, string> = {
	village: 'Village',
	'village-outline': 'Village Boundary',
	pipeline: 'Pipeline',
	'pipeline-valve': 'Valve',
	wtp: 'WTP',
	'wtp-point': 'WTP Point',
	tank: 'Tank',
	'tank-point': 'Tank Point',
	intake: 'Intake'
};

/** flat groups */
export const FLAT_GROUPS: LegendGroups = {
	Village: ['village', 'village-outline'],
	Pipeline: ['pipeline', 'pipeline-valve'],
	Facilities: ['wtp', 'wtp-point', 'tank', 'tank-point', 'intake']
};

/** groups nested three levels deep, as objects of groups */
export const NESTED_GROUPS: LegendGroups = {
	'Water Supply': {
		Facilities: {
			WTP: ['wtp', 'wtp-point'],
			Tank: ['tank', 'tank-point']
		},
		Pipeline: ['pipeline', 'pipeline-valve']
	},
	Village: ['village', 'village-outline']
};

/** a group with layers and a nested group in its array */
export const MIXED_GROUPS: LegendGroups = {
	Facilities: [{ 'Treatment Plant': ['wtp', 'wtp-point'] }, 'intake', 'tank', 'tank-point']
};
