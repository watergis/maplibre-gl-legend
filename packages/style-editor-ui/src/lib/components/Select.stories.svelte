<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Select from './Select.svelte';

	const { Story } = defineMeta({
		title: 'Components/Select',
		component: Select,
		tags: ['autodocs'],
		args: {
			id: 'story-select',
			name: 'raster-resampling',
			options: [
				{ label: 'linear', value: 'linear' },
				{ label: 'nearest', value: 'nearest' }
			],
			value: 'linear',
			onchange: fn()
		}
	});
</script>

<Story name="Default" />
<Story
	name="Line pattern"
	args={{
		name: 'line-dasharray',
		options: [
			{ label: 'Solid', value: '0' },
			{ label: 'Dash', value: '1' },
			{ label: 'Dash dot', value: '2' },
			{ label: 'Dot', value: '3' }
		],
		value: '1'
	}}
/>
