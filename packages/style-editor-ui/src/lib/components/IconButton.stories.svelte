<script module lang="ts">
	import { Code, SlidersHorizontal, X } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import IconButton from './IconButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/IconButton',
		component: IconButton,
		args: { icon: X, name: 'close', label: 'Close', onclick: fn() },
		argTypes: { icon: { control: false } }
	});
</script>

<Story name="Default" />
<Story
	name="Pressed"
	args={{ icon: SlidersHorizontal, name: 'fields', label: 'Properties', pressed: true }}
/>
<Story
	name="Not pressed"
	args={{ icon: Code, name: 'manualEditor', label: 'Manual editor', pressed: false }}
/>
