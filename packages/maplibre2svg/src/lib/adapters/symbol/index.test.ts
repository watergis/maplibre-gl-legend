import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { createLayerLegend } from '../../core/legend-generator';
import {
	attrsOf,
	evaluatedLayer,
	fakeEncoder,
	renderContext,
	solidImage,
	withoutEncoder
} from '../../test-utils';
import type { LegendImage } from '../../core/types';
import { iconSize, rotatedBox } from './icon';
import { SymbolAdapter } from './index';

const renderSymbolLayer = (...args: Parameters<SymbolAdapter['render']>) =>
	new SymbolAdapter().render(...args);

const symbol = (layout: Record<string, unknown>, paint: Record<string, unknown> = {}, props = {}) =>
	evaluatedLayer('symbol', paint, layout, props);

const render = (layer: ReturnType<typeof symbol>, images: Record<string, LegendImage> = {}) =>
	renderSymbolLayer(layer, renderContext([layer], images));

describe('icon size', () => {
	it('is the image size divided by the pixel ratio times icon-size, clamped', () => {
		expect(iconSize(8, 4, 2, 40)).toEqual({ width: 16, height: 8 });
		expect(iconSize(100, 50, 1, 40)).toEqual({ width: 40, height: 20 });
	});

	it('grows with the rotation', () => {
		const box = rotatedBox(10, 10, 45);
		expect(box.width).toBeCloseTo(14.142);
		expect(rotatedBox(10, 4, 90).width).toBeCloseTo(4);
	});
});

describe('renderSymbolLayer', () => {
	const pin = solidImage(32, 16, [0, 128, 0, 255], { pixelRatio: 2 });

	it('draws the image at its display size, centered', async () => {
		const result = await render(symbol({ 'icon-image': 'pin', 'icon-size': 1.5 }), { pin });
		const image = attrsOf(result.svg, 'image');
		expect(image).toMatchObject({
			width: '24',
			height: '12',
			href: 'data:image/x-test,32x16/0,128,0,255'
		});
		expect([result.width, result.height]).toEqual([30, 20]);
		expect(attrsOf(result.svg, 'g', 1).transform).toContain('translate(12 6)');
	});

	it('grows the swatch for a large icon, clamped to maxSize', async () => {
		const result = await render(symbol({ 'icon-image': 'pin', 'icon-size': 10 }), { pin });
		expect(attrsOf(result.svg, 'image')).toMatchObject({ width: '40', height: '20' });
		expect(result.width).toBe(42);
	});

	it('rotates by icon-rotate and applies icon-opacity', async () => {
		const result = await render(
			symbol({ 'icon-image': 'pin', 'icon-rotate': 90 }, { 'icon-opacity': 0.5 }),
			{ pin }
		);
		const group = attrsOf(result.svg, 'g', 1);
		expect(group.transform).toContain('rotate(90)');
		expect(group.opacity).toBe('0.5');
	});

	it('tints an SDF icon with icon-color and ignores it for other icons', async () => {
		const sdf = solidImage(2, 2, [0, 0, 0, 255], { sdf: true });
		const tinted = await render(symbol({ 'icon-image': 'sdf' }, { 'icon-color': '#0000ff' }), {
			sdf
		});
		expect(attrsOf(tinted.svg, 'image').href).toBe('data:image/x-test,2x2/0,0,255,255');
		const plain = await render(symbol({ 'icon-image': 'pin' }, { 'icon-color': '#0000ff' }), {
			pin
		});
		expect(attrsOf(plain.svg, 'image').href).toBe('data:image/x-test,32x16/0,128,0,255');
	});

	it('draws a placeholder for a missing image, or when it cannot be encoded', async () => {
		const missing = await render(symbol({ 'icon-image': 'nope' }));
		expect(missing.svg.querySelector('image')).toBeNull();
		expect(missing.svg.querySelector('.maplibre2svg-missing-icon')).not.toBeNull();
		const layer = symbol({ 'icon-image': 'pin' });
		const ctx = renderContext([layer], { pin });
		const noCanvas = await renderSymbolLayer(layer, withoutEncoder(ctx));
		expect(noCanvas.svg.querySelector('image')).toBeNull();
		expect(noCanvas.svg.querySelector('.maplibre2svg-missing-icon')).not.toBeNull();
		// at the size of the image: 32 / 2 × 16 / 2, less the stroke
		expect(attrsOf(noCanvas.svg, 'rect')).toMatchObject({ width: '15', height: '7' });
	});

	it('picks an image for a {token} name it cannot fill', async () => {
		const images = {
			meter_on: solidImage(4, 4, [1, 2, 3, 255]),
			meter_avg: solidImage(4, 4, [9, 9, 9, 255])
		};
		const result = await render(symbol({ 'icon-image': 'meter_{status}' }), images);
		expect(attrsOf(result.svg, 'image').href).toBe('data:image/x-test,4x4/9,9,9,255');
	});

	it('draws the label in a CSS font without glyphs when the layer has no icon', async () => {
		const text = await render(symbol({ 'text-field': 'Name' }));
		expect(text.svg.querySelector('text')?.textContent).toBe('Name');
	});

	it('draws only the icon when the layer has both an icon and a label', async () => {
		const both = await render(symbol({ 'icon-image': 'pin', 'text-field': '{name}' }), { pin });
		const iconOnly = await render(symbol({ 'icon-image': 'pin' }), { pin });
		expect(both.svg.querySelector('image')).not.toBeNull();
		expect(both.svg.querySelector('text')).toBeNull();
		expect([both.width, both.height]).toEqual([iconOnly.width, iconOnly.height]);
	});

	it('draws the icon placeholder, not the label, for a missing image', async () => {
		const result = await render(symbol({ 'icon-image': 'nope', 'text-field': 'Name' }));
		expect(result.svg.querySelector('text')).toBeNull();
		expect(result.svg.querySelector('.maplibre2svg-missing-icon')).not.toBeNull();
	});

	it('draws the placeholder for an icon-image which needs a feature, such as ["get", "icon"]', async () => {
		for (const layout of [
			{ 'icon-image': ['get', 'icon'] },
			{ 'icon-image': ['get', 'icon'], 'text-field': 'Name' },
			{ 'icon-image': ['concat', ['get', 'kind'], '_11'], 'icon-size': 2 }
		]) {
			const result = await render(symbol(layout), { pin });
			expect(result.svg.querySelector('.maplibre2svg-missing-icon')).not.toBeNull();
			expect(result.svg.querySelector('text')).toBeNull();
		}
	});

	it('draws the image when the feature gives the name', async () => {
		const result = await render(symbol({ 'icon-image': ['get', 'icon'] }, {}, { icon: 'pin' }), {
			pin
		});
		expect(result.svg.querySelector('image')).not.toBeNull();
	});

	it('has no icon for an empty icon-image, which means none', async () => {
		const result = await render(symbol({ 'icon-image': '', 'text-field': 'Name' }));
		expect(result.svg.querySelector('.maplibre2svg-missing-icon')).toBeNull();
		expect(result.svg.querySelector('text')?.textContent).toBe('Name');
	});

	it('styles the placeholder with CSS custom properties', async () => {
		const result = await render(symbol({ 'icon-image': 'nope' }));
		const shape = result.svg.querySelector('.maplibre2svg-missing-icon-default');
		expect(shape?.getAttribute('stroke')).toBe('#888888');
		expect(shape?.getAttribute('style')).toContain('var(--maplibre2svg-missing-icon-color');
		expect(shape?.getAttribute('style')).toContain('var(--maplibre2svg-missing-icon-fill');
	});

	it('has a hidden custom icon, a mask of --maplibre2svg-missing-icon, for a page to show', async () => {
		const result = await render(symbol({ 'icon-image': 'nope' }));
		const custom = result.svg.querySelector('.maplibre2svg-missing-icon-custom');
		expect(custom?.tagName).toBe('foreignObject');
		// an attribute, which a stylesheet overrides; an inline style would win over it
		expect(custom?.getAttribute('display')).toBe('none');
		expect(custom?.getAttribute('style')).toBeNull();
		const mask = custom?.firstElementChild;
		expect(mask?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(mask?.getAttribute('style')).toContain('mask: var(--maplibre2svg-missing-icon)');
	});
});

describe('a match on icon-image', () => {
	it('gives one row per image, each with its own icon', async () => {
		const colors: Record<string, [number, number, number, number]> = {
			meter_on: [0, 255, 0, 255],
			meter_co: [255, 0, 0, 255],
			meter: [128, 128, 128, 255]
		};
		const layer = {
			id: 'meter',
			type: 'symbol',
			source: 's',
			layout: {
				'icon-image': ['match', ['get', 'status'], 'ON', 'meter_on', 'C/O', 'meter_co', 'meter']
			}
		} as unknown as LayerSpecification;
		const style = { version: 8, sources: {}, layers: [layer] } as StyleSpecification;
		const legend = await createLayerLegend(layer, style, {
			getImage: (id) => (colors[id] ? solidImage(4, 4, colors[id]) : undefined),
			imageEncoder: fakeEncoder().encode
		});
		expect(
			legend.entries.map((e) => [e.label, e.svg.querySelector('image')?.getAttribute('href')])
		).toEqual([
			['ON', 'data:image/x-test,4x4/0,255,0,255'],
			['C/O', 'data:image/x-test,4x4/255,0,0,255'],
			['Other', 'data:image/x-test,4x4/128,128,128,255']
		]);
	});
});
