import { act, render, screen } from '@testing-library/react-native';
import { createRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  I18nManager,
  PanResponder,
  type PanResponderCallbacks,
  type PanResponderGestureState,
  StyleSheet,
  Text,
} from 'react-native';

import { Carousel } from './Carousel';
import { layoutCarousel } from './testing';
import type { CarouselHandle } from './types';

const items = ['Summary', 'Chart', 'Outlook'];
const ref = createRef<CarouselHandle>();
const gesture = (dx: number, dy = 0): PanResponderGestureState => ({
  dx,
  dy,
  stateID: 1,
  moveX: dx,
  moveY: dy,
  x0: 0,
  y0: 0,
  vx: 0,
  vy: 0,
  numberActiveTouches: 1,
});
let pan: PanResponderCallbacks;

const setup = async (props: Partial<React.ComponentProps<typeof Carousel>> = {}) => {
  await render(
    <Carousel
      ref={ref}
      mode="card"
      testID="c"
      data={items}
      renderItem={({ item }) => <Text>{String(item)}</Text>}
      {...props}
    />,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300, height: 200 });
};
const finish = async () =>
  act(async () => {
    jest.advanceTimersByTime(400);
  });
const swipe = async (dx: number, cancelled = false) => {
  // PanResponder invokes these only after recognising a horizontal gesture.
  await act(async () => {
    pan.onPanResponderGrant?.({} as never, gesture(0));
  });
  await act(async () => {
    pan.onPanResponderMove?.({} as never, gesture(dx));
  });
  await act(async () => {
    const release = cancelled ? pan.onPanResponderTerminate : pan.onPanResponderRelease;
    release?.({} as never, gesture(dx));
  });
  await finish();
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const original = PanResponder.create;
  jest.spyOn(PanResponder, 'create').mockImplementation((callbacks) => {
    pan = callbacks;
    return original(callbacks);
  });
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    let timer: ReturnType<typeof setTimeout>;
    return {
      start: (callback) => {
        timer = setTimeout(() => {
          if (value instanceof Animated.Value) {
            value.setValue(Number(config.toValue));
          }
          callback?.({ finished: true });
        }, 320);
      },
      stop: () => clearTimeout(timer),
      reset: () => clearTimeout(timer),
    };
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it('resolves card layout to one slide and navigates through the ref', async () => {
  const changed = jest.fn();
  const start = jest.fn();
  const end = jest.fn();
  await setup({
    visibleSlides: 3,
    peek: 20,
    spacing: 12,
    onPageChanged: changed,
    onSnapStart: start,
    onSnapEnd: end,
  });
  expect(ref.current?.pageCount).toBe(3);
  await act(async () => {
    ref.current?.goTo(2);
  });
  expect(ref.current?.page).toBe(2);
  await finish();
  expect(screen.getByText('Outlook')).toBeTruthy();
  expect(screen.queryByText('Summary')).toBeNull();
  expect(changed).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledWith(2, expect.objectContaining({ source: 'imperative' }));
  expect(start).toHaveBeenCalledTimes(1);
  expect(end).toHaveBeenCalledTimes(1);
});

it('accepts a 25% drag and cancels short or terminated drags', async () => {
  const changed = jest.fn();
  const dragStart = jest.fn();
  const dragEnd = jest.fn();
  await setup({ onPageChanged: changed, onDragStart: dragStart, onDragEnd: dragEnd });
  await swipe(-60);
  expect(ref.current?.page).toBe(0);
  await swipe(-75);
  expect(ref.current?.page).toBe(1);
  await swipe(-120, true);
  expect(ref.current?.page).toBe(1);
  await swipe(90);
  expect(ref.current?.page).toBe(0);
  expect(changed).toHaveBeenCalledTimes(2);
  expect(dragStart).toHaveBeenCalledTimes(4);
  expect(dragEnd).toHaveBeenCalledTimes(4);
});

it.each([false, true])('wraps swipes only with infinite=%s', async (infinite) => {
  await setup({ infinite, defaultPage: 2 });
  await swipe(-100);
  expect(ref.current?.page).toBe(infinite ? 0 : 2);
  if (infinite) {
    await swipe(100);
    expect(ref.current?.page).toBe(2);
    await swipe(-100);
    await swipe(-100);
    expect(ref.current?.page).toBe(1);
  }
});

it('keeps loop wrapping on controls but stops swipes at the edge', async () => {
  await setup({ loop: true, defaultPage: 2 });
  await swipe(-100);
  expect(ref.current?.page).toBe(2);
  await act(async () => {
    ref.current?.next({ animated: false });
  });
  expect(ref.current?.page).toBe(0);
  expect(screen.getByText('Summary')).toBeTruthy();
});

it('mirrors swipe direction in RTL', async () => {
  const previous = I18nManager.isRTL;
  I18nManager.isRTL = true;
  try {
    await setup();
    await swipe(90);
    expect(ref.current?.page).toBe(1);
    await swipe(-90);
    expect(ref.current?.page).toBe(0);
  } finally {
    I18nManager.isRTL = previous;
  }
});

it.each([{ data: [] }, { data: ['Only card'] }])(
  'handles decks with no neighbour: %j',
  async ({ data }) => {
    const changed = jest.fn();
    await setup({ data, infinite: true, onPageChanged: changed });
    expect(pan.onMoveShouldSetPanResponder?.({} as never, gesture(-100))).toBe(false);
    await act(async () => {
      ref.current?.next();
    });
    expect(changed).not.toHaveBeenCalled();
  },
);

it('uses the controlled page and follows external changes without duplicate events', async () => {
  const changed = jest.fn();
  function Controlled() {
    const [page, setPage] = useState(0);
    return (
      <Carousel
        ref={ref}
        testID="c"
        mode="card"
        page={page}
        onPageChanged={(next, event) => {
          changed(next, event);
          setPage(next);
        }}
      >
        {items.map((item) => (
          <Text key={item}>{item}</Text>
        ))}
      </Carousel>
    );
  }
  await render(<Controlled />);
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await swipe(-90);
  expect(screen.getByText('Chart')).toBeTruthy();
  expect(changed).toHaveBeenCalledTimes(1);
  await act(async () => {
    ref.current?.next({ animated: false });
  });
  expect(screen.getByText('Outlook')).toBeTruthy();
  // The first swipe animated; the accepted immediate move adds no animation.
  expect(Animated.timing).toHaveBeenCalledTimes(1);
});

it('returns to the controlled page when its owner rejects a move', async () => {
  await setup({ page: 0 });
  await swipe(-90);
  expect(screen.getByText('Summary')).toBeTruthy();
  expect(screen.queryByText('Chart')).toBeNull();
});

it('follows an external page jump with one flip and no change notification', async () => {
  const changed = jest.fn();
  const view = await render(
    <Carousel mode="card" testID="c" page={0} onPageChanged={changed}>
      {items.map((item) => (
        <Text key={item}>{item}</Text>
      ))}
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await view.rerender(
    <Carousel mode="card" testID="c" page={2} onPageChanged={changed}>
      {items.map((item) => (
        <Text key={item}>{item}</Text>
      ))}
    </Carousel>,
  );
  await finish();
  expect(screen.getByText('Outlook')).toBeTruthy();
  expect(Animated.timing).toHaveBeenCalledTimes(1);
  expect(changed).not.toHaveBeenCalled();
});

it('handles direction reversal and blocks new gestures while settling', async () => {
  await setup({ infinite: true });
  await act(async () => {
    pan.onPanResponderGrant?.({} as never, gesture(0));
  });
  await act(async () => {
    pan.onPanResponderMove?.({} as never, gesture(-200));
  });
  expect(screen.getByTestId('c-track-face-1').props.pointerEvents).toBe('auto');
  await act(async () => {
    pan.onPanResponderMove?.({} as never, gesture(100));
  });
  await act(async () => {
    pan.onPanResponderRelease?.({} as never, gesture(100));
  });
  expect(pan.onMoveShouldSetPanResponder?.({} as never, gesture(-100))).toBe(false);
  await finish();
  expect(ref.current?.page).toBe(2);
  expect(screen.getByText('Outlook')).toBeTruthy();
});

it('clamps a shrinking deck and cancels pending work on unmount', async () => {
  const view = await render(
    <Carousel
      ref={ref}
      testID="c"
      mode="card"
      defaultPage={2}
      data={items}
      renderItem={({ item }) => <Text>{item}</Text>}
    />,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await view.rerender(
    <Carousel
      ref={ref}
      testID="c"
      mode="card"
      data={['Summary']}
      renderItem={({ item }) => <Text>{item}</Text>}
    />,
  );
  expect(ref.current?.page).toBe(0);
  expect(screen.getByText('Summary')).toBeTruthy();
  await view.unmount();
  await finish();
  expect(ref.current).toBeNull();
});

it('switches without animation for reduced motion', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  await setup();
  await act(async () => {
    ref.current?.next();
  });
  expect(screen.getByText('Chart')).toBeTruthy();
  expect(Animated.timing).not.toHaveBeenCalled();
});

it('autoplay uses the card transition and fires once per page', async () => {
  const changed = jest.fn();
  await setup({ autoPlay: true, interval: 1000, onPageChanged: changed });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  await finish();
  expect(screen.getByText('Chart')).toBeTruthy();
  expect(changed).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ source: 'autoplay', userInitiated: false }),
  );
});

it.each([
  ['forward', -75],
  ['back', 90],
])('keeps the settled face upright when the native angle lags (%s)', async (_, dx) => {
  // The native driver can deliver the final angle after the settled face is committed. A face
  // left at ±180° with a hidden backface makes the whole card disappear.
  let angle: Animated.Value | undefined;
  const timing = jest.mocked(Animated.timing).getMockImplementation();
  jest.mocked(Animated.timing).mockImplementation((value, config) => {
    if (value instanceof Animated.Value) {
      angle = value;
    }
    return timing?.(value, config) as Animated.CompositeAnimation;
  });
  await setup();
  if (dx > 0) {
    await swipe(-75);
  }
  await swipe(dx);
  const settled = screen.getByTestId(`c-track-face-${dx > 0 ? 0 : 1}`);
  await act(async () => {
    angle?.setValue(dx > 0 ? 1 : -1);
  });
  expect(StyleSheet.flatten(settled.props.style).transform).toEqual([
    { perspective: 1000 },
    { rotateY: '0deg' },
  ]);
});

it('hides the incoming face from interaction and accessibility before halfway', async () => {
  await setup();
  await act(async () => {
    pan.onPanResponderGrant?.({} as never, gesture(0));
  });
  await act(async () => {
    pan.onPanResponderMove?.({} as never, gesture(-90));
  });
  const incoming = screen.getByTestId('c-track-face-1', { includeHiddenElements: true });
  expect(incoming.props.pointerEvents).toBe('none');
  expect(incoming.props.accessibilityElementsHidden).toBe(true);
});

it('cancels an in-flight animation when the mode changes', async () => {
  const view = await render(
    <Carousel ref={ref} mode="card" testID="c">
      {items.map((item) => (
        <Text key={item}>{item}</Text>
      ))}
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  await act(async () => {
    ref.current?.next();
  });
  await view.rerender(
    <Carousel ref={ref} mode="classic" testID="c">
      {items.map((item) => (
        <Text key={item}>{item}</Text>
      ))}
    </Carousel>,
  );
  await finish();
  expect(screen.getByTestId('c-track').props.horizontal).toBe(true);
  expect(ref.current?.page).toBe(1);
});
