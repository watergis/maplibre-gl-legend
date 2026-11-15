import type { LayerSpecification } from 'maplibre-gl';
import { getContext, setContext } from 'svelte';
import type { PropertyType, StyleEditorMap } from './interfaces';

/** what the editor components share, set by the dialog */
export interface EditorContext {
	map: StyleEditorMap;
	/** the layer being edited, as it was when the dialog was opened for it */
	layer: LayerSpecification;
	/** prefix of the ids of the form elements, unique to the dialog */
	idPrefix: string;
	/**
	 * set a property of the layer on the map
	 * @param type `paint` or `layout`
	 * @param property the property name
	 * @param value the value; `undefined` resets the property to its default
	 */
	setProperty: (type: PropertyType, property: string, value: unknown) => void;
	/** read a property of the layer on the map */
	getProperty: (type: PropertyType, property: string) => unknown;
	/** show the manual editor */
	openManualEditor: () => void;
}

const KEY = Symbol('gl-style-editor');

/** share the context with the components of the dialog */
export const setEditorContext = (context: EditorContext) => setContext(KEY, context);

/** the context set by the dialog */
export const getEditorContext = () => getContext<EditorContext>(KEY);
