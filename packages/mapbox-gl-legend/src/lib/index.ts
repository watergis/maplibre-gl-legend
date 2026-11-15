/* eslint-disable @typescript-eslint/ban-ts-comment */
import mapboxgl from 'mapbox-gl';
import type {
	ControlPosition,
	IControl,
	LayerSpecification,
	Map as MapboxMap,
	StyleSpecification
} from 'mapbox-gl';
import LegendSymbol from '@watergis/legend-symbol';

/**
 * Options of {@link MapboxLegendControl}.
 *
 * Every option can be omitted when it is passed to the constructor: the default value is used
 * instead.
 */
export interface LegendOptions {
	/**
	 * Whether the legend panel is open when the control is added.
	 *
	 * - `true`: the panel is open. It stays open until the user closes it with its close button.
	 * - `false`: only the legend button is shown, and the user opens the panel with it. The panel
	 *   is closed again when the user clicks outside the control.
	 *
	 * @defaultValue `true`
	 */
	showDefault: boolean;
	/**
	 * Whether each layer has a checkbox to show / hide it on the map.
	 *
	 * The checkbox sets the `visibility` layout property of the layer. Checkboxes of the same layer
	 * in other legend controls are kept in sync.
	 *
	 * @defaultValue `true`
	 */
	showCheckbox: boolean;
	/**
	 * The order of the layers in the legend.
	 *
	 * - `true`: the top-most layer of the style (the last one in `style.layers`) comes first, as
	 *   they are stacked on the map.
	 * - `false`: the layers are listed in the order of `style.layers`.
	 *
	 * @defaultValue `true`
	 */
	reverseOrder: boolean;
	/**
	 * The initial state of the "Only rendered" checkbox in the panel.
	 *
	 * - `true`: only the layers which have features rendered in the current view are listed. The
	 *   list is updated when the map is moved. Layers hidden with the checkbox stay listed, so that
	 *   they can be shown again.
	 * - `false`: all layers in `targets` are listed.
	 *
	 * The user can change it with the checkbox.
	 *
	 * @defaultValue `true`
	 */
	onlyRendered: boolean;
	/**
	 * The title shown at the top of the panel.
	 *
	 * @defaultValue `'Legend'`
	 */
	title?: string;
	/**
	 * The label of the "Only rendered" checkbox, e.g. to translate it.
	 *
	 * @defaultValue `'Only rendered'`
	 */
	onlyRenderedLabel?: string;
	/**
	 * The Mapbox access token used to load the sprite of the style when it is a `mapbox://` URL,
	 * for the icons of symbol layers and the patterns of fill layers.
	 *
	 * @defaultValue `mapboxgl.accessToken`
	 */
	accessToken?: string;
}

/**
 * A Mapbox GL JS control which shows a legend panel of the map's layers.
 *
 * The panel has:
 *
 * - a title ({@link LegendOptions.title}) and a close button. When the panel is closed, a legend
 *   button opens it again.
 * - the "Only rendered" checkbox ({@link LegendOptions.onlyRendered}), to list only the layers
 *   rendered in the current view.
 * - a row per layer: a checkbox to show / hide the layer ({@link LegendOptions.showCheckbox}), its
 *   symbol and its title. The symbol is drawn from the style of the layer at the current zoom.
 *
 * The legend is updated when the map is moved and when the style changes.
 *
 * @example
 * ```ts
 * map.on('load', () => {
 * 	const targets = {
 * 		pipeline: 'Pipeline',
 * 		meter: 'Water Meter',
 * 		valve: 'Valve'
 * 	};
 *
 * 	// closed at first, without the checkboxes
 * 	map.addControl(
 * 		new MapboxLegendControl(targets, { showDefault: false, showCheckbox: false }),
 * 		'top-right'
 * 	);
 *
 * 	// all layers of the style, in the order of style.layers
 * 	map.addControl(new MapboxLegendControl({}, { reverseOrder: false }), 'bottom-left');
 * });
 * ```
 */
export class MapboxLegendControl implements IControl {
	private controlContainer: HTMLElement;
	private map?: MapboxMap;
	private legendContainer: HTMLElement;
	private legendButton: HTMLButtonElement;
	private closeButton: HTMLButtonElement;
	private legendTable: HTMLElement;
	private targets: { [key: string]: string };
	private uncheckedLayers: { [key: string]: string } = {};
	private onlyRendered: boolean;
	private options: LegendOptions = {
		showDefault: true,
		showCheckbox: true,
		reverseOrder: true,
		onlyRendered: true,
		title: undefined,
		onlyRenderedLabel: undefined,
		accessToken: undefined
	};
	private sprite = {
		image: HTMLImageElement,
		json: JSON
	};

	/**
	 * Create a legend control. Add it to the map with `map.addControl()`, after the style is loaded
	 * (e.g. in the `load` event).
	 *
	 * @param targets The layers listed in the legend: the layer ID and the title shown for it, e.g.
	 *   `{ pipeline: 'Pipeline' }`. The layers are listed in the order of the style, not of this
	 *   object. With an empty object (`{}`), all layers of the style are listed, titled by their
	 *   IDs.
	 * @param options The options of the legend. Omitted options use their default values: see
	 *   {@link LegendOptions}.
	 */
	constructor(targets: { [key: string]: string }, options?: Partial<LegendOptions>) {
		this.targets = targets;
		if (options) {
			this.options = Object.assign(this.options, options);
		}
		this.onlyRendered = this.options.onlyRendered;
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	/**
	 * The position of the control when `map.addControl()` is called without a position.
	 *
	 * @returns `'top-right'`
	 */
	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	/**
	 * create checkbox for switching layer visibility
	 * @param layer the layer
	 * @returns the TD Element holding the checkbox, or undefined without `showCheckbox`
	 */
	private createLayerCheckbox(layer: LayerSpecification): HTMLElement | undefined {
		if (!this.options.showCheckbox) return;

		const changeLayerVisibility = (layer_id: string, checked) => {
			if (checked) {
				if (this.uncheckedLayers[layer_id]) delete this.uncheckedLayers[layer_id];
				this.map?.setLayoutProperty(layer_id, 'visibility', 'visible');
			} else {
				this.uncheckedLayers[layer_id] = layer_id;
				this.map?.setLayoutProperty(layer_id, 'visibility', 'none');
			}
			const checkboxes: NodeListOf<HTMLElement> = document.getElementsByName(layer_id);
			for (const i in checkboxes) {
				if (typeof checkboxes[i] === 'number') continue;
				// @ts-ignore
				checkboxes[i].checked = checked;
			}
		};

		// create checkbox for switching layer visibility
		const td = document.createElement('TD');
		td.className = 'legend-table-td';
		const checklayer = document.createElement('input');
		checklayer.setAttribute('type', 'checkbox');
		checklayer.setAttribute('name', layer.id);
		checklayer.setAttribute('value', layer.id);
		const visibility = this.map?.getLayoutProperty(layer.id, 'visibility');
		if (!visibility) {
			checklayer.checked = true;
		} else {
			let _checked = true;
			switch (visibility) {
				case 'none':
					_checked = false;
					break;
				case 'visible':
					_checked = true;
					checklayer.checked = true;
					break;
			}
			changeLayerVisibility(layer.id, _checked);
		}

		checklayer.addEventListener('click', function (e) {
			// @ts-ignore
			const _id = e.target?.value;
			// @ts-ignore
			const _checked = e.target?.checked;
			changeLayerVisibility(_id, _checked);
		});
		td.appendChild(checklayer);

		return td;
	}

	/**
	 * Create and return a layer's legend row
	 * @param layer the layer
	 * @returns the TR Element, or undefined when the layer has no symbol to draw
	 */
	private getLayerLegend(layer: LayerSpecification): HTMLElement | undefined {
		const map = this.map;
		const zoom = map?.getZoom();
		const sprite = this.sprite;
		const symbol = LegendSymbol({ sprite, zoom, layer });

		const tr = document.createElement('TR');

		const td0 = this.createLayerCheckbox(layer);
		if (td0) tr.appendChild(td0);

		// create legend symbol
		const td1 = document.createElement('TD');
		td1.className = 'legend-table-td';

		if (!symbol) {
			const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			const iconPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');

			iconSvg.setAttribute('fill', 'none');
			iconSvg.setAttribute('viewBox', '0 0 24 24');
			iconSvg.setAttribute('stroke', 'black');
			iconSvg.classList.add('post-icon');

			iconPath.setAttribute(
				'd',
				'M21,0H3A3,3,0,0,0,0,3V21a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V3A3,3,0,0,0,21,0ZM3,2H21a1,1,0,0,1,1,1V15.86L14.18,9.35a5.06,5.06,0,0,0-6.39-.06L2,13.92V3A1,1,0,0,1,3,2ZM21,22H3a1,1,0,0,1-1-1V16.48l7-5.63a3.06,3.06,0,0,1,3.86,0L22,18.47V21A1,1,0,0,1,21,22Z'
			);

			iconPath.setAttribute('stroke-linecap', 'round');
			iconPath.setAttribute('stroke-linejoin', 'round');
			iconPath.setAttribute('stroke-width', '2');

			iconPath2.setAttribute(
				'd',
				'M18,9a3,3,0,1,0-3-3A3,3,0,0,0,18,9Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,18,5Z'
			);
			iconPath2.setAttribute('stroke-linecap', 'round');
			iconPath2.setAttribute('stroke-linejoin', 'round');
			iconPath2.setAttribute('stroke-width', '2');

			iconSvg.appendChild(iconPath);
			iconSvg.appendChild(iconPath2);

			const label2 = document.createElement('label');
			label2.textContent =
				this.targets && this.targets[layer.id] ? this.targets[layer.id] : layer.id;
			td1.appendChild(iconSvg);
		} else {
			if (symbol.element === 'div') {
				if (
					symbol.attributes.style.backgroundImage &&
					!['url(undefined)', 'url(null)'].includes(symbol.attributes.style.backgroundImage)
				) {
					const img = document.createElement('img');
					img.src = symbol.attributes.style.backgroundImage.replace('url(', '').replace(')', '');
					img.alt = layer.id;
					img.style.cssText = `height: 17px;`;
					td1.appendChild(img);
				}
				td1.style.backgroundColor = symbol.attributes.style.backgroundColor;
				td1.style.backgroundPosition = symbol.attributes.style.backgroundPosition;
				td1.style.backgroundSize = symbol.attributes.style.backgroundSize;
				td1.style.backgroundRepeat = symbol.attributes.style.backgroundRepeat;
				td1.style.opacity = symbol.attributes.style.opacity;
			} else if (symbol.element === 'svg') {
				const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				svg.style.cssText = 'height: 17px;';
				svg.setAttributeNS(null, 'version', '1.1');
				Object.keys(symbol.attributes).forEach((k) => {
					svg.setAttribute(k, symbol.attributes[k]);
					const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
					symbol.children.forEach((child) => {
						const c = document.createElementNS('http://www.w3.org/2000/svg', child.element);
						Object.keys(child.attributes).forEach((k2) => {
							c.setAttributeNS(null, k2, child.attributes[k2]);
						});
						group.appendChild(c);
					});
					svg.appendChild(group);
				});
				const label2 = document.createElement('label');
				label2.textContent =
					this.targets && this.targets[layer.id] ? this.targets[layer.id] : layer.id;
				td1.appendChild(svg);
			} else {
				return;
			}
		}

		// create layer label
		const td2 = document.createElement('TD');
		td2.className = 'legend-table-td';
		const label1 = document.createElement('label');
		label1.textContent = this.targets && this.targets[layer.id] ? this.targets[layer.id] : layer.id;
		td2.appendChild(label1);

		// tr.appendChild(td0);
		tr.appendChild(td1);
		tr.appendChild(td2);
		return tr;
	}

	/**
    update legend contents
    */
	private updateLegendControl() {
		const map = this.map;

		// get current rendered layers
		const visibleLayers = {};
		if (map) {
			const features = map.queryRenderedFeatures();
			for (const feature of features) {
				if (!feature.layer) continue;
				visibleLayers[feature.layer.id] = feature.layer;
			}
		}

		let layers = map?.getStyle().layers;
		if (layers) {
			if (!this.legendTable) {
				this.legendTable = document.createElement('TABLE');
				this.legendTable.className = 'legend-table';
				// only the table scrolls, so the scrollbar does not overlap the close button
				const tableWrapper = document.createElement('div');
				tableWrapper.className = 'mapboxgl-legend-table-wrapper';
				tableWrapper.appendChild(this.legendTable);
				this.legendContainer.appendChild(tableWrapper);
			}

			while (this.legendTable.firstChild) {
				this.legendTable.removeChild(this.legendTable.firstChild);
			}
			if (this.options.reverseOrder) {
				layers = layers.reverse();
			}
			layers.forEach((l) => {
				if (visibleLayers[l.id] && this.uncheckedLayers[l.id]) {
					delete this.uncheckedLayers[l.id];
				} else if (this.uncheckedLayers[l.id]) {
					visibleLayers[l.id] = l;
				}

				if (
					this.targets === undefined ||
					// if target option is undefined, show all layers.
					(this.targets && Object.keys(this.targets).length === 0) ||
					// if no layer is specified, show all layers.
					(this.targets &&
						Object.keys(this.targets)
							.map((id: string) => {
								return id;
							})
							.includes(l.id))
					// if layers are speficied, only show these specific layers.
				) {
					if (this.onlyRendered) {
						// only show rendered layer
						if (!visibleLayers[l.id]) return;
					}
					const tr = this.getLayerLegend(l);
					if (!tr) return;
					this.legendTable.appendChild(tr);
				} else {
					return;
				}
			});
		}
	}

	private getStyleUrl(sprite: StyleSpecification['sprite'] | undefined): string | undefined {
		if (!sprite) return;
		if (typeof sprite === 'string') {
			return sprite;
		}
		return;
	}

	/**
	 * Build sprite resource URL. `mapbox://sprites/{user}/{style}` is resolved to Mapbox Styles API with access token.
	 * @param styleUrl sprite URL in style.json
	 * @param suffix e.g. `@2x.png` or `.json`
	 */
	private getSpriteResourceUrl(styleUrl: string, suffix: string): string {
		if (!styleUrl.startsWith('mapbox://')) {
			return `${styleUrl}${suffix}`;
		}
		const baseApiUrl =
			(mapboxgl as unknown as { baseApiUrl?: string }).baseApiUrl || 'https://api.mapbox.com';
		const path = styleUrl.replace(/^mapbox:\/\/sprites\//, '');
		const token = this.options.accessToken || mapboxgl.accessToken;
		const url = `${baseApiUrl}/styles/v1/${path}/sprite${suffix}`;
		return token ? `${url}?access_token=${token}` : url;
	}

	/**
	 * Create the panel, load the sprite of the style and start updating the panel with the map.
	 * Called by `map.addControl()`: you do not need to call it yourself.
	 *
	 * @param map The map the control is added to.
	 * @returns The element of the control, placed on the map by Mapbox GL JS.
	 */
	public onAdd(map: MapboxMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add('mapboxgl-ctrl');
		this.controlContainer.classList.add('mapboxgl-ctrl-group');
		this.legendContainer = document.createElement('div');
		this.legendContainer.classList.add('mapboxgl-legend-list');
		this.legendButton = document.createElement('button');
		this.legendButton.classList.add('mapboxgl-ctrl-icon');
		this.legendButton.classList.add('mapboxgl-legend-switcher');
		this.legendButton.addEventListener('click', () => {
			this.legendButton.style.display = 'none';
			this.legendContainer.style.display = 'block';
		});
		document.addEventListener('click', this.onDocumentClick);
		this.controlContainer.appendChild(this.legendButton);
		this.controlContainer.appendChild(this.legendContainer);

		this.closeButton = document.createElement('button');
		this.closeButton.textContent = 'x';
		this.closeButton.classList.add('mapboxgl-legend-close-button');
		this.closeButton.addEventListener('click', () => {
			this.legendButton.style.display = 'block';
			this.legendContainer.style.display = 'none';
		});
		this.legendContainer.appendChild(this.closeButton);

		const legendLabel = document.createElement('label');
		legendLabel.classList.add('mapboxgl-legend-title-label');
		legendLabel.textContent = this.options.title || 'Legend';
		this.legendContainer.appendChild(legendLabel);
		this.legendContainer.appendChild(document.createElement('br'));

		const checkOnlyRendered = document.createElement('input');
		checkOnlyRendered.setAttribute('type', 'checkbox');
		const checkboxOnlyRenderedId = `mapboxgl-legend-onlyrendered-checkbox-${Math.random() * 100}`;
		checkOnlyRendered.setAttribute('id', checkboxOnlyRenderedId);
		checkOnlyRendered.classList.add('mapboxgl-legend-onlyRendered-checkbox');
		checkOnlyRendered.checked = this.onlyRendered;
		checkOnlyRendered.addEventListener('click', this.handleClickOnlyRendered.bind(this));
		this.legendContainer.appendChild(checkOnlyRendered);
		const onlyRenderedLabel = document.createElement('label');
		onlyRenderedLabel.classList.add('mapboxgl-legend-onlyRendered-label');
		onlyRenderedLabel.textContent = this.options.onlyRenderedLabel || 'Only rendered';
		onlyRenderedLabel.htmlFor = checkboxOnlyRenderedId;
		this.legendContainer.appendChild(onlyRenderedLabel);
		this.legendContainer.appendChild(document.createElement('br'));

		this.map.on('moveend', () => {
			this.updateLegendControl();
		});
		this.map.on('styledata', () => {
			this.updateLegendControl();
		});
		const afterLoadListener = async () => {
			if (map.loaded()) {
				const style = map.getStyle();
				const styleUrl = this.getStyleUrl(style.sprite);
				if (styleUrl) {
					const promise = Promise.all([
						this.loadImage(this.getSpriteResourceUrl(styleUrl, '@2x.png')),
						this.loadJson(this.getSpriteResourceUrl(styleUrl, '.json'))
					]);
					await promise
						.then(([image, json]) => {
							this.setSprite(image, json);
						})
						.catch((err) => console.error(err));
				}
				this.updateLegendControl();
				map.off('idle', afterLoadListener);
			}
		};
		this.map.on('idle', afterLoadListener);

		if (this.options && this.options.showDefault == true) {
			this.legendContainer.style.display = 'block';
			this.legendButton.style.display = 'none';
		}

		return this.controlContainer;
	}

	/**
	 * Remove the panel from the map. Called by `map.removeControl()`: you do not need to call it
	 * yourself.
	 */
	public onRemove(): void {
		if (
			!this.controlContainer ||
			!this.controlContainer.parentNode ||
			!this.map ||
			!this.legendButton
		) {
			return;
		}
		this.legendButton.removeEventListener('click', this.onDocumentClick);
		this.controlContainer.parentNode.removeChild(this.controlContainer);
		document.removeEventListener('click', this.onDocumentClick);
		this.map = undefined;
	}

	/**
	 * Update the legend now.
	 *
	 * The legend is updated by itself when the map is moved and when the style changes. Call this
	 * when something else changed what it shows, e.g. layer visibility set by your code.
	 */
	public redraw(): void {
		this.updateLegendControl();
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element) &&
			this.legendContainer &&
			this.legendButton
		) {
			if (this.options && this.options.showDefault !== true) {
				this.legendContainer.style.display = 'none';
				this.legendButton.style.display = 'block';
			}
		}
	}

	private handleClickOnlyRendered(e) {
		const _checked = e.target?.checked;
		this.onlyRendered = _checked ? true : false;
		this.updateLegendControl();
	}

	private setSprite(image, json) {
		this.sprite = {
			image,
			json
		};
	}

	private loadImage(url: string) {
		let cancelled = false;
		const promise = new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.onload = () => {
				if (!cancelled) resolve(img);
			};
			img.onerror = (e) => {
				if (!cancelled) reject(e);
			};
			img.src = url;
		});
		//@ts-ignore
		promise.cancel = () => {
			cancelled = true;
		};
		return promise;
	}

	private loadJson(url: string) {
		return fetch(url).then((res) => {
			if (!res.ok) {
				throw new Error(`Failed to load JSON: ${res.status} ${res.statusText}`);
			}
			return res.json();
		});
	}
}
