import { describe, expect, it } from 'vitest';
import { attrsOf, evaluatedLayer, renderContext, withoutEncoder } from '../../test-utils';
import type { HillshadeLight } from './shade';
import { HillshadeAdapter, standardHillshade, terrainDerivative } from './index';

const renderHillshade = (...args: Parameters<HillshadeAdapter['render']>) =>
	new HillshadeAdapter().render(...args);

const light = (direction: number, exaggeration = 0.5): HillshadeLight => ({
	direction,
	exaggeration,
	highlight: [1, 1, 0, 1],
	shadow: [0, 0, 1, 1],
	accent: [0, 0, 0, 0]
});

/** How much of the highlight (yellow) against the shadow (blue) a point gets */
const lit = (x: number, y: number, direction: number) => {
	const [r, , b] = standardHillshade(terrainDerivative(x, y), light(direction));
	return r - b;
};

describe('the hillshade shader', () => {
	it('lights the slopes which face the light and shades the others', () => {
		// the main summit is at (19, 8): its north slope at y 4, its south slope at y 12
		expect(lit(19, 4, 0)).toBeGreaterThan(0);
		expect(lit(19, 12, 0)).toBeLessThan(0);
		expect(lit(19, 12, 180)).toBeGreaterThan(0);
		expect(lit(24, 8, 90)).toBeGreaterThan(0);
		expect(lit(14.5, 8, 90)).toBeLessThan(0);
	});

	it('is transparent on flat ground and stronger with the exaggeration', () => {
		expect(standardHillshade([0, 0], light(0))[3]).toBe(0);
		const weak = standardHillshade([1, 1], light(0, 0.1))[3];
		const strong = standardHillshade([1, 1], light(0, 1))[3];
		expect(strong).toBeGreaterThan(weak);
	});

	it('puts the accent on steep slopes', () => {
		const accented = {
			...light(0),
			shadow: [0, 0, 0, 0],
			highlight: [0, 0, 0, 0],
			accent: [1, 0, 0, 1]
		} as HillshadeLight;
		expect(standardHillshade([3, 0], accented)[0]).toBeGreaterThan(
			standardHillshade([0.2, 0], accented)[0]
		);
	});
});

describe('renderHillshade', () => {
	it('draws the shaded terrain as an image over a neutral ground, framed', async () => {
		const symbol = await renderHillshade(
			evaluatedLayer('hillshade', { 'hillshade-illumination-direction': [90, 270] }),
			renderContext()
		);
		const image = attrsOf(symbol.svg, 'image');
		expect(image.href).toMatch(/^data:image\/x-test,30x20\//);
		expect([...symbol.svg.children].map((c) => c.tagName.toLowerCase())).toEqual([
			'rect',
			'image',
			'rect'
		]);
	});

	it('changes with the direction', async () => {
		const href = async (direction: number) =>
			attrsOf(
				(
					await renderHillshade(
						evaluatedLayer('hillshade', { 'hillshade-illumination-direction': direction }),
						renderContext()
					)
				).svg,
				'image'
			).href;
		const hrefs = await Promise.all([0, 90, 180, 270].map(href));
		expect(new Set(hrefs).size).toBeGreaterThan(1);
	});

	it('draws a vector stand-in without an encoder', async () => {
		const ctx = renderContext();
		const symbol = await renderHillshade(evaluatedLayer('hillshade'), withoutEncoder(ctx));
		expect(symbol.svg.querySelector('image')).toBeNull();
		expect(symbol.svg.querySelectorAll('polygon').length).toBeGreaterThan(0);
		expect(symbol.svg.querySelector('g[filter]')).not.toBeNull();
	});
});
