<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import NumberInput from './NumberInput.svelte';

	const { Story } = defineMeta({
		title: 'Components/NumberInput',
		component: NumberInput,
		args: {
			id: 'story-number',
			name: 'line-width',
			label: 'Line width',
			value: 2,
			min: 0,
			max: 20,
			step: 0.5,
			unit: 'px',
			onchange: fn()
		}
	});
</script>

<Story name="Pixels" />
<Story name="Percent" args={{ value: 80, min: 0, max: 100, step: 1, unit: '%' }} />
<Story name="Out of range" args={{ value: 42 }} />
