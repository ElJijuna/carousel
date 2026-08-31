import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { clamp } from '../utils/geometry';

/** Inputs to {@link useCarouselPage}. */
export interface UseCarouselPageOptions {
  /** Controlled page index. Omit to let the carousel own the state. */
  page?: number;
  /** Starting page when uncontrolled. */
  defaultPage?: number;
  /** Current total, used to clamp both modes into range. */
  pageCount: number;
  /** Notified once per actual change. */
  onPageChanged?: (page: number) => void;
}

/** What {@link useCarouselPage} hands back. */
export interface CarouselPageState {
  /** The page the carousel should render, always inside `[0, pageCount)`. */
  page: number;
  /** Live view of {@link CarouselPageState.page}, for the imperative handle. */
  pageRef: RefObject<number>;
  /**
   * Move to a page. Clamps into range, ignores a move onto the current page,
   * and returns whether anything actually changed.
   */
  commitPage: (next: number) => boolean;
}

/**
 * Own the current page, in either the controlled or the uncontrolled mode.
 *
 * The fire-once rule lives here: a swipe emits a scroll event per frame and
 * navigating past a non-wrapping end clamps back onto the current page, so
 * `onPageChanged` is filtered down to real transitions before the consumer ever
 * sees it.
 *
 * Under a controlled `page` the carousel reports moves but never forces the
 * prop back — feed `onPageChanged` into `page` or the track and the chrome will
 * describe different pages, exactly like a controlled `TextInput` whose
 * `onChangeText` is dropped.
 */
export function useCarouselPage({
  page: controlledPage,
  defaultPage = 0,
  pageCount,
  onPageChanged,
}: UseCarouselPageOptions): CarouselPageState {
  const isControlled = controlledPage !== undefined;

  // Clamped up front, so an out-of-range `defaultPage` cannot strand the
  // carousel on a page with nothing behind it.
  const [internalPage, setInternalPage] = useState(() =>
    clamp(Math.floor(defaultPage) || 0, 0, Math.max(0, pageCount - 1)),
  );

  // Clamping here rather than in an effect means a shrinking `pageCount` — a
  // rotation that drops `visibleSlides` from 3 to 1, say — can never render a
  // page that no longer exists, not even for one frame.
  const page = clamp(isControlled ? controlledPage : internalPage, 0, Math.max(0, pageCount - 1));

  const pageRef = useRef(page);
  const pageCountRef = useRef(pageCount);
  const isControlledRef = useRef(isControlled);
  const onPageChangedRef = useRef(onPageChanged);

  useEffect(() => {
    pageRef.current = page;
    pageCountRef.current = pageCount;
    isControlledRef.current = isControlled;
    onPageChangedRef.current = onPageChanged;
  });

  const commitPage = useCallback((next: number) => {
    const target = clamp(Math.floor(next) || 0, 0, Math.max(0, pageCountRef.current - 1));
    if (target === pageRef.current) {
      return false;
    }
    // Written eagerly so the imperative handle's getter is already right on the
    // line after `next()`, rather than a render later.
    pageRef.current = target;
    if (!isControlledRef.current) {
      setInternalPage(target);
    }
    onPageChangedRef.current?.(target);
    return true;
  }, []);

  return { page, pageRef, commitPage };
}
