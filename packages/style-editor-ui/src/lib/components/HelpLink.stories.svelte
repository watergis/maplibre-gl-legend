<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import HelpLink from './HelpLink.svelte';

	const { Story } = defineMeta({
		title: 'Components/HelpLink',
		component: HelpLink,
		args: { layerType: 'fill', type: 'paint', property: 'fill-color' },
		argTypes: {
			type: { control: 'inline-radio', options: ['paint', 'layout'] }
		}
	});
</script>

<Story name="Property" />
<Story name="Layer type" args={{ layerType: 'heatmap', type: undefined, property: undefined }} />
