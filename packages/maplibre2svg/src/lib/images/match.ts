/** The words of an id: runs of letters and digits of 3 or more characters, lower case */
export function wordsOf(id: string): string[] {
	return id
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length >= 3);
}

/**
 * The id of an image which a `{token}` template could stand for, such as `park_11` for
 * `{icon}_11`: of the ids which match with every token as a wildcard, the first in sorted
 * order which shares a word with `hint` (such as the layer id), else the first in sorted order
 */
export function matchTemplate(template: string, ids: string[], hint = ''): string | undefined {
	const parts = template.split(/{[^{}]+}/);
	const pattern = new RegExp(
		`^${parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`
	);
	const matching = [...ids].sort().filter((id) => pattern.test(id));
	const hints = new Set(wordsOf(hint));
	return matching.find((id) => wordsOf(id).some((word) => hints.has(word))) ?? matching[0];
}
