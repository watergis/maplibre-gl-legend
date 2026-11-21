<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import { NESTED_GROUPS } from '../../stories/fixtures';
	import { classesSymbol } from '../../stories/mock-source';
	import { findLayer } from '../../stories/view';
	import type { LegendPanelOptions, LegendTargets } from '../types/legend-panel-options';
	import type { LayerSymbol } from '../types/legend-source';
	import TreeLayer from './TreeLayer.svelte';

	const { Story } = defineMeta({
		title: 'Tree/TreeLayer',
		args: { onstyleeditor: fn() }
	});

	interface Args {
		/** the ID of the layer shown */
		layerId: string;
		options?: LegendPanelOptions;
		targets?: LegendTargets;
		hidden?: string[];
		symbols?: Record<string, () => LayerSymbol>;
		onstyleeditor?: (layerId: string, title: string) => void;
	}

	const pipelineClasses = () =>
		classesSymbol([
			{ label: 'DN300', color: '#1e3a8a' },
			{ label: 'DN200', color: '#2563eb' },
			{ label: 'DN100', color: '#60a5fa' }
		]);
</script>

{#snippet template(args: Args)}
	<ModelFrame
		options={args.options ?? { onlyRendered: false }}
		targets={args.targets}
		hidden={args.hidden}
		symbols={args.symbols}
		onstyleeditor={args.onstyleeditor}
	>
		{#snippet children(model)}
			<ul class="maplibregl-legend-tree">
				<TreeLayer {model} node={findLayer(model, args.layerId)} />
			</ul>
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="Layer" {template} args={{ layerId: 'wtp' }} />
<Story name="Hidden" {template} args={{ layerId: 'wtp', hidden: ['wtp'] }} />
<Story
	name="Classified layer"
	{template}
	args={{ layerId: 'pipeline', symbols: { pipeline: pipelineClasses } }}
/>
<Story
	name="Fallback icon"
	{template}
	args={{ layerId: 'wtp', symbols: { wtp: () => ({ type: 'error' }) } }}
/>
<Story
	name="With style editor button"
	{template}
	args={{ layerId: 'wtp', options: { onlyRendered: false, showStyleEditor: true } }}
/>
<Story
	name="In nested groups"
	{template}
	args={{
		layerId: 'tank',
		options: { onlyRendered: false, groups: NESTED_GROUPS, showStyleEditor: true }
	}}
/>
<Story
	name="Group shown as a layer"
	{template}
	args={{
		layerId: 'wtp',
		targets: { wtp: 'WTP' },
		hidden: ['wtp-point'],
		options: { onlyRendered: false, groups: { 'Treatment Plant': ['wtp', 'wtp-point'] } }
	}}
/>
