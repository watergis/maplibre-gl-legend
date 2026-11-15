import { describe, expect, it } from 'vitest';
import { toCssColor } from './color';

describe('toCssColor', () => {
	it('converts CSS strings, as evaluated layers hold them', () => {
		expect(toCssColor('rgba(255,0,0,0.5)')).toEqual({ color: '#ff0000', opacity: 0.5 });
		expect(toCssColor('#0f0')).toEqual({ color: '#00ff00', opacity: 1 });
		expect(toCssColor('hsl(240, 100%, 50%)')).toEqual({ color: '#0000ff', opacity: 1 });
	});

	it('converts premultiplied color objects', () => {
		expect(toCssColor({ r: 0.5, g: 0, b: 0, a: 0.5 })).toEqual({ color: '#ff0000', opacity: 0.5 });
		expect(toCssColor({ r: 0, g: 0, b: 0, a: 0 })).toEqual({ color: '#000000', opacity: 0 });
	});

	it('falls back for what is not a color', () => {
		expect(toCssColor('nope', '#ffffff')).toEqual({ color: '#ffffff', opacity: 1 });
		expect(toCssColor(undefined)).toEqual({ color: '#000000', opacity: 1 });
	});
});
