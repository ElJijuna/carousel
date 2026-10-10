import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef, useState } from 'react';
import { Animated, Text } from 'react-native';

import { Carousel } from './Carousel';
import { useCarousel } from './CarouselContext';
import { layoutCarousel } from './testing';
import type {
  CarouselAutoPlayState,
  CarouselDotSlotProps,
  CarouselHandle,
  CarouselPaginationSlotProps,
} from './types';

const contextClocks: CarouselAutoPlayState[] = [];
function ClockPagination({ autoPlayState }: CarouselPaginationSlotProps) {
  const carousel = useCarousel();
  expect(autoPlayState).toBe(carousel.autoPlayState);
  contextClocks.push(carousel.autoPlayState);
  return null;
}
function latestClock() {
  const clock = contextClocks.at(-1);
  if (!clock) {
    throw new Error('The clock consumer has not rendered');
  }
  return clock;
}
beforeEach(() => {
  jest.useFakeTimers();
  contextClocks.length = 0;
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
const advance = async (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

it('shares one stable clock across context and slots without per-frame carousel renders', async () => {
  const item = jest.fn(({ item: label }: { item: string }) => <Text>{label}</Text>);
  const dot = jest.fn((_props: CarouselDotSlotProps) => null);
  const ref = createRef<CarouselHandle>();
  const props = {
    autoPlay: true,
    interval: 1000,
    testID: 'c',
    ref,
    data: ['A', 'B'],
    renderItem: item,
  };
  const view = await render(<Carousel {...props} components={{ Pagination: ClockPagination }} />);
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  const { progress } = latestClock();
  const renders = contextClocks.length;
  item.mockClear();
  await advance(400);
  expect(item).not.toHaveBeenCalled();
  expect(contextClocks).toHaveLength(renders);
  await view.rerender(<Carousel {...props} components={{ Dot: dot }} />);
  expect(dot.mock.calls[0]?.[0].autoPlayState?.progress).toBe(progress);
  dot.mockClear();
  item.mockClear();
  await advance(200);
  expect(dot).not.toHaveBeenCalled();
  expect(item).not.toHaveBeenCalled();
});

it.each(['classic', 'card'] as const)(
  'starts a fresh clock after the %s transition ends',
  async (mode) => {
    const { timing } = Animated;
    jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
      if (!config.useNativeDriver) {
        return timing(value, config);
      }
      let timer: ReturnType<typeof setTimeout>;
      return {
        start: (callback) => {
          timer = setTimeout(() => {
            if (value instanceof Animated.Value) {
              value.setValue(1);
            }
            callback?.({ finished: true });
          }, 320);
        },
        stop: () => clearTimeout(timer),
        reset: () => clearTimeout(timer),
      };
    });
    const ref = createRef<CarouselHandle>();
    await render(
      <Carousel
        mode={mode}
        testID="c"
        ref={ref}
        autoPlay
        interval={1000}
        components={{ Pagination: ClockPagination }}
      >
        <Text>A</Text>
        <Text>B</Text>
        <Text>C</Text>
      </Carousel>,
    );
    await layoutCarousel(screen.getByTestId('c'), { width: 300 });
    const values: number[] = [];
    const { progress } = latestClock();
    const id = progress.addListener(({ value }) => values.push(value));
    await advance(1000);
    expect(ref.current?.page).toBe(1);
    expect(latestClock().isPlaying).toBe(false);
    expect(values.at(-1)).toBe(0);
    await advance(200);
    expect(values.at(-1)).toBe(0);
    if (mode === 'classic') {
      await fireEvent(screen.getByTestId('c-track'), 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: 300, y: 0 } },
      });
    } else {
      await advance(120);
    }
    expect(latestClock().isPlaying).toBe(true);
    await advance(999);
    expect(ref.current?.page).toBe(1);
    await advance(1);
    expect(ref.current?.page).toBe(2);
    progress.removeListener(id);
  },
);

it('resumes a cancelled scroll drag with the remaining time', async () => {
  const ref = createRef<CarouselHandle>();
  await render(
    <Carousel
      testID="c"
      ref={ref}
      autoPlay
      interval={1000}
      components={{ Pagination: ClockPagination }}
    >
      <Text>A</Text>
      <Text>B</Text>
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await advance(200);
  await fireEvent(screen.getByTestId('c-track'), 'scrollBeginDrag');
  await advance(500);
  await fireEvent(screen.getByTestId('c-track'), 'scrollEndDrag', {
    nativeEvent: { contentOffset: { x: 0, y: 0 } },
  });
  expect(latestClock().isPlaying).toBe(false);
  await advance(120);
  await advance(799);
  expect(ref.current?.page).toBe(0);
  await advance(1);
  expect(ref.current?.page).toBe(1);
});

it('waits for an external controlled page transition', async () => {
  const view = await render(
    <Carousel
      testID="c"
      autoPlay
      interval={1000}
      page={0}
      components={{ Pagination: ClockPagination }}
    >
      <Text>A</Text>
      <Text>B</Text>
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await advance(400);
  await view.rerender(
    <Carousel
      testID="c"
      autoPlay
      interval={1000}
      page={1}
      components={{ Pagination: ClockPagination }}
    >
      <Text>A</Text>
      <Text>B</Text>
    </Carousel>,
  );
  expect(latestClock().isPlaying).toBe(false);
  await fireEvent(screen.getByTestId('c-track'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: 300, y: 0 } },
  });
  expect(latestClock().isPlaying).toBe(true);
});

it.each(['classic', 'card'] as const)(
  'starts immediately after nonanimated controlled navigation in %s',
  async (mode) => {
    const ref = createRef<CarouselHandle>();
    function Controlled() {
      const [page, setPage] = useState(0);
      return (
        <Carousel
          mode={mode}
          ref={ref}
          testID="c"
          autoPlay
          interval={1000}
          page={page}
          onPageChanged={setPage}
          components={{ Pagination: ClockPagination }}
        >
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </Carousel>
      );
    }
    await render(<Controlled />);
    await layoutCarousel(screen.getByTestId('c'), { width: 300 });
    await advance(400);
    await act(async () => {
      ref.current?.next({ animated: false });
    });
    expect(latestClock().isPlaying).toBe(true);
    expect(ref.current?.page).toBe(1);
    await advance(999);
    expect(ref.current?.page).toBe(1);
    await advance(1);
    expect(ref.current?.page).toBe(2);
  },
);

it.each(['classic', 'card'] as const)(
  'reports one autoplay request when a controlled owner rejects it in %s',
  async (mode) => {
    const changed = jest.fn();
    await render(
      <Carousel
        mode={mode}
        testID="c"
        autoPlay
        interval={1000}
        page={0}
        onPageChanged={changed}
        components={{ Pagination: ClockPagination }}
      >
        <Text>A</Text>
        <Text>B</Text>
      </Carousel>,
    );
    await layoutCarousel(screen.getByTestId('c'), { width: 300 });
    await advance(1000);
    if (mode === 'classic') {
      await fireEvent(screen.getByTestId('c-track'), 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: 300, y: 0 } },
      });
    } else {
      await advance(320);
    }
    expect(changed).toHaveBeenCalledTimes(1);
  },
);
