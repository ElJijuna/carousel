import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef, memo } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';

import { Carousel } from './Carousel';
import { useCarousel } from './CarouselContext';
import { useCarouselSlide } from './CarouselSlideContext';
import type {
  CarouselArrowSlotProps,
  CarouselDotSlotProps,
  CarouselHandle,
  CarouselPaginationSlotProps,
  CarouselPlayPauseSlotProps,
} from './types';

// ─── Mocked chrome ────────────────────────────────────────────────────────────
// The carousel draws nothing itself, so every assertion below goes through
// stand-ins for the UI a real implementer would supply.

const MockArrow = ({
  direction,
  onPress,
  disabled,
  accessibilityLabel,
}: CarouselArrowSlotProps) => (
  <Pressable
    testID={`arrow-${direction}`}
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled }}
    onPress={disabled ? undefined : onPress}
  >
    <Text>{direction}</Text>
  </Pressable>
);

const MockDot = ({ index, selected, onPress, accessibilityLabel }: CarouselDotSlotProps) => (
  <Pressable
    testID={`dot-${index}`}
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected }}
    onPress={onPress}
  >
    <Text>{selected ? `[${index}]` : `${index}`}</Text>
  </Pressable>
);

const MockPagination = ({ page, pageCount }: CarouselPaginationSlotProps) => (
  <Text testID="fraction">{`${page + 1} / ${pageCount}`}</Text>
);

const MockPlayPause = ({ isPlaying, onPress, accessibilityLabel }: CarouselPlayPauseSlotProps) => (
  <Pressable testID="play-pause" accessibilityLabel={accessibilityLabel} onPress={onPress}>
    <Text>{isPlaying ? 'pause' : 'play'}</Text>
  </Pressable>
);

const slides = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of stand-in slides
    <View key={`s${i}`}>
      <Text>{`slide ${i}`}</Text>
    </View>
  ));

const WIDTH = 300;

/** Give the carousel a width, since nothing lays out in the test renderer. */
const layout = async (testID = 'c', width = WIDTH) => {
  await fireEvent(screen.getByTestId(testID), 'layout', {
    nativeEvent: { layout: { width, height: 200, x: 0, y: 0 } },
  });
};

/** Simulate the track coming to rest at a scroll offset. */
const settleAt = async (x: number, testID = 'c-track') => {
  await fireEvent(screen.getByTestId(testID), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x, y: 0 } },
  });
};

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders children as slides', async () => {
    await render(<Carousel testID="c">{slides(3)}</Carousel>);
    await layout();

    expect(screen.getByText('slide 0')).toBeTruthy();
    expect(screen.getByText('slide 2')).toBeTruthy();
  });

  it('draws no chrome of its own', async () => {
    await render(<Carousel testID="c">{slides(3)}</Carousel>);
    await layout();

    expect(screen.queryByTestId('dot-0')).toBeNull();
    expect(screen.queryByTestId('arrow-next')).toBeNull();
    expect(screen.queryByTestId('play-pause')).toBeNull();
  });

  it('renders one dot per page, not per slide', async () => {
    await render(
      <Carousel testID="c" visibleSlides={2} components={{ Dot: MockDot }}>
        {slides(5)}
      </Carousel>,
    );
    await layout();

    // 5 slides in groups of 2 make 3 pages.
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(3);
  });

  it('resolves a responsive visibleSlides map against its own width', async () => {
    await render(
      <Carousel
        testID="c"
        visibleSlides={{ base: 3, 700: 2, 400: 1 }}
        components={{ Dot: MockDot }}
      >
        {slides(6)}
      </Carousel>,
    );

    await layout('c', 360);
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(6);

    await layout('c', 500);
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(3);

    await layout('c', 900);
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(2);
  });

  it('survives having no slides at all', async () => {
    await render(<Carousel testID="c" components={{ Dot: MockDot }} />);
    await layout();

    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(1);
  });

  it('names itself for assistive technology', async () => {
    await render(
      <Carousel testID="c" accessibilityLabel="Featured products">
        {slides(3)}
      </Carousel>,
    );
    expect(screen.getByLabelText('Featured products')).toBeTruthy();
  });

  it('labels each slide', async () => {
    await render(<Carousel testID="c">{slides(3)}</Carousel>);
    await layout();

    expect(screen.getByLabelText('1 of 3')).toBeTruthy();
    expect(screen.getByLabelText('3 of 3')).toBeTruthy();
  });
});

// ─── Pagination chrome ────────────────────────────────────────────────────────

describe('dots', () => {
  it('marks the current page and moves on press', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" components={{ Dot: MockDot }} onPageChanged={onPageChanged}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('[0]')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('dot-2'));

    expect(onPageChanged).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        page: 2,
        previousPage: 0,
        source: 'pagination',
        userInitiated: true,
      }),
    );
    expect(screen.getByText('[2]')).toBeTruthy();
  });

  it('labels each dot', async () => {
    await render(
      <Carousel testID="c" components={{ Dot: MockDot }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByLabelText('Page 2')).toBeTruthy();
  });

  it('takes a custom pageLabel formatter', async () => {
    await render(
      <Carousel
        testID="c"
        components={{ Dot: MockDot }}
        pageLabel={(index, total) => `Screen ${index + 1} of ${total}`}
      >
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByLabelText('Screen 2 of 3')).toBeTruthy();
  });

  it('lets a Pagination slot replace the whole row', async () => {
    await render(
      <Carousel testID="c" components={{ Dot: MockDot, Pagination: MockPagination }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByTestId('fraction')).toHaveTextContent('1 / 4');
    expect(screen.queryByTestId('dot-0')).toBeNull();
  });
});

// ─── Arrows ───────────────────────────────────────────────────────────────────

describe('arrows', () => {
  it('pages forward and back', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }} onPageChanged={onPageChanged}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));
    expect(onPageChanged).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ previousPage: 0, source: 'next' }),
    );

    await fireEvent.press(screen.getByTestId('arrow-previous'));
    expect(onPageChanged).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({ previousPage: 1, source: 'previous' }),
    );
  });

  it('goes disabled at the ends rather than disappearing', async () => {
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        {slides(2)}
      </Carousel>,
    );
    await layout();

    // A control that vanishes takes the focus a user is pressing with it.
    expect(screen.getByTestId('arrow-previous')).toBeDisabled();
    expect(screen.getByTestId('arrow-next')).not.toBeDisabled();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(screen.getByTestId('arrow-previous')).not.toBeDisabled();
    expect(screen.getByTestId('arrow-next')).toBeDisabled();
  });

  it('stays enabled at both ends when the carousel wraps', async () => {
    await render(
      <Carousel testID="c" loop components={{ Arrow: MockArrow }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByTestId('arrow-previous')).not.toBeDisabled();
    expect(screen.getByTestId('arrow-next')).not.toBeDisabled();
  });

  it('hides entirely when there is only one page', async () => {
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        {slides(1)}
      </Carousel>,
    );
    await layout();

    expect(screen.queryByTestId('arrow-next')).toBeNull();
  });

  it('prefers the direction-specific slots over the shared one', async () => {
    const Specific = (props: CarouselArrowSlotProps) => (
      <Pressable testID={`specific-${props.direction}`} onPress={props.onPress}>
        <Text>x</Text>
      </Pressable>
    );
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow, NextArrow: Specific }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByTestId('specific-next')).toBeTruthy();
    expect(screen.getByTestId('arrow-previous')).toBeTruthy();
  });

  it('takes custom arrow labels', async () => {
    await render(
      <Carousel
        testID="c"
        components={{ Arrow: MockArrow }}
        previousLabel="Anterior"
        nextLabel="Siguiente"
      >
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByLabelText('Siguiente')).toBeTruthy();
    expect(screen.getByLabelText('Anterior')).toBeTruthy();
  });
});

// ─── Paging behaviour ─────────────────────────────────────────────────────────

describe('paging', () => {
  it('refuses to move past the last page without loop', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }} onPageChanged={onPageChanged}>
        {slides(2)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));
    onPageChanged.mockClear();
    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(onPageChanged).not.toHaveBeenCalled();
  });

  it('rewinds to the first page when looping', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" loop components={{ Arrow: MockArrow }} onPageChanged={onPageChanged}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-previous'));

    expect(onPageChanged).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ previousPage: 0, source: 'previous' }),
    );
  });

  it('starts on defaultPage', async () => {
    await render(
      <Carousel testID="c" defaultPage={2} components={{ Dot: MockDot }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('[2]')).toBeTruthy();
  });

  it('reads the page back off a real scroll', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" components={{ Dot: MockDot }} onPageChanged={onPageChanged}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await settleAt(2 * WIDTH);

    expect(onPageChanged).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ previousPage: 0, source: 'drag' }),
    );
    expect(screen.getByText('[2]')).toBeTruthy();
  });

  it('reports a page change once, not once per scroll frame', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" onPageChanged={onPageChanged}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    const track = screen.getByTestId('c-track');
    for (const x of [280, 300, 310, 300]) {
      await fireEvent.scroll(track, {
        nativeEvent: { contentOffset: { x, y: 0 } },
      });
    }

    expect(onPageChanged).toHaveBeenCalledTimes(1);
    expect(onPageChanged).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ previousPage: 0, source: 'drag' }),
    );
  });
});

// ─── Controlled mode ──────────────────────────────────────────────────────────

describe('controlled mode', () => {
  it('renders the page it is given and reports moves without taking them', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        page={1}
        onPageChanged={onPageChanged}
        components={{ Dot: MockDot, Arrow: MockArrow }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('[1]')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(onPageChanged).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ previousPage: 1, source: 'next' }),
    );
    // The prop is the source of truth and the parent ignored the callback.
    expect(screen.getByText('[1]')).toBeTruthy();
  });

  it('follows the prop when the parent feeds the callback back', async () => {
    const view = await render(
      <Carousel testID="c" page={0} components={{ Dot: MockDot }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      await view.rerender(
        <Carousel testID="c" page={3} components={{ Dot: MockDot }}>
          {slides(4)}
        </Carousel>,
      );
    });

    expect(screen.getByText('[3]')).toBeTruthy();
  });
});

// ─── Imperative handle ────────────────────────────────────────────────────────

describe('imperative handle', () => {
  it('drives the carousel from outside', async () => {
    const ref = createRef<CarouselHandle>();
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" ref={ref} onPageChanged={onPageChanged} components={{ Dot: MockDot }}>
        {slides(6)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      ref.current?.next();
    });
    expect(screen.getByText('[1]')).toBeTruthy();

    await act(async () => {
      ref.current?.previous();
    });
    expect(screen.getByText('[0]')).toBeTruthy();

    await act(async () => {
      ref.current?.goTo(4);
    });
    expect(screen.getByText('[4]')).toBeTruthy();
  });

  it("reports ref-driven moves with source 'imperative', distinct from chrome", async () => {
    const ref = createRef<CarouselHandle>();
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        ref={ref}
        onPageChanged={onPageChanged}
        components={{ Dot: MockDot, Arrow: MockArrow }}
      >
        {slides(6)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      ref.current?.next();
    });
    expect(onPageChanged).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ source: 'imperative', userInitiated: true }),
    );

    await act(async () => {
      ref.current?.goTo(3);
    });
    expect(onPageChanged).toHaveBeenLastCalledWith(
      3,
      expect.objectContaining({ source: 'imperative' }),
    );

    // The same underlying action taken through the rendered chrome instead
    // reports its own, more specific source.
    await fireEvent.press(screen.getByTestId('dot-0'));
    expect(onPageChanged).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({ source: 'pagination' }),
    );
  });

  it('reads its getters back without waiting for a render', async () => {
    const ref = createRef<CarouselHandle>();
    await render(
      <Carousel testID="c" ref={ref}>
        {slides(5)}
      </Carousel>,
    );
    await layout();

    expect(ref.current?.pageCount).toBe(5);
    await act(async () => {
      ref.current?.next();
      // Right on the next line, not a render later.
      expect(ref.current?.page).toBe(1);
    });
  });

  it('goToSlide targets the page holding a slide, not the slide index', async () => {
    const ref = createRef<CarouselHandle>();
    await render(
      <Carousel testID="c" ref={ref} visibleSlides={2} components={{ Dot: MockDot }}>
        {slides(6)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      ref.current?.goToSlide(5);
    });

    expect(screen.getByText('[2]')).toBeTruthy();
  });

  it('clamps goTo instead of wrapping', async () => {
    const ref = createRef<CarouselHandle>();
    await render(
      <Carousel testID="c" ref={ref} loop components={{ Dot: MockDot }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      ref.current?.goTo(99);
    });

    expect(screen.getByText('[2]')).toBeTruthy();
  });
});

// ─── Auto-play ────────────────────────────────────────────────────────────────

describe('autoPlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('advances on the interval', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" autoPlay interval={1000} onPageChanged={onPageChanged}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onPageChanged).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        previousPage: 0,
        source: 'autoplay',
        userInitiated: false,
      }),
    );
  });

  it('wraps at the end even without loop, rather than stalling', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel testID="c" autoPlay interval={1000} defaultPage={2} onPageChanged={onPageChanged}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onPageChanged).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ previousPage: 2, source: 'autoplay' }),
    );
  });

  it('renders a play/pause control that actually stops it', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        autoPlay
        interval={1000}
        onPageChanged={onPageChanged}
        components={{ PlayPauseControl: MockPlayPause }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('pause')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('play-pause'));
    expect(screen.getByText('play')).toBeTruthy();

    onPageChanged.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(onPageChanged).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('play-pause'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(onPageChanged).toHaveBeenCalled();
  });

  it('labels the control for whichever action it offers', async () => {
    await render(
      <Carousel
        testID="c"
        autoPlay
        pauseLabel="Detener"
        playLabel="Reanudar"
        components={{ PlayPauseControl: MockPlayPause }}
      >
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByLabelText('Detener')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('play-pause'));
    expect(screen.getByLabelText('Reanudar')).toBeTruthy();
  });

  it('does not render the control without autoPlay', async () => {
    await render(
      <Carousel testID="c" components={{ PlayPauseControl: MockPlayPause }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.queryByTestId('play-pause')).toBeNull();
  });

  it('pauses while the user is dragging', async () => {
    const onDragStart = jest.fn();
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        autoPlay
        interval={1000}
        onDragStart={onDragStart}
        onPageChanged={onPageChanged}
        components={{ PlayPauseControl: MockPlayPause }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent(screen.getByTestId('c-track'), 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });

    expect(onDragStart).toHaveBeenCalled();
    expect(screen.getByText('play')).toBeTruthy();

    onPageChanged.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(onPageChanged).not.toHaveBeenCalled();
  });

  it('resumes when the finger lifts', async () => {
    const onDragEnd = jest.fn();
    await render(
      <Carousel
        testID="c"
        autoPlay
        onDragEnd={onDragEnd}
        components={{ PlayPauseControl: MockPlayPause }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    const track = screen.getByTestId('c-track');
    await fireEvent(track, 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await fireEvent(track, 'scrollEndDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });

    expect(onDragEnd).toHaveBeenCalled();
    expect(screen.getByText('pause')).toBeTruthy();
  });
});

// ─── Virtualized mode ─────────────────────────────────────────────────────────

describe('data mode', () => {
  const photos = Array.from({ length: 6 }, (_, i) => ({
    id: `p${i}`,
    title: `photo ${i}`,
  }));

  it('renders through renderItem', async () => {
    await render(
      <Carousel
        testID="c"
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
        components={{ Dot: MockDot }}
      />,
    );
    await layout();

    expect(screen.getByText('photo 0')).toBeTruthy();
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(6);
  });

  it('pages the same way the children mode does', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        data={photos}
        renderItem={({ item }) => <Text>{item.title}</Text>}
        onPageChanged={onPageChanged}
        components={{ Arrow: MockArrow }}
      />,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(onPageChanged).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ previousPage: 0, source: 'next' }),
    );
  });

  it('hands renderItem the slide width', async () => {
    await render(
      <Carousel
        testID="c"
        visibleSlides={2}
        data={photos}
        renderItem={({ slideWidth }) => <Text>{`w${slideWidth}`}</Text>}
      />,
    );
    await layout();

    expect(screen.getAllByText('w150').length).toBeGreaterThan(0);
  });

  it('leaves isActive false unless trackActiveSlides is on', async () => {
    await render(
      <Carousel
        testID="c"
        data={photos}
        renderItem={({ index, isActive }) => <Text>{`${index}:${isActive}`}</Text>}
      />,
    );
    await layout();

    expect(screen.getByText('0:false')).toBeTruthy();
  });

  it('marks the active slides when asked', async () => {
    await render(
      <Carousel
        testID="c"
        trackActiveSlides
        data={photos}
        renderItem={({ index, isActive }) => <Text>{`${index}:${isActive}`}</Text>}
      />,
    );
    await layout();

    expect(screen.getByText('0:true')).toBeTruthy();
    expect(screen.getByText('1:false')).toBeTruthy();
  });

  it('renders nothing for a slide when renderItem is missing', async () => {
    await render(<Carousel testID="c" data={photos} components={{ Dot: MockDot }} />);
    await layout();

    // Still a working carousel — just empty slides.
    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(6);
  });
});

// ─── infinite ─────────────────────────────────────────────────────────────────

describe('infinite', () => {
  it('renders a clone page at each end', async () => {
    await render(
      <Carousel testID="c" infinite visibleSlides={2}>
        {slides(6)}
      </Carousel>,
    );
    await layout();

    // 6 real slides + 2 leading clones + 2 trailing clones are on screen...
    expect(screen.getAllByText(/^slide /, { includeHiddenElements: true })).toHaveLength(10);
    // ...but only the real ones are exposed to assistive technology.
    expect(screen.getAllByText(/^slide /)).toHaveLength(6);
  });

  it('keeps the page count over the real slides only', async () => {
    await render(
      <Carousel testID="c" infinite visibleSlides={2} components={{ Dot: MockDot }}>
        {slides(6)}
      </Carousel>,
    );
    await layout();

    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(3);
  });

  it('labels the real slides once and hides the clones from assistive tech', async () => {
    await render(
      <Carousel testID="c" infinite>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    // Exposing the copies would read the same content twice and miscount.
    expect(screen.getAllByLabelText('1 of 3')).toHaveLength(1);
  });

  it('does not clone when everything already fits on one page', async () => {
    await render(
      <Carousel testID="c" infinite visibleSlides={3}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getAllByText(/^slide /, { includeHiddenElements: true })).toHaveLength(3);
  });

  it('wraps forward past the end', async () => {
    const onPageChanged = jest.fn();
    await render(
      <Carousel
        testID="c"
        infinite
        defaultPage={2}
        onPageChanged={onPageChanged}
        components={{ Arrow: MockArrow }}
      >
        {slides(3)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(onPageChanged).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ previousPage: 2, source: 'next' }),
    );
  });
});

// ─── Accessibility announcements ──────────────────────────────────────────────

describe('announcements', () => {
  let announce: jest.SpyInstance;

  beforeEach(() => {
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation();
    // `restoreAllMocks` cannot restore this RN property, so a second `spyOn`
    // hands back the *same* spy — history and all. Clear it explicitly or the
    // previous test's announcement counts as this one's.
    announce.mockClear();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('announces each page change', async () => {
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();
    announce.mockClear();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(announce).toHaveBeenCalledWith('Page 2 of 4');
  });

  it('says nothing on mount', async () => {
    await render(<Carousel testID="c">{slides(4)}</Carousel>);
    await layout();

    expect(announce).not.toHaveBeenCalled();
  });

  it('takes a custom statusLabel', async () => {
    await render(
      <Carousel
        testID="c"
        statusLabel={(index, total) => `Página ${index + 1} de ${total}`}
        components={{ Arrow: MockArrow }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(announce).toHaveBeenCalledWith('Página 2 de 4');
  });

  it('stays silent when statusLabel is null', async () => {
    await render(
      <Carousel testID="c" statusLabel={null} components={{ Arrow: MockArrow }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();
    announce.mockClear();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(announce).not.toHaveBeenCalled();
  });

  it('stays silent while a rotation is running', async () => {
    jest.useFakeTimers();
    await render(
      <Carousel testID="c" autoPlay interval={1000}>
        {slides(4)}
      </Carousel>,
    );
    await layout();
    announce.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // A carousel that speaks every few seconds is unusable.
    expect(announce).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('says nothing for a single-page deck', async () => {
    await render(<Carousel testID="c">{slides(1)}</Carousel>);
    await layout();

    expect(announce).not.toHaveBeenCalled();
  });
});

// ─── useCarousel ──────────────────────────────────────────────────────────────

describe('useCarousel', () => {
  const Counter = () => {
    const { page, pageCount, next, canGoNext } = useCarousel();
    return (
      <Pressable
        testID="counter"
        onPress={() => next()}
        accessibilityState={{ disabled: !canGoNext }}
      >
        <Text>{`${page + 1}/${pageCount}`}</Text>
      </Pressable>
    );
  };

  it('gives a slot component the full state and actions', async () => {
    await render(
      <Carousel testID="c" components={{ Pagination: Counter }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('1/3')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('counter'));

    expect(screen.getByText('2/3')).toBeTruthy();
  });

  it('works from inside a slide too', async () => {
    await render(
      <Carousel testID="c">
        <Counter />
        <View>
          <Text>second</Text>
        </View>
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('1/2')).toBeTruthy();
  });

  it('explains itself when called outside a carousel', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    await expect(render(<Counter />)).rejects.toThrow(/must be called inside a <Carousel>/);
    spy.mockRestore();
  });
});

// ─── Slot placement ───────────────────────────────────────────────────────────

describe('slot placement', () => {
  it('renders every slot wherever it is configured', async () => {
    await render(
      <Carousel
        testID="c"
        autoPlay
        slots={{ arrows: 'below', pagination: 'above', playPause: 'below' }}
        components={{
          Arrow: MockArrow,
          Dot: MockDot,
          PlayPauseControl: MockPlayPause,
        }}
      >
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByTestId('arrow-next')).toBeTruthy();
    expect(screen.getByTestId('dot-0')).toBeTruthy();
    expect(screen.getByTestId('play-pause')).toBeTruthy();
  });

  it('overlays them by default without breaking the track', async () => {
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getByTestId('arrow-next')).toBeTruthy();
    expect(screen.getByTestId('c-track')).toBeTruthy();
  });

  it('supports an overlaid pagination row', async () => {
    await render(
      <Carousel testID="c" slots={{ pagination: 'overlay' }} components={{ Dot: MockDot }}>
        {slides(3)}
      </Carousel>,
    );
    await layout();

    expect(screen.getAllByTestId(/^dot-/)).toHaveLength(3);
  });
});

// ─── Snap lifecycle ───────────────────────────────────────────────────────────

describe('snap lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires onSnapStart then onSnapEnd around a drag that settles', async () => {
    const onSnapStart = jest.fn();
    const onSnapEnd = jest.fn();
    await render(
      <Carousel testID="c" onSnapStart={onSnapStart} onSnapEnd={onSnapEnd}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    const track = screen.getByTestId('c-track');
    await fireEvent(track, 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    expect(onSnapStart).not.toHaveBeenCalled();
    expect(onSnapEnd).not.toHaveBeenCalled();

    // The finger lets go: the track is now settling on its own.
    await fireEvent(track, 'scrollEndDrag', {
      nativeEvent: { contentOffset: { x: 250, y: 0 } },
    });
    expect(onSnapStart).toHaveBeenCalledTimes(1);
    expect(onSnapEnd).not.toHaveBeenCalled();

    await settleAt(300);
    expect(onSnapEnd).toHaveBeenCalledTimes(1);
  });

  it('fires around a button-driven page change too', async () => {
    const onSnapStart = jest.fn();
    const onSnapEnd = jest.fn();
    await render(
      <Carousel
        testID="c"
        onSnapStart={onSnapStart}
        onSnapEnd={onSnapEnd}
        components={{ Arrow: MockArrow }}
      >
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));
    expect(onSnapStart).toHaveBeenCalledTimes(1);
    expect(onSnapEnd).not.toHaveBeenCalled();

    // The test renderer never fires a real momentum event for a programmatic
    // `scrollTo`, so the 600ms backstop is what resolves it here.
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(onSnapEnd).toHaveBeenCalledTimes(1);
  });

  it('does not fire onSnapStart again for a second press before the first settles', async () => {
    const onSnapStart = jest.fn();
    await render(
      <Carousel testID="c" onSnapStart={onSnapStart} components={{ Arrow: MockArrow }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));
    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(onSnapStart).toHaveBeenCalledTimes(1);
  });
});

// ─── onProgress ───────────────────────────────────────────────────────────────

describe('onProgress', () => {
  it('reports the raw scroll position on every frame', async () => {
    const onProgress = jest.fn();
    await render(
      <Carousel testID="c" onProgress={onProgress}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent.scroll(screen.getByTestId('c-track'), {
      nativeEvent: { contentOffset: { x: 150, y: 0 } },
    });

    expect(onProgress).toHaveBeenCalledWith({
      page: 0,
      absoluteProgress: 0.5,
      offset: 150,
    });
  });

  it('reports progress for an animated, button-driven move', async () => {
    const onProgress = jest.fn();
    await render(
      <Carousel testID="c" onProgress={onProgress} components={{ Arrow: MockArrow }}>
        {slides(4)}
      </Carousel>,
    );
    await layout();

    await fireEvent.press(screen.getByTestId('arrow-next'));
    await fireEvent.scroll(screen.getByTestId('c-track'), {
      nativeEvent: { contentOffset: { x: 300, y: 0 } },
    });

    expect(onProgress).toHaveBeenCalledWith({
      page: 1,
      absoluteProgress: 1,
      offset: 300,
    });
  });

  it('does not force a Carousel re-render — it is called directly, not through state', async () => {
    let renders = 0;
    const Probe = () => {
      renders += 1;
      return null;
    };
    const onProgress = jest.fn();
    await render(
      <Carousel testID="c" onProgress={onProgress}>
        {slides(4)}
        <Probe />
      </Carousel>,
    );
    await layout();
    renders = 0;

    for (const x of [10, 20, 30, 40, 50]) {
      await fireEvent.scroll(screen.getByTestId('c-track'), {
        nativeEvent: { contentOffset: { x, y: 0 } },
      });
    }

    expect(onProgress).toHaveBeenCalledTimes(5);
    expect(renders).toBe(0);
  });
});

// ─── useCarouselSlide ─────────────────────────────────────────────────────────

describe('useCarouselSlide', () => {
  // A genuine function component, called from `renderItem` rather than
  // inlined there — `renderItem` runs inside a class component's render
  // (`FlatList`'s cell renderer), which is not a legal place to call a hook.
  const ProbeSlide = ({ index }: { index: number }) => {
    const slide = useCarouselSlide(index);
    return <Text>{`${index}:${slide.isActive}:${slide.progress.toFixed(2)}`}</Text>;
  };

  it('reports isActive and progress for the slide at its index', async () => {
    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        <ProbeSlide index={0} />
        <ProbeSlide index={1} />
      </Carousel>,
    );
    await layout();

    expect(screen.getByText('0:true:0.00')).toBeTruthy();
    expect(screen.getByText('1:false:-1.00')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    expect(screen.getByText('1:true:0.00')).toBeTruthy();
    expect(screen.getByText('0:false:1.00')).toBeTruthy();
  });

  it('works from renderItem when delegated to a real component', async () => {
    await render(
      <Carousel
        testID="c"
        data={['a', 'b']}
        renderItem={({ index }) => <ProbeSlide index={index} />}
        components={{ Arrow: MockArrow }}
      />,
    );
    await layout();

    expect(screen.getByText('0:true:0.00')).toBeTruthy();
  });

  it('does not rerender a memoized slide whose derived state did not change', async () => {
    const renderSpy = jest.fn();
    // `React.memo` is what makes this guarantee real: it is what lets a slide
    // bail out of a re-render triggered by its parent, the same way
    // `trackActiveSlides` already documents for `renderItem`. The store
    // underneath `useCarouselSlide` is what then still updates *this*
    // component when the store's derived value actually changes.
    const Slide = memo(({ index }: { index: number }) => {
      const { isActive } = useCarouselSlide(index);
      renderSpy(index);
      return <Text>{`${index}:${isActive}`}</Text>;
    });

    await render(
      <Carousel testID="c" components={{ Arrow: MockArrow }}>
        <Slide index={0} />
        <Slide index={1} />
        <Slide index={2} />
        <Slide index={3} />
      </Carousel>,
    );
    await layout();
    renderSpy.mockClear();

    await fireEvent.press(screen.getByTestId('arrow-next'));

    // Only the two slides whose `isActive` actually flipped re-rendered — not
    // slides 2 and 3, which stayed inactive throughout.
    expect(renderSpy.mock.calls.flat().sort()).toEqual([0, 1]);
  });

  it('throws when called outside a carousel', async () => {
    const Bad = () => {
      useCarouselSlide(0);
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation();
    await expect(render(<Bad />)).rejects.toThrow(/must be called inside a <Carousel>/);
    spy.mockRestore();
  });
});
