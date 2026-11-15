/** A premultiplied RGBA color, 0..1, as MapLibre's shader takes colors */
export type Premultiplied = [number, number, number, number];

/** The colors and the light of a hillshade, as its uniforms */
export interface HillshadeLight {
	/** `hillshade-illumination-direction` in degrees, 0 = north, clockwise */
	direction: number;
	exaggeration: number;
	highlight: Premultiplied;
	shadow: Premultiplied;
	accent: Premultiplied;
}

/** A hill of the synthetic terrain: center and spread in CSS pixels of a 30 × 20 swatch */
interface Hill {
	x: number;
	y: number;
	sx: number;
	sy: number;
	height: number;
}

/** A range: a main summit, a lower one, a ridge between them and foothills */
const HILLS: Hill[] = [
	{ x: 19, y: 8, sx: 5.5, sy: 4.5, height: 1 },
	{ x: 8.5, y: 11.5, sx: 4.5, sy: 3.8, height: 0.72 },
	{ x: 14, y: 10, sx: 7, sy: 2.2, height: 0.38 },
	{ x: 26, y: 15.5, sx: 3.2, sy: 2.8, height: 0.42 },
	{ x: 4, y: 3.5, sx: 2.8, sy: 2.4, height: 0.35 },
	{ x: 22, y: 17, sx: 6, sy: 1.6, height: 0.2 }
];

/** A deterministic sequence in 0..1 (an LCG), for the knolls of the terrain */
function sequence(seed: number, count: number): number[] {
	const values: number[] = [];
	let state = seed;
	for (let i = 0; i < count; i++) {
		state = (state * 1664525 + 1013904223) % 4294967296;
		values.push(state / 4294967296);
	}
	return values;
}

/** Knolls on the slopes and in the plain, so that the relief is irregular like real terrain */
const KNOLLS: Hill[] = (() => {
	const r = sequence(7, 18 * 4);
	return Array.from({ length: 18 }, (_, i) => ({
		x: r[i * 4] * 30,
		y: r[i * 4 + 1] * 20,
		sx: 1 + r[i * 4 + 2] * 1.6,
		sy: 0.8 + r[i * 4 + 3] * 1.4,
		height: 0.05 + r[i * 4 + 2] * 0.1
	}));
})();

/** Gullies down the slopes of the summits: long narrow hollows, which give ridges between them */
const GULLIES: { x: number; y: number; angle: number; length: number }[] = [
	{ x: 19, y: 8, angle: 200, length: 7 },
	{ x: 19, y: 8, angle: 120, length: 6 },
	{ x: 19, y: 8, angle: 330, length: 5 },
	{ x: 8.5, y: 11.5, angle: 150, length: 5 },
	{ x: 8.5, y: 11.5, angle: 250, length: 4.5 }
];

function gullies(x: number, y: number): number {
	let depth = 0;
	for (const g of GULLIES) {
		const a = (g.angle * Math.PI) / 180;
		const [ux, uy] = [Math.sin(a), -Math.cos(a)];
		const along = (x - g.x) * ux + (y - g.y) * uy;
		const across = -(x - g.x) * uy + (y - g.y) * ux;
		if (along <= 0) continue;
		// fades in smoothly from the summit, so that no crease shows where it starts
		const start = 1 - Math.exp(-(along * along) / 2);
		const t = along / g.length;
		depth += 0.1 * start * Math.exp(-(across * across) / 1.6) * Math.exp(-((t - 0.5) ** 2) / 0.18);
	}
	return depth;
}

/** Height of the terrain at a point, in units of the swatch 30 × 20 */
export function terrainHeight(x: number, y: number): number {
	let z = 0;
	for (const hill of HILLS) {
		const dx = (x - hill.x) / hill.sx;
		const dy = (y - hill.y) / hill.sy;
		z += hill.height * Math.exp(-(dx * dx + dy * dy) / 2);
	}
	for (const knoll of KNOLLS) {
		const dx = (x - knoll.x) / knoll.sx;
		const dy = (y - knoll.y) / knoll.sy;
		z += knoll.height * Math.exp(-(dx * dx + dy * dy) / 2);
	}
	return z - gullies(x, y);
}

/** Steepness of the terrain: the derivative per CSS pixel which gives slopes like a DEM's */
const RELIEF = 7;

/** The gradient of the terrain (x east, y south), as MapLibre's prepare pass gives it */
export function terrainDerivative(x: number, y: number): [number, number] {
	const e = 0.25;
	return [
		((terrainHeight(x + e, y) - terrainHeight(x - e, y)) / (2 * e)) * RELIEF,
		((terrainHeight(x, y + e) - terrainHeight(x, y - e)) / (2 * e)) * RELIEF
	];
}

/**
 * MapLibre's `standard_hillshade` (hillshade.fragment.glsl, 6.16) for one derivative:
 * premultiplied RGBA of the shade from shadow to highlight by how the slope faces the light,
 * and the accent on the steep slopes, both scaled by the exaggeration
 */
export function standardHillshade(deriv: [number, number], light: HillshadeLight): Premultiplied {
	const azimuth = (light.direction * Math.PI) / 180 + Math.PI;
	const slope = Math.atan(0.625 * Math.hypot(deriv[0], deriv[1]));
	const aspect =
		deriv[0] !== 0 ? Math.atan2(deriv[1], -deriv[0]) : (Math.PI / 2) * (deriv[1] > 0 ? 1 : -1);
	const intensity = light.exaggeration;
	const base = 1.875 - intensity * 1.75;
	const maxValue = 0.5 * Math.PI;
	const scaledSlope =
		intensity !== 0.5 ? ((base ** slope - 1) / (base ** maxValue - 1)) * maxValue : slope;
	const strength = Math.min(1, Math.max(0, intensity * 2));
	const accent = (1 - Math.cos(scaledSlope)) * strength;
	const mod = (a: number, n: number) => a - n * Math.floor(a / n);
	const shade = Math.abs(mod((aspect + azimuth) / Math.PI + 0.5, 2) - 1);
	const shadeScale = Math.sin(scaledSlope) * strength;
	const color = light.shadow.map(
		(s, i) => (s + (light.highlight[i] - s) * shade) * shadeScale
	) as Premultiplied;
	return color.map((c, i) => light.accent[i] * accent * (1 - color[3]) + c) as Premultiplied;
}

/**
 * The shaded synthetic terrain, `width × height` device pixels for a swatch of
 * `cssWidth × cssHeight`, as straight RGBA for an image
 */
export function shadeTerrain(
	width: number,
	height: number,
	cssWidth: number,
	cssHeight: number,
	light: HillshadeLight
): Uint8ClampedArray {
	const out = new Uint8ClampedArray(width * height * 4);
	const [sx, sy] = [30 / width, 20 / height];
	// the terrain is laid out for 30 × 20; keep its slopes when the swatch is another size
	const slopeScale = Math.sqrt((30 / cssWidth) * (20 / cssHeight));
	for (let py = 0; py < height; py++) {
		for (let px = 0; px < width; px++) {
			const [dx, dy] = terrainDerivative((px + 0.5) * sx, (py + 0.5) * sy);
			const [r, g, b, a] = standardHillshade([dx * slopeScale, dy * slopeScale], light);
			const i = (py * width + px) * 4;
			if (a <= 0) continue;
			out[i] = (r / a) * 255;
			out[i + 1] = (g / a) * 255;
			out[i + 2] = (b / a) * 255;
			out[i + 3] = a * 255;
		}
	}
	return out;
}
