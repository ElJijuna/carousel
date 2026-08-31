import { act, renderHook } from '@testing-library/react-native';
import type { LayoutChangeEvent } from 'react-native';

import { type UseCarouselMetricsOptions, useCarouselMetrics } from './useCarouselMetrics';

const layoutEvent = (width: number) =>
  ({ nativeEvent: { layout: { width, height: 200, x: 0, y: 0 } } }) as LayoutChangeEvent;

const setup = async (initialProps: UseCarouselMetricsOptions) =>
  renderHook((props: UseCarouselMetricsOptions) => useCarouselMetrics(props), { initialProps });

it('reports a zero-width geometry before the first layout pass', async () => {
  const { result } = await setup({ slideCount: 5 });
  expect(result.current.containerWidth).toBe(0);
  expect(result.current.geometry.slideWidth).toBe(0);
});

it('derives the layout from the measured width', async () => {
  const { result } = await setup({ slideCount: 5, visibleSlides: 2, spacing: 10, peek: 20 });

  await act(async () => {
    result.current.onLayout(layoutEvent(300));
  });

  expect(result.current.containerWidth).toBe(300);
  expect(result.current.geometry.slideWidth).toBe(125);
  expect(result.current.geometry.pageCount).toBe(3);
});

it('resolves responsive props against its own width, not the window', async () => {
  const { result } = await setup({
    slideCount: 9,
    visibleSlides: { base: 3, 700: 2, 400: 1 },
  });

  await act(async () => {
    result.current.onLayout(layoutEvent(360));
  });
  expect(result.current.geometry.visibleSlides).toBe(1);

  await act(async () => {
    result.current.onLayout(layoutEvent(500));
  });
  expect(result.current.geometry.visibleSlides).toBe(2);

  await act(async () => {
    result.current.onLayout(layoutEvent(900));
  });
  expect(result.current.geometry.visibleSlides).toBe(3);
});

it('ignores a re-layout at the same width', async () => {
  const { result } = await setup({ slideCount: 3 });

  await act(async () => {
    result.current.onLayout(layoutEvent(300));
  });
  const first = result.current.geometry;

  await act(async () => {
    // onLayout fires on every re-layout; committing this would re-render every
    // slide for nothing.
    result.current.onLayout(layoutEvent(300.2));
  });

  expect(result.current.geometry).toBe(first);
});

it('keeps the geometry object stable while its inputs do not change', async () => {
  const { result, rerender } = await setup({ slideCount: 3, spacing: 8 });

  await act(async () => {
    result.current.onLayout(layoutEvent(300));
  });
  const first = result.current.geometry;

  await act(async () => {
    await rerender({ slideCount: 3, spacing: 8 });
  });

  // Identity matters: the scroll bridge re-anchors the track whenever the
  // geometry changes, so a fresh object every render would fight the user.
  expect(result.current.geometry).toBe(first);
});
