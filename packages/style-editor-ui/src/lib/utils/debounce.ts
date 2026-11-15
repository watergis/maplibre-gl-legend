/**
 * Delay calls of a function until it has not been called for `wait` ms.
 *
 * @param fn the function
 * @param wait the delay in ms
 * @returns the debounced function, with `flush()` to call a pending call now
 */
export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	wait: number
): ((...args: A) => void) & { flush: () => void } {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: A | undefined;
	const run = () => {
		timer = undefined;
		if (!pending) return;
		const args = pending;
		pending = undefined;
		fn(...args);
	};
	const debounced = (...args: A) => {
		pending = args;
		if (timer !== undefined) clearTimeout(timer);
		timer = setTimeout(run, wait);
	};
	debounced.flush = () => {
		if (timer !== undefined) clearTimeout(timer);
		run();
	};
	return debounced;
}
