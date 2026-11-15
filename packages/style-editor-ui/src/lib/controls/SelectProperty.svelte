<!-- A property chosen from a list: the given options, or the values of the specification -->
<script lang="ts">
	import Select from '../components/Select.svelte';
	import { getEditorContext } from '../context';
	import type { SelectFieldConfig } from '../panels/fields';
	import type { PropertySpec } from '../utils/spec';
	import ExpressionNote from './ExpressionNote.svelte';
	import { createWriter } from './write';

	interface Props {
		field: SelectFieldConfig;
		/** the specification of the property */
		spec?: PropertySpec;
		/** the value of the property when the field is shown */
		value: unknown;
	}

	let { field, spec, value }: Props = $props();

	const context = getEditorContext();
	const id = $derived(`${context.idPrefix}-${field.property}`);

	const options = $derived.by(() => {
		if (field.options) return field.options;
		const values = Array.isArray(spec?.values) ? spec.values : Object.keys(spec?.values ?? {});
		const list = values.map((v) => ({ label: v, value: v as unknown }));
		// without a default value, the property can be left unset
		return spec?.default === undefined ? [{ label: 'Default', value: undefined }, ...list] : list;
	});

	const key = (v: unknown) => JSON.stringify(v ?? null);
	// an unset property has its default value
	// svelte-ignore state_referenced_locally
	let selected = $state(
		String(options.findIndex((o) => key(o.value) === key(value ?? spec?.default)))
	);

	const write = createWriter(context, () => field);
</script>

{#if selected === '-1'}
	<ExpressionNote {value} />
{:else}
	<Select
		{id}
		name={field.property}
		options={options.map((o, i) => ({ label: o.label, value: String(i) }))}
		bind:value={selected}
		onchange={(i) => {
			write(options[Number(i)].value);
			write.flush();
		}}
	/>
{/if}
