<script module lang="ts">
	import { Check, RotateCcw } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Components/Button',
		component: Button,
		tags: ['autodocs'],
		args: { variant: 'primary', label: 'Apply', icon: Check, iconName: 'apply', onclick: fn() },
		argTypes: {
			variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
			icon: { control: false }
		}
	});
</script>

<Story name="Primary" />
<Story
	name="Secondary"
	args={{ variant: 'secondary', label: 'Reset', icon: RotateCcw, iconName: 'reset' }}
/>
<Story name="Without icon" args={{ icon: undefined, label: 'Apply' }} />
<Story name="Disabled" args={{ disabled: true }} />
