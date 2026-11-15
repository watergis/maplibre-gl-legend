import { describe, expect, it } from 'vitest';
import { hasLayoutFields } from './fields';

describe('hasLayoutFields', () => {
	it('is true only for the layer types whose fields edit a layout property', () => {
		expect(hasLayoutFields('symbol')).toBe(true);
		expect(hasLayoutFields('line')).toBe(false);
		expect(hasLayoutFields('fill')).toBe(false);
		expect(hasLayoutFields('circle')).toBe(false);
	});
});
