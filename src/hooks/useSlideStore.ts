import { useMemo, useRef } from "react";

import type { CarouselSlideState } from "../types";
import { clamp } from "../utils/geometry";

/**
 * How far `progress` travels before it is pinned, in page units.
 *
 * Unclamped, `progress` would change for *every* slide on *every* scroll
 * frame — it is one continuous, carousel-wide position, so a step from page 4
 * to page 5 shifts the number for slide 0 exactly as much as it does for
 * slide 5. Pinning it once a slide is more than a page away keeps its
 * subscription — and therefore its re-renders — scoped to the slides actually
 * near the viewport, which is what makes `useCarouselSlide` cheap to use
 * across a long deck.
 */
const PROGRESS_CLAMP = 1;

/** Raw numbers a {@link SlideStore} derives every slide's state from. */
export interface SlideStoreSnapshot {
	/** Current page. */
	page: number;
	/** Slides per page. */
	visibleSlides: number;
	/** Continuous position in page units — see {@link CarouselProgressEvent.absoluteProgress}. */
	absoluteProgress: number;
	/** Whether `peek` is on, so a neighbouring slide is ever partly visible. */
	hasPeek: boolean;
}

/** What {@link useSlideStore} hands back — a tiny external store, one per `Carousel`. */
export interface SlideStore {
	/** Feed it the latest numbers. Notifies every subscriber. */
	update: (snapshot: SlideStoreSnapshot) => void;
	/** `useSyncExternalStore`'s `subscribe`. */
	subscribe: (listener: () => void) => () => void;
	/**
	 * `useSyncExternalStore`'s `getSnapshot`, closed over one slide's index.
	 *
	 * Returns the *same object* across calls when that slide's derived state has
	 * not actually changed, which is what lets `useSyncExternalStore` skip a
	 * re-render for a slide whose `isActive` and `isVisible` did not flip —
	 * `progress` is continuous, so it still re-renders on every scroll frame,
	 * but only for the slides a component actually asked about.
	 */
	getDerivedForIndex: (index: number) => CarouselSlideState;
}

const initialSnapshot: SlideStoreSnapshot = {
	page: 0,
	visibleSlides: 1,
	absoluteProgress: 0,
	hasPeek: false,
};

function computeDerived(
	index: number,
	snapshot: SlideStoreSnapshot,
): CarouselSlideState {
	const { page, visibleSlides, absoluteProgress, hasPeek } = snapshot;
	const start = page * visibleSlides;
	const end = start + visibleSlides;
	const isActive = index >= start && index < end;
	const isVisible = hasPeek ? index >= start - 1 && index < end + 1 : isActive;
	const slidePage = visibleSlides > 0 ? Math.floor(index / visibleSlides) : 0;
	const progress = clamp(
		absoluteProgress - slidePage,
		-PROGRESS_CLAMP,
		PROGRESS_CLAMP,
	);
	return { index, isActive, isVisible, progress };
}

const isSameSlideState = (a: CarouselSlideState, b: CarouselSlideState) =>
	a.isActive === b.isActive &&
	a.isVisible === b.isVisible &&
	a.progress === b.progress;

/** The store's mutable internals, held in a `ref` — the sanctioned place to mutate across renders. */
interface SlideStoreState {
	snapshot: SlideStoreSnapshot;
	cache: Map<number, CarouselSlideState>;
	listeners: Set<() => void>;
}

/**
 * A per-`Carousel` store that lets {@link useCarouselSlide} subscribe to one
 * slide's derived state without going through React context or state — which
 * would re-render every slide on every scroll frame, exactly what
 * `trackActiveSlides` documents as too expensive to do by default.
 *
 * Kept stable for the component's lifetime, so the store's own identity never
 * forces a re-render; only `getDerivedForIndex`'s return value does, and only
 * for the index a subscriber actually asked about.
 */
export function useSlideStore(): SlideStore {
	const stateRef = useRef<SlideStoreState>(undefined);
	stateRef.current ??= {
		snapshot: initialSnapshot,
		cache: new Map(),
		listeners: new Set(),
	};

	return useMemo(() => {
		const state = stateRef.current as SlideStoreState;

		return {
			update(next: SlideStoreSnapshot) {
				const { snapshot } = state;
				if (
					next.page === snapshot.page &&
					next.visibleSlides === snapshot.visibleSlides &&
					next.absoluteProgress === snapshot.absoluteProgress &&
					next.hasPeek === snapshot.hasPeek
				) {
					return;
				}
				state.snapshot = next;
				for (const listener of state.listeners) {
					listener();
				}
			},
			subscribe(listener: () => void) {
				state.listeners.add(listener);
				return () => {
					state.listeners.delete(listener);
				};
			},
			getDerivedForIndex(index: number) {
				const next = computeDerived(index, state.snapshot);
				const cached = state.cache.get(index);
				if (cached && isSameSlideState(cached, next)) {
					return cached;
				}
				state.cache.set(index, next);
				return next;
			},
		};
	}, []);
}
