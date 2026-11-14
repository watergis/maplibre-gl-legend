/**
 * Whether a URL is free of control characters (C0, DEL), tab and newlines, which browsers strip
 * from URLs anywhere: `java\tscript:` or `\u0001javascript:` would otherwise pass a scheme test
 * and still run
 */
export function hasNoControls(url: string): boolean {
	for (let i = 0; i < url.length; i++) {
		const code = url.charCodeAt(i);
		if (code < 0x20 || code === 0x7f) return false;
	}
	return true;
}
