<!-- Link to the MapLibre Style Specification of a layer type or of a property -->
<script lang="ts">
	import { CircleHelp } from '@lucide/svelte';
	import type { LayerType, PropertyType } from '../interfaces';
	import { getHelpUrl } from '../utils/spec';
	import Icon from './Icon.svelte';

	interface Props {
		layerType: LayerType;
		type?: PropertyType;
		property?: string;
	}

	let { layerType, type, property }: Props = $props();

	const label = $derived(
		property
			? `Open the specification of ${property}`
			: `Open the specification of ${layerType} layers`
	);
</script>

<a
	class="gl-style-editor-help"
	href={getHelpUrl(layerType, type, property)}
	target="_blank"
	rel="noreferrer"
	aria-label={label}
	title={label}
>
	<Icon icon={CircleHelp} name="help" />
</a>

<style>
	.gl-style-editor-help {
		--gl-style-editor-icon-size: 14px;
		display: inline-flex;
		flex: none;
		color: var(--gl-style-editor-muted-foreground);
		transition: color 0.15s;
	}

	.gl-style-editor-help:hover,
	.gl-style-editor-help:focus-visible {
		outline: none;
		color: var(--gl-style-editor-primary);
	}
</style>
