<!--
	Sets the editor context, as the dialog does, so that the controls and the panels can be shown on
	their own with a mock map (see `mock-map.ts`).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setEditorContext } from '../lib/context';
	import type { PropertyType } from '../lib/interfaces';
	import type { MockMap } from './mock-map';

	interface Props {
		map: MockMap;
		layerId: string;
		/** a property was set on the map */
		onchange?: (property: string, value: unknown) => void;
		/** the "Edit in the manual editor" link was clicked */
		onmanualeditor?: () => void;
		children: Snippet;
	}

	let { map, layerId, onchange, onmanualeditor, children }: Props = $props();

	const read = () => ({ map, layerId });
	const initial = read();
	const layer = initial.map.getStyle().layers.find((l) => l.id === initial.layerId);
	if (!layer) throw new Error(`no layer ${initial.layerId}`);

	setEditorContext({
		map: initial.map,
		layer,
		idPrefix: 'story',
		getProperty: (type: PropertyType, property: string) =>
			type === 'paint'
				? initial.map.getPaintProperty(layer.id, property as never)
				: initial.map.getLayoutProperty(layer.id, property as never),
		setProperty: (type: PropertyType, property: string, value: unknown) => {
			if (type === 'paint')
				initial.map.setPaintProperty(layer.id, property as never, value as never);
			else initial.map.setLayoutProperty(layer.id, property as never, value as never);
			onchange?.(property, value);
		},
		openManualEditor: () => onmanualeditor?.()
	});
</script>

<div class="story-editor-frame">
	{@render children()}
</div>

<style>
	.story-editor-frame {
		display: flex;
		flex-direction: column;
		gap: var(--gl-style-editor-gap);
		padding: 16px;
	}
</style>
