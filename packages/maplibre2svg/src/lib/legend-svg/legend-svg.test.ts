import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLegend } from '../legend';
import type { LayerLegend } from '../types';
import { legendToSvg } from './index';

const layers = [
	{ id: 'water', type: 'fill', source: 's', paint: { 'fill-color': '#9cf' } },
	{
		id: 'roads',
		type: 'line',
		source: 's',
		paint: { 'line-color': ['match', ['get', 'k'], 'a', '#f00', '#000'] }
	},
	{
		id: 'relief',
		type: 'color-relief',
		source: 'dem',
		paint: {
			'color-relief-color': ['interpolate', ['linear'], ['elevation'], 0, '#000', 100, '#fff']
		}
	},
	{
		id: 'trail',
		type: 'line',
		source: 's',
		paint: { 'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#00f', 1, '#f00'] }
	}
] as unknown as LayerSpecification[];
const style = { version: 8, sources: {}, layers } as StyleSpecification;
const measure = (text: string) => text.length * 6;

const texts = (svg: SVGSVGElement) => [...svg.querySelectorAll('text')].map((t) => t.textContent);

describe('legendToSvg', () => {
	it('stacks the layers: titles of layers with several entries, then their rows', async () => {
		const legends = await createLegend(style);
		const svg = legendToSvg(legends, { measureText: measure });
		expect(texts(svg)).toEqual(['water', 'roads', 'a', 'Other', 'relief', '≤ 0', '≥ 100', 'trail']);
		expect(svg.querySelectorAll(':scope > svg')).toHaveLength(6);
		expect(svg.querySelector('text')?.closest('g')?.getAttribute('fill')).toBe('#222222');
		expect(Number(svg.getAttribute('width'))).toBeGreaterThan(0);
	});

	it('has title modes, reverse and a separator', async () => {
		const legends = await createLegend(style);
		expect(texts(legendToSvg(legends, { titles: 'never', measureText: measure }))).toEqual([
			'water',
			'a',
			'Other',
			'≤ 0',
			'≥ 100',
			'trail'
		]);
		expect(texts(legendToSvg(legends, { titles: 'always', measureText: measure }))).toEqual([
			'water',
			'water',
			'roads',
			'a',
			'Other',
			'relief',
			'≤ 0',
			'≥ 100',
			'trail',
			'trail'
		]);
		expect(texts(legendToSvg(legends, { reverse: true, measureText: measure }))[0]).toBe('trail');
		expect(
			legendToSvg(legends, { separator: true }).querySelectorAll(':scope > line')
		).toHaveLength(3);
	});

	it('copies the symbols with unique ids which still resolve, leaving the entries as they are', async () => {
		const legends = await createLegend(style);
		const trail = legends[3].entries[0].svg;
		const originalId = trail.querySelector('linearGradient')?.id;
		const before = trail.outerHTML;
		const a = legendToSvg(legends);
		const b = legendToSvg(legends);
		expect(trail.outerHTML).toBe(before);
		expect(trail.parentNode).toBeNull();
		const ids = [...a.querySelectorAll('[id]'), ...b.querySelectorAll('[id]')].map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).not.toContain(originalId);
		for (const node of a.querySelectorAll('[stroke^="url("], [fill^="url("]')) {
			const ref = (node.getAttribute('stroke') ?? node.getAttribute('fill'))?.match(
				/url\(#(.+)\)/
			)?.[1];
			expect(a.querySelector(`[id="${ref}"]`), ref).not.toBeNull();
		}
	});

	it('cuts labels with an ellipsis at the width', async () => {
		const long = { id: 'a very long layer label which does not fit', type: 'fill', source: 's' };
		const legends = await createLegend({ ...style, layers: [long] } as StyleSpecification);
		const svg = legendToSvg(legends, { width: 120, measureText: measure });
		const label = texts(svg)[0] ?? '';
		expect(label.endsWith('…')).toBe(true);
		expect(measure(label)).toBeLessThanOrEqual(120 - 8 - (8 + 30 + 6));
		expect(svg.getAttribute('width')).toBe('120');
	});

	it('serialises as standalone SVG, with xlink:href beside href by default', async () => {
		const legends = [...(await createLegend(style)), imageLegend()];
		const text = new XMLSerializer().serializeToString(
			legendToSvg(legends, { background: '#fff' })
		);
		expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(text).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
		expect(text).toMatch(
			/<image[^>]* href="data:image\/png;base64,AA"[^>]* xlink:href="data:image\/png;base64,AA"/
		);
		const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
		expect(parsed.querySelector('parsererror')).toBeNull();
		expect(parsed.documentElement.tagName).toBe('svg');
		const plain = new XMLSerializer().serializeToString(legendToSvg(legends, { xlink: false }));
		expect(plain).not.toContain('xlink');
	});

	it('aligns the labels of each layer after its own widest symbol', async () => {
		const legends = [...(await createLegend(style)), imageLegend(90)];
		const svg = legendToSvg(legends, { measureText: measure, titles: 'never' });
		const x = (label: string) =>
			[...svg.querySelectorAll('text')].find((t) => t.textContent === label)?.getAttribute('x');
		expect(x('water')).toBe('44');
		expect(x('wide')).toBe(String(8 + 90 + 6));
	});

	it('falls back for options which are not sane, and for a measurer which fails', async () => {
		const legends = await createLegend(style);
		const svg = legendToSvg(legends, {
			padding: -5,
			rowGap: Number.NaN,
			fontSize: Infinity,
			width: -1,
			maxWidth: Number.NaN,
			measureText: () => {
				throw new Error('no canvas');
			}
		});
		const text = new XMLSerializer().serializeToString(svg);
		expect(text).not.toMatch(/NaN|Infinity/);
		expect(svg.querySelector('text')?.getAttribute('x')).toBe('44');
		const odd = legendToSvg(legends, { measureText: () => Number.NaN, width: 1e9 });
		expect(odd.getAttribute('width')).toBe('10000');
		expect(new XMLSerializer().serializeToString(odd)).not.toMatch(/NaN|Infinity/);
	});
});

/** A legend of one entry whose symbol holds an image */
function imageLegend(width = 30): LayerLegend {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', String(width));
	svg.setAttribute('height', '20');
	const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
	image.setAttribute('href', 'data:image/png;base64,AA');
	svg.append(image);
	return {
		layerId: 'wide',
		type: 'symbol',
		label: 'wide',
		entries: [{ label: 'wide', kind: 'single', svg, width, height: 20 }]
	};
}
