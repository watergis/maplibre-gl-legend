<script module lang="ts">
	import { Code, SlidersHorizontal } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import SegmentedButton from './SegmentedButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/SegmentedButton',
		component: SegmentedButton,
		args: {
			name: 'story-format',
			label: 'Format',
			choices: [
				{ value: 'yaml', label: 'YAML' },
				{ value: 'json', label: 'JSON' }
			],
			value: 'yaml',
			onchange: fn()
		}
	});
</script>

<Story name="Format" />
<Story
	name="With icons"
	args={{
		name: 'story-mode',
		label: 'Mode',
		choices: [
			{ value: 'fields', label: 'Properties', icon: SlidersHorizontal },
			{ value: 'manual', label: 'Manual', icon: Code }
		],
		value: 'fields'
	}}
/>
<Story
	name="Compact"
	args={{
		name: 'story-compact',
		label: 'Overlap',
		compact: true,
		choices: [
			{ value: 'never', label: 'never' },
			{ value: 'always', label: 'always' },
			{ value: 'cooperative', label: 'cooperative' }
		],
		value: 'never'
	}}
/>
