<!-- The fields of the layer type of the layer being edited, see `fields.ts` -->
<script lang="ts">
	import { getEditorContext } from '../context';
	import PropertyField from '../controls/PropertyField.svelte';
	import { getFields } from './fields';

	const context = getEditorContext();
	const fields = getFields({ map: context.map, layer: context.layer });
</script>

<div class="gl-style-editor-panel gl-style-editor-panel--{context.layer.type}">
	{#each fields as field (field.kind === 'heatmap-generator' ? field.kind : field.property)}
		<PropertyField {field} />
	{:else}
		<p class="gl-style-editor-panel__empty">
			The {context.layer.type} layer has no property to edit here.
			<button
				type="button"
				class="gl-style-editor-panel__link"
				onclick={() => context.openManualEditor()}>Use the manual editor</button
			>.
		</p>
	{/each}
</div>

<style>
	.gl-style-editor-panel {
		display: flex;
		flex-direction: column;
		gap: var(--gl-style-editor-gap);
	}

	.gl-style-editor-panel__empty {
		margin: 0;
		color: var(--gl-style-editor-muted-foreground);
	}

	.gl-style-editor-panel__link {
		padding: 0;
		border: none;
		background: none;
		color: var(--gl-style-editor-primary);
		font: inherit;
		cursor: pointer;
	}

	.gl-style-editor-panel__link:hover,
	.gl-style-editor-panel__link:focus-visible {
		outline: none;
		text-decoration: underline;
	}
</style>
