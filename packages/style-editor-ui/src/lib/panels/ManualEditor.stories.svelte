<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { LAYER_STORIES, type LayerStory } from '../../stories/layer-stories';
	import { createMockMap } from '../../stories/mock-map';
	import type { ManualFormat } from '../utils/manual-format';
	import ManualEditor from './ManualEditor.svelte';

	interface Args {
		story: LayerStory;
		format: ManualFormat;
		full: boolean;
		onchange: (property: string, value: unknown) => void;
	}

	const { Story } = defineMeta({
		title: 'Panels/ManualEditor',
		argTypes: {
			story: { control: false },
			format: { control: 'inline-radio', options: ['yaml', 'json'] },
			full: { control: 'boolean' }
		},
		args: { format: 'yaml', full: false, onchange: fn() }
	});
</script>

{#snippet template(args: Args)}
	{#key args}
		<EditorContextFrame
			map={createMockMap(args.story.style.layers)}
			layerId={args.story.layerId}
			onchange={args.onchange}
		>
			<ManualEditor format={args.format} full={args.full} />
		</EditorContextFrame>
	{/key}
{/snippet}

<Story name="YAML" {template} args={{ story: LAYER_STORIES.line }} />
<Story name="JSON" {template} args={{ story: LAYER_STORIES.line, format: 'json' }} />
<Story name="Symbol" {template} args={{ story: LAYER_STORIES.symbolSdfIcon }} />
<Story name="Full layer" {template} args={{ story: LAYER_STORIES.symbolSdfIcon, full: true }} />
