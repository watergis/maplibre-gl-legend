import type { LayerLegend } from '../../lib';

/** One row: the symbol centered in a column of `symbolWidth`, so the labels line up */
function row(symbol: Element, text: string, indent: boolean, symbolWidth: number) {
	const div = document.createElement('div');
	div.style.cssText = `display:flex;align-items:center;gap:8px;margin:4px 0 4px ${indent ? 16 : 0}px`;
	// the symbol column keeps its width when a long label wraps
	const cell = document.createElement('div');
	cell.style.cssText = `flex:none;width:${symbolWidth}px;display:flex;justify-content:center;align-items:center`;
	cell.append(symbol);
	const label = document.createElement('span');
	label.textContent = text;
	div.append(cell, label);
	return div;
}

/** Rows of "symbol + label": one row for a single entry, else a title and indented classes */
export function legendRows(legend: LayerLegend): HTMLElement {
	const root = document.createElement('div');
	root.dataset.layer = legend.layerId;
	const symbolWidth = Math.max(0, ...legend.entries.map((entry) => entry.width));
	if (legend.entries.length === 1) {
		const [entry] = legend.entries;
		root.append(row(entry.svg, entry.label, false, symbolWidth));
		return root;
	}
	const title = document.createElement('div');
	title.style.fontWeight = 'bold';
	title.textContent = legend.label;
	root.append(title);
	for (const entry of legend.entries) {
		const r = row(entry.svg, entry.label, true, symbolWidth);
		r.dataset.kind = entry.kind;
		root.append(r);
	}
	return root;
}
