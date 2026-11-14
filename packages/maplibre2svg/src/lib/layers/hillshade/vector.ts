import type { EvaluatedLayer } from '../../expression';
import { el, fmt, uniqueId } from '../../svg';
import { clamp, frame, numberOf, paintColor, swatch } from '../common';
import type { RenderContext, RenderedSymbol } from '../types';

/** Default of `hillshade-illumination-direction` */
const DEFAULT_DIRECTION = 335;
/** How strong the highlight and the shadow are at full exaggeration */
const HIGHLIGHT = 1;
const SHADOW = 0.85;

type Point = [number, number];

/**
 * The crests of a small range, in fractions of the swatch: a main ridge, a spur off it and a
 * lower ridge, each with the reach of its slopes in fractions of the height
 */
const RIDGES: { crest: Point[]; reach: number }[] = [
	{
		crest: [
			[0.04, 0.82],
			[0.3, 0.42],
			[0.52, 0.26],
			[0.96, 0.5]
		],
		reach: 0.42
	},
	{
		crest: [
			[0.52, 0.26],
			[0.6, 0.62],
			[0.66, 1.02]
		],
		reach: 0.3
	},
	{
		crest: [
			[0.02, 0.18],
			[0.2, 0.06]
		],
		reach: 0.22
	}
];
/** The crease between the main ridge and the spur, for the accent color */
const CREASE: Point[] = [
	[0.42, 1.02],
	[0.47, 0.66],
	[0.5, 0.4]
];

/** The first entry of a value which newer specifications allow to be an array */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** Light from the direction (0 = north, clockwise) on a slope which faces `aspect` (likewise) */
export function facetLight(aspect: number, direction: number): number {
	return Math.cos(((aspect - direction) * Math.PI) / 180);
}

type Shade = { color: string; opacity: number };

interface Scene {
	doc: Document;
	width: number;
	height: number;
	direction: number;
	strength: number;
	light: Shade;
	dark: Shade;
}

/**
 * One slope beside a segment of a crest: a band from the crest down to its foot, shaded by how
 * it faces the light, strongest at the crest and fading out at the foot (a gradient across it)
 */
function slope(scene: Scene, a: Point, b: Point, side: 1 | -1, reach: number) {
	const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
	const length = Math.hypot(dx, dy) || 1;
	// the normal of the segment towards this side, in pixels
	const [nx, ny] = [(-dy / length) * side * reach, (dx / length) * side * reach];
	const foot = (p: Point): Point => [p[0] + nx, p[1] + ny];
	const aspect = (Math.atan2(nx, -ny) * 180) / Math.PI;
	const lit = facetLight(aspect, scene.direction);
	const shade = lit >= 0 ? scene.light : scene.dark;
	const alpha = shade.opacity * Math.abs(lit) * (lit >= 0 ? HIGHLIGHT : SHADOW) * scene.strength;
	const id = uniqueId('slope');
	const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	const gradient = el(
		scene.doc,
		'linearGradient',
		{ id, gradientUnits: 'userSpaceOnUse', x1: mx, y1: my, x2: mx + nx, y2: my + ny },
		[
			el(scene.doc, 'stop', { offset: 0, 'stop-color': shade.color, 'stop-opacity': alpha }),
			el(scene.doc, 'stop', {
				offset: 0.45,
				'stop-color': shade.color,
				'stop-opacity': alpha * 0.55
			}),
			el(scene.doc, 'stop', { offset: 1, 'stop-color': shade.color, 'stop-opacity': 0 })
		]
	);
	const polygon = el(scene.doc, 'polygon', {
		points: [a, b, foot(b), foot(a)].map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' '),
		fill: `url(#${id})`,
		'data-aspect': Math.round((aspect + 360) % 360),
		'data-light': Math.round(lit * 100) / 100
	});
	return { gradient, polygon };
}

const toPixels = (points: Point[], width: number, height: number): Point[] =>
	points.map(([x, y]) => [x * width, y * height]);

/**
 * The stand-in of the shaded relief where no image can be encoded (Node): a ridge with a spur and a lower ridge, each
 * slope lit in `hillshade-highlight-color` when it faces `hillshade-illumination-direction`
 * (0 = north, clockwise; the first one of an array) and shaded in `hillshade-shadow-color`
 * when it faces away, strongest at the crest and fading towards the foot, over a neutral ground.
 * The crease between the ridges takes `hillshade-accent-color`. `hillshade-exaggeration` sets the
 * contrast; `hillshade-method` does not change the drawing.
 */
export function vectorHillshade(layer: EvaluatedLayer, ctx: RenderContext): RenderedSymbol {
	const { width, height } = ctx.swatch;
	const doc = ctx.document;
	const scene: Scene = {
		doc,
		width,
		height,
		direction: numberOf(first(layer.paint['hillshade-illumination-direction']), DEFAULT_DIRECTION),
		strength: clamp(numberOf(layer.paint['hillshade-exaggeration'], 0.5) * 1.6, 0, 1),
		light: paintColor(first(layer.paint['hillshade-highlight-color']) ?? '#ffffff'),
		dark: paintColor(first(layer.paint['hillshade-shadow-color']) ?? '#000000')
	};
	const accent = paintColor(layer.paint['hillshade-accent-color'] ?? '#000000');
	const gradients: Element[] = [];
	const slopes: Element[] = [];
	for (const ridge of RIDGES) {
		const crest = toPixels(ridge.crest, width, height);
		for (let i = 0; i < crest.length - 1; i++) {
			for (const side of [1, -1] as const) {
				const part = slope(scene, crest[i], crest[i + 1], side, ridge.reach * height);
				gradients.push(part.gradient);
				slopes.push(part.polygon);
			}
		}
	}
	const [clip, soften] = [uniqueId('clip'), uniqueId('soften')];
	const crease = toPixels(CREASE, width, height);
	const creasePath = el(doc, 'path', {
		d: `M${crease.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' L')}`,
		fill: 'none',
		stroke: accent.color,
		'stroke-opacity': accent.opacity * 0.5 * scene.strength,
		'stroke-width': Math.max(0.5, height / 24),
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round'
	});
	const defs = el(doc, 'defs', {}, [
		el(doc, 'clipPath', { id: clip }, [el(doc, 'rect', { width, height })]),
		// a slight blur hides the seams between the slopes and softens the crests
		el(doc, 'filter', { id: soften, x: '-10%', y: '-10%', width: '120%', height: '120%' }, [
			el(doc, 'feGaussianBlur', { stdDeviation: Math.max(0.25, height / 50) })
		]),
		...gradients
	]);
	const ground = el(doc, 'rect', { x: 0, y: 0, width, height, fill: 'rgba(128,128,128,0.22)' });
	const relief = el(doc, 'g', { filter: `url(#${soften})` }, [...slopes, creasePath]);
	const border = frame(ctx, width, height);
	return swatch(ctx, width, height, [
		defs,
		ground,
		el(doc, 'g', { 'clip-path': `url(#${clip})` }, [relief]),
		...(border ? [border] : [])
	]);
}
