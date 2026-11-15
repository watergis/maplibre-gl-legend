<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LayerSpecification } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { field } from '../../stories/fields';
	import { createMockMap } from '../../stories/mock-map';
	import type { FieldConfig } from '../panels/fields';
	import PropertyField from './PropertyField.svelte';

	interface Args {
		layer: LayerSpecification;
		field: FieldConfig;
		onchange: (property: string, value: unknown) => void;
	}

	const { Story } = defineMeta({
		title: 'Controls/PropertyField',
		args: { onchange: fn() }
	});

	const circle: LayerSpecification = {
		id: 'points',
		type: 'circle',
		source: 'points',
		paint: { 'circle-color': '#2563eb', 'circle-radius': 6 }
	};
</script>

{#snippet template(args: Args)}
	{#key args}
		<EditorContextFrame
			map={createMockMap([args.layer])}
			layerId={args.layer.id}
			onchange={args.onchange}
		>
			<PropertyField field={args.field} />
		</EditorContextFrame>
	{/key}
{/snippet}

<Story name="Number" {template} args={{ layer: circle, field: field('circle', 'circle-radius') }} />
<Story name="Color" {template} args={{ layer: circle, field: field('circle', 'circle-color') }} />
<Story
	name="Default value"
	{template}
	args={{ layer: circle, field: field('circle', 'circle-stroke-width') }}
/>
<Story
	name="Select"
	{template}
	args={{
		layer: { id: 'raster', type: 'raster', source: 'raster' },
		field: field('raster', 'raster-resampling')
	}}
/>
<Story
	name="Heatmap generator"
	{template}
	args={{ layer: circle, field: field('circle', 'heatmap-generator') }}
/>
