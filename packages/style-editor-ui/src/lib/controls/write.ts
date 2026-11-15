import type { EditorContext } from '../context';
import type { PropertyType } from '../interfaces';
import { debounce } from '../utils/debounce';

/** delay of the writes to the map while a control is dragged, in ms */
export const WRITE_DELAY = 60;

/**
 * Write the value of a field to the map, with its linked properties, at most every
 * {@link WRITE_DELAY} ms.
 *
 * @param context the editor context
 * @param getField the property, and the properties set to the same value
 * @returns the debounced writer
 */
export function createWriter(
	context: EditorContext,
	getField: () => { type: PropertyType; property: string; linked?: string[] }
) {
	return debounce((value: unknown) => {
		const field = getField();
		for (const property of [field.property, ...(field.linked ?? [])]) {
			context.setProperty(field.type, property, value);
		}
	}, WRITE_DELAY);
}

/** round a number to remove floating point noise, e.g. 0.1 * 3 */
export const round = (value: number) => Math.round(value * 1e6) / 1e6;
