/**
 * The id of an image which a `{token}` template could stand for, such as `maki_11` for
 * `{icon}_11`: the first of the sorted ids which match with every token as a wildcard.
 */
export function matchTemplate(template: string, ids: string[]): string | undefined {
	const parts = template.split(/{[^{}]+}/);
	const pattern = new RegExp(
		`^${parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`
	);
	return [...ids].sort().find((id) => pattern.test(id));
}
