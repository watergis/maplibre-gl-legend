<!-- A color property: a constant, or each output of a zoom / data expression -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import ColorInput from '../components/ColorInput.svelte';
	import { getEditorContext } from '../context';
	import type { ColorFieldConfig } from '../panels/fields';
	import { formatColor, parseColor } from '../utils/color';
	import { toEditable } from '../utils/stops';
	import ExpressionNote from './ExpressionNote.svelte';
	import Stops from './Stops.svelte';
	import { createWriter } from './write';

	interface Props {
		field: ColorFieldConfig;
		/** the value of the property when the field is shown */
		value: unknown;
	}

	let { field, value }: Props = $props();

	const context = getEditorContext();
	const id = $derived(`${context.idPrefix}-${field.property}`);

	// svelte-ignore state_referenced_locally
	const editable = $state(toEditable(value, parseColor));

	const write = createWriter(context, () => field);
	onDestroy(() => write.flush());

	const setStop = () => {
		if (editable.kind !== 'stops') return;
		write(editable.update(editable.stops.map((s) => formatColor(s.value))));
	};
</script>

{#if editable.kind === 'constant'}
	<ColorInput
		{id}
		name={field.property}
		label={field.label}
		bind:value={editable.value}
		onchange={(color) => write(formatColor(color))}
	/>
{:else if editable.kind === 'stops'}
	<Stops stops={editable.stops}>
		{#snippet control(stop, index)}
			<ColorInput
				id="{id}-{index}"
				name="{field.property}-{index}"
				label="{field.label}, {stop.label}"
				bind:value={stop.value}
				onchange={setStop}
			/>
		{/snippet}
	</Stops>
{:else}
	<ExpressionNote {value} />
{/if}
