<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ModelFrame from '../../stories/ModelFrame.svelte';
	import OnlyRenderedSwitch from './OnlyRenderedSwitch.svelte';

	const { Story } = defineMeta({
		title: 'Components/OnlyRenderedSwitch'
	});
</script>

{#snippet template(args: { onlyRendered: boolean; onlyRenderedLabel?: string })}
	<ModelFrame
		options={{ onlyRendered: args.onlyRendered, onlyRenderedLabel: args.onlyRenderedLabel }}
	>
		{#snippet children(model)}
			<OnlyRenderedSwitch {model} id="story-only-rendered" />
		{/snippet}
	</ModelFrame>
{/snippet}

<Story name="On" {template} args={{ onlyRendered: true }} />
<Story name="Off" {template} args={{ onlyRendered: false }} />
<Story
	name="Translated label"
	{template}
	args={{ onlyRendered: true, onlyRenderedLabel: '表示中のみ' }}
/>
