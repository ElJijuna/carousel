import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

// ─── Responsive values ────────────────────────────────────────────────────────

/**
 * A breakpoint map keyed by **max width in dp**, plus a `base` entry used when
 * nothing else matches.
 *
 * React Native has no CSS media queries, so the carousel measures its own
 * container with `onLayout` and resolves the map against that width — not the
 * window's. A carousel inside a sidebar therefore adapts to the space it was
 * actually given.
 *
 * The narrowest matching entry wins, so the map reads like stacked media
 * queries:
 *
 * ```tsx
 * // ≤400dp → 1 slide, ≤700dp → 2 slides, anything wider → 3
 * visibleSlides={{ base: 3, 700: 2, 400: 1 }}
 * ```
 */
export interface ResponsiveMap<T> {
  /** Value used when the container is wider than every numeric breakpoint. */
  base: T;
  /** Value used when the container is at most `maxWidth` dp wide. */
  [maxWidth: number]: T;
}

/** Either a plain value or a {@link ResponsiveMap} of them. */
export type ResponsiveValue<T> = T | ResponsiveMap<T>;

// ─── Navigation ───────────────────────────────────────────────────────────────

/** Options accepted by the imperative navigation methods. */
export interface CarouselNavigateOptions {
  /**
   * Animate the scroll. Ignored — and treated as `false` — when the operating
   * system reports a "reduce motion" preference.
   * @default true
   */
  animated?: boolean;
}

// ─── Public state and actions ─────────────────────────────────────────────────

/** Everything the carousel knows about where it currently is. */
export interface CarouselState {
  /** Zero-based index of the current page. */
  page: number;
  /** Total pages: `ceil(slideCount / visibleSlides)`, floored at 1. */
  pageCount: number;
  /** Number of slides the carousel was given. */
  slideCount: number;
  /** Slides visible at once, after the responsive map has been resolved. */
  visibleSlides: number;
  /** Width of a single slide in dp. `0` before the first layout pass. */
  slideWidth: number;
  /** Whether {@link CarouselActions.previous} would move. */
  canGoPrevious: boolean;
  /** Whether {@link CarouselActions.next} would move. */
  canGoNext: boolean;
  /** Whether an `autoPlay` rotation is currently running. */
  isPlaying: boolean;
  /** Whether the user is dragging the track right now. */
  isDragging: boolean;
}

/** Everything that can drive the carousel from the outside. */
export interface CarouselActions {
  /** Advance one page. Wraps when `loop` or `infinite` is on. */
  next: (options?: CarouselNavigateOptions) => void;
  /** Go back one page. Wraps when `loop` or `infinite` is on. */
  previous: (options?: CarouselNavigateOptions) => void;
  /** Jump to a page index. Clamped into range — it never wraps. */
  goTo: (page: number, options?: CarouselNavigateOptions) => void;
  /**
   * Jump to the page holding a given slide. With `visibleSlides` above 1 this
   * is not the same as the page index.
   */
  goToSlide: (slide: number, options?: CarouselNavigateOptions) => void;
  /** Start the `autoPlay` rotation, exactly as a play control would. */
  play: () => void;
  /** Stop the `autoPlay` rotation, exactly as a pause control would. */
  pause: () => void;
}

/** Value handed to consumers by {@link useCarousel}. */
export type CarouselContextValue = CarouselState & CarouselActions;

// ─── Events ────────────────────────────────────────────────────────────────────

/**
 * What kind of interaction moved the carousel to a new page.
 *
 * - `'drag'` — a swipe, flick, or free scroll (touch, trackpad, mouse wheel).
 * - `'next'` / `'previous'` — {@link CarouselActions.next} / {@link CarouselActions.previous},
 *   which is what the built-in `Arrow` slots and the keyboard arrow keys call.
 * - `'pagination'` — {@link CarouselActions.goTo} / {@link CarouselActions.goToSlide}, which is
 *   what the built-in `Dot` and `Pagination` slots and the keyboard Home/End keys call.
 * - `'autoplay'` — an automatic `autoPlay` tick.
 * - `'imperative'` — a call made through the {@link CarouselHandle} `ref`, from outside the
 *   carousel's own chrome.
 */
export type CarouselPageChangeSource =
  | 'drag'
  | 'next'
  | 'previous'
  | 'pagination'
  | 'autoplay'
  | 'imperative';

/** Detail handed to {@link CarouselProps.onPageChanged} alongside the new page. */
export interface CarouselPageChangeEvent {
  /** The page the carousel just moved to — the same value as the callback's first argument. */
  page: number;
  /** The page it moved from. */
  previousPage: number;
  /** What triggered the move. */
  source: CarouselPageChangeSource;
  /**
   * Whether a person caused this change, as opposed to the `autoPlay` timer.
   * Shorthand for `source !== 'autoplay'` — check `source` directly for anything
   * more specific, such as telling a drag apart from a button press.
   *
   * @example Consumer-defined haptic feedback, without the carousel depending on a haptics library
   * ```ts
   * onPageChanged={(page, event) => {
   *   if (event.userInitiated) {
   *     Haptics.selectionAsync();
   *   }
   * }}
   * ```
   */
  userInitiated: boolean;
}

/** Detail handed to {@link CarouselProps.onProgress} on every scroll frame. */
export interface CarouselProgressEvent {
  /** Nearest page to the current scroll position. */
  page: number;
  /**
   * Continuous position in page units — `page` plus the fraction of the way to
   * a neighbour. Whole while at rest, moving fractionally through
   * `page - 1 .. page + 1` while scrolling. Direction-agnostic, the same way
   * page indices are everywhere else in this library.
   */
  absoluteProgress: number;
  /** Raw scroll offset in dp, in the same direction-agnostic coordinates. */
  offset: number;
}

/**
 * Imperative handle reached through `ref`.
 *
 * Every method takes the same path as the rendered chrome, so wrapping,
 * reduced motion and the fire-once `onPageChanged` rule behave identically
 * however the move was started. The readable members are live getters, so
 * `handle.page` is already correct on the line after `next()` rather than a
 * render later.
 */
export interface CarouselHandle extends CarouselActions {
  /** Current page index. */
  readonly page: number;
  /** Total pages. */
  readonly pageCount: number;
  /** Whether the `autoPlay` rotation is running. */
  readonly isPlaying: boolean;
}

// ─── Component slots ──────────────────────────────────────────────────────────

/**
 * Props handed to an arrow slot. The carousel supplies behaviour and
 * accessibility metadata; the slot supplies every pixel.
 */
export interface CarouselArrowSlotProps {
  /** Which arrow this is. */
  direction: 'previous' | 'next';
  /** Move one page in `direction`. Already a no-op when `disabled`. */
  onPress: () => void;
  /**
   * `true` at the first/last page when the carousel does not wrap. Render this
   * as a visual disabled state; do **not** unmount the control, or the focus a
   * screen-reader user is sitting on vanishes mid-navigation.
   */
  disabled: boolean;
  /** From the `previousLabel` / `nextLabel` props. */
  accessibilityLabel: string;
  /** Current page index. */
  page: number;
  /** Total pages. */
  pageCount: number;
}

/** Props handed to a single page-indicator dot. */
export interface CarouselDotSlotProps {
  /** Zero-based page this dot represents. */
  index: number;
  /** Total pages. */
  total: number;
  /** Whether this dot's page is the current one. */
  selected: boolean;
  /** Jump to this dot's page. */
  onPress: () => void;
  /** From the `pageLabel` formatter. */
  accessibilityLabel: string;
}

/**
 * Props handed to a pagination slot that replaces the whole indicator row.
 * Use this instead of `Dot` when you need something other than one element per
 * page — a fraction ("3 / 8"), a progress bar, a scrubber.
 */
export interface CarouselPaginationSlotProps {
  /** Current page index. */
  page: number;
  /** Total pages. */
  pageCount: number;
  /** Jump to a page. */
  goTo: (page: number) => void;
  /** The `pageLabel` formatter, for labelling your own controls. */
  pageLabel: (index: number, total: number) => string;
  /** From the `paginationLabel` prop — a name for the group as a whole. */
  accessibilityLabel: string;
}

/** Props handed to the auto-play play/pause slot. */
export interface CarouselPlayPauseSlotProps {
  /** Whether the rotation is running. */
  isPlaying: boolean;
  /** Toggle the rotation. */
  onPress: () => void;
  /** From the `pauseLabel` / `playLabel` props, whichever applies. */
  accessibilityLabel: string;
}

/**
 * The chrome the implementer plugs in. Every entry is optional and an omitted
 * one renders nothing at all — the carousel itself draws no UI beyond the
 * track.
 */
export interface CarouselComponents {
  /** Fallback used for both arrows when the specific slots are absent. */
  Arrow?: ComponentType<CarouselArrowSlotProps>;
  /** Previous-page control. Falls back to `Arrow`. */
  PreviousArrow?: ComponentType<CarouselArrowSlotProps>;
  /** Next-page control. Falls back to `Arrow`. */
  NextArrow?: ComponentType<CarouselArrowSlotProps>;
  /** One indicator per page, laid out in a row by the carousel. */
  Dot?: ComponentType<CarouselDotSlotProps>;
  /** Replaces the whole indicator row. Takes precedence over `Dot`. */
  Pagination?: ComponentType<CarouselPaginationSlotProps>;
  /** Auto-play control. Required by WCAG 2.2.2 whenever `autoPlay` is on. */
  PlayPauseControl?: ComponentType<CarouselPlayPauseSlotProps>;
}

/** Where the carousel places each slot relative to the track. */
export interface CarouselSlotLayout {
  /**
   * `'overlay'` pins the arrows over the track's left and right edges;
   * `'above'` / `'below'` puts them in their own row.
   * @default 'overlay'
   */
  arrows?: 'overlay' | 'above' | 'below';
  /**
   * Where the indicator row goes.
   * @default 'below'
   */
  pagination?: 'overlay' | 'above' | 'below';
  /**
   * Where the play/pause control goes.
   * @default 'overlay'
   */
  playPause?: 'overlay' | 'above' | 'below';
}

// ─── renderItem ───────────────────────────────────────────────────────────────

/** Argument passed to {@link CarouselProps.renderItem}. */
export interface CarouselRenderItemInfo<TItem> {
  /** The entry from `data`. */
  item: TItem;
  /** Its index in `data`. */
  index: number;
  /** Resolved slide width in dp, in case the slide needs it. */
  slideWidth: number;
  /**
   * Whether this slide sits on the current page. Always `false` unless
   * `trackActiveSlides` is on — computing it invalidates every slide on each
   * page change, which is exactly the re-render a virtualized list is there to
   * avoid.
   */
  isActive: boolean;
}

/** Render function for the virtualized (`data`) mode. */
export type CarouselRenderItem<TItem> = (
  info: CarouselRenderItemInfo<TItem>,
) => ReactElement | null;

// ─── Slide state ────────────────────────────────────────────────────────────────

/** Value handed back by {@link useCarouselSlide}. */
export interface CarouselSlideState {
  /** The index passed to the hook, echoed back for convenience when passing this object along. */
  index: number;
  /** Whether this slide's page is the current one. */
  isActive: boolean;
  /**
   * Whether any part of this slide is on screen — `isActive`, plus a
   * neighbouring slide peeking in at the edge when `peek` is set.
   */
  isVisible: boolean;
  /**
   * Distance from being active, in page units: `0` when active, growing
   * towards `±1` as the carousel scrolls it off towards a neighbouring page,
   * and pinned at `±1` beyond that. Drive scale, opacity or parallax from it
   * without pulling in an animation library.
   *
   * Updates on every scroll frame *while within one page of active* — read it
   * only where you intend to re-render at that rate. A slide more than a page
   * away is pinned at `±1` and does not re-render on every frame just because
   * some other slide is being dragged into view.
   */
  progress: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for {@link Carousel}.
 *
 * @typeParam TItem - element type of `data` in the virtualized mode.
 */
export interface CarouselProps<TItem = unknown> {
  // ── Slides ──
  /**
   * Slides as children. Every child is mounted at once, which is what you want
   * for a handful of onboarding screens or banners.
   *
   * Mutually exclusive with `data`; when both are given, `data` wins.
   */
  children?: ReactNode;
  /**
   * Slides as data. Switches the carousel to a virtualized `FlatList`, so a
   * list of hundreds of slides only ever mounts the few near the viewport.
   * Requires `renderItem`.
   */
  data?: readonly TItem[];
  /** Renders one slide in the `data` mode. */
  renderItem?: CarouselRenderItem<TItem>;
  /** Stable key for a `data` entry. Defaults to the index. */
  keyExtractor?: (item: TItem, index: number) => string;

  // ── Layout ──
  /**
   * How many slides fit in the viewport at once (integer ≥ 1). Navigation
   * advances one whole group, and the indicator shows one entry per group.
   * Accepts a {@link ResponsiveMap}.
   * @default 1
   */
  visibleSlides?: ResponsiveValue<number>;
  /**
   * How much of the neighbouring slides shows at each edge, in dp. The active
   * group shrinks to make room, so paging still advances exactly one group.
   * `spacing` is added on top, so this is the sliver you actually see.
   * Accepts a {@link ResponsiveMap}.
   * @default 0
   */
  peek?: ResponsiveValue<number>;
  /**
   * Gap between slides in dp.
   * @default 0
   */
  spacing?: number;

  // ── Paging behaviour ──
  /**
   * Wrap around past the ends by rewinding: stepping forward from the last
   * page scrolls back to the first. Nothing is cloned, so your slides render
   * exactly once.
   * @default false
   */
  loop?: boolean;
  /**
   * Seamless wrapping: a copy of the last page is rendered before the first
   * one (and a copy of the first after the last), so paging past either end
   * keeps moving in the same direction. The carousel repositions onto the real
   * page, without animation, once the scroll settles. Implies `loop`.
   *
   * The clones are copies of your slides, so avoid `infinite` for slides that
   * own uncloneable side effects — autoplaying media, per-slide fetches.
   * @default false
   */
  infinite?: boolean;
  /**
   * Controlled page index. The carousel reports where the user moved it
   * through `onPageChanged` but only ever renders the page you pass — feed
   * `onPageChanged` back into this prop, the same contract as a controlled
   * `TextInput`.
   */
  page?: number;
  /**
   * Page the carousel starts on when uncontrolled. Clamped into range, and
   * ignored once `page` is passed.
   * @default 0
   */
  defaultPage?: number;
  /**
   * Called once per actual page change — never for a page you are already on.
   *
   * The second argument says *why* the page changed — a drag, a button, an
   * `autoPlay` tick, a ref call — so a consumer can play a sound, fire
   * analytics, or trigger haptic feedback without the carousel depending on
   * any of those itself.
   *
   * ```ts
   * onPageChanged={(page, event) => {
   *   if (event.userInitiated) {
   *     Haptics.selectionAsync();
   *   }
   * }}
   * ```
   */
  onPageChanged?: (page: number, event: CarouselPageChangeEvent) => void;

  // ── Auto-play ──
  /**
   * Advance automatically. Pauses while the user drags and while the app is
   * backgrounded.
   *
   * WCAG 2.2.2 requires a way to stop content that moves on its own, so render
   * a `PlayPauseControl` slot (or your own control via {@link useCarousel})
   * whenever this is on.
   * @default false
   */
  autoPlay?: boolean;
  /**
   * Milliseconds between automatic advances.
   * @default 3000
   */
  interval?: number;

  // ── Chrome ──
  /** The chrome to render. See {@link CarouselComponents}. */
  components?: CarouselComponents;
  /** Where each slot is placed. See {@link CarouselSlotLayout}. */
  slots?: CarouselSlotLayout;

  // ── Styling ──
  /** Style for the outermost wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Style for the scrollable track. */
  trackStyle?: StyleProp<ViewStyle>;
  /** Style applied to every slide wrapper, on top of its computed width. */
  slideStyle?: StyleProp<ViewStyle>;
  /** Style for the row holding the indicator. */
  paginationStyle?: StyleProp<ViewStyle>;
  /** Style for the container holding the arrows. */
  arrowsStyle?: StyleProp<ViewStyle>;

  // ── Accessibility ──
  /**
   * Accessible name for the carousel as a whole.
   * @default 'Carousel'
   */
  accessibilityLabel?: string;
  /**
   * Accessible name for the indicator group.
   * @default 'Carousel pages'
   */
  paginationLabel?: string;
  /** Accessible name for each indicator. @default `Page ${index + 1}` */
  pageLabel?: (index: number, total: number) => string;
  /** Accessible name for each slide. @default `${index + 1} of ${total}` */
  slideLabel?: (index: number, total: number) => string;
  /**
   * Announced to screen readers on every page change, the React Native
   * counterpart of a live region. Pass `null` to stay silent.
   * @default `Page ${index + 1} of ${total}`
   */
  statusLabel?: ((index: number, total: number) => string) | null;
  /** Accessible label for the previous arrow. @default 'Previous slide' */
  previousLabel?: string;
  /** Accessible label for the next arrow. @default 'Next slide' */
  nextLabel?: string;
  /** Accessible label for the pause control. @default 'Pause automatic rotation' */
  pauseLabel?: string;
  /** Accessible label for the play control. @default 'Resume automatic rotation' */
  playLabel?: string;

  // ── Escape hatches ──
  /**
   * Recompute `isActive` for every slide on each page change. Off by default
   * because it defeats slide memoization; turn it on only when your slides
   * really do look different when active.
   *
   * {@link useCarouselSlide} is usually the better fit for this: it reads
   * `isActive` (and `isVisible`, `progress`) from inside one slide through a
   * subscription, so only that slide re-renders rather than the whole list —
   * `trackActiveSlides` stays for `renderItem`'s synchronous `isActive`, which
   * some virtualization patterns need at render time rather than as an effect.
   * @default false
   */
  trackActiveSlides?: boolean;
  /** Called when the user starts dragging the track. */
  onDragStart?: () => void;
  /** Called when the user lets go of the track. */
  onDragEnd?: () => void;
  /**
   * Called when the track starts animating towards a resting page — a
   * released drag settling, or a `next` / `previous` / `goTo` / `autoPlay` /
   * imperative move starting its scroll. Pairs with {@link CarouselProps.onSnapEnd}.
   */
  onSnapStart?: () => void;
  /** Called once the track comes to rest on a page. Pairs with {@link CarouselProps.onSnapStart}. */
  onSnapEnd?: () => void;
  /**
   * Called on every scroll frame with the raw position, for building custom
   * animations — indicators, parallax, opacity, scale — without the carousel
   * depending on an animation library. Fires during drags, flings and
   * animated programmatic moves alike.
   *
   * Called directly from the scroll handler rather than through state, so it
   * never causes the carousel (or anything else) to re-render — drive your
   * own `Animated.Value`, state, or ref from it.
   */
  onProgress?: (event: CarouselProgressEvent) => void;
  /**
   * `testID` for the carousel's outer view. The scrollable track gets
   * `` `${testID}-track` `` so tests and e2e specs can drive the scroller
   * directly.
   */
  testID?: string;
}
