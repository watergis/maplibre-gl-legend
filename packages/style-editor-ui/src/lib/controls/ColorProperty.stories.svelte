<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LayerSpecification } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { field, valueOf } from '../../stories/fields';
	import { createMockMap } from '../../stories/mock-map';
	import type { ColorFieldConfig } from '../panels/fields';
	import ColorProperty from './ColorProperty.svelte';

	interface Args {
		layer: LayerSpecification;
		field: ColorFieldConfig;
		onchange: (property: string, value: unknown) => void;
	}

	const { Story } = defineMeta({
		title: 'Controls/ColorProperty',
		parameters: {
			docs: {
				description: {
					component:
						'A color property: a constant, or each output of an `interpolate` / `step` / `match` expression or a legacy function with `stops`.'
				}
			}
		},
		args: { onchange: fn() }
	});

	const fill = (paint: Record<string, unknown>) =>
		({ id: 'areas', type: 'fill', source: 'areas', paint }) as LayerSpecification;
	const fillColor = field<ColorFieldConfig>('fill', 'fill-color');
</script>

{#snippet template(args: Args)}
	{#key args}
		<EditorContextFrame
			map={createMockMap([args.layer])}
			layerId={args.layer.id}
			onchange={args.onchange}
		>
			<ColorProperty field={args.field} value={valueOf(args.layer, args.field)} />
		</EditorContextFrame>
	{/key}
{/snippet}

<Story
	name="Constant"
	{template}
	args={{ layer: fill({ 'fill-color': '#22c55e' }), field: fillColor }}
/>
<Story
	name="Translucent"
	{template}
	args={{ layer: fill({ 'fill-color': 'rgba(37, 99, 235, 0.35)' }), field: fillColor }}
/>
<Story
	name="Data classes"
	{template}
	args={{
		layer: fill({
			'fill-color': ['match', ['get', 'class'], 'park', '#86efac', 'water', '#93c5fd', '#d4d4d8']
		}),
		field: fillColor
	}}
/>
<Story
	name="Legacy stops"
	{template}
	args={{
		layer: fill({
			'fill-color': {
				stops: [
					[8, '#fef3c7'],
					[14, '#b45309']
				]
			}
		}),
		field: fillColor
	}}
/>
<Story
	name="Expression"
	{template}
	args={{
		layer: fill({ 'fill-color': ['case', ['>', ['get', 'height'], 100], '#f97316', '#0ea5e9'] }),
		field: fillColor
	}}
/>
