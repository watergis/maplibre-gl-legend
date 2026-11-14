import { el } from '../svg';

/** Mid tones of land, water and vegetation, which read on light and dark pages */
const MOSAIC = ['#8fb3c9', '#a7c49a', '#c9b48f', '#b9c7a3', '#9fb5a0', '#c4bfa9'];

/**
 * A generic raster: a 3 × 2 mosaic of muted tiles, the stand-in for a tile which cannot be
 * shown, and the backdrop of one which fails to load in the browser
 */
export function rasterPlaceholder(doc: Document, width: number, height: number): Element {
	const cols = 3;
	const rows = 2;
	const cells: Element[] = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			cells.push(
				el(doc, 'rect', {
					x: (col * width) / cols,
					y: (row * height) / rows,
					width: width / cols,
					height: height / rows,
					fill: MOSAIC[(row * cols + col) % MOSAIC.length]
				})
			);
		}
	}
	return el(doc, 'g', { 'data-placeholder': 'raster' }, cells);
}
