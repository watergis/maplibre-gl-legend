import { describe, expect, it } from 'vitest';
import { formatColor, parseColor } from './color';

describe('parseColor', () => {
	it('parses CSS colors', () => {
		expect(parseColor('#f00')).toEqual({ hex: '#ff0000', alpha: 1 });
		expect(parseColor('royalblue')).toEqual({ hex: '#4169e1', alpha: 1 });
		expect(parseColor('rgba(0, 0, 255, 0.5)')).toEqual({ hex: '#0000ff', alpha: 0.5 });
		expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ hex: '#00ff00', alpha: 1 });
	});

	it('parses rgb expressions', () => {
		expect(parseColor(['rgb', 255, 0, 0])).toEqual({ hex: '#ff0000', alpha: 1 });
		expect(parseColor(['rgba', 0, 0, 0, 0.25])).toEqual({ hex: '#000000', alpha: 0.25 });
	});

	it('ignores other values', () => {
		expect(parseColor('not a color')).toBeUndefined();
		expect(parseColor(['get', 'color'])).toBeUndefined();
		expect(parseColor(3)).toBeUndefined();
	});
});

describe('formatColor', () => {
	it('writes hex when opaque, rgba otherwise', () => {
		expect(formatColor({ hex: '#123456', alpha: 1 })).toBe('#123456');
		expect(formatColor({ hex: '#ff8000', alpha: 0.4 })).toBe('rgba(255, 128, 0, 0.4)');
	});
});
