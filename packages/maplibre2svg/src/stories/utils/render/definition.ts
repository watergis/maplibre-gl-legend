import type { LayerSpecification } from 'maplibre-gl';

/** Translucent grey, readable on both the light and the dark background */
const CODE_STYLE = [
	'margin:0',
	'padding:8px',
	'max-height:70vh',
	'overflow:auto',
	'white-space:pre',
	'font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace',
	'color:inherit',
	'background:rgba(128,128,128,0.12)',
	'border:1px solid rgba(128,128,128,0.35)',
	'border-radius:4px'
].join(';');

function heading(text: string) {
	const h = document.createElement('div');
	h.style.cssText = 'font-weight:bold;margin:8px 0 4px';
	h.textContent = text;
	return h;
}

function code(value: unknown) {
	const pre = document.createElement('pre');
	pre.style.cssText = CODE_STYLE;
	pre.textContent = JSON.stringify(value, null, 2);
	return pre;
}

/**
 * The definition of a layer as it is passed to `createLayerLegend`, pretty-printed, with the
 * options which change the legend, so that a reader can judge whether the legend fits it.
 */
export function definitionPane(layer: LayerSpecification, options: Record<string, unknown>) {
	const pane = document.createElement('div');
	pane.append(heading('Options'), code(options), heading('Layer'), code(layer));
	return pane;
}

/** Two panes side by side, stacked when the width is narrow */
export function sideBySide(left: HTMLElement, right: HTMLElement) {
	const root = document.createElement('div');
	root.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start';
	for (const [pane, basis] of [
		[left, '240px'],
		[right, '360px']
	] as const) {
		pane.style.flex = `1 1 ${basis}`;
		pane.style.minWidth = '0';
		root.append(pane);
	}
	return root;
}

/**
 * One layer of a multi-layer story: a collapsible block titled with the layer id, holding the
 * legend and the definition side by side.
 */
export function layerDetails(
	layer: LayerSpecification,
	legend: HTMLElement,
	options: Record<string, unknown>,
	open = false
) {
	const details = document.createElement('details');
	details.open = open;
	details.style.margin = '8px 0';
	const summary = document.createElement('summary');
	summary.style.cursor = 'pointer';
	summary.textContent = `${layer.id} (${layer.type})`;
	details.append(summary, sideBySide(legend, definitionPane(layer, options)));
	return details;
}
