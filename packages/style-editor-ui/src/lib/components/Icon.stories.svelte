<script module lang="ts">
	import { CircleHelp, Code, Palette, RotateCcw, SlidersHorizontal, X } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Icon from './Icon.svelte';

	const { Story } = defineMeta({
		title: 'Components/Icon',
		component: Icon,
		tags: ['autodocs'],
		args: { icon: Palette, name: 'title' },
		argTypes: { icon: { control: false } }
	});

	/** the icons of the dialog, by the key used in their class name */
	const ICONS = {
		title: Palette,
		close: X,
		fields: SlidersHorizontal,
		manualEditor: Code,
		reset: RotateCcw,
		help: CircleHelp
	};
</script>

<Story name="Default" />

<Story name="All icons">
	{#snippet template()}
		<div style="display: flex; gap: 16px;">
			{#each Object.entries(ICONS) as [name, icon] (name)}
				<span style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
					<Icon {icon} {name} />
					<code style="font-size: 11px;">{name}</code>
				</span>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Large">
	{#snippet template(args)}
		<span style="--gl-style-editor-icon-size: 40px; color: var(--gl-style-editor-primary);">
			<Icon {...args} />
		</span>
	{/snippet}
</Story>
