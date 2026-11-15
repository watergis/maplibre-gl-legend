<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ColorInput from './ColorInput.svelte';

	const { Story } = defineMeta({
		title: 'Components/ColorInput',
		component: ColorInput,
		args: {
			id: 'story-color',
			name: 'fill-color',
			label: 'Fill color',
			value: { hex: '#2563eb', alpha: 1 },
			onchange: fn()
		}
	});
</script>

<Story name="Opaque" />
<Story name="Translucent" args={{ value: { hex: '#dc2626', alpha: 0.4 } }} />
