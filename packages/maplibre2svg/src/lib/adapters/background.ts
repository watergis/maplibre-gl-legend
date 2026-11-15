import type { Swatch } from '../render';
import type { Attrs } from '../render/svg';
import type { EvaluatedLayer } from '../style';
import { AreaAdapter } from './area';

/**
 * `background`: a rectangle of `background-color` (or `background-pattern`) ×
 * `background-opacity`, filling the swatch, with the neutral frame around it
 */
export class BackgroundAdapter extends AreaAdapter {
	readonly type = 'background';
	protected readonly colorProperty = 'background-color';
	protected readonly opacityProperty = 'background-opacity';
	protected readonly patternProperty = 'background-pattern';

	protected override shape(_layer: EvaluatedLayer, swatch: Swatch, fill: Attrs): Element {
		return swatch.el('rect', { x: 0, y: 0, width: swatch.width, height: swatch.height, ...fill });
	}
}
