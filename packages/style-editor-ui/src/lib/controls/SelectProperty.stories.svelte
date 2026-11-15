<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LayerSpecification } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { field, valueOf } from '../../stories/fields';
	import { createMockMap } from '../../stories/mock-map';
	import type { SelectFieldConfig } from '../panels/fields';
	import { getPropertySpec } from '../utils/spec';
	import SelectProperty from './SelectProperty.svelte';

	interface Args {
		layer: LayerSpecification;
		field: SelectFieldConfig;
		onchange: (property: string, value: unknown) => void;
	}

	const { Story } = defineMeta({
		title: 'Controls/SelectProperty',
		parameters: {
			docs: {
				description: {
					component:
						'A property chosen from a list: the options of the field, or the values of the style specification ("Default" when the property has no default value).'
				}
			}
		},
		args: { onchange: fn() }
	});
</script>

{#snippet template(args: Args)}
	{#key args}
		<EditorContextFrame
			map={createMockMap([args.layer])}
			layerId={args.layer.id}
			onchange={args.onchange}
		>
			<SelectProperty
				field={args.field}
				spec={getPropertySpec(args.layer.type, args.field.type, args.field.property)}
				value={valueOf(args.layer, args.field)}
			/>
		</EditorContextFrame>
	{/key}
{/snippet}

<Story
	name="Options of the field"
	{template}
	args={{
		layer: { id: 'roads', type: 'line', source: 'roads', paint: { 'line-dasharray': [10, 4] } },
		field: field('line', 'line-dasharray')
	}}
/>
<Story
	name="Values of the specification"
	{template}
	args={{
		layer: { id: 'raster', type: 'raster', source: 'raster', paint: {} },
		field: field('raster', 'raster-resampling')
	}}
/>
<Story
	name="Without a default value"
	{template}
	args={{
		layer: {
			id: 'pins',
			type: 'symbol',
			source: 'points',
			layout: { 'icon-image': 'pin' }
		},
		field: field('symbol', 'icon-overlap')
	}}
/>
<Story
	name="Expression"
	{template}
	args={{
		layer: {
			id: 'roads',
			type: 'line',
			source: 'roads',
			paint: { 'line-dasharray': ['step', ['zoom'], ['literal', [2, 2]], 12, ['literal', [4, 1]]] }
		},
		field: field('line', 'line-dasharray')
	}}
/>
