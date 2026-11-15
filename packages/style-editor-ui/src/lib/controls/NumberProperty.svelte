<!-- A numeric property: a constant, or each output of a zoom / data expression -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import NumberInput from '../components/NumberInput.svelte';
	import { getEditorContext } from '../context';
	import type { NumberFieldConfig } from '../panels/fields';
	import { toEditable } from '../utils/stops';
	import ExpressionNote from './ExpressionNote.svelte';
	import Stops from './Stops.svelte';
	import { createWriter, round } from './write';

	interface Props {
		field: NumberFieldConfig;
		/** the value of the property when the field is shown */
		value: unknown;
	}

	let { field, value }: Props = $props();

	const context = getEditorContext();
	const id = $derived(`${context.idPrefix}-${field.property}`);
	const scale = $derived(field.percent ? 100 : 1);
	const unit = $derived(field.percent ? '%' : field.unit);

	// the value as shown, e.g. in % for a fraction; the field is created again for another value
	const read = () =>
		toEditable(value, (v) =>
			typeof v === 'number' ? round(v * (field.percent ? 100 : 1)) : undefined
		);
	const editable = $state(read());

	const write = createWriter(context, () => field);
	onDestroy(() => write.flush());

	const setConstant = (n: number) => write(round(n / scale));
	const setStop = () => {
		if (editable.kind !== 'stops') return;
		write(editable.update(editable.stops.map((s) => round(s.value / scale))));
	};
</script>

{#if editable.kind === 'constant'}
	<NumberInput
		{id}
		name={field.property}
		label={field.label}
		bind:value={editable.value}
		min={field.min}
		max={field.max}
		step={field.step}
		{unit}
		onchange={setConstant}
	/>
{:else if editable.kind === 'stops'}
	<Stops stops={editable.stops}>
		{#snippet control(stop, index)}
			<NumberInput
				id="{id}-{index}"
				name="{field.property}-{index}"
				label="{field.label}, {stop.label}"
				bind:value={stop.value}
				min={field.min}
				max={field.max}
				step={field.step}
				{unit}
				onchange={setStop}
			/>
		{/snippet}
	</Stops>
{:else}
	<ExpressionNote {value} />
{/if}
