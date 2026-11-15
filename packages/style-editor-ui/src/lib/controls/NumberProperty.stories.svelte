<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LayerSpecification } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { field, valueOf } from '../../stories/fields';
	import { createMockMap } from '../../stories/mock-map';
	import type { NumberFieldConfig } from '../panels/fields';
	import NumberProperty from './NumberProperty.svelte';

	interface Args {
		layer: LayerSpecification;
		field: NumberFieldConfig;
		onchange: (property: string, value: unknown) => void;
	}

	const { Story } = defineMeta({
		title: 'Controls/NumberProperty',
		args: { onchange: fn() }
	});

	const line = (paint: Record<string, unknown>) =>
		({ id: 'roads', type: 'line', source: 'roads', paint }) as LayerSpecification;
</script>

{#snippet template(args: Args)}
	{#key args}
		<EditorContextFrame
			map={createMockMap([args.layer])}
			layerId={args.layer.id}
			onchange={args.onchange}
		>
			<NumberProperty field={args.field} value={valueOf(args.layer, args.field)} />
		</EditorContextFrame>
	{/key}
{/snippet}

<Story
	name="Constant"
	{template}
	args={{ layer: line({ 'line-width': 3 }), field: field('line', 'line-width') }}
/>
<Story
	name="Percent"
	{template}
	args={{ layer: line({ 'line-opacity': 0.6 }), field: field('line', 'line-opacity') }}
/>
<Story
	name="Zoom stops"
	{template}
	args={{
		layer: line({ 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 12, 4, 16, 12] }),
		field: field('line', 'line-width')
	}}
/>
<Story
	name="Data classes"
	{template}
	args={{
		layer: line({
			'line-width': ['match', ['get', 'class'], 'primary', 6, ['secondary', 'tertiary'], 3, 1]
		}),
		field: field('line', 'line-width')
	}}
/>
<Story
	name="Expression"
	{template}
	args={{
		layer: line({ 'line-width': ['*', ['get', 'lanes'], 2] }),
		field: field('line', 'line-width')
	}}
/>
