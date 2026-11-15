/*
 * Internal UI of maplibre-gl-legend: the dialog editing the style of a layer. It is bundled into
 * the plugin and not published.
 */
export { default as StyleEditorDialog } from './style-editor-dialog';
export * from './interfaces';
export {
	FIELDS,
	getFields,
	type ColorFieldConfig,
	type FieldCondition,
	type FieldConfig,
	type HeatmapGeneratorFieldConfig,
	type NumberFieldConfig,
	type SelectFieldConfig
} from './panels/fields';
export * from './utils/color';
export * from './utils/manual-format';
export * from './utils/spec';
export * from './utils/stops';

export { default as Button } from './components/Button.svelte';
export { default as ColorInput } from './components/ColorInput.svelte';
export { default as Field } from './components/Field.svelte';
export { default as HelpLink } from './components/HelpLink.svelte';
export { default as Icon } from './components/Icon.svelte';
export { default as IconButton } from './components/IconButton.svelte';
export { default as NumberInput } from './components/NumberInput.svelte';
export { default as SegmentedButton } from './components/SegmentedButton.svelte';
export { default as Select } from './components/Select.svelte';
export { default as Switch } from './components/Switch.svelte';
export { default as StyleEditorDialogComponent } from './dialog/StyleEditorDialog.svelte';
