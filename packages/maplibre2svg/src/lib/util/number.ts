/** The value within `min..max` */
export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

/** A finite number from an evaluated value, or the fallback */
export function numberOf(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
