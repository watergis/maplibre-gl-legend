import { describe, expect, it } from 'vitest';
import { createSvg, el, fmt, SVG_NS } from './render/svg';

describe('svg helpers', () => {
	it('formats numbers with 2 decimals at most', () => {
		expect(fmt(1.23456)).toBe('1.23');
		expect(fmt(-0.001)).toBe('0');
		expect(fmt(10)).toBe('10');
	});

	it('creates elements in the SVG namespace, skipping undefined attributes', () => {
		const rect = el(document, 'rect', { width: 1.005, fill: 'red', stroke: undefined });
		expect(rect.namespaceURI).toBe(SVG_NS);
		expect(rect.getAttribute('fill')).toBe('red');
		expect(rect.hasAttribute('stroke')).toBe(false);
	});

	it('creates a root svg with its size', () => {
		const svg = createSvg(document, 30, 20, [el(document, 'g')]);
		expect(svg.getAttribute('viewBox')).toBe('0 0 30 20');
		expect(svg.childNodes).toHaveLength(1);
	});
});
