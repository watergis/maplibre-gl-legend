/**
 * A tiny encoder of glyph PBFs for the tests, so that no binary fixture is needed
 */
import type { Glyph } from './decode';

function varint(n: number): number[] {
	const bytes: number[] = [];
	let value = n;
	while (value >= 128) {
		bytes.push((value % 128) | 0x80);
		value = Math.floor(value / 128);
	}
	bytes.push(value);
	return bytes;
}

const zigzag = (n: number) => (n < 0 ? -2 * n - 1 : 2 * n);
const key = (field: number, type: number) => varint(field * 8 + type);
const bytes = (field: number, data: ArrayLike<number>) => [
	...key(field, 2),
	...varint(data.length),
	...Array.from(data)
];
const uint = (field: number, n: number) => [...key(field, 0), ...varint(n)];

/** A glyph whose bitmap is filled with `value`, the border included */
export function fixtureGlyph(id: number, fields: Partial<Glyph> = {}, value = 255): Glyph {
	const width = fields.width ?? 4;
	const height = fields.height ?? 6;
	const size = width > 0 ? (width + 6) * (height + 6) : 0;
	return {
		id,
		width,
		height,
		left: 1,
		top: -2,
		advance: width + 2,
		bitmap: new Uint8Array(size).fill(value),
		...fields
	};
}

/** Encode glyphs as one font stack of a glyph PBF */
export function encodeGlyphs(glyphs: Glyph[], name = 'Test Regular'): Uint8Array {
	const encoded = glyphs.map((g) =>
		bytes(3, [
			...uint(1, g.id),
			...bytes(2, g.bitmap),
			...uint(3, g.width),
			...uint(4, g.height),
			...uint(5, zigzag(g.left)),
			...uint(6, zigzag(g.top)),
			...uint(7, g.advance)
		])
	);
	const stack = [
		...bytes(1, new TextEncoder().encode(name)),
		...bytes(2, new TextEncoder().encode('0-255')),
		...encoded.flat()
	];
	return new Uint8Array(bytes(1, stack));
}
