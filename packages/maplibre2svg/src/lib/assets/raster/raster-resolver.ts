import { imageLoads } from './probe';
import { rasterImageUrl, type RasterContext } from './source';

/**
 * Finds the image which stands for a raster layer: the tile of its source at the center and
 * zoom of the map (or the image of an image source), and whether it loads
 */
export class RasterSourceResolver {
	readonly context: RasterContext;

	constructor(context: RasterContext) {
		this.context = context;
	}

	/** The URL of the thumbnail of the source, or undefined to show the placeholder */
	imageUrl(sourceId: unknown): Promise<string | undefined> {
		return rasterImageUrl(sourceId, this.context);
	}

	/** Whether the image loads, checked once per URL; undefined when it cannot be told */
	loads(url: string): Promise<boolean | undefined> {
		return imageLoads(this.context.cache, this.context.loadImage, url);
	}
}
