import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { CarouselPageChangeSource, CarouselProgressEvent } from '../types';
import {
  type Geometry,
  mirrorOffset,
  type NavigationTarget,
  offsetForPage,
  offsetForUnit,
  pageFromOffset,
} from '../utils/geometry';

/**
 * How long to wait for a programmatic scroll to settle before assuming the
 * momentum callback is not coming. iOS does not reliably fire
 * `onMomentumScrollEnd` after an animated `scrollTo`, and a carousel stuck in
 * "programmatic" mode would stop tracking the user entirely.
 */
const PROGRAMMATIC_SETTLE_MS = 600;

/**
 * How long after the finger lifts to settle when no momentum follows. A slow
 * release produces `onScrollEndDrag` and nothing else, so without this the page
 * would never be committed.
 */
const DRAG_SETTLE_MS = 120;

/**
 * The two scroller shapes the carousel drives. `FlatList` exposes
 * `scrollToOffset`, `ScrollView` exposes `scrollTo`; normalising here is what
 * lets both engines share every hook.
 */
export interface CarouselScroller {
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
}

/** Inputs to {@link useCarouselScroll}. */
export interface UseCarouselScrollOptions {
  /** Current layout numbers. */
  geometry: Geometry;
  /** The page being rendered. */
  page: number;
  /** Live view of the current page, from `useCarouselPage`. */
  pageRef: RefObject<number>;
  /** Commit a page; returns whether it changed. */
  commitPage: (page: number, source: CarouselPageChangeSource) => boolean;
  /** Whether the layout direction is right-to-left. */
  rtl: boolean;
  /** Whether the user asked for reduced motion. */
  reducedMotion: boolean;
  /** Raw scroll position, reported on every frame. Kept in a ref, need not be stable. */
  onProgress?: (event: CarouselProgressEvent) => void;
  /** A settle towards a resting page has begun. Kept in a ref, need not be stable. */
  onSnapStart?: () => void;
  /** The track has come to rest on a page. Kept in a ref, need not be stable. */
  onSnapEnd?: () => void;
}

/** The scroll bridge handed back by {@link useCarouselScroll}. */
export interface CarouselScrollBridge {
  /**
   * Attach to the underlying `ScrollView` or `FlatList`. A stable callback, so
   * the scroller is not detached and re-attached on every render.
   */
  attachScroller: (instance: CarouselScroller | null) => void;
  /** Commit a navigation target and scroll to it. */
  applyTarget: (
    target: NavigationTarget,
    animated: boolean,
    source: CarouselPageChangeSource,
  ) => void;
  /** Scroll handler — attach with `scrollEventThrottle={16}`. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Momentum handlers, which drive the settle. */
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Drag handlers. */
  onScrollBeginDrag: () => void;
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Backstop that anchors the initial page once content exists. */
  onContentSizeChange: () => void;
}

/**
 * Bridge between logical pages and real scroll offsets.
 *
 * The user's finger is the source of truth: the page is read back off actual
 * scroll offsets rather than assumed from the last command, so a flick, a drag
 * and a button press all converge on the same state.
 */
export function useCarouselScroll({
  geometry,
  page,
  pageRef,
  commitPage,
  rtl,
  reducedMotion,
  onProgress,
  onSnapStart,
  onSnapEnd,
}: UseCarouselScrollOptions): CarouselScrollBridge {
  const scrollerRef = useRef<CarouselScroller | null>(null);
  const onProgressRef = useRef(onProgress);
  const onSnapStartRef = useRef(onSnapStart);
  const onSnapEndRef = useRef(onSnapEnd);
  useEffect(() => {
    onProgressRef.current = onProgress;
    onSnapStartRef.current = onSnapStart;
    onSnapEndRef.current = onSnapEnd;
  });
  /** Guards `onSnapStart` / `onSnapEnd` against firing more than once per settle. */
  const snapActiveRef = useRef(false);
  /** The source of the programmatic move currently in flight, for `settle()` to report. */
  const activeSourceRef = useRef<CarouselPageChangeSource>('drag');
  /** Last known offset, in logical (direction-agnostic) coordinates. */
  const currentOffsetRef = useRef(0);
  /** Suppresses page commits for offsets we are merely scrolling *through*. */
  const programmaticRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragSettleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /**
   * The page the carousel itself last moved to. The external-sync effect
   * compares against this so it only ever reacts to a *controlled prop* change,
   * and never undoes the carousel's own clone-page travel.
   */
  const lastAppliedPageRef = useRef(page);
  /** Set once the user touches the track, disabling the initial-anchor fixups. */
  const userScrolledRef = useRef(false);
  /**
   * Where a programmatic scroll is currently travelling, and how. Kept so the
   * move can be re-issued if the content changes size under it mid-flight.
   */
  const programmaticTargetRef = useRef<{
    offset: number;
    animated: boolean;
  } | null>(null);

  useEffect(
    () => () => {
      clearTimeout(programmaticTimerRef.current);
      clearTimeout(dragSettleTimerRef.current);
    },
    [],
  );

  const scrollToLogical = useCallback(
    (logical: number, animated: boolean) => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        return;
      }
      // Mirroring happens here and nowhere else, so every other calculation in
      // the library can stay direction-agnostic.
      const physical = mirrorOffset(logical, geometry, rtl);
      if (typeof scroller.scrollToOffset === 'function') {
        scroller.scrollToOffset({ offset: physical, animated });
      } else if (typeof scroller.scrollTo === 'function') {
        scroller.scrollTo({ x: physical, animated });
      }
    },
    [geometry, rtl],
  );

  /** Fires `onSnapStart` at most once per settle cycle. */
  const beginSnap = useCallback(() => {
    if (snapActiveRef.current) {
      return;
    }
    snapActiveRef.current = true;
    onSnapStartRef.current?.();
  }, []);

  /** Fires `onSnapEnd`, pairing whichever `beginSnap` call started this cycle. */
  const endSnap = useCallback(() => {
    if (!snapActiveRef.current) {
      return;
    }
    snapActiveRef.current = false;
    onSnapEndRef.current?.();
  }, []);

  const settle = useCallback(() => {
    programmaticRef.current = false;
    programmaticTargetRef.current = null;
    clearTimeout(programmaticTimerRef.current);
    clearTimeout(dragSettleTimerRef.current);
    if (geometry.pageStride <= 0) {
      endSnap();
      return;
    }
    const resolved = pageFromOffset(currentOffsetRef.current, geometry);
    commitPage(resolved.page, activeSourceRef.current);
    lastAppliedPageRef.current = resolved.page;
    if (resolved.onClone) {
      // We are parked on a copy. Hop to the real page it duplicates without
      // animation — the pixels are identical, so the jump is invisible, and it
      // is what makes the *next* swipe in the same direction keep going.
      scrollToLogical(offsetForPage(resolved.page, geometry), false);
    }
    endSnap();
  }, [geometry, commitPage, scrollToLogical, endSnap]);

  const applyTarget = useCallback(
    (target: NavigationTarget, animated: boolean, source: CarouselPageChangeSource) => {
      activeSourceRef.current = source;
      beginSnap();
      commitPage(target.page, source);
      lastAppliedPageRef.current = target.page;

      programmaticRef.current = true;
      clearTimeout(programmaticTimerRef.current);
      programmaticTimerRef.current = setTimeout(settle, PROGRAMMATIC_SETTLE_MS);

      const offset = offsetForUnit(target.unit, geometry);
      const withAnimation = animated && !reducedMotion;
      programmaticTargetRef.current = { offset, animated: withAnimation };
      scrollToLogical(offset, withAnimation);
    },
    [commitPage, settle, scrollToLogical, geometry, reducedMotion, beginSnap],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const logical = mirrorOffset(event.nativeEvent.contentOffset.x, geometry, rtl);
      currentOffsetRef.current = logical;

      if (geometry.pageStride > 0 && onProgressRef.current) {
        const unit = logical / geometry.pageStride;
        onProgressRef.current({
          page: pageFromOffset(logical, geometry).page,
          absoluteProgress: unit - geometry.leadUnits,
          offset: logical,
        });
      }

      if (programmaticRef.current || geometry.pageStride <= 0) {
        return;
      }
      // Commit mid-drag so the chrome tracks the finger. `commitPage` filters
      // this down to real transitions, so the per-frame scroll events cost one
      // comparison each rather than a render.
      const { page: next } = pageFromOffset(logical, geometry);
      if (commitPage(next, 'drag')) {
        lastAppliedPageRef.current = next;
      }
    },
    [geometry, rtl, commitPage],
  );

  const onMomentumScrollBegin = useCallback(() => {
    clearTimeout(dragSettleTimerRef.current);
    // Covers a fling with no preceding `onScrollEndDrag` — a mouse-wheel or
    // trackpad scroll on web, which never fires a drag gesture at all.
    beginSnap();
  }, [beginSnap]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentOffsetRef.current = mirrorOffset(event.nativeEvent.contentOffset.x, geometry, rtl);
      settle();
    },
    [geometry, rtl, settle],
  );

  const onScrollBeginDrag = useCallback(() => {
    userScrolledRef.current = true;
    clearTimeout(dragSettleTimerRef.current);
    // A finger beats any programmatic scroll still in flight.
    programmaticRef.current = false;
    clearTimeout(programmaticTimerRef.current);
    activeSourceRef.current = 'drag';
  }, []);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentOffsetRef.current = mirrorOffset(event.nativeEvent.contentOffset.x, geometry, rtl);
      // The finger has let go: the track is now settling towards a page on its
      // own, whether that takes a momentum fling or the short timer below.
      beginSnap();
      // A slow release produces no momentum phase at all, so settle on a short
      // timer that `onMomentumScrollBegin` cancels when momentum does follow.
      clearTimeout(dragSettleTimerRef.current);
      dragSettleTimerRef.current = setTimeout(settle, DRAG_SETTLE_MS);
    },
    [geometry, rtl, settle, beginSnap],
  );

  // Re-anchor whenever the layout changes: every offset moves when the
  // container is resized or `visibleSlides` regroups, so the page the user was
  // looking at has to be re-found rather than left at a stale pixel offset.
  useEffect(() => {
    if (geometry.pageStride <= 0) {
      return;
    }
    lastAppliedPageRef.current = pageRef.current;
    scrollToLogical(offsetForPage(pageRef.current, geometry), false);
  }, [geometry, scrollToLogical, pageRef]);

  // Follow a controlled `page` prop. Skipped for pages the carousel moved to
  // itself, which is what keeps this from cancelling clone-page travel.
  useEffect(() => {
    if (geometry.pageStride <= 0 || page === lastAppliedPageRef.current) {
      return;
    }
    lastAppliedPageRef.current = page;
    const offset = offsetForPage(page, geometry);
    const animated = !reducedMotion;
    // Marked programmatic for the same reasons `applyTarget` marks its own
    // moves. Without it `onScroll` reads this animation's frames as a drag and
    // commits every page it travels over — and a parent feeding
    // `onPageChanged` back into `page`, which is the documented contract,
    // applies those and lands on whichever page the scroll had reached rather
    // than the one it asked for. It also lets `onContentSizeChange` see the
    // move as in flight, so a virtualized list mounting slides underneath it
    // re-issues the scroll instead of cutting it short.
    activeSourceRef.current = 'imperative';
    programmaticRef.current = true;
    programmaticTargetRef.current = { offset, animated };
    clearTimeout(programmaticTimerRef.current);
    programmaticTimerRef.current = setTimeout(settle, PROGRAMMATIC_SETTLE_MS);
    scrollToLogical(offset, animated);
  }, [page, geometry, reducedMotion, scrollToLogical, settle]);

  const onContentSizeChange = useCallback(() => {
    // `FlatList` ignores `scrollToOffset` until it has laid out content, so the
    // first anchor above can silently do nothing. Retry once content exists —
    // but never after the user has taken over.
    if (geometry.pageStride <= 0 || userScrolledRef.current) {
      return;
    }

    // A move already in flight is re-issued rather than re-anchored: in the
    // virtualized mode the list mounts the slides the scroll is travelling
    // towards, and content that resizes under a smooth scroll cuts it short —
    // the snap points then park it on whatever page it had reached, which is
    // how a wrap to the last page used to land two pages early.
    const inFlight = programmaticRef.current ? programmaticTargetRef.current : null;
    const target = inFlight ?? {
      offset: offsetForPage(pageRef.current, geometry),
      animated: false,
    };
    if (Math.abs(currentOffsetRef.current - target.offset) < 1) {
      return;
    }
    scrollToLogical(target.offset, target.animated);
  }, [geometry, scrollToLogical, pageRef]);

  const attachScroller = useCallback((instance: CarouselScroller | null) => {
    scrollerRef.current = instance;
  }, []);

  return {
    attachScroller,
    applyTarget,
    onScroll,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onScrollBeginDrag,
    onScrollEndDrag,
    onContentSizeChange,
  };
}
