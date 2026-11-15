import { mount, unmount } from 'svelte';
import StyleEditorDialogComponent from './dialog/StyleEditorDialog.svelte';
import type { StyleEditorDialogOptions, StyleEditorTarget } from './interfaces';

/** Counter making the ids of the form elements unique when several dialogs are created */
let dialogCount = 0;

/**
 * Non-modal dialog editing the style of a layer of a map, see `dialog/StyleEditorDialog.svelte`.
 *
 * It mounts the Svelte component at the end of the document when it is opened, and removes it
 * once the dialog has been closed. Opening it for another layer while it is open keeps the dialog
 * where it is and shows the other layer.
 *
 * @example
 * ```ts
 * const editor = new StyleEditorDialog({ map });
 * editor.open({ layerId: 'water', title: 'Water' });
 * ```
 */
export default class StyleEditorDialog {
	private options: StyleEditorDialogOptions;

	/** exports of the mounted component, set while the dialog is open */
	private component:
		| {
				setTarget: (target: StyleEditorTarget) => boolean;
				close: () => void;
				contains: (node: Node | null) => boolean;
		  }
		| undefined;

	/**
	 * @param options the map, and the options of the dialog
	 */
	constructor(options: StyleEditorDialogOptions) {
		this.options = options;
	}

	/** Whether the dialog is open */
	public get isOpen(): boolean {
		return !!this.component;
	}

	/**
	 * Open the dialog for a layer, or show another layer in the open dialog.
	 *
	 * @param target the layer
	 */
	public open(target: StyleEditorTarget): void {
		if (this.component) {
			this.component.setTarget(target);
			return;
		}
		this.component = mount(StyleEditorDialogComponent, {
			target: document.body,
			props: {
				options: this.options,
				target,
				idPrefix: `gl-style-editor-${++dialogCount}`,
				onclosed: () => {
					const component = this.component;
					this.component = undefined;
					if (component) unmount(component);
					this.options.onClose?.();
				}
			}
		});
	}

	/** Close the dialog */
	public close(): void {
		this.component?.close();
	}

	/**
	 * Whether a node is in the dialog, e.g. to ignore the clicks in the dialog.
	 *
	 * @param node the node
	 * @returns true when the dialog is open and contains the node
	 */
	public contains(node: Node | null): boolean {
		return this.component?.contains(node) ?? false;
	}
}
