import { createContext, useContext } from "react";

import type { CarouselContextValue } from "./types";

const CarouselContext = createContext<CarouselContextValue | null>(null);

/** Internal: `Carousel` mounts this around its slides and its chrome slots. */
export const CarouselProvider = CarouselContext.Provider;

/**
 * Read and drive the carousel from inside it.
 *
 * This is the escape hatch behind the component slots: whatever the slot props
 * do not cover, build yourself from the same state the carousel runs on. It
 * works in any component rendered inside the carousel — a slide, or any of the
 * `components` slots, which is usually where custom chrome belongs.
 *
 * ```tsx
 * const Counter = () => {
 *   const { page, pageCount, next } = useCarousel();
 *   return <Text onPress={() => next()}>{page + 1} / {pageCount}</Text>;
 * };
 *
 * <Carousel components={{ Pagination: Counter }}>{slides}</Carousel>;
 * ```
 *
 * @throws if called outside a `Carousel` — a silent `null` here would surface
 * much later as an unexplained "cannot read property 'page' of null".
 */
export function useCarousel(): CarouselContextValue {
	const value = useContext(CarouselContext);
	if (value === null) {
		throw new Error(
			"useCarousel must be called inside a <Carousel>. Render your chrome as a child of the " +
				"carousel, pass it through the `components` prop, or wrap it in <CarouselProvider>.",
		);
	}
	return value;
}

/**
 * Like {@link useCarousel}, but returns `null` outside a carousel instead of
 * throwing — for chrome that is meant to work both inside and outside one.
 */
export function useCarouselOptional(): CarouselContextValue | null {
	return useContext(CarouselContext);
}
