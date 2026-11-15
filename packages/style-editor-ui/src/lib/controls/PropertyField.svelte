<!-- A field of the editor: its label with a link to the specification, and its control -->
<script lang="ts">
	import Field from '../components/Field.svelte';
	import { getEditorContext } from '../context';
	import type { FieldConfig } from '../panels/fields';
	import { getPropertySpec } from '../utils/spec';
	import ColorProperty from './ColorProperty.svelte';
	import HeatmapGenerator from './HeatmapGenerator.svelte';
	import NumberProperty from './NumberProperty.svelte';
	import SelectProperty from './SelectProperty.svelte';

	interface Props {
		field: FieldConfig;
	}

	let { field }: Props = $props();

	const context = getEditorContext();
	const layerType = context.layer.type;
</script>

{#if field.kind === 'heatmap-generator'}
	<Field
		name="heatmap"
		label={field.label}
		id="{context.idPrefix}-heatmap"
		help={{ layerType: 'heatmap' }}
		inline
	>
		<HeatmapGenerator id="{context.idPrefix}-heatmap" />
	</Field>
{:else}
	{@const spec = getPropertySpec(layerType, field.type, field.property)}
	{@const value = context.getProperty(field.type, field.property) ?? spec?.default}
	<Field
		name={field.property}
		label={field.label}
		id="{context.idPrefix}-{field.property}"
		help={{ layerType, type: field.type, property: field.property }}
	>
		{#if field.kind === 'number'}
			<NumberProperty {field} {value} />
		{:else if field.kind === 'color'}
			<ColorProperty {field} {value} />
		{:else}
			<SelectProperty {field} {spec} {value} />
		{/if}
	</Field>
{/if}
