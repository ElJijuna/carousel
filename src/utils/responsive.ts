import type { ResponsiveMap, ResponsiveValue } from "../types";

/**
 * Narrow a {@link ResponsiveValue} to its map form.
 *
 * A responsive map is the only object shape the props accept, so "is a
 * non-null, non-array object" is a sufficient test — and it keeps the check
 * cheap enough to run on every layout pass.
 */
const isResponsiveMap = <T>(
	value: ResponsiveValue<T>,
): value is ResponsiveMap<T> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Resolve a responsive prop against the carousel's measured width.
 *
 * Numeric keys are **max widths**, so the narrowest entry that still fits the
 * container wins and unlisted buckets fall outwards to the next wider one:
 * with `{ base: 3, 700: 2, 400: 1 }`, a 500dp container gets `2` because 700
 * is the narrowest key it fits under.
 *
 * @param value - the prop, either a plain value or a breakpoint map
 * @param width - measured container width in dp
 * @param fallback - used when the map has no matching entry and no `base`
 * @returns the resolved value
 */
export function resolveResponsive<T>(
	value: ResponsiveValue<T> | undefined,
	width: number,
	fallback: T,
): T {
	if (value === undefined) {
		return fallback;
	}
	if (!isResponsiveMap(value)) {
		return value;
	}

	// A width of 0 means "not measured yet". Every numeric key would match it,
	// so the narrowest bucket would win for one frame and the carousel would
	// visibly reflow. `base` is the honest answer until a real width arrives.
	let best: T | undefined;
	if (width > 0) {
		let bestKey = Number.POSITIVE_INFINITY;
		for (const key of Object.keys(value)) {
			const maxWidth = Number(key);
			if (!Number.isFinite(maxWidth)) {
				continue;
			}
			if (width <= maxWidth && maxWidth < bestKey) {
				bestKey = maxWidth;
				best = value[maxWidth];
			}
		}
	}

	if (best !== undefined) {
		return best;
	}
	return value.base !== undefined ? value.base : fallback;
}
