/**
 * Keeps what the legends of a map are made from, such as glyph ranges, encoded images and
 * whether tiles load, between calls. Values are kept as promises, so that concurrent calls for
 * the same key share one load, and failures are kept too, so that a missing resource is not
 * requested again on every update.
 */
export class LegendCache {
	/** values keyed by where they were loaded from */
	readonly store: Map<string, Promise<unknown>>;

	constructor(store: Map<string, Promise<unknown>> = new Map()) {
		this.store = store;
	}

	/**
	 * A cache over the store of `cache`: the cache itself when it is one, else a new one sharing
	 * its store, for a cache given as a plain `{ store }` object
	 */
	static from(cache: { store: Map<string, Promise<unknown>> }): LegendCache {
		return cache instanceof LegendCache ? cache : new LegendCache(cache.store);
	}

	/** The value of the key, loaded with `load` the first time and kept */
	memo<T>(key: string, load: () => Promise<T>): Promise<T> {
		const cached = this.store.get(key) as Promise<T> | undefined;
		if (cached) return cached;
		const value = load();
		this.store.set(key, value);
		return value;
	}
}

/** Create a cache to share between calls, such as the updates of the legend of one map */
export function createLegendCache(): LegendCache {
	return new LegendCache();
}
