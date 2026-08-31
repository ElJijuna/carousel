import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { ResponsiveValue } from '../types';
import { computeGeometry, type Geometry } from '../utils/geometry';
import { resolveResponsive } from '../utils/responsive';

/** Inputs to {@link useCarouselMetrics}. */
export interface UseCarouselMetricsOptions {
  /** How many slides the consumer supplied. */
  slideCount: number;
  /** Slides per page, possibly a breakpoint map. */
  visibleSlides?: ResponsiveValue<number>;
  /** Peek in dp, possibly a breakpoint map. */
  peek?: ResponsiveValue<number>;
  /** Gap between slides in dp. */
  spacing?: number;
  /** Whether seamless wrapping is on. */
  infinite?: boolean;
}

/** What {@link useCarouselMetrics} hands back. */
export interface CarouselMetrics {
  /** Every derived layout number. */
  geometry: Geometry;
  /** Measured container width in dp; `0` until the first layout pass. */
  containerWidth: number;
  /** Attach to the carousel's outer `View`. */
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Measure the carousel and derive its layout.
 *
 * React Native has no media queries, so responsive props resolve against the
 * width this hook measures — the carousel's own, not the window's. A carousel
 * in a split view therefore adapts to the space it was handed.
 */
export function useCarouselMetrics({
  slideCount,
  visibleSlides,
  peek,
  spacing = 0,
  infinite = false,
}: UseCarouselMetricsOptions): CarouselMetrics {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    // Only commit real changes: `onLayout` fires on every re-layout, and a
    // setState with an identical width would re-render the whole slide list.
    setContainerWidth((previous) => (Math.abs(previous - width) < 0.5 ? previous : width));
  }, []);

  const resolvedVisible = resolveResponsive(visibleSlides, containerWidth, 1);
  const resolvedPeek = resolveResponsive(peek, containerWidth, 0);

  const geometry = useMemo(
    () =>
      computeGeometry({
        containerWidth,
        slideCount,
        visibleSlides: resolvedVisible,
        peek: resolvedPeek,
        spacing,
        infinite,
      }),
    [containerWidth, slideCount, resolvedVisible, resolvedPeek, spacing, infinite],
  );

  return { geometry, containerWidth, onLayout };
}
