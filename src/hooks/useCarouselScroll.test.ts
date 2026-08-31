import { act, renderHook } from '@testing-library/react-native';
import { createRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { CarouselPageChangeSource } from '../types';
import { computeGeometry, type GeometryInput } from '../utils/geometry';
import {
  type CarouselScroller,
  type UseCarouselScrollOptions,
  useCarouselScroll,
} from './useCarouselScroll';

const geometryOf = (overrides: Partial<GeometryInput> = {}) =>
  computeGeometry({
    containerWidth: 300,
    slideCount: 5,
    visibleSlides: 1,
    peek: 0,
    spacing: 0,
    infinite: false,
    ...overrides,
  });

/** A scroll event carrying only the field the bridge actually reads. */
const scrollEvent = (x: number) =>
  ({
    nativeEvent: { contentOffset: { x, y: 0 } },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

interface Harness {
  scroller: { scrollTo: jest.Mock };
  commitPage: jest.Mock<boolean, [number, CarouselPageChangeSource]>;
  pageRef: { current: number };
}

const setup = async (options: Partial<UseCarouselScrollOptions> = {}) => {
  const scroller: Harness['scroller'] = { scrollTo: jest.fn() };
  const pageRef = createRef<number>() as { current: number };
  pageRef.current = options.page ?? 0;

  // Mirrors the real hook's contract: clamped, fires once, updates the ref.
  const commitPage = jest.fn((next: number, _source: CarouselPageChangeSource) => {
    if (next === pageRef.current) {
      return false;
    }
    pageRef.current = next;
    return true;
  }) as Harness['commitPage'];

  const initialProps: UseCarouselScrollOptions = {
    geometry: geometryOf(),
    page: 0,
    pageRef,
    commitPage,
    rtl: false,
    reducedMotion: false,
    ...options,
  };

  const view = await renderHook((props: UseCarouselScrollOptions) => useCarouselScroll(props), {
    initialProps,
  });

  await act(async () => {
    view.result.current.attachScroller(scroller as unknown as CarouselScroller);
  });
  scroller.scrollTo.mockClear();
  commitPage.mockClear();

  return { ...view, scroller, commitPage, pageRef, initialProps };
};

const lastScrollX = (scroller: Harness['scroller']) =>
  scroller.scrollTo.mock.calls.at(-1)?.[0] as { x: number; animated: boolean } | undefined;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('applyTarget', () => {
  it('commits the page and scrolls to the unit', async () => {
    const { result, scroller, commitPage } = await setup();

    await act(async () => {
      result.current.applyTarget({ page: 2, unit: 2 }, true, 'pagination');
    });

    expect(commitPage).toHaveBeenCalledWith(2, 'pagination');
    expect(lastScrollX(scroller)).toEqual({ x: 600, animated: true });
  });

  it('refuses to animate when the user asked for reduced motion', async () => {
    const { result, scroller } = await setup({ reducedMotion: true });

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, true, 'pagination');
    });

    expect(lastScrollX(scroller)?.animated).toBe(false);
  });

  it('mirrors the offset for a right-to-left layout', async () => {
    const { result, scroller } = await setup({ rtl: true });

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, false, 'pagination');
    });

    // Logical 300 against a maxScroll of 1200 is physical 900.
    expect(lastScrollX(scroller)?.x).toBe(900);
  });

  it('ignores scroll events for pages it is merely passing through', async () => {
    const { result, commitPage } = await setup();

    await act(async () => {
      result.current.applyTarget({ page: 3, unit: 3 }, true, 'pagination');
    });
    commitPage.mockClear();

    // Frames emitted while the animated scroll travels over pages 1 and 2.
    await act(async () => {
      result.current.onScroll(scrollEvent(300));
      result.current.onScroll(scrollEvent(600));
    });

    expect(commitPage).not.toHaveBeenCalled();
  });
});

describe('onScroll', () => {
  it('commits the page the user has dragged to', async () => {
    const { result, commitPage } = await setup();

    await act(async () => {
      result.current.onScroll(scrollEvent(610));
    });

    expect(commitPage).toHaveBeenCalledWith(2, 'drag');
  });

  it('reads mirrored offsets back for a right-to-left layout', async () => {
    const { result, commitPage } = await setup({ rtl: true });

    // Physical 900 is logical 300, which is page 1.
    await act(async () => {
      result.current.onScroll(scrollEvent(900));
    });

    expect(commitPage).toHaveBeenCalledWith(1, 'drag');
  });

  it('does nothing before the first layout pass', async () => {
    const { result, commitPage } = await setup({
      geometry: geometryOf({ containerWidth: 0 }),
    });

    await act(async () => {
      result.current.onScroll(scrollEvent(600));
    });

    expect(commitPage).not.toHaveBeenCalled();
  });
});

describe('settling', () => {
  it('commits the resting page when momentum ends', async () => {
    const { result, commitPage } = await setup();

    await act(async () => {
      result.current.onMomentumScrollEnd(scrollEvent(900));
    });

    expect(commitPage).toHaveBeenCalledWith(3, 'drag');
  });

  it('settles a slow release that produces no momentum', async () => {
    const { result, commitPage } = await setup();

    // Lifting the finger only schedules the settle — nothing is committed yet.
    await act(async () => {
      result.current.onScrollEndDrag(scrollEvent(300));
    });
    expect(commitPage).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(commitPage).toHaveBeenCalledWith(1, 'drag');
  });

  it('lets momentum cancel the drag-release timer', async () => {
    const { result, scroller } = await setup();

    await act(async () => {
      result.current.onScrollEndDrag(scrollEvent(150));
      result.current.onMomentumScrollBegin();
      jest.advanceTimersByTime(200);
    });

    // The interrupted timer must not have re-anchored anything mid-flight.
    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('backstops a programmatic scroll whose momentum callback never arrives', async () => {
    const { result, commitPage } = await setup();

    await act(async () => {
      result.current.applyTarget({ page: 2, unit: 2 }, true, 'pagination');
    });
    commitPage.mockClear();

    // iOS does not reliably report momentum end after an animated scrollTo.
    await act(async () => {
      result.current.onScroll(scrollEvent(600));
      jest.advanceTimersByTime(700);
    });

    // Still page 2, but the bridge is no longer stuck in programmatic mode.
    await act(async () => {
      result.current.onScroll(scrollEvent(900));
    });
    expect(commitPage).toHaveBeenCalledWith(3, 'drag');
  });

  it('hands control back to a finger that interrupts a programmatic scroll', async () => {
    const { result, commitPage } = await setup();

    await act(async () => {
      result.current.applyTarget({ page: 4, unit: 4 }, true, 'pagination');
    });
    commitPage.mockClear();

    await act(async () => {
      result.current.onScrollBeginDrag();
      result.current.onScroll(scrollEvent(0));
    });

    expect(commitPage).toHaveBeenCalledWith(0, 'drag');
  });
});

describe('infinite clone handling', () => {
  const infiniteGeometry = geometryOf({
    slideCount: 6,
    visibleSlides: 2,
    infinite: true,
  });

  it('hops off the trailing clone onto the real first page', async () => {
    const { result, scroller, commitPage } = await setup({
      geometry: infiniteGeometry,
      page: 2,
    });

    // Unit 4 is the copy of page 0 rendered after the last real page.
    await act(async () => {
      result.current.onMomentumScrollEnd(scrollEvent(1200));
    });

    expect(commitPage).toHaveBeenCalledWith(0, 'drag');
    // Real page 0 lives at unit 1, past the leading clone.
    expect(lastScrollX(scroller)).toEqual({ x: 300, animated: false });
  });

  it('hops off the leading clone onto the real last page', async () => {
    const { result, scroller, commitPage } = await setup({
      geometry: infiniteGeometry,
      page: 0,
    });

    await act(async () => {
      result.current.onMomentumScrollEnd(scrollEvent(0));
    });

    expect(commitPage).toHaveBeenCalledWith(2, 'drag');
    expect(lastScrollX(scroller)).toEqual({ x: 900, animated: false });
  });

  it('leaves a landing on a real page alone', async () => {
    const { result, scroller } = await setup({
      geometry: infiniteGeometry,
      page: 0,
    });

    await act(async () => {
      result.current.onMomentumScrollEnd(scrollEvent(600));
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });
});

describe('re-anchoring', () => {
  it('re-finds the current page when the layout changes', async () => {
    const { scroller, rerender, initialProps, pageRef } = await setup();
    pageRef.current = 2;

    await act(async () => {
      await rerender({
        ...initialProps,
        page: 2,
        geometry: geometryOf({ containerWidth: 400 }),
      });
    });

    // Page 2 now sits at 800, not 600 — the old pixel offset is meaningless.
    expect(lastScrollX(scroller)).toEqual({ x: 800, animated: false });
  });

  it('follows a controlled page prop', async () => {
    const { scroller, rerender, initialProps } = await setup();

    await act(async () => {
      await rerender({ ...initialProps, page: 3 });
    });

    expect(lastScrollX(scroller)).toEqual({ x: 900, animated: true });
  });

  it('does not re-scroll to a page it moved to itself', async () => {
    const { result, scroller, rerender, initialProps } = await setup();

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, true, 'pagination');
    });
    scroller.scrollTo.mockClear();

    // The parent echoes the reported page back — the carousel is already there.
    await act(async () => {
      await rerender({ ...initialProps, page: 1 });
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('does not undo clone travel when the page prop catches up', async () => {
    const infinite = geometryOf({
      slideCount: 6,
      visibleSlides: 2,
      infinite: true,
    });
    const { result, scroller, rerender, initialProps } = await setup({
      geometry: infinite,
      page: 2,
    });

    // Travel forward through the trailing clone to reach page 0.
    await act(async () => {
      result.current.applyTarget({ page: 0, unit: 4 }, true, 'pagination');
    });
    expect(lastScrollX(scroller)?.x).toBe(1200);
    scroller.scrollTo.mockClear();

    await act(async () => {
      await rerender({ ...initialProps, geometry: infinite, page: 0 });
    });

    // Snapping back to unit 1 here would kill the seamless motion mid-scroll.
    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });
});

describe('onContentSizeChange', () => {
  it('anchors the initial page once the list finally has content', async () => {
    const { result, scroller, pageRef } = await setup();
    pageRef.current = 2;

    await act(async () => {
      result.current.onContentSizeChange();
    });

    expect(lastScrollX(scroller)).toEqual({ x: 600, animated: false });
  });

  it('never yanks the track after the user has taken over', async () => {
    const { result, scroller, pageRef } = await setup();
    pageRef.current = 2;

    await act(async () => {
      result.current.onScrollBeginDrag();
    });
    scroller.scrollTo.mockClear();

    await act(async () => {
      result.current.onContentSizeChange();
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('does nothing when the track is already where it belongs', async () => {
    const { result, scroller } = await setup();

    await act(async () => {
      result.current.onScroll(scrollEvent(0));
      result.current.onContentSizeChange();
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('re-issues a move the content resized under, instead of re-anchoring', async () => {
    const { result, scroller } = await setup();

    // A long animated move — the wrap from the first page to the last.
    await act(async () => {
      result.current.applyTarget({ page: 4, unit: 4 }, true, 'pagination');
    });
    expect(lastScrollX(scroller)).toEqual({ x: 1200, animated: true });
    scroller.scrollTo.mockClear();

    // Halfway there, the virtualized list mounts the slides being travelled
    // towards and the content resizes, which cuts a browser's smooth scroll
    // short. The move has to be re-issued to its own target: re-anchoring to
    // where the track has *reached* is how the wrap used to land early.
    await act(async () => {
      result.current.onScroll(scrollEvent(600));
      result.current.onContentSizeChange();
    });

    expect(lastScrollX(scroller)).toEqual({ x: 1200, animated: true });
  });
});

describe('scroller shapes', () => {
  it('drives a FlatList through scrollToOffset', async () => {
    const scrollToOffset = jest.fn();
    const pageRef = { current: 0 };
    const view = await renderHook((props: UseCarouselScrollOptions) => useCarouselScroll(props), {
      initialProps: {
        geometry: geometryOf(),
        page: 0,
        pageRef,
        commitPage: () => true,
        rtl: false,
        reducedMotion: false,
      } satisfies UseCarouselScrollOptions,
    });

    await act(async () => {
      view.result.current.attachScroller({ scrollToOffset });
      view.result.current.applyTarget({ page: 1, unit: 1 }, false, 'pagination');
    });

    expect(scrollToOffset).toHaveBeenCalledWith({
      offset: 300,
      animated: false,
    });
  });

  it('survives having no scroller attached at all', async () => {
    const pageRef = { current: 0 };
    const view = await renderHook((props: UseCarouselScrollOptions) => useCarouselScroll(props), {
      initialProps: {
        geometry: geometryOf(),
        page: 0,
        pageRef,
        commitPage: () => true,
        rtl: false,
        reducedMotion: false,
      } satisfies UseCarouselScrollOptions,
    });

    await expect(
      act(async () => {
        view.result.current.applyTarget({ page: 1, unit: 1 }, true, 'pagination');
      }),
    ).resolves.not.toThrow();
  });
});

describe('onProgress', () => {
  it('reports the raw position on every scroll frame, even while programmatic', async () => {
    const onProgress = jest.fn();
    const { result } = await setup({ onProgress });

    await act(async () => {
      result.current.applyTarget({ page: 2, unit: 2 }, true, 'pagination');
      result.current.onScroll(scrollEvent(525));
    });

    expect(onProgress).toHaveBeenCalledWith({
      page: 2,
      absoluteProgress: 1.75,
      offset: 525,
    });
  });

  it('does nothing before the first layout pass', async () => {
    const onProgress = jest.fn();
    const { result } = await setup({
      onProgress,
      geometry: geometryOf({ containerWidth: 0 }),
    });

    await act(async () => {
      result.current.onScroll(scrollEvent(100));
    });

    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe('snap lifecycle', () => {
  it('fires onSnapStart once a drag is released, and onSnapEnd once it settles', async () => {
    const onSnapStart = jest.fn();
    const onSnapEnd = jest.fn();
    const { result } = await setup({ onSnapStart, onSnapEnd });

    await act(async () => {
      result.current.onScrollBeginDrag();
    });
    expect(onSnapStart).not.toHaveBeenCalled();

    await act(async () => {
      result.current.onScrollEndDrag(scrollEvent(150));
    });
    expect(onSnapStart).toHaveBeenCalledTimes(1);
    expect(onSnapEnd).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(onSnapEnd).toHaveBeenCalledTimes(1);
  });

  it('fires around a programmatic move, resolved by momentum end', async () => {
    const onSnapStart = jest.fn();
    const onSnapEnd = jest.fn();
    const { result } = await setup({ onSnapStart, onSnapEnd });

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, true, 'next');
    });
    expect(onSnapStart).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.onMomentumScrollEnd(scrollEvent(300));
    });
    expect(onSnapEnd).toHaveBeenCalledTimes(1);
  });

  it('falls back to the 600ms backstop when momentum never arrives', async () => {
    const onSnapEnd = jest.fn();
    const { result } = await setup({ onSnapEnd });

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, true, 'next');
      jest.advanceTimersByTime(600);
    });

    expect(onSnapEnd).toHaveBeenCalledTimes(1);
  });

  it('does not fire onSnapStart twice for a retarget before the first settles', async () => {
    const onSnapStart = jest.fn();
    const { result } = await setup({ onSnapStart });

    await act(async () => {
      result.current.applyTarget({ page: 1, unit: 1 }, true, 'next');
      result.current.applyTarget({ page: 2, unit: 2 }, true, 'next');
    });

    expect(onSnapStart).toHaveBeenCalledTimes(1);
  });
});
