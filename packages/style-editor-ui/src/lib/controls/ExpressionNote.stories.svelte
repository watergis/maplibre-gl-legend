<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import EditorContextFrame from '../../stories/EditorContextFrame.svelte';
	import { createMockMap } from '../../stories/mock-map';
	import ExpressionNote from './ExpressionNote.svelte';

	interface Args {
		value: unknown;
		onmanualeditor: () => void;
	}

	const { Story } = defineMeta({
		title: 'Controls/ExpressionNote',
		args: { onmanualeditor: fn() }
	});

	const map = createMockMap([{ id: 'areas', type: 'fill', source: 'areas' }]);
</script>

{#snippet template(args: Args)}
	<EditorContextFrame {map} layerId="areas" onmanualeditor={args.onmanualeditor}>
		<ExpressionNote value={args.value} />
	</EditorContextFrame>
{/snippet}

<Story
	name="Case"
	{template}
	args={{ value: ['case', ['>', ['get', 'height'], 100], '#f97316', '#0ea5e9'] }}
/>
<Story
	name="Long expression"
	{template}
	args={{
		value: [
			'interpolate',
			['linear'],
			['zoom'],
			10,
			['*', ['get', 'lanes'], 1],
			16,
			['*', ['get', 'lanes'], 4]
		]
	}}
/>
