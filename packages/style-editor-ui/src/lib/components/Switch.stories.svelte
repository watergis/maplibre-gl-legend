<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/Switch',
		component: Switch,
		tags: ['autodocs'],
		args: { id: 'story-switch', name: 'heatmap', checked: false, onchange: fn() }
	});
</script>

{#snippet template(args: Parameters<typeof Switch>[1])}
	<label for={args.id}>Heatmap</label>
	<Switch {...args} />
{/snippet}

<Story name="Off" {template} />
<Story name="On" {template} args={{ checked: true }} />
