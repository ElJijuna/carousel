import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fn } from 'storybook/test';

import { Carousel } from '../Carousel';
import { useCarousel } from '../CarouselContext';
import type { CarouselHandle, CarouselPaginationSlotProps } from '../types';
import {
  MockArrow,
  MockCreditCard,
  MockDayAgenda,
  MockDayCell,
  MockDot,
  MockFraction,
  MockPageSlide,
  MockPlayPause,
  MockSlide,
  MockSplitCard,
  mockCalendarMonth,
  mockCards,
  mockData,
  mockDays,
  mockDefaultDayId,
  mockFeatures,
  mockPages,
  mockSlides,
  palette,
} from './mocks';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: palette.ink,
  },
  buttonText: { color: palette.surface, fontSize: 13 },
  readout: {
    marginTop: 8,
    textAlign: 'center',
    color: palette.caption,
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.track,
    marginTop: 12,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: palette.accent },
  dimmed: { opacity: 0.4 },

  screen: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 390,
    height: 620,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.track,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  topBar: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.track,
  },
  topBarTitle: { fontSize: 15, fontWeight: '600', color: palette.ink },
  // The carousel fills the space the top bar leaves, and the track fills what
  // the footer leaves inside that — no fixed heights anywhere in this screen.
  pageCarousel: { flex: 1 },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.track,
  },
  pageDots: { flexDirection: 'row', alignItems: 'center' },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: palette.accent,
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '600',
  },

  calendar: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.calendarBg,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekTitle: { fontSize: 16, fontWeight: '600', color: palette.calendarInk },
  weekControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekReadout: {
    fontSize: 12,
    color: palette.calendarMuted,
    fontVariant: ['tabular-nums'],
    marginRight: 4,
  },
  weekButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.calendarBorder,
    backgroundColor: palette.calendarCell,
  },
  weekButtonGlyph: { fontSize: 16, lineHeight: 18, color: palette.calendarInk },
});

/**
 * Props that carry React elements, render functions or styles.
 *
 * They stay in the docs table but get no editor: the Controls panel serialises
 * whatever you type back into the story, and a slide or a slot component does
 * not survive the round trip — editing `children` would replace real elements
 * with plain objects, and editing `components` would wipe the chrome. Choosing
 * those belongs to the story, not to a text field.
 */
const noControl = { control: false } as const;
const structuralArgTypes = Object.fromEntries(
  [
    'children',
    'data',
    'renderItem',
    'keyExtractor',
    'components',
    'style',
    'trackStyle',
    'slideStyle',
    'paginationStyle',
    'arrowsStyle',
    'pageLabel',
    'slideLabel',
    'statusLabel',
  ].map((name) => [name, noControl]),
);

const meta = {
  title: 'Carousel',
  component: Carousel,
  // Turns the props table below into an actual page: without it the component
  // description, the `table.type` summaries and the argTypes are computed and
  // then never rendered anywhere.
  tags: ['autodocs'],
  parameters: {
    jest: {
      componentPath: 'src/Carousel.tsx',
    },
    docs: {
      description: {
        component:
          'A headless horizontal carousel. It owns every behaviour and draws nothing but the ' +
          'track — every arrow, dot and control below comes from the `components` slots, ' +
          'mocked in `src/stories/mocks.tsx`.',
      },
    },
  },
  argTypes: {
    ...structuralArgTypes,
    // `visibleSlides` and `peek` are `number | ResponsiveMap<number>`, which
    // Storybook can only offer as a JSON editor. Every story but `Responsive`
    // passes the plain number, so the number control is the useful one; the
    // responsive stories put the object editor back themselves.
    //
    // `type` is narrowed to `number` as well, not just `control`: Storybook
    // coerces `?args=visibleSlides:2` against the *type*, and silently drops
    // the value when that type is a union it cannot parse — which is what made
    // a shared control link arrive with the control back at its default.
    // `table.type` keeps the docs showing the real signature.
    visibleSlides: {
      type: { name: 'number' },
      table: { type: { summary: 'number | ResponsiveMap<number>' } },
      control: { type: 'number', min: 1, max: 6, step: 1 },
    },
    peek: {
      type: { name: 'number' },
      table: { type: { summary: 'number | ResponsiveMap<number>' } },
      control: { type: 'range', min: 0, max: 96, step: 4 },
    },
    spacing: { control: { type: 'range', min: 0, max: 48, step: 2 } },
    interval: { control: { type: 'range', min: 500, max: 8000, step: 500 } },
    page: { control: { type: 'number', min: 0, step: 1 } },
    defaultPage: { control: { type: 'number', min: 0, step: 1 } },
  },
  // Defaults for every story, so the controls open populated rather than as a
  // row of empty "Set number" buttons. The callbacks are spies, which is what
  // puts every page change and drag in the Actions panel.
  args: {
    onPageChanged: fn(),
    onDragStart: fn(),
    onDragEnd: fn(),
    visibleSlides: 1,
    spacing: 0,
    peek: 0,
    loop: false,
    infinite: false,
    autoPlay: false,
    interval: 3000,
    trackActiveSlides: false,
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One slide per page, dots below — the smallest useful configuration. */
export const Basic: Story = {
  args: {
    testID: 'carousel',
    components: { Dot: MockDot },
    children: mockSlides(4),
  },
};

/** Nothing passed in `components`, so nothing but the track is drawn. */
export const NoChrome: Story = {
  args: {
    testID: 'carousel',
    children: mockSlides(4),
  },
};

/** Arrows overlaid on the track edges, disabled at the ends. */
export const WithArrows: Story = {
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(4),
  },
};

/** Three slides at a time; paging moves a whole group, so 6 slides give 2 pages. */
export const VisibleSlides: Story = {
  args: {
    testID: 'carousel',
    visibleSlides: 3,
    spacing: 12,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(6),
  },
};

/** `peek` shows a sliver of the neighbours, so the deck reads as continuous. */
export const PeekAndSpacing: Story = {
  args: {
    testID: 'carousel',
    visibleSlides: 2,
    spacing: 12,
    peek: 32,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(7),
  },
};

/** A breakpoint map resolved against the carousel's own width — resize me. */
export const Responsive: Story = {
  // This story is the one that passes maps rather than numbers, so it swaps the
  // meta's number controls back for the JSON editor that can express one.
  argTypes: {
    visibleSlides: { control: 'object' },
    peek: { control: 'object' },
  },
  args: {
    testID: 'carousel',
    visibleSlides: { base: 3, 700: 2, 460: 1 },
    peek: { base: 32, 460: 16 },
    spacing: 12,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(9),
  },
};

/** `loop` rewinds past the ends. Nothing is cloned. */
export const Loop: Story = {
  args: {
    testID: 'carousel',
    loop: true,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(4),
  },
};

/** `infinite` keeps moving in the same direction by cloning a page at each end. */
export const Infinite: Story = {
  args: {
    testID: 'carousel',
    infinite: true,
    visibleSlides: 2,
    spacing: 12,
    peek: 24,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(6),
  },
};

/** Rotates on a timer, with the stop control WCAG 2.2.2 requires. */
export const AutoPlay: Story = {
  args: {
    testID: 'carousel',
    autoPlay: true,
    interval: 2000,
    loop: true,
    components: { Dot: MockDot, PlayPauseControl: MockPlayPause },
    children: mockSlides(4),
  },
};

/** A `Pagination` slot replaces the whole dot row with a counter. */
export const FractionPagination: Story = {
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Pagination: MockFraction },
    children: mockSlides(8),
  },
};

/**
 * Virtualized: 500 slides, but only the few near the viewport are mounted.
 *
 * Rendered through `render` rather than `args` so `Carousel`'s item generic is
 * inferred from the real `data` instead of being pinned to `unknown` by `Meta`.
 */
const virtualizedData = mockData(500);

export const Virtualized: Story = {
  args: {
    testID: 'carousel',
    visibleSlides: 2,
    spacing: 12,
    components: { Arrow: MockArrow, Pagination: MockFraction },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={virtualizedData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MockSlide index={item.index} caption="virtualized" />}
    />
  ),
};

/** The parent owns the page and feeds `onPageChanged` straight back. */
export const Controlled: Story = {
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  // `page` and `onPageChanged` are the point of the story, so they stay out of
  // the controls; everything else comes from `args`.
  argTypes: { page: { control: false } },
  render: ({ onPageChanged, ...args }) => {
    const [page, setPage] = useState(0);
    return (
      <View>
        <Carousel
          {...args}
          page={page}
          // Overriding the arg would silence the Actions panel for the one
          // story whose whole subject is the page changing, so call both.
          onPageChanged={(next) => {
            setPage(next);
            onPageChanged?.(next);
          }}
        >
          {mockSlides(5)}
        </Carousel>
        <View style={styles.row}>
          <Pressable testID="external-first" style={styles.button} onPress={() => setPage(0)}>
            <Text style={styles.buttonText}>First</Text>
          </Pressable>
          <Pressable testID="external-last" style={styles.button} onPress={() => setPage(4)}>
            <Text style={styles.buttonText}>Last</Text>
          </Pressable>
        </View>
        <Text testID="page-readout" style={styles.readout}>{`page ${page}`}</Text>
      </View>
    );
  },
};

/** Driving the carousel through its `ref`, from a toolbar outside it. */
export const ImperativeHandle: Story = {
  args: {
    testID: 'carousel',
    loop: true,
    components: { Dot: MockDot },
  },
  render: (args) => {
    const carousel = useRef<CarouselHandle>(null);
    const [readout, setReadout] = useState('page 0');
    const sync = () => setReadout(`page ${carousel.current?.page ?? 0}`);
    return (
      <View>
        <Carousel {...args} ref={carousel}>
          {mockSlides(6)}
        </Carousel>
        <View style={styles.row}>
          <Pressable
            testID="handle-previous"
            style={styles.button}
            onPress={() => {
              carousel.current?.previous();
              sync();
            }}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </Pressable>
          <Pressable
            testID="handle-slide"
            style={styles.button}
            onPress={() => {
              carousel.current?.goToSlide(4);
              sync();
            }}
          >
            <Text style={styles.buttonText}>Slide 5</Text>
          </Pressable>
          <Pressable
            testID="handle-next"
            style={styles.button}
            onPress={() => {
              carousel.current?.next();
              sync();
            }}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
        <Text testID="handle-readout" style={styles.readout}>
          {readout}
        </Text>
      </View>
    );
  },
};

/** Custom chrome built from `useCarousel`, for what the slots do not cover. */
const ProgressBar = () => {
  const { page, pageCount, next, previous, canGoPrevious, canGoNext } = useCarousel();
  return (
    <View>
      <View testID="progress-track" style={styles.progressTrack}>
        <View
          testID="progress-fill"
          style={[styles.progressFill, { width: `${((page + 1) / pageCount) * 100}%` }]}
        />
      </View>
      <View style={styles.row}>
        <Pressable
          testID="hook-previous"
          style={[styles.button, !canGoPrevious && styles.dimmed]}
          onPress={() => previous()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable
          testID="hook-next"
          style={[styles.button, !canGoNext && styles.dimmed]}
          onPress={() => next()}
        >
          <Text style={styles.buttonText}>Forward</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const CustomChromeViaHook: Story = {
  args: {
    testID: 'carousel',
    components: { Pagination: ProgressBar },
    slots: { pagination: 'below' },
    children: mockSlides(5),
  },
};

/**
 * A wallet: one card per page, with a sliver of the neighbours showing so the
 * deck reads as a stack you can flick through.
 *
 * `loop` rather than `infinite` — a wallet is a fixed, countable set of cards,
 * and cloning one would show the same card twice.
 *
 * Rendered through `render` rather than `args` so `Carousel`'s item generic is
 * inferred from `mockCards` instead of being pinned to `unknown` by `Meta`. The
 * cards themselves are fixed; every layout prop still comes from the controls.
 */
export const CreditCards: Story = {
  argTypes: { peek: { control: 'object' } },
  args: {
    testID: 'carousel',
    loop: true,
    spacing: 16,
    peek: { base: 36, 460: 20 },
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={mockCards}
      keyExtractor={(card) => card.id}
      renderItem={({ item }) => <MockCreditCard card={item} />}
      slideLabel={(index, total) => `Card ${index + 1} of ${total}`}
    />
  ),
};

/**
 * Split cards: title, description and footer on the left half, artwork on the
 * right. Each half is exactly half the slide, so the split follows the width
 * the carousel computes — drop `visibleSlides` to 2 in the controls and each
 * card stays split down the middle, just narrower.
 *
 * Rendered through `render` so the item generic comes from `mockFeatures`.
 */
export const SplitCards: Story = {
  args: {
    testID: 'carousel',
    spacing: 16,
    peek: 28,
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={mockFeatures}
      keyExtractor={(feature) => feature.id}
      renderItem={({ item }) => <MockSplitCard feature={item} />}
    />
  ),
};

/**
 * The screen's bottom bar: the page dots on the left, the primary action on the
 * right.
 *
 * It goes in the `Pagination` slot — the one that replaces the whole indicator
 * row — because that is what lets the dots and the button be one bar instead of
 * two stacked ones. The dots are the same `MockDot` every other story uses; only
 * their container changed.
 */
const PageFooter = ({
  page,
  pageCount,
  goTo,
  pageLabel,
  accessibilityLabel,
}: CarouselPaginationSlotProps) => {
  // The slot props carry everything about the indicator; the hook is only here
  // for the button, which is not an indicator at all.
  const { next, canGoNext } = useCarousel();
  return (
    <View style={styles.pageFooter}>
      {/* Labelled but role-less, exactly as the carousel labels the dot row it
          draws itself — a `tablist` here would promise tabs it does not have. */}
      <View style={styles.pageDots} accessibilityLabel={accessibilityLabel}>
        {Array.from({ length: pageCount }, (_, index) => (
          <MockDot
            // The page index *is* the identity: a fixed-length row of
            // interchangeable controls, one per page.
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the identity
            key={`page-dot-${index}`}
            index={index}
            total={pageCount}
            selected={index === page}
            onPress={() => goTo(index)}
            accessibilityLabel={pageLabel(index, pageCount)}
          />
        ))}
      </View>
      {/*
        The last page restarts the tour rather than leaving a dead button: a
        story should not ship a control that does nothing.
      */}
      <Pressable
        testID="next-page"
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={() => (canGoNext ? next() : goTo(0))}
      >
        <Text style={styles.primaryButtonText}>{canGoNext ? 'Next page' : 'Start over'}</Text>
      </Pressable>
    </View>
  );
};

/**
 * The carousel as the page itself: a top bar above it, and a bottom bar holding
 * the dots and the primary "Next page" button.
 *
 * The carousel is the whole area between the two bars, which is the layout an
 * onboarding or a tour actually needs — rather than a card sitting in a page
 * that owns its own chrome.
 */
export const PageLayout: Story = {
  args: {
    testID: 'carousel',
    components: { Pagination: PageFooter },
    slots: { pagination: 'below' },
    accessibilityLabel: 'Onboarding',
    paginationLabel: 'Onboarding steps',
    pageLabel: (index: number, total: number) => `Step ${index + 1} of ${total}`,
    style: styles.pageCarousel,
  },
  render: (args) => (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Top bar</Text>
      </View>
      <Carousel
        {...args}
        data={mockPages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MockPageSlide page={item} />}
      />
    </View>
  ),
};

/**
 * The day strip's header: the month on the left, the week stepper on the right.
 *
 * It goes in the `Pagination` slot placed `above`, because a week strip's
 * indicator is not a row of dots — it is "which week is this", spelled out next
 * to the controls that change it.
 */
const WeekHeader = ({
  page,
  pageCount,
  pageLabel,
  accessibilityLabel,
}: CarouselPaginationSlotProps) => {
  // The slot props carry the page; the hook is here for the stepper, which
  // already knows where the ends are — that is what greys it out at them
  // instead of leaving a control that looks pressable and does nothing.
  const { next, previous, canGoPrevious, canGoNext } = useCarousel();
  return (
    <View style={styles.weekHeader} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.weekTitle}>{mockCalendarMonth}</Text>
      <View style={styles.weekControls}>
        <Text testID="week-readout" style={styles.weekReadout}>
          {pageLabel(page, pageCount)}
        </Text>
        <Pressable
          testID="week-previous"
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          accessibilityState={{ disabled: !canGoPrevious }}
          onPress={canGoPrevious ? () => previous() : undefined}
          style={[styles.weekButton, !canGoPrevious && styles.dimmed]}
        >
          <Text style={styles.weekButtonGlyph}>‹</Text>
        </Pressable>
        <Pressable
          testID="week-next"
          accessibilityRole="button"
          accessibilityLabel="Next week"
          accessibilityState={{ disabled: !canGoNext }}
          onPress={canGoNext ? () => next() : undefined}
          style={[styles.weekButton, !canGoNext && styles.dimmed]}
        >
          <Text style={styles.weekButtonGlyph}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

/**
 * A day picker: one week of days per page, and the selected day's agenda below.
 *
 * The two pieces of state are deliberately separate. The **page** is the
 * carousel's — which week is on screen — and the **selection** is the story's,
 * so paging ahead to look at next week does not change the day you were
 * reading, and picking a day does not scroll the strip out from under your
 * finger. `visibleSlides: 7` is what makes a page a week; drop it to 5 in the
 * controls and a page becomes five days, with the selected day untouched.
 *
 * The chips are slides that are also controls, which is the shape of any row
 * that drives the content under it — a category filter, a date range, tabs.
 */
export const DayCalendar: Story = {
  // A week is seven chips on a wide container and fewer on a phone, so this
  // story passes a map and needs the JSON editor back.
  argTypes: { visibleSlides: { control: 'object' } },
  args: {
    testID: 'carousel',
    visibleSlides: { base: 7, 620: 5, 460: 4 },
    spacing: 8,
    components: { Pagination: WeekHeader },
    slots: { pagination: 'above' },
    accessibilityLabel: 'Day picker',
    paginationLabel: 'Weeks',
    pageLabel: (index: number, total: number) => `Week ${index + 1} of ${total}`,
    // Each chip already says which day it is, so the slide wrapper only has to
    // say where in the strip it sits.
    slideLabel: (index: number, total: number) => `Day ${index + 1} of ${total}`,
  },
  render: (args) => {
    // The day's id, not its position: what is selected is a day, and it stays
    // that day however the strip is paged, resized or re-grouped.
    const [selectedId, setSelectedId] = useState(mockDefaultDayId);
    const selectedDay = mockDays.find((day) => day.id === selectedId);
    return (
      <View style={styles.calendar}>
        <Carousel {...args}>
          {mockDays.map((day) => (
            <MockDayCell
              key={day.id}
              day={day}
              selected={day.id === selectedId}
              onPress={() => setSelectedId(day.id)}
            />
          ))}
        </Carousel>
        {selectedDay ? <MockDayAgenda day={selectedDay} /> : null}
      </View>
    );
  },
};
