<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NumberInput from '../components/NumberInput.svelte';
	import type { Stop } from '../utils/stops';
	import Stops from './Stops.svelte';

	const { Story } = defineMeta({
		title: 'Controls/Stops'
	});

	const stops: Stop<number>[] = [
		{ label: 'zoom 8', value: 1 },
		{ label: 'zoom 12', value: 4 },
		{ label: 'zoom 16', value: 12 }
	];
	const classes: Stop<number>[] = [
		{ label: 'class = primary', value: 6 },
		{ label: 'class = secondary, tertiary, track, path, service road', value: 3 },
		{ label: 'other', value: 1 }
	];
</script>

{#snippet template(args: { stops: Stop<number>[] })}
	<Stops stops={args.stops}>
		{#snippet control(stop, index)}
			<NumberInput
				id="story-stop-{index}"
				name="stop-{index}"
				label={stop.label}
				value={stop.value}
				min={0}
				max={20}
				step={0.5}
				unit="px"
			/>
		{/snippet}
	</Stops>
{/snippet}

<Story name="Zoom" {template} args={{ stops }} />
<Story name="Classes" {template} args={{ stops: classes }} />
