import type { LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';

/** the types of layers the editor can edit */
export type LayerType = LayerSpecification['type'];

/** the kind of a style property */
export type PropertyType = 'paint' | 'layout';

/**
 * The methods of the map the style editor uses. A MapLibre GL JS `Map` has all of them.
 */
export type StyleEditorMap = Pick<
	MaplibreMap,
	| 'getStyle'
	| 'getLayer'
	| 'getPaintProperty'
	| 'setPaintProperty'
	| 'getLayoutProperty'
	| 'setLayoutProperty'
	| 'addLayer'
	| 'removeLayer'
	| 'getImage'
>;

/** the corner where the dialog is placed. The user can move it by dragging its header */
export type StyleEditorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Options of {@link StyleEditorDialog} */
export interface StyleEditorDialogOptions {
	/** the map whose layers are edited */
	map: StyleEditorMap;
	/**
	 * where the dialog is placed: a corner of `container`, or of the window
	 *
	 * @defaultValue `'top-left'`
	 */
	position?: StyleEditorPosition;
	/**
	 * the element the dialog stays in, usually the container of the map: the dialog opens in its
	 * corner at `position`, is dragged only inside it, follows it when the page scrolls, and is not
	 * higher than it (its body scrolls). Without it, the dialog stays in the window.
	 */
	container?: HTMLElement;
	/**
	 * called after the editor changed the style of a layer
	 *
	 * @param layerId the ID of the layer
	 */
	onChange?: (layerId: string) => void;
	/** called once the dialog has been closed */
	onClose?: () => void;
}

/** the layer the dialog is opened for */
export interface StyleEditorTarget {
	/** the ID of the layer */
	layerId: string;
	/**
	 * the title shown in the header of the dialog
	 *
	 * @defaultValue the layer ID
	 */
	title?: string;
}
