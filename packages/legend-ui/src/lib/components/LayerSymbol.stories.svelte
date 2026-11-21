<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LayerSpecification } from 'maplibre-gl';
	import { swatchSymbol } from '../../stories/mock-source';
	import type { LayerSymbol as Symbol } from '../types/legend-source';
	import LayerSymbol from './LayerSymbol.svelte';

	const { Story } = defineMeta({
		title: 'Components/LayerSymbol'
	});

	const layer = (type: string, color: string) =>
		({
			id: type,
			type,
			source: 'water',
			paint: { [`${type}-color`]: color }
		}) as LayerSpecification;
</script>

{#snippet template(args: { symbol: () => Symbol })}
	<div class="maplibregl-legend-list" style:display="block">
		<LayerSymbol symbol={args.symbol()} />
	</div>
{/snippet}

<Story name="Fill" {template} args={{ symbol: () => swatchSymbol(layer('fill', '#a5f3fc')) }} />
<Story name="Line" {template} args={{ symbol: () => swatchSymbol(layer('line', '#2563eb')) }} />
<Story name="Circle" {template} args={{ symbol: () => swatchSymbol(layer('circle', '#0f766e')) }} />
<Story name="Fallback icon" {template} args={{ symbol: () => ({ type: 'error' }) }} />
