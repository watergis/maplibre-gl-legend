import type { LayerLegend } from '../../lib';

function row(symbol: Element, text: string, indent: boolean) {
	const div = document.createElement('div');
	div.style.cssText = `display:flex;align-items:center;gap:8px;margin:4px 0 4px ${indent ? 16 : 0}px`;
	const label = document.createElement('span');
	label.textContent = text;
	div.append(symbol, label);
	return div;
}

/** Rows of "symbol + label": one row for a single entry, else a title and indented classes */
export function legendRows(legend: LayerLegend): HTMLElement {
	const root = document.createElement('div');
	root.dataset.layer = legend.layerId;
	if (legend.entries.length === 1) {
		const [entry] = legend.entries;
		root.append(row(entry.svg, entry.label, false));
		return root;
	}
	const title = document.createElement('div');
	title.style.fontWeight = 'bold';
	title.textContent = legend.label;
	root.append(title);
	for (const entry of legend.entries) {
		const r = row(entry.svg, entry.label, true);
		r.dataset.kind = entry.kind;
		root.append(r);
	}
	return root;
}
