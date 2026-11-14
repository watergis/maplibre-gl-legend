import { describe, expect, it } from 'vitest';
import { createLegendCache } from '../cache';
import { fakeEncoder, solidImage } from '../test-utils';
import { defaultEncoder } from './encoder';
import {
	findImage,
	findImageByTemplate,
	imageUrl,
	matchTemplate,
	patternOf,
	type ImageContext
} from './index';

const context = (images: Record<string, unknown>, list?: () => string[]): ImageContext => ({
	getImage: (id) => images[id] as never,
	listImages: list ?? (() => Object.keys(images)),
	encode: fakeEncoder().encode,
	cache: createLegendCache()
});

describe('matchTemplate', () => {
	it('takes the first sorted id which matches with the tokens as wildcards', () => {
		const ids = ['road_3', 'road_2', 'rail_1', 'park_11', 'zoo_11'];
		expect(matchTemplate('road_{ref_length}', ids)).toBe('road_2');
		expect(matchTemplate('{maki}_11', ids)).toBe('park_11');
		expect(matchTemplate('{a}.{b}', ['x.y', 'xy'])).toBe('x.y');
		expect(matchTemplate('marker_{k}', ids)).toBeUndefined();
	});
});

describe('findImage', () => {
	it('gives valid RGBA images only, with a sane pixel ratio', () => {
		const images = context({
			ok: solidImage(2, 2, undefined, { pixelRatio: 0 }),
			short: { ...solidImage(2, 2), data: new Uint8Array(3) },
			empty: solidImage(0, 0)
		});
		expect(findImage(images, 'ok')?.image.pixelRatio).toBe(1);
		expect(findImage(images, 'short')).toBeUndefined();
		expect(findImage(images, 'empty')).toBeUndefined();
		expect(findImage(images, 'none')).toBeUndefined();
		expect(findImage(images, '')).toBeUndefined();
		const throwing: ImageContext = {
			...images,
			getImage: () => {
				throw new Error('x');
			}
		};
		expect(findImage(throwing, 'ok')).toBeUndefined();
	});

	it('finds an image for a template among the images there are', () => {
		const images = context({ meter_on: solidImage(1, 1), meter_avg: solidImage(1, 1) });
		expect(findImageByTemplate(images, 'meter_{status}')?.id).toBe('meter_avg');
		expect(findImageByTemplate(context({}), 'meter_{status}')).toBeUndefined();
	});
});

describe('imageUrl', () => {
	it('encodes each image and variant once', async () => {
		const { encode, calls } = fakeEncoder();
		const cache = createLegendCache();
		const image = solidImage(2, 1);
		const a = await imageUrl(cache, encode, { id: 'x', variant: 'plain' }, image);
		const b = await imageUrl(cache, encode, { id: 'x', variant: 'plain' }, image);
		await imageUrl(cache, encode, { id: 'x', variant: 'tint' }, image);
		expect(a).toBe('data:test/2x1/255,0,0,255');
		expect(b).toBe(a);
		expect(calls).toHaveLength(2);
	});

	it('gives undefined when the encoder cannot encode or throws', async () => {
		const cache = createLegendCache();
		const image = solidImage(1, 1);
		expect(await imageUrl(cache, () => undefined, { id: 'a', variant: '' }, image)).toBeUndefined();
		const throwing = () => {
			throw new Error('no canvas');
		};
		expect(await imageUrl(cache, throwing, { id: 'b', variant: '' }, image)).toBeUndefined();
	});

	it('cannot encode without a canvas, without throwing', async () => {
		expect(await defaultEncoder(document)(new Uint8ClampedArray(4), 1, 1)).toBeUndefined();
	});
});

describe('patternOf', () => {
	it('tiles the image in user space with a unique id', () => {
		const a = patternOf(document, 'data:x', 8, 4, 0, 2);
		const b = patternOf(document, 'data:x', 8, 4);
		expect(a.element.tagName.toLowerCase()).toBe('pattern');
		expect(a.element.getAttribute('patternUnits')).toBe('userSpaceOnUse');
		expect(a.element.getAttribute('y')).toBe('2');
		expect(a.element.querySelector('image')?.getAttribute('width')).toBe('8');
		expect(a.paint).toBe(`url(#${a.element.id})`);
		expect(a.element.id).not.toBe(b.element.id);
	});
});
