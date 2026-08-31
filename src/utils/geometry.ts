/**
 * Pure layout and paging arithmetic for the carousel.
 *
 * Everything here is a plain function of numbers so the interesting behaviour —
 * clamping, wrapping, clone-unit travel, reading a page back off a scroll
 * offset — can be exercised without a renderer or a scroll view.
 *
 * @module
 */

/** Positive modulo, so stepping back from page 0 lands on the last page. */
export const wrapIndex = (value: number, length: number): number =>
	length <= 0 ? 0 : ((value % length) + length) % length;

/** Clamp `value` into `[min, max]`. */
export const clamp = (value: number, min: number, max: number): number =>
	value < min ? min : value > max ? max : value;

/** Inputs to {@link computeGeometry}. */
export interface GeometryInput {
	/** Measured width of the carousel container in dp. `0` before layout. */
	containerWidth: number;
	/** Number of slides supplied by the consumer. */
	slideCount: number;
	/** Requested slides-per-page, already resolved from any responsive map. */
	visibleSlides: number;
	/** Peek in dp, already resolved from any responsive map. */
	peek: number;
	/** Gap between slides in dp. */
	spacing: number;
	/** Whether seamless wrapping (and therefore cloning) is on. */
	infinite: boolean;
}

/** Everything the renderer and the scroll bridge need, derived in one pass. */
export interface Geometry {
	/** `visibleSlides` normalised to an integer ≥ 1. */
	visibleSlides: number;
	/** Width of one slide in dp. */
	slideWidth: number;
	/** Resolved peek in dp — the inline padding on the content container. */
	peek: number;
	/** Distance from one slide's leading edge to the next: width + spacing. */
	slideStride: number;
	/** Distance travelled by one page: `visibleSlides * slideStride`. */
	pageStride: number;
	/** Total pages, floored at 1 so an empty carousel still divides cleanly. */
	pageCount: number;
	/** Whether clone pages are being rendered. */
	cloned: boolean;
	/** Slides cloned before the first real one. */
	leadingClones: number;
	/** Slides cloned after the last real one. */
	trailingClones: number;
	/** Slides actually rendered, clones included. */
	renderedSlideCount: number;
	/** Scroll units between unit 0 and real page 0 — `1` when cloned, else `0`. */
	leadUnits: number;
	/** Total scroll units, clone pages included. */
	unitCount: number;
	/** Width of the scrollable content in dp. */
	contentWidth: number;
	/** Largest reachable scroll offset. */
	maxScrollOffset: number;
}

/** Derive every layout number the carousel needs from its measured width. */
export function computeGeometry({
	containerWidth,
	slideCount,
	visibleSlides,
	peek,
	spacing,
	infinite,
}: GeometryInput): Geometry {
	const visible = Math.max(1, Math.floor(visibleSlides) || 1);
	// Floored at 1: an empty carousel still has to divide cleanly, or every
	// modulo below turns into NaN.
	const pageCount = Math.max(1, Math.ceil(slideCount / visible));

	// Nothing to clone when every slide already fits on a single page — there is
	// no "other end" to come round from.
	const cloned = infinite && slideCount > visible;
	const leadingClones = cloned ? visible : 0;
	const trailingClones = cloned ? visible : 0;
	const renderedSlideCount = slideCount + leadingClones + trailingClones;

	const available = containerWidth - 2 * peek - (visible - 1) * spacing;
	const slideWidth = Math.max(0, available / visible);
	const slideStride = slideWidth + spacing;
	const pageStride = visible * slideStride;

	const contentWidth =
		renderedSlideCount > 0
			? 2 * peek +
				renderedSlideCount * slideWidth +
				(renderedSlideCount - 1) * spacing
			: 0;
	const maxScrollOffset = Math.max(0, contentWidth - containerWidth);

	const leadUnits = cloned ? 1 : 0;

	return {
		visibleSlides: visible,
		slideWidth,
		peek,
		slideStride,
		pageStride,
		pageCount,
		cloned,
		leadingClones,
		trailingClones,
		renderedSlideCount,
		leadUnits,
		unitCount: pageCount + 2 * leadUnits,
		contentWidth,
		maxScrollOffset,
	};
}

/**
 * Scroll offset that rests scroll unit `unit` against the leading edge.
 *
 * Clamped to the content, which matters at the tail: with 5 slides in groups of
 * 2 the last page's ideal offset lies past the end of the content, so it snaps
 * flush to the right edge instead. Clamping can never merge two real pages —
 * the second-to-last offset is always strictly inside the range.
 */
export const offsetForUnit = (unit: number, geometry: Geometry): number =>
	clamp(unit * geometry.pageStride, 0, geometry.maxScrollOffset);

/** Scroll offset for a logical page, hopping over the leading clone page. */
export const offsetForPage = (page: number, geometry: Geometry): number =>
	offsetForUnit(page + geometry.leadUnits, geometry);

/**
 * Convert between logical and physical scroll offsets.
 *
 * Page indices stay logical everywhere in this library — 0 is always the first
 * page, growing as you page forward — because a right-to-left scroller mirrors
 * its content, putting offset 0 at the *right* edge. Mirroring at this one
 * boundary keeps every other calculation direction-agnostic.
 *
 * The mapping is its own inverse, so the same call converts either way.
 */
export const mirrorOffset = (
	offset: number,
	geometry: Geometry,
	rtl: boolean,
): number => (rtl ? geometry.maxScrollOffset - offset : offset);

/**
 * The snap points handed to the scroller, clone units included.
 *
 * Returned in ascending order, which is what the scroller requires — so under
 * `rtl` the mirrored offsets come back reversed, not just negated in place.
 */
export function snapOffsets(geometry: Geometry, rtl = false): number[] {
	if (geometry.pageStride <= 0) {
		return [];
	}
	const offsets: number[] = [];
	for (let unit = 0; unit < geometry.unitCount; unit += 1) {
		offsets.push(offsetForUnit(unit, geometry));
	}
	if (!rtl) {
		return offsets;
	}
	return offsets
		.map((offset) => mirrorOffset(offset, geometry, true))
		.reverse();
}

/**
 * Read the resting scroll unit back off a real scroll offset.
 *
 * A nearest-offset scan rather than `round(offset / pageStride)`: the tail
 * offsets are clamped, so dividing would misread the last page as soon as the
 * slide count is not a multiple of `visibleSlides`.
 */
export function unitFromOffset(offset: number, geometry: Geometry): number {
	if (geometry.pageStride <= 0 || geometry.unitCount <= 1) {
		return 0;
	}
	let bestUnit = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let unit = 0; unit < geometry.unitCount; unit += 1) {
		const distance = Math.abs(offset - offsetForUnit(unit, geometry));
		if (distance < bestDistance) {
			bestDistance = distance;
			bestUnit = unit;
		}
	}
	return bestUnit;
}

/** Where a scroll offset puts the carousel, in logical terms. */
export interface ResolvedOffset {
	/** The logical page the offset corresponds to. */
	page: number;
	/** The raw scroll unit, which may be a clone. */
	unit: number;
	/** Whether the offset is resting on a clone page. */
	onClone: boolean;
}

/** Translate a real scroll offset into a logical page. */
export function pageFromOffset(
	offset: number,
	geometry: Geometry,
): ResolvedOffset {
	const unit = unitFromOffset(offset, geometry);
	if (!geometry.cloned) {
		return {
			page: clamp(unit, 0, geometry.pageCount - 1),
			unit,
			onClone: false,
		};
	}
	if (unit === 0) {
		// The leading clone shows the last `visibleSlides` slides, so logically we
		// are looking at the last page.
		return { page: geometry.pageCount - 1, unit, onClone: true };
	}
	if (unit >= geometry.pageCount + 1) {
		return { page: 0, unit, onClone: true };
	}
	return { page: unit - 1, unit, onClone: false };
}

/** A move the carousel has decided to make. */
export interface NavigationTarget {
	/** The logical page the move lands on. */
	page: number;
	/**
	 * The scroll unit to animate to — a clone unit when wrapping seamlessly, in
	 * which case the carousel silently re-anchors onto the real page once the
	 * scroll settles. That fix-up is driven by {@link pageFromOffset} reporting
	 * `onClone`, so a user who flicks onto a clone is corrected the same way.
	 */
	unit: number;
}

/**
 * Work out where a relative move should go.
 *
 * Returns `null` when the carousel is already against an end it cannot pass,
 * which is what keeps `onPageChanged` from re-firing for the current page.
 */
export function stepTarget(
	currentPage: number,
	delta: number,
	geometry: Geometry,
	wraps: boolean,
): NavigationTarget | null {
	const { pageCount, leadUnits, cloned } = geometry;
	const raw = currentPage + delta;

	if (raw >= 0 && raw <= pageCount - 1) {
		return raw === currentPage ? null : { page: raw, unit: raw + leadUnits };
	}
	if (!wraps) {
		return null;
	}

	const page = wrapIndex(raw, pageCount);
	if (page === currentPage) {
		return null;
	}

	// A single step off either end travels *through* the clone page, so the
	// motion continues in the direction the user asked for instead of rewinding.
	// Anything larger has no clone to travel through and just jumps.
	if (cloned && raw === pageCount) {
		return { page: 0, unit: pageCount + 1 };
	}
	if (cloned && raw === -1) {
		return { page: pageCount - 1, unit: 0 };
	}
	return { page, unit: page + leadUnits };
}

/** Absolute jump. Clamped into range — it never wraps. */
export function goToTarget(page: number, geometry: Geometry): NavigationTarget {
	const target = clamp(Math.floor(page) || 0, 0, geometry.pageCount - 1);
	return { page: target, unit: target + geometry.leadUnits };
}

/** The page holding a given slide. */
export const pageForSlide = (
	slide: number,
	geometry: Geometry,
	slideCount: number,
): number =>
	clamp(
		Math.floor(
			clamp(Math.floor(slide) || 0, 0, Math.max(0, slideCount - 1)) /
				geometry.visibleSlides,
		),
		0,
		geometry.pageCount - 1,
	);

/**
 * Map a rendered slide position back to its index in the consumer's data.
 *
 * With clones on, rendered position 0 is a copy of a slide near the end, so
 * this is what keeps keys, labels and `renderItem` pointing at the right item.
 */
export function sourceIndexFor(
	renderedIndex: number,
	geometry: Geometry,
	slideCount: number,
): number {
	const { leadingClones } = geometry;
	if (renderedIndex < leadingClones) {
		return slideCount - leadingClones + renderedIndex;
	}
	const real = renderedIndex - leadingClones;
	return real < slideCount ? real : real - slideCount;
}

/** Build the padded slide list used in the cloned (`infinite`) mode. */
export function withClones<T>(
	items: readonly T[],
	geometry: Geometry,
): readonly T[] {
	if (!geometry.cloned) {
		return items;
	}
	const { leadingClones, trailingClones } = geometry;
	return [
		...items.slice(items.length - leadingClones),
		...items,
		...items.slice(0, trailingClones),
	];
}
