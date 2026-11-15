<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ColorInput from './ColorInput.svelte';
	import Field from './Field.svelte';
	import NumberInput from './NumberInput.svelte';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/Field',
		component: Field,
		args: {
			name: 'line-width',
			label: 'Line width',
			id: 'story-line-width',
			help: { layerType: 'line', type: 'paint', property: 'line-width' }
		}
	});
</script>

<Story name="With a number input">
	{#snippet template(args)}
		<Field name={args.name} label={args.label} id={args.id} help={args.help} inline={args.inline}>
			<NumberInput
				id={args.id ?? ''}
				name="line-width"
				value={3}
				min={0}
				max={20}
				step={0.5}
				unit="px"
			/>
		</Field>
	{/snippet}
</Story>

<Story
	name="With a color input"
	args={{
		name: 'fill-color',
		label: 'Fill color',
		id: 'story-fill-color',
		help: { layerType: 'fill', type: 'paint', property: 'fill-color' }
	}}
>
	{#snippet template(args)}
		<Field name={args.name} label={args.label} id={args.id} help={args.help} inline={args.inline}>
			<ColorInput id={args.id ?? ''} name="fill-color" value={{ hex: '#22c55e', alpha: 0.8 }} />
		</Field>
	{/snippet}
</Story>

<Story
	name="Inline"
	args={{
		name: 'heatmap',
		label: 'Heatmap',
		id: 'story-heatmap',
		inline: true,
		help: { layerType: 'heatmap' }
	}}
>
	{#snippet template(args)}
		<Field name={args.name} label={args.label} id={args.id} help={args.help} inline={args.inline}>
			<Switch id={args.id ?? ''} name="heatmap" checked={false} />
		</Field>
	{/snippet}
</Story>

<Story name="Without help" args={{ help: undefined }}>
	{#snippet template(args)}
		<Field name={args.name} label={args.label} id={args.id} help={args.help} inline={args.inline}>
			<NumberInput id={args.id ?? ''} name="line-width" value={1} min={0} max={20} step={1} />
		</Field>
	{/snippet}
</Story>
