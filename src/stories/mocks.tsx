/**
 * Mocked chrome for the stories.
 *
 * `@real-native/carousel` ships no UI on purpose, so the Storybook has to bring
 * its own. Everything here is a plain React Native component that takes the
 * carousel's slot props — the same shape an implementer writes in their own
 * design system. Copy any of it as a starting point.
 *
 * @module
 */
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  CarouselArrowSlotProps,
  CarouselDotSlotProps,
  CarouselPaginationSlotProps,
  CarouselPlayPauseSlotProps,
} from '../types';
import { mockImageLabels, mockImages } from './mockImages';

/** Shared colours for the mocked chrome, so the stories stay literal-free. */
export const palette = {
  ink: '#111827',
  muted: '#9ca3af',
  surface: '#ffffff',
  accent: '#2563eb',
  slideBg: '#e0e7ff',
  slideBorder: '#c7d2fe',
  caption: '#4b5563',
  track: '#e5e7eb',
  shadow: '#000000',
  cardInk: '#f8fafc',
  cardChip: '#e2c275',
  splitBorder: '#e5e7eb',
  splitEyebrow: '#2563eb',
  // The day strip is the one dark surface in this Storybook, so it carries its
  // own ramp rather than inverting the light one above.
  calendarBg: '#0f0f11',
  calendarPanel: '#151517',
  calendarCell: '#1c1c1e',
  calendarCellSelected: '#0b2a5b',
  calendarBorder: '#2a2a2e',
  calendarBorderSelected: '#1d4ed8',
  calendarInk: '#f4f4f5',
  calendarMuted: '#a1a1aa',
  calendarAccent: '#60a5fa',
};

const styles = StyleSheet.create({
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    marginHorizontal: 8,
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  arrowDisabled: { opacity: 0.35 },
  arrowGlyph: { fontSize: 18, color: palette.ink, lineHeight: 20 },

  dot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.muted,
  },
  dotSelected: { backgroundColor: palette.accent, width: 20 },

  fraction: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: palette.ink,
    alignSelf: 'center',
  },
  fractionText: {
    color: palette.surface,
    fontVariant: ['tabular-nums'],
    fontSize: 13,
  },

  playPause: {
    margin: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  playPauseText: { fontSize: 12, color: palette.ink },

  slide: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slideBorder,
    backgroundColor: palette.slideBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: { fontSize: 22, fontWeight: '600', color: palette.ink },
  slideCaption: { fontSize: 13, color: palette.caption, marginTop: 4 },

  card: {
    height: 190,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: palette.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIssuer: { fontSize: 13, fontWeight: '600', color: palette.cardInk },
  // No `opacity` on any card text: the hierarchy comes from size, weight and
  // letter-spacing instead, because a translucent label blends into the card
  // colour and drops below the 4.5:1 the a11y addon checks for.
  cardTier: { fontSize: 11, letterSpacing: 2, color: palette.cardInk },
  cardChip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: palette.cardChip,
  },
  cardNumber: {
    fontSize: 18,
    letterSpacing: 2,
    color: palette.cardInk,
    fontVariant: ['tabular-nums'],
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: palette.cardInk,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.cardInk,
    fontVariant: ['tabular-nums'],
  },

  split: {
    flexDirection: 'row',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.splitBorder,
    backgroundColor: palette.surface,
    // The image runs to the card's edge, so the corners have to clip it.
    overflow: 'hidden',
  },
  // Each half is a percentage of the same row, so the split tracks the slide
  // width instead of a hard-coded number. `flex: 1` looks equivalent and is
  // not: a zero flex-basis is a *content-box* basis, so the text half would
  // come out its own padding wider than the image.
  splitBody: { width: '50%', padding: 16, justifyContent: 'space-between' },
  splitText: { flexShrink: 1, overflow: 'hidden' },
  splitImage: { width: '50%', height: '100%' },
  splitEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.splitEyebrow,
    marginBottom: 6,
  },
  splitTitle: { fontSize: 18, fontWeight: '600', color: palette.ink },
  splitDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.caption,
    marginTop: 6,
  },
  splitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.splitBorder,
    paddingTop: 10,
    marginTop: 12,
  },
  splitFooterText: { fontSize: 12, color: palette.caption },
  splitFooterLink: { fontSize: 12, fontWeight: '600', color: palette.accent },

  pageSlide: {
    // No height: the carousel is given a bounded one by the screen, so the
    // slide stretches to the track and the whole page lays itself out.
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageSlideArt: { width: '100%', height: 224, borderRadius: 16 },
  pageSlideTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  pageSlideBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.caption,
    textAlign: 'center',
    marginTop: 8,
  },

  dayCell: {
    // No width: the carousel divides the strip up by `visibleSlides`, so a
    // week fits whatever the container is, down to a phone.
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.calendarBorder,
    backgroundColor: palette.calendarCell,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayCellSelected: {
    backgroundColor: palette.calendarCellSelected,
    borderColor: palette.calendarBorderSelected,
  },
  // The selected day is marked by a border and a heavier number as well as by
  // colour, so it still reads as selected without colour perception.
  dayWeekday: { fontSize: 12, letterSpacing: 1, color: palette.calendarMuted },
  dayWeekdaySelected: { color: palette.calendarAccent },
  dayNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.calendarInk,
    fontVariant: ['tabular-nums'],
  },
  dayNumberSelected: { color: palette.calendarAccent, fontWeight: '700' },

  agenda: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.calendarBorder,
    backgroundColor: palette.calendarPanel,
  },
  agendaHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.calendarInk,
    marginBottom: 12,
  },
  agendaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  agendaRowSpaced: { marginTop: 12 },
  agendaTime: {
    width: 52,
    fontSize: 13,
    color: palette.calendarAccent,
    fontVariant: ['tabular-nums'],
  },
  agendaText: { flexShrink: 1 },
  agendaTitle: { fontSize: 14, color: palette.calendarInk },
  agendaLocation: { fontSize: 12, color: palette.calendarMuted, marginTop: 2 },
  agendaEmpty: { fontSize: 13, color: palette.calendarMuted },
});

/** Round arrow button. Goes translucent rather than unmounting at the ends. */
export const MockArrow = ({
  direction,
  onPress,
  disabled,
  accessibilityLabel,
}: CarouselArrowSlotProps) => (
  <Pressable
    testID={`arrow-${direction}`}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    // Marked disabled rather than removed: a button that vanishes under the
    // finger pressing it takes the user's place in the deck with it.
    accessibilityState={{ disabled }}
    onPress={disabled ? undefined : onPress}
    style={[styles.arrow, disabled && styles.arrowDisabled]}
  >
    <Text
      testID={`arrow-${direction}-${disabled ? 'disabled' : 'enabled'}`}
      style={styles.arrowGlyph}
    >
      {direction === 'previous' ? '‹' : '›'}
    </Text>
  </Pressable>
);

/** Pill-style page dot that widens when selected. */
export const MockDot = ({ index, selected, onPress, accessibilityLabel }: CarouselDotSlotProps) => (
  <Pressable
    testID={`dot-${index}`}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={styles.dot}
  >
    {/*
      `accessibilityState` is the right API for real screen readers, but
      react-native-web does not map it onto `aria-selected`/`aria-disabled` for
      a plain button — so the inner testID is what gives the browser-based e2e
      suite something stable to assert the visual state on.
    */}
    <View
      testID={`dot-${index}-${selected ? 'selected' : 'idle'}`}
      style={[styles.dotInner, selected && styles.dotSelected]}
    />
  </Pressable>
);

/** A "3 / 8" counter — the case a per-page `Dot` cannot express. */
export const MockFraction = ({
  page,
  pageCount,
  accessibilityLabel,
}: CarouselPaginationSlotProps) => (
  <View style={styles.fraction} accessibilityLabel={accessibilityLabel} testID="fraction">
    <Text style={styles.fractionText}>{`${page + 1} / ${pageCount}`}</Text>
  </View>
);

/** Auto-play control. WCAG 2.2.2 requires one whenever `autoPlay` is on. */
export const MockPlayPause = ({
  isPlaying,
  onPress,
  accessibilityLabel,
}: CarouselPlayPauseSlotProps) => (
  <Pressable
    testID="play-pause"
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={styles.playPause}
  >
    <Text style={styles.playPauseText}>{isPlaying ? '❚❚ Pause' : '▶ Play'}</Text>
  </Pressable>
);

/** A stand-in slide, so the stories have something to page through. */
export const MockSlide = ({ index, caption }: { index: number; caption?: ReactNode }) => (
  <View style={styles.slide} testID={`slide-${index}`}>
    <Text style={styles.slideTitle}>{index + 1}</Text>
    {caption ? <Text style={styles.slideCaption}>{caption}</Text> : null}
  </View>
);

/** `n` mock slides, for the `children` mode. */
export const mockSlides = (count: number, caption?: (index: number) => string) =>
  Array.from({ length: count }, (_, index) => (
    <MockSlide
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of stand-in slides
      key={`slide-${index}`}
      index={index}
      caption={caption?.(index)}
    />
  ));

/** `n` mock records, for the virtualized `data` mode. */
export const mockData = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, index }));

/** One card in the wallet story. */
export interface MockCard {
  id: string;
  /** Name printed top-left. Invented, like every value here. */
  issuer: string;
  /** Product tier, printed top-right. */
  tier: string;
  /** Last four digits — the only ones a real card UI may show. */
  last4: string;
  holder: string;
  /** MM/YY. */
  expires: string;
  background: string;
}

/**
 * A credit card slide.
 *
 * Every number below is fake and stays fake: a card carousel is the one place
 * where the slide, not the carousel, decides what may be rendered, so only the
 * last four digits are ever printed and the accessible name says the same.
 */
export const MockCreditCard = ({ card }: { card: MockCard }) => (
  <View
    testID={`card-${card.id}`}
    accessible
    accessibilityLabel={`${card.tier} card ending in ${card.last4}, expires ${card.expires}`}
    style={[styles.card, { backgroundColor: card.background }]}
  >
    <View style={styles.cardRow}>
      <Text style={styles.cardIssuer}>{card.issuer}</Text>
      <Text style={styles.cardTier}>{card.tier.toUpperCase()}</Text>
    </View>
    <View style={styles.cardChip} />
    <Text style={styles.cardNumber}>{`•••• •••• •••• ${card.last4}`}</Text>
    <View style={styles.cardRow}>
      <View>
        <Text style={styles.cardLabel}>CARDHOLDER</Text>
        <Text style={styles.cardValue}>{card.holder}</Text>
      </View>
      <View>
        <Text style={styles.cardLabel}>EXPIRES</Text>
        <Text style={styles.cardValue}>{card.expires}</Text>
      </View>
    </View>
  </View>
);

/** A wallet's worth of fake cards, for the credit-card story. */
export const mockCards: readonly MockCard[] = [
  {
    id: 'platinum',
    issuer: 'Real Native Bank',
    tier: 'Platinum',
    last4: '4242',
    holder: 'A. MARTINEZ',
    expires: '08/29',
    background: '#1f2937',
  },
  {
    id: 'gold',
    issuer: 'Real Native Bank',
    tier: 'Gold',
    last4: '8210',
    holder: 'A. MARTINEZ',
    expires: '11/27',
    background: '#92400e',
  },
  {
    id: 'classic',
    issuer: 'Real Native Bank',
    tier: 'Classic',
    last4: '0417',
    holder: 'A. MARTINEZ',
    expires: '03/28',
    background: '#1d4ed8',
  },
  {
    id: 'travel',
    issuer: 'Real Native Bank',
    tier: 'Travel',
    last4: '9931',
    holder: 'A. MARTINEZ',
    expires: '06/30',
    background: '#047857',
  },
];

/** One entry in the split-card story. */
export interface MockFeature {
  id: string;
  /** Small label above the title. */
  eyebrow: string;
  title: string;
  description: string;
  /** Left-hand footer text — a date, a reading time, a status. */
  footer: string;
  /** Which entry of {@link mockImages} fills the right half. */
  image: keyof typeof mockImages;
}

/**
 * A card split down the middle: text on the left, artwork on the right.
 *
 * Each half is `width: '50%'` of the same row, so the split follows whatever
 * width the carousel hands the slide — including the narrower slides you get
 * from `visibleSlides` or `peek` — rather than a fixed pixel column.
 */
export const MockSplitCard = ({ feature }: { feature: MockFeature }) => (
  <View style={styles.split} testID={`feature-${feature.id}`}>
    <View style={styles.splitBody}>
      {/*
        The card is a fixed height and the text half narrows with the slide, so
        both strings are clamped: without that, a narrow `visibleSlides` lets a
        long description run straight through the footer.
      */}
      <View style={styles.splitText}>
        <Text style={styles.splitEyebrow}>{feature.eyebrow.toUpperCase()}</Text>
        <Text style={styles.splitTitle} numberOfLines={2}>
          {feature.title}
        </Text>
        <Text style={styles.splitDescription} numberOfLines={3}>
          {feature.description}
        </Text>
      </View>
      <View style={styles.splitFooter}>
        <Text style={styles.splitFooterText}>{feature.footer}</Text>
        <Text style={styles.splitFooterLink}>Read more ›</Text>
      </View>
    </View>
    <Image
      testID={`feature-${feature.id}-image`}
      style={styles.splitImage}
      resizeMode="cover"
      source={{ uri: mockImages[feature.image] }}
      // Described rather than left decorative: the artwork is half the card,
      // so a reader that skips it silently loses half of what is on screen.
      accessibilityLabel={mockImageLabels[feature.image]}
    />
  </View>
);

/** Four split cards, for the story of the same name. */
export const mockFeatures: readonly MockFeature[] = [
  {
    id: 'headless',
    eyebrow: 'Headless',
    title: 'Bring your own chrome',
    description:
      'The carousel draws nothing but the track. Arrows, dots and counters are components you pass in.',
    footer: '3 min read',
    image: 'harbour',
  },
  {
    id: 'responsive',
    eyebrow: 'Responsive',
    title: 'Measured, not guessed',
    description:
      "Breakpoints resolve against the carousel's own width, so one in a sidebar adapts to the sidebar.",
    footer: '4 min read',
    image: 'meadow',
  },
  {
    id: 'virtualized',
    eyebrow: 'Virtualized',
    title: 'Hundreds of slides, a few mounted',
    description:
      'Pass `data` and `renderItem` and the track becomes a FlatList without changing any behaviour.',
    footer: '5 min read',
    image: 'dawn',
  },
  {
    id: 'accessible',
    eyebrow: 'Accessible',
    title: 'Labelled and announceable',
    description:
      'Every slot arrives with the label it needs, and page changes are announced as they happen.',
    footer: '6 min read',
    image: 'dusk',
  },
];

/** One step of the page-level story. */
export interface MockPage {
  id: string;
  title: string;
  body: string;
  /** Which entry of {@link mockImages} sits above the copy. */
  image: keyof typeof mockImages;
}

/** A full-screen onboarding step: artwork, title, one paragraph. */
export const MockPageSlide = ({ page }: { page: MockPage }) => (
  <View style={styles.pageSlide} testID={`page-${page.id}`}>
    <Image
      style={styles.pageSlideArt}
      resizeMode="cover"
      source={{ uri: mockImages[page.image] }}
      accessibilityLabel={mockImageLabels[page.image]}
    />
    <Text style={styles.pageSlideTitle}>{page.title}</Text>
    <Text style={styles.pageSlideBody}>{page.body}</Text>
  </View>
);

/** Five onboarding steps, for the page-level story. */
export const mockPages: readonly MockPage[] = [
  {
    id: 'welcome',
    title: 'A carousel, not a design',
    body: 'Everything you see here is chrome the story passes in. The component itself draws only the track.',
    image: 'harbour',
  },
  {
    id: 'layout',
    title: 'Sized by its container',
    body: 'Slides are measured against the width the carousel was actually given, so it fits a phone or a sidebar.',
    image: 'meadow',
  },
  {
    id: 'gestures',
    title: 'Real scrolling, real snapping',
    body: "The track is a native scroll view. Flicks, momentum and snapping are the platform's, not a reimplementation.",
    image: 'dawn',
  },
  {
    id: 'a11y',
    title: 'Announced as it moves',
    body: 'Each slide carries a label, and every page change is announced the way a live region would.',
    image: 'dusk',
  },
  {
    id: 'ready',
    title: 'Bring your own everything',
    body: 'Dots, arrows, footers, progress bars — pass a component, or build one on the useCarousel hook.',
    image: 'harbour',
  },
];

/** One entry of a day's agenda, in the day-strip story. */
export interface MockAgendaEntry {
  id: string;
  /** 24-hour start time. */
  time: string;
  title: string;
  /** Room or "Remote" — the second line of the entry. */
  location: string;
}

/** One day chip in the day-strip story, with the agenda it reveals. */
export interface MockDay {
  id: string;
  /** Three-letter weekday, printed above the number. */
  weekday: string;
  /** Day of the month, printed large. */
  dayOfMonth: number;
  /** Spoken name of the day — the chip's accessible label. */
  label: string;
  /** What the panel below the strip shows while this day is selected. */
  agenda: readonly MockAgendaEntry[];
}

/** The month the strip covers. Printed by the story's own header. */
export const mockCalendarMonth = 'August';

const weekdays = [
  ['MON', 'Monday'],
  ['TUE', 'Tuesday'],
  ['WED', 'Wednesday'],
  ['THU', 'Thursday'],
  ['FRI', 'Friday'],
  ['SAT', 'Saturday'],
  ['SUN', 'Sunday'],
] as const;

/** Rotated rather than randomised, so every render — and every screenshot — matches. */
const agendaPool = [
  { time: '09:00', title: 'Design review', location: 'Studio A' },
  { time: '11:30', title: 'Pairing on the scroll bridge', location: 'Remote' },
  { time: '14:00', title: 'Release planning', location: 'Room 4' },
  { time: '16:15', title: 'Accessibility audit', location: 'Remote' },
  { time: '18:00', title: 'Community call', location: 'Remote' },
] as const;

const agendaFor = (index: number): MockAgendaEntry[] => {
  // Sundays stay empty on purpose: a day view needs an empty state as much as
  // it needs a full one.
  if (index % 7 === 6) {
    return [];
  }
  // Rotated with `slice` rather than read at `[i % length]`, so the pool is
  // walked without an index the compiler has to be told cannot miss.
  const offset = index % agendaPool.length;
  return (
    [...agendaPool.slice(offset), ...agendaPool.slice(0, offset)]
      .slice(0, (index % 3) + 1)
      // Rotating the pool picks *which* entries a day gets; a day still reads
      // top to bottom in time order, the way an agenda has to.
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((entry, slot) => ({ id: `day-${index}-entry-${slot}`, ...entry }))
  );
};

const buildDay = (index: number, weekday: string, spoken: string): MockDay => {
  const dayOfMonth = 9 + index;
  const agenda = agendaFor(index);
  return {
    id: `day-${dayOfMonth}`,
    weekday,
    dayOfMonth,
    // The count goes in the label because the chip only shows a number: a
    // reader that cannot see the panel below still learns the day is busy.
    label: `${spoken} ${dayOfMonth} ${mockCalendarMonth}, ${
      agenda.length === 0 ? 'nothing scheduled' : `${agenda.length} scheduled`
    }`,
    agenda,
  };
};

/**
 * Three weeks of days, starting on Monday the 9th.
 *
 * Fixed values rather than `new Date()`: the story, the e2e suite and the
 * visual baselines all have to render the same strip on any day of the year.
 */
export const mockDays: readonly MockDay[] = Array.from({ length: 3 }, (_, week) =>
  weekdays.map(([weekday, spoken], slot) => buildDay(week * 7 + slot, weekday, spoken)),
).flat();

/** The day the strip opens on — Friday the 13th, on the first week. */
export const mockDefaultDayId = 'day-13';

/**
 * One day of the strip.
 *
 * A slide that is also a control: the carousel owns where the chip *is*, and
 * the chip owns whether it is the selected day. Keeping those apart is what
 * lets the strip page a whole week without changing the selection.
 */
export const MockDayCell = ({
  day,
  selected,
  onPress,
}: {
  day: MockDay;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    testID={`day-${day.dayOfMonth}`}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={day.label}
    onPress={onPress}
    style={[styles.dayCell, selected && styles.dayCellSelected]}
  >
    {/*
      Same reason as `MockDot`: react-native-web does not map
      `accessibilityState` onto a plain button, so this inner testID is what
      the browser-based e2e suite can assert the selected state on.
    */}
    <Text
      testID={`day-${day.dayOfMonth}-${selected ? 'selected' : 'idle'}`}
      style={[styles.dayWeekday, selected && styles.dayWeekdaySelected]}
    >
      {day.weekday}
    </Text>
    <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{day.dayOfMonth}</Text>
  </Pressable>
);

/**
 * The panel under the strip: what the selected day holds.
 *
 * Announced politely rather than swapped silently — the content changes below
 * the chip that was pressed, which is not where a screen-reader user is.
 */
export const MockDayAgenda = ({ day }: { day: MockDay }) => (
  <View style={styles.agenda} testID="day-agenda" accessibilityLiveRegion="polite">
    <Text style={styles.agendaHeading} testID="day-agenda-heading">
      {day.label}
    </Text>
    {day.agenda.length === 0 ? (
      <Text style={styles.agendaEmpty} testID="day-agenda-empty">
        Nothing scheduled.
      </Text>
    ) : (
      day.agenda.map((entry, index) => (
        <View
          key={entry.id}
          testID={`entry-${entry.id}`}
          style={[styles.agendaRow, index > 0 && styles.agendaRowSpaced]}
        >
          <Text style={styles.agendaTime}>{entry.time}</Text>
          <View style={styles.agendaText}>
            <Text style={styles.agendaTitle}>{entry.title}</Text>
            <Text style={styles.agendaLocation}>{entry.location}</Text>
          </View>
        </View>
      ))
    )}
  </View>
);
