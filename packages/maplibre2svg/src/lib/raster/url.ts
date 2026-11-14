import { hasNoControls } from '../url-safety';

/**
 * Whether a URL can go into `<image href>`: `http:`, `https:`, `data:image/`, `blob:`, or a
 * relative URL, without control characters. Anything else (`pmtiles://`, `javascript:`, custom
 * protocols) cannot.
 */
export function isLoadableUrl(url: unknown): url is string {
	if (typeof url !== 'string' || url.trim() === '' || !hasNoControls(url)) return false;
	const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();
	// relative and protocol-relative URLs load as the page does
	if (scheme === undefined) return !/^\s*[^/?#]*:/.test(url);
	if (scheme === 'http' || scheme === 'https' || scheme === 'blob') return true;
	return scheme === 'data' && /^\s*data:image\//i.test(url);
}
