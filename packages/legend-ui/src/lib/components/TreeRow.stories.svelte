<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import TreeRow from './TreeRow.svelte';

	const { Story } = defineMeta({
		title: 'Tree/TreeRow',
		args: { onrowclick: fn() }
	});

	interface Args {
		/** the level of the row */
		depth: number;
		title: string;
		/** true: the title row of a group, with a chevron */
		header?: boolean;
		showCheckbox?: boolean;
		showStyleEditor?: boolean;
		/** the color of the swatch of a layer row */
		color?: string;
		onrowclick?: () => void;
	}
</script>

{#snippet template(args: Args)}
	<ModelFrame
		options={{
			onlyRendered: false,
			showCheckbox: args.showCheckbox,
			showStyleEditor: args.showStyleEditor
		}}
	>
		{#snippet children(model)}
			<TreeRow
				{model}
				depth={args.depth}
				title={args.title}
				header={args.header}
				groupToggle={args.header}
				toggleLayerIds={args.header ? ['wtp', 'wtp-point'] : ['wtp']}
				onrowclick={args.header ? args.onrowclick : undefined}
			>
				{#snippet lead()}
					{#if args.header}
						<button
							type="button"
							class="maplibregl-legend-group-collapse"
							aria-expanded="true"
							aria-label="Collapse {args.title}"
						></button>
					{:else}
						<span class="maplibregl-legend-symbol">
							<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
								<rect
									x="2"
									y="3"
									width="16"
									height="14"
									fill={args.color ?? '#a5f3fc'}
									stroke="#555"
								></rect>
							</svg>
						</span>
					{/if}
				{/snippet}
				{#snippet styleButton()}
					{#if !args.header}
						<button
							type="button"
							class="maplibregl-legend-style-button"
							aria-label="Edit style of {args.title}"
						></button>
					{/if}
				{/snippet}
			</TreeRow>
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Layer row" {template} args={{ depth: 0, title: 'WTP' }} />
<Story name="Group row" {template} args={{ depth: 0, title: 'Water Facilities', header: true }} />
<Story name="Nested layer row" {template} args={{ depth: 3, title: 'WTP' }} />
<Story
	name="Nested group row"
	{template}
	args={{ depth: 2, title: 'Treatment Plant', header: true }}
/>
<Story
	name="With style editor button"
	{template}
	args={{ depth: 1, title: 'WTP', showStyleEditor: true }}
/>
<Story name="Without toggle" {template} args={{ depth: 1, title: 'WTP', showCheckbox: false }} />
