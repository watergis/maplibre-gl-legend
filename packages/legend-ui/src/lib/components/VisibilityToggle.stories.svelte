<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import VisibilityToggle from './VisibilityToggle.svelte';

	const { Story } = defineMeta({
		title: 'Components/VisibilityToggle'
	});

	interface Args {
		/** the layers switched by the toggle */
		layerIds: string[];
		/** the hidden layers */
		hidden?: string[];
		title: string;
		group?: boolean;
	}
</script>

{#snippet template(args: Args)}
	<ModelFrame hidden={args.hidden}>
		{#snippet children(model)}
			<div class="maplibregl-legend-row">
				<span class="maplibregl-legend-label">{args.title}</span>
				<VisibilityToggle
					{model}
					layerIds={args.layerIds}
					title={args.title}
					name={args.group ? undefined : args.layerIds[0]}
					group={args.group}
				/>
			</div>
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Visible" {template} args={{ layerIds: ['wtp'], title: 'WTP' }} />
<Story name="Hidden" {template} args={{ layerIds: ['wtp'], title: 'WTP', hidden: ['wtp'] }} />
<Story
	name="Partially visible group"
	{template}
	args={{
		layerIds: ['wtp', 'wtp-point', 'tank'],
		title: 'Facilities',
		hidden: ['tank'],
		group: true
	}}
/>
